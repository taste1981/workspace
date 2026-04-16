// ==================== TFLITE EDITOR ====================
// FlatBuffer Builder, Carving, FC Type Editing

// --- FlatBuffer Builder (back-to-front, TFLite compatible) ---
class FBB {
  constructor(sz) {
    this.a = new ArrayBuffer(sz||4096); this.u = new Uint8Array(this.a); this.d = new DataView(this.a);
    this.sp = sz||4096; this.ma = 1; this.vt = null; this.vu = 0; this.oe = 0;
  }
  off() { return this.a.byteLength - this.sp; }
  _g(n) {
    if (this.sp >= n) return;
    let nc = this.a.byteLength; const used = nc - this.sp;
    while (nc < used + n) nc *= 2;
    const na = new ArrayBuffer(nc), nu = new Uint8Array(na);
    nu.set(this.u.subarray(this.sp), nc - used);
    this.sp = nc - used; this.a = na; this.u = nu; this.d = new DataView(na);
  }
  _p(n) { for (let i=0;i<n;i++) this.u[--this.sp]=0; }
  prep(sz, add) {
    if (sz>this.ma) this.ma=sz;
    const al=((~(this.a.byteLength-this.sp+add))+1)&(sz-1);
    this._g(al+sz+add); this._p(al);
  }
  wI8(v) { this._g(1); this.u[--this.sp]=v&0xff; }
  wI16(v) { this.sp-=2; this.d.setInt16(this.sp,v,true); }
  wI32(v) { this.sp-=4; this.d.setInt32(this.sp,v,true); }
  wU32(v) { this.sp-=4; this.d.setUint32(this.sp,v,true); }
  wF32(v) { this.sp-=4; this.d.setFloat32(this.sp,v,true); }
  wI64(v) { this.sp-=8; this.d.setUint32(this.sp,v>>>0,true); this.d.setInt32(this.sp+4,Math.floor(v/0x100000000),true); }
  pI8(v) { this.prep(1,0); this.wI8(v); }
  pI32(v) { this.prep(4,0); this.wI32(v); }
  pU32(v) { this.prep(4,0); this.wU32(v); }
  pOff(o) { this.prep(4,0); this.wI32(o?this.off()-o+4:0); }
  str(s) {
    if(s==null)return 0; const e=new TextEncoder().encode(s);
    this._g(e.length+5); this.wI8(0);
    for(let i=e.length-1;i>=0;i--)this.wI8(e[i]);
    this.pI32(e.length); return this.off();
  }
  vecI32(a) { this.prep(4,a.length*4); this.prep(4,a.length*4); for(let i=a.length-1;i>=0;i--){this.wI32(a[i]);} this.pI32(a.length); return this.off(); }
  vecF32(a) { this.prep(4,a.length*4); this.prep(4,a.length*4); for(let i=a.length-1;i>=0;i--){this.wF32(a[i]);} this.pI32(a.length); return this.off(); }
  vecI64(a) { this.prep(4,a.length*8); this.prep(8,a.length*8); for(let i=a.length-1;i>=0;i--){this.wI64(a[i]);} this.pI32(a.length); return this.off(); }
  vecU8(data) {
    // bulk copy for byte vectors (buffer data)
    this.prep(4,data.length); this.prep(1,data.length);
    this._g(data.length); this.sp-=data.length; this.u.set(data,this.sp);
    this.pI32(data.length); return this.off();
  }
  vecOff(a) { this.prep(4,a.length*4); this.prep(4,a.length*4); for(let i=a.length-1;i>=0;i--){this.pOff(a[i]);} this.pI32(a.length); return this.off(); }
  startObj(nf) { this.vt=new Array(nf).fill(0); this.vu=nf; this.oe=this.off(); }
  aI8(f,v,d) { if(v===d)return; this.prep(1,0); this.wI8(v); this.vt[f]=this.off(); }
  aI32(f,v,d) { if(v===d)return; this.prep(4,0); this.wI32(v); this.vt[f]=this.off(); }
  aU32(f,v,d) { if(v===d)return; this.prep(4,0); this.wU32(v); this.vt[f]=this.off(); }
  aOff(f,o) { if(!o)return; this.prep(4,0); this.wI32(this.off()-o+4); this.vt[f]=this.off(); }
  endObj() {
    this.pI32(0); const to=this.off();
    let tr=this.vu-1; while(tr>=0&&!this.vt[tr])tr--; tr++;
    for(let i=tr-1;i>=0;i--){this.prep(2,0);this.wI16(this.vt[i]?to-this.vt[i]:0);}
    this.prep(2,0);this.wI16(to-this.oe); this.prep(2,0);this.wI16((tr+2)*2);
    const vo=this.off();
    this.d.setInt32(this.a.byteLength-to,vo-to,true);
    this.vt=null; return to;
  }
  finish(ro) {
    this.prep(this.ma,4); this.pOff(ro);
    return new Uint8Array(this.a,this.sp,this.a.byteLength-this.sp);
  }
}

// --- Build a .tflite FlatBuffer from a subgraph of the parsed TFLite model ---
function buildCarvedTFLite(opIndices) {
  const m = tflParsed;
  const sg = m.subgraphs[0];
  const selOps = opIndices.sort((a,b)=>a-b);

  // Determine all tensor indices used by selected operators
  const producedBy = {}; // tensorIdx -> opIndex that produces it
  const consumedBy = {}; // tensorIdx -> [opIndex] that consume it
  for (let oi = 0; oi < sg.operators.length; oi++) {
    const op = sg.operators[oi];
    for (const ti of op.outputs) producedBy[ti] = oi;
    for (const ti of op.inputs) { if (ti>=0) { if(!consumedBy[ti])consumedBy[ti]=[]; consumedBy[ti].push(oi); } }
  }

  const selSet = new Set(selOps);
  const usedTensors = new Set();
  for (const oi of selOps) {
    const op = sg.operators[oi];
    for (const ti of op.inputs) if(ti>=0) usedTensors.add(ti);
    for (const ti of op.outputs) usedTensors.add(ti);
  }

  // New subgraph inputs: tensors consumed by selected ops, produced by non-selected (or original inputs/constants)
  const newInputs = [];
  const newOutputs = [];
  for (const ti of usedTensors) {
    const prod = producedBy[ti];
    const isConsumedBySelected = (consumedBy[ti]||[]).some(o => selSet.has(o));
    const isProducedBySelected = prod !== undefined && selSet.has(prod);
    const t = sg.tensors[ti];
    const isConstant = t && t.buffer > 0 && m.buffers[t.buffer]?.data;

    if (isConsumedBySelected && !isProducedBySelected && !isConstant) {
      newInputs.push(ti);
    }
    if (isProducedBySelected) {
      const consumedByNonSel = (consumedBy[ti]||[]).some(o => !selSet.has(o));
      const wasOrigOutput = sg.outputs.includes(ti);
      const notConsumedBySel = !(consumedBy[ti]||[]).some(o => selSet.has(o));
      if (consumedByNonSel || wasOrigOutput || notConsumedBySel) {
        newOutputs.push(ti);
      }
    }
  }

  const allTensors = [...usedTensors].sort((a,b)=>a-b);
  const tensorRemap = {};
  for (let i = 0; i < allTensors.length; i++) tensorRemap[allTensors[i]] = i;

  const usedOpcodes = [...new Set(selOps.map(oi => sg.operators[oi].opcode_index))].sort((a,b)=>a-b);
  const opcRemap = {};
  for (let i = 0; i < usedOpcodes.length; i++) opcRemap[usedOpcodes[i]] = i;

  const usedBuffers = [0];
  const bufRemap = {0: 0};
  for (const ti of allTensors) {
    const t = sg.tensors[ti];
    if (t.buffer > 0 && !bufRemap.hasOwnProperty(t.buffer)) {
      bufRemap[t.buffer] = usedBuffers.length;
      usedBuffers.push(t.buffer);
    }
  }

  const fb = new FBB(1024 * 1024);

  // 1. Buffers
  const bufOffsets = [];
  for (const bi of usedBuffers) {
    const bufData = m.buffers[bi]?.data;
    let dataOff = 0;
    if (bufData) dataOff = fb.vecU8(bufData);
    fb.startObj(1);
    if (dataOff) fb.aOff(0, dataOff);
    bufOffsets.push(fb.endObj());
  }
  const buffersVec = fb.vecOff(bufOffsets);

  // 2. Tensors
  const tensorOffsets = [];
  for (const ti of allTensors) {
    const t = sg.tensors[ti];
    const nameOff = fb.str(t.name || '');
    const shapeOff = t.shape.length ? fb.vecI32(t.shape) : 0;
    let quantOff = 0;
    if (t.quant) {
      const scOff = t.quant.scale.length ? fb.vecF32(t.quant.scale) : 0;
      const zpOff = t.quant.zero_point.length ? fb.vecI64(t.quant.zero_point) : 0;
      const minOff = t.quant.min?.length ? fb.vecF32(t.quant.min) : 0;
      const maxOff = t.quant.max?.length ? fb.vecF32(t.quant.max) : 0;
      fb.startObj(7);
      if (minOff) fb.aOff(0, minOff);
      if (maxOff) fb.aOff(1, maxOff);
      if (scOff) fb.aOff(2, scOff);
      if (zpOff) fb.aOff(3, zpOff);
      if (t.quant.quantized_dimension) fb.aI32(6, t.quant.quantized_dimension, 0);
      quantOff = fb.endObj();
    }
    fb.startObj(5);
    if (shapeOff) fb.aOff(0, shapeOff);
    fb.aI8(1, t.type, 0);
    fb.aU32(2, bufRemap[t.buffer] || 0, 0);
    if (nameOff) fb.aOff(3, nameOff);
    if (quantOff) fb.aOff(4, quantOff);
    tensorOffsets.push(fb.endObj());
  }
  const tensorsVec = fb.vecOff(tensorOffsets);

  // 3. Operators
  const opOffsets = [];
  for (const oi of selOps) {
    const op = sg.operators[oi];
    const inArr = op.inputs.map(ti => ti < 0 ? -1 : (tensorRemap[ti] ?? -1));
    const outArr = op.outputs.map(ti => tensorRemap[ti] ?? -1);
    const inOff = fb.vecI32(inArr);
    const outOff = fb.vecI32(outArr);
    fb.startObj(3);
    fb.aU32(0, opcRemap[op.opcode_index] ?? 0, 0);
    fb.aOff(1, inOff);
    fb.aOff(2, outOff);
    opOffsets.push(fb.endObj());
  }
  const opsVec = fb.vecOff(opOffsets);

  // 4. SubGraph
  const sgInputsOff = fb.vecI32(newInputs.map(ti => tensorRemap[ti]));
  const sgOutputsOff = fb.vecI32(newOutputs.map(ti => tensorRemap[ti]));
  const sgNameOff = fb.str('carved_subgraph');
  fb.startObj(5);
  fb.aOff(0, tensorsVec);
  fb.aOff(1, sgInputsOff);
  fb.aOff(2, sgOutputsOff);
  fb.aOff(3, opsVec);
  if (sgNameOff) fb.aOff(4, sgNameOff);
  const sgOff = fb.endObj();
  const sgVecOff = fb.vecOff([sgOff]);

  // 5. OperatorCodes
  const opcOffsets = [];
  for (const oci of usedOpcodes) {
    const opc = m.opCodes[oci];
    const customOff = opc.custom ? fb.str(opc.custom) : 0;
    fb.startObj(4);
    fb.aI8(0, Math.min(opc.code, 127), 0);
    if (customOff) fb.aOff(1, customOff);
    fb.aI32(2, opc.version || 1, 0);
    fb.aI32(3, opc.code, 0);
    opcOffsets.push(fb.endObj());
  }
  const opcVecOff = fb.vecOff(opcOffsets);

  const descOff = fb.str('Carved subgraph');

  fb.startObj(5);
  fb.aU32(0, 3, 0);
  fb.aOff(1, opcVecOff);
  fb.aOff(2, sgVecOff);
  if (descOff) fb.aOff(3, descOff);
  fb.aOff(4, buffersVec);
  const modelOff = fb.endObj();

  return fb.finish(modelOff);
}

// --- Build a complete .tflite FlatBuffer from a (possibly modified) parsed model ---
function buildFullTFLite(m) {
  const sg = m.subgraphs[0];
  const fb = new FBB(4 * 1024 * 1024);

  const bufOffsets = [];
  for (const buf of m.buffers) {
    let dataOff = 0;
    if (buf.data) dataOff = fb.vecU8(buf.data);
    fb.startObj(1);
    if (dataOff) fb.aOff(0, dataOff);
    bufOffsets.push(fb.endObj());
  }
  const buffersVec = fb.vecOff(bufOffsets);

  const tensorOffsets = [];
  for (const t of sg.tensors) {
    const nameOff = fb.str(t.name || '');
    const shapeOff = t.shape.length ? fb.vecI32(t.shape) : 0;
    let quantOff = 0;
    if (t.quant) {
      const scOff = t.quant.scale.length ? fb.vecF32(t.quant.scale) : 0;
      const zpOff = t.quant.zero_point.length ? fb.vecI64(t.quant.zero_point) : 0;
      const minOff = t.quant.min?.length ? fb.vecF32(t.quant.min) : 0;
      const maxOff = t.quant.max?.length ? fb.vecF32(t.quant.max) : 0;
      fb.startObj(7);
      if (minOff) fb.aOff(0, minOff);
      if (maxOff) fb.aOff(1, maxOff);
      if (scOff) fb.aOff(2, scOff);
      if (zpOff) fb.aOff(3, zpOff);
      if (t.quant.quantized_dimension) fb.aI32(6, t.quant.quantized_dimension, 0);
      quantOff = fb.endObj();
    }
    fb.startObj(5);
    if (shapeOff) fb.aOff(0, shapeOff);
    fb.aI8(1, t.type, 0);
    fb.aU32(2, t.buffer, 0);
    if (nameOff) fb.aOff(3, nameOff);
    if (quantOff) fb.aOff(4, quantOff);
    tensorOffsets.push(fb.endObj());
  }
  const tensorsVec = fb.vecOff(tensorOffsets);

  const opOffsets = [];
  for (const op of sg.operators) {
    const inOff = fb.vecI32(op.inputs);
    const outOff = fb.vecI32(op.outputs);
    fb.startObj(3);
    fb.aU32(0, op.opcode_index, 0);
    fb.aOff(1, inOff);
    fb.aOff(2, outOff);
    opOffsets.push(fb.endObj());
  }
  const opsVec = fb.vecOff(opOffsets);

  const sgInputsOff = fb.vecI32(sg.inputs);
  const sgOutputsOff = fb.vecI32(sg.outputs);
  const sgNameOff = fb.str(sg.name || '');
  fb.startObj(5);
  fb.aOff(0, tensorsVec);
  fb.aOff(1, sgInputsOff);
  fb.aOff(2, sgOutputsOff);
  fb.aOff(3, opsVec);
  if (sgNameOff) fb.aOff(4, sgNameOff);
  const sgOff = fb.endObj();
  const sgVecOff = fb.vecOff([sgOff]);

  const opcOffsets = [];
  for (const opc of m.opCodes) {
    const customOff = opc.custom ? fb.str(opc.custom) : 0;
    fb.startObj(4);
    fb.aI8(0, Math.min(opc.code, 127), 0);
    if (customOff) fb.aOff(1, customOff);
    fb.aI32(2, opc.version || 1, 0);
    fb.aI32(3, opc.code, 0);
    opcOffsets.push(fb.endObj());
  }
  const opcVecOff = fb.vecOff(opcOffsets);

  const descOff = fb.str(m.description || '');

  fb.startObj(5);
  fb.aU32(0, m.version || 3, 0);
  fb.aOff(1, opcVecOff);
  fb.aOff(2, sgVecOff);
  if (descOff) fb.aOff(3, descOff);
  fb.aOff(4, buffersVec);
  const modelOff = fb.endObj();

  return fb.finish(modelOff);
}

// --- Deep clone the parsed tflite model ---
function cloneTflModel(m) {
  return {
    version: m.version,
    description: m.description,
    opCodes: m.opCodes.map(o => ({ ...o })),
    subgraphs: m.subgraphs.map(sg => ({
      name: sg.name,
      tensors: sg.tensors.map(t => ({
        shape: [...t.shape], type: t.type, buffer: t.buffer, name: t.name,
        quant: t.quant ? {
          scale: [...t.quant.scale], zero_point: [...t.quant.zero_point],
          min: t.quant.min ? [...t.quant.min] : [], max: t.quant.max ? [...t.quant.max] : [],
          quantized_dimension: t.quant.quantized_dimension
        } : null
      })),
      inputs: [...sg.inputs],
      outputs: [...sg.outputs],
      operators: sg.operators.map(op => ({
        opcode_index: op.opcode_index, inputs: [...op.inputs], outputs: [...op.outputs]
      }))
    })),
    buffers: m.buffers.map(b => ({ data: b.data ? new Uint8Array(b.data) : null }))
  };
}

// TFL type name -> type code
const TFL_TYPE_CODES = {};
for (const [k, v] of Object.entries(TFL_TYPES)) TFL_TYPE_CODES[v] = parseInt(k);

// --- Apply FC type change: insert CAST nodes, modify tensors, return new model bytes ---
function applyFCTypeChange(opIndex, newInputTypeCode, newOutputTypeCode) {
  const mc = cloneTflModel(tflParsed);
  const sg = mc.subgraphs[0];
  const fcOp = sg.operators[opIndex];
  if (!fcOp) throw new Error('Operator not found at index ' + opIndex);

  // Ensure CAST opcode exists in opCodes; CAST = 53
  let castOpcIdx = mc.opCodes.findIndex(o => o.code === 53);
  if (castOpcIdx < 0) {
    castOpcIdx = mc.opCodes.length;
    mc.opCodes.push({ code: 53, custom: '', version: 1 });
  }

  const activationTi = fcOp.inputs[0]; // input[0] is the activation tensor
  const origInputType = sg.tensors[activationTi].type;
  const outputTi = fcOp.outputs[0];
  const origOutputType = sg.tensors[outputTi].type;

  let insertBefore = null;
  let insertAfter = null;

  // --- Handle input change ---
  if (newInputTypeCode !== origInputType) {
    const newBufIdx = mc.buffers.length;
    mc.buffers.push({ data: null });

    const srcTensor = sg.tensors[activationTi];
    const newTensorIdx = sg.tensors.length;
    sg.tensors.push({
      shape: [...srcTensor.shape], type: newInputTypeCode, buffer: newBufIdx,
      name: srcTensor.name + '_cast_' + TFL_TYPES[newInputTypeCode],
      quant: null
    });

    insertBefore = {
      opcode_index: castOpcIdx,
      inputs: [activationTi],
      outputs: [newTensorIdx]
    };

    fcOp.inputs[0] = newTensorIdx;
  }

  // --- Handle output change ---
  if (newOutputTypeCode !== origOutputType) {
    sg.tensors[outputTi].type = newOutputTypeCode;
    sg.tensors[outputTi].name = (sg.tensors[outputTi].name || '') + '_' + TFL_TYPES[newOutputTypeCode];

    const newBufIdx = mc.buffers.length;
    mc.buffers.push({ data: null });
    const newTensorIdx = sg.tensors.length;
    sg.tensors.push({
      shape: [...sg.tensors[outputTi].shape], type: origOutputType, buffer: newBufIdx,
      name: (sg.tensors[outputTi].name || 'output') + '_cast_' + TFL_TYPES[origOutputType],
      quant: null
    });

    insertAfter = {
      opcode_index: castOpcIdx,
      inputs: [outputTi],
      outputs: [newTensorIdx]
    };

    for (let oi = 0; oi < sg.operators.length; oi++) {
      if (oi === opIndex) continue;
      const op = sg.operators[oi];
      for (let j = 0; j < op.inputs.length; j++) {
        if (op.inputs[j] === outputTi) op.inputs[j] = newTensorIdx;
      }
    }

    for (let i = 0; i < sg.outputs.length; i++) {
      if (sg.outputs[i] === outputTi) sg.outputs[i] = newTensorIdx;
    }
  }

  let fcPos = opIndex;
  if (insertBefore) {
    sg.operators.splice(fcPos, 0, insertBefore);
    fcPos++;
  }
  if (insertAfter) {
    sg.operators.splice(fcPos + 1, 0, insertAfter);
  }

  return buildFullTFLite(mc);
}
