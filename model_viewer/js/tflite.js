// ==================== TFLITE FLATBUFFER READER ====================
const TFL_TYPES = {0:'float32',1:'float16',2:'int32',3:'uint8',4:'int64',5:'string',6:'bool',7:'int16',8:'complex64',9:'int8',10:'float64',11:'complex128',12:'uint64',13:'resource',14:'variant',15:'uint32',16:'uint16',17:'int4',18:'bfloat16',19:'int2'};
const TFL_OPS = {0:'ADD',1:'AVERAGE_POOL_2D',2:'CONCATENATION',3:'CONV_2D',4:'DEPTHWISE_CONV_2D',5:'DEPTH_TO_SPACE',6:'DEQUANTIZE',7:'EMBEDDING_LOOKUP',8:'FLOOR',9:'FULLY_CONNECTED',10:'HASHTABLE_LOOKUP',11:'L2_NORMALIZATION',12:'L2_POOL_2D',13:'LOCAL_RESPONSE_NORMALIZATION',14:'LOGISTIC',15:'LSH_PROJECTION',16:'LSTM',17:'MAX_POOL_2D',18:'MUL',19:'RELU',20:'RELU_N1_TO_1',21:'RELU6',22:'RESHAPE',23:'RESIZE_BILINEAR',24:'RNN',25:'SOFTMAX',26:'SPACE_TO_DEPTH',27:'SVDF',28:'TANH',29:'CONCAT_EMBEDDINGS',30:'SKIP_GRAM',31:'CALL',32:'CUSTOM',33:'EMBEDDING_LOOKUP_SPARSE',34:'PAD',35:'UNIDIRECTIONAL_SEQUENCE_RNN',36:'GATHER',37:'BATCH_TO_SPACE_ND',38:'SPACE_TO_BATCH_ND',39:'TRANSPOSE',40:'MEAN',41:'SUB',42:'DIV',43:'SQUEEZE',44:'UNIDIRECTIONAL_SEQUENCE_LSTM',45:'STRIDED_SLICE',46:'BIDIRECTIONAL_SEQUENCE_RNN',47:'EXP',48:'TOPK_V2',49:'SPLIT',50:'LOG_SOFTMAX',51:'DELEGATE',52:'BIDIRECTIONAL_SEQUENCE_LSTM',53:'CAST',54:'PRELU',55:'MAXIMUM',56:'ARG_MAX',57:'MINIMUM',58:'LESS',59:'NEG',60:'PADV2',61:'GREATER',62:'GREATER_EQUAL',63:'LESS_EQUAL',64:'SELECT',65:'SLICE',66:'SIN',67:'TRANSPOSE_CONV',68:'SPARSE_TO_DENSE',69:'TILE',70:'EXPAND_DIMS',71:'EQUAL',72:'NOT_EQUAL',73:'LOG',74:'SUM',75:'SQRT',76:'RSQRT',77:'SHAPE',78:'POW',79:'ARG_MIN',80:'FAKE_QUANT',81:'REDUCE_PROD',82:'REDUCE_MAX',83:'PACK',84:'LOGICAL_OR',85:'ONE_HOT',86:'LOGICAL_AND',87:'LOGICAL_NOT',88:'UNPACK',89:'REDUCE_MIN',90:'FLOOR_DIV',91:'REDUCE_ANY',92:'SQUARE',93:'ZEROS_LIKE',94:'FILL',95:'FLOOR_MOD',96:'RANGE',97:'RESIZE_NEAREST_NEIGHBOR',98:'LEAKY_RELU',99:'SQUARED_DIFFERENCE',100:'MIRROR_PAD',101:'ABS',102:'SPLIT_V',103:'UNIQUE',104:'CEIL',105:'REVERSE_V2',106:'ADD_N',107:'GATHER_ND',108:'COS',109:'WHERE',110:'RANK',111:'ELU',112:'REVERSE_SEQUENCE',113:'MATRIX_DIAG',114:'QUANTIZE',115:'MATRIX_SET_DIAG',116:'ROUND',117:'HARD_SWISH',118:'IF',119:'WHILE',120:'NON_MAX_SUPPRESSION_V4',121:'NON_MAX_SUPPRESSION_V5',122:'SCATTER_ND',123:'SELECT_V2',124:'DENSIFY',125:'SEGMENT_SUM',126:'BATCH_MATMUL',128:'CUMSUM',129:'CALL_ONCE',130:'BROADCAST_TO',131:'RFFT2D',132:'CONV_3D',134:'REAL',135:'COMPLEX_ABS',140:'REDUCE_ALL',141:'CONV_3D_TRANSPOSE',150:'GELU',151:'DYNAMIC_UPDATE_SLICE',156:'ATAN2',158:'SIGN'};

class FBReader {
  constructor(buf) { this.buf = buf; this.dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); }
  u8(o) { return this.buf[o]; }
  u16(o) { return this.dv.getUint16(o, true); }
  i16(o) { return this.dv.getInt16(o, true); }
  u32(o) { return this.dv.getUint32(o, true); }
  i32(o) { return this.dv.getInt32(o, true); }
  i64(o) { const lo = this.u32(o), hi = this.i32(o+4); return hi * 0x100000000 + lo; }
  f32(o) { return this.dv.getFloat32(o, true); }
  str(o) { if (!o) return ''; const so = o + this.u32(o); const len = this.u32(so); return new TextDecoder().decode(this.buf.subarray(so+4, so+4+len)); }
  tbl(o) { const to = o + this.i32(o); return to; } // indirect offset to table
  vtbl(t) { return t - this.i32(t); } // vtable offset
  field(t, idx) { const vt = this.vtbl(t); const vsize = this.u16(vt); const foff = 4 + idx * 2; if (foff >= vsize) return 0; const fo = this.u16(vt + foff); return fo ? t + fo : 0; }
  fieldU8(t,i) { const o = this.field(t,i); return o ? this.u8(o) : 0; }
  fieldU16(t,i) { const o = this.field(t,i); return o ? this.u16(o) : 0; }
  fieldI32(t,i) { const o = this.field(t,i); return o ? this.i32(o) : 0; }
  fieldU32(t,i) { const o = this.field(t,i); return o ? this.u32(o) : 0; }
  fieldI64(t,i) { const o = this.field(t,i); return o ? this.i64(o) : 0; }
  fieldF32(t,i) { const o = this.field(t,i); return o ? this.f32(o) : 0; }
  fieldStr(t,i) { const o = this.field(t,i); return o ? this.str(o) : ''; }
  fieldTbl(t,i) { const o = this.field(t,i); return o ? this.tbl(o) : 0; }
  vec(o) { if (!o) return {len:0, at:()=>0}; const vo = o + this.u32(o); const len = this.u32(vo); const base = vo + 4; const self = this; return {len, at(i) { return base + i * 4; }, tbl(i) { return self.tbl(base + i*4); }, i32(i) { return self.i32(base + i*4); }, u8(i) { return self.u8(base+i); }}; }
  fieldVec(t,i) { const o = this.field(t,i); return this.vec(o); }
}

function tflParse(arrayBuf) {
  const buf = new Uint8Array(arrayBuf);
  const fb = new FBReader(buf);
  const root = fb.tbl(0);
  const version = fb.fieldU32(root, 0);
  const description = fb.fieldStr(root, 3);

  // operator_codes
  const opcVec = fb.fieldVec(root, 1);
  const opCodes = [];
  for (let i = 0; i < opcVec.len; i++) {
    const oc = opcVec.tbl(i);
    const deprecated = fb.fieldU8(oc, 0); // deprecated_builtin_code (int8)
    const custom = fb.fieldStr(oc, 1);
    const ver = fb.fieldI32(oc, 2);
    const builtin = fb.fieldI32(oc, 3);
    // Use builtin_code if not 0, else deprecated code
    const code = builtin !== 0 ? builtin : deprecated;
    opCodes.push({ code, custom, version: ver });
  }

  // subgraphs
  const sgVec = fb.fieldVec(root, 2);
  const subgraphs = [];
  for (let si = 0; si < sgVec.len; si++) {
    const sg = sgVec.tbl(si);
    const sgName = fb.fieldStr(sg, 4);

    // tensors
    const tVec = fb.fieldVec(sg, 0);
    const tensors = [];
    for (let ti = 0; ti < tVec.len; ti++) {
      const t = tVec.tbl(ti);
      const shapeVec = fb.fieldVec(t, 0);
      const shape = [];
      for (let d = 0; d < shapeVec.len; d++) shape.push(shapeVec.i32(d));
      const type = fb.fieldU8(t, 1);
      const buffer = fb.fieldU32(t, 2);
      const name = fb.fieldStr(t, 3);
      // quantization
      let quant = null;
      const qo = fb.fieldTbl(t, 4);
      if (qo) {
        const minV = fb.fieldVec(qo, 0), maxV = fb.fieldVec(qo, 1);
        const scaleV = fb.fieldVec(qo, 2), zpV = fb.fieldVec(qo, 3);
        const qdim = fb.fieldI32(qo, 6);
        const scales = [], zps = [], mins = [], maxs = [];
        for (let j = 0; j < scaleV.len; j++) scales.push(fb.f32(scaleV.at(j)));
        for (let j = 0; j < zpV.len; j++) zps.push(fb.i64(zpV.at(j) - 4 + j * 8)); // i64 vec
        // re-read zps as i64 vector properly
        if (zpV.len > 0) {
          zps.length = 0;
          const zpBase = fb.field(qo, 3);
          if (zpBase) {
            const zpVecOff = zpBase + fb.u32(zpBase);
            const zpLen = fb.u32(zpVecOff);
            for (let j = 0; j < zpLen; j++) zps.push(fb.i64(zpVecOff + 4 + j * 8));
          }
        }
        for (let j = 0; j < minV.len; j++) mins.push(fb.f32(minV.at(j)));
        for (let j = 0; j < maxV.len; j++) maxs.push(fb.f32(maxV.at(j)));
        if (scales.length > 0 || zps.length > 0) {
          quant = { scale: scales, zero_point: zps, min: mins, max: maxs, quantized_dimension: qdim };
        }
      }
      tensors.push({ shape, type, buffer, name, quant });
    }

    // inputs/outputs
    const inVec = fb.fieldVec(sg, 1), outVec = fb.fieldVec(sg, 2);
    const inputs = [], outputs = [];
    for (let i = 0; i < inVec.len; i++) inputs.push(inVec.i32(i));
    for (let i = 0; i < outVec.len; i++) outputs.push(outVec.i32(i));

    // operators
    const opVec = fb.fieldVec(sg, 3);
    const operators = [];
    for (let oi = 0; oi < opVec.len; oi++) {
      const op = opVec.tbl(oi);
      const opcodeIdx = fb.fieldU32(op, 0);
      const opInVec = fb.fieldVec(op, 1), opOutVec = fb.fieldVec(op, 2);
      const opInputs = [], opOutputs = [];
      for (let i = 0; i < opInVec.len; i++) opInputs.push(opInVec.i32(i));
      for (let i = 0; i < opOutVec.len; i++) opOutputs.push(opOutVec.i32(i));
      operators.push({ opcode_index: opcodeIdx, inputs: opInputs, outputs: opOutputs });
    }

    subgraphs.push({ name: sgName, tensors, inputs, outputs, operators });
  }

  // buffers
  const bufVec = fb.fieldVec(root, 4);
  const buffers = [];
  for (let bi = 0; bi < bufVec.len; bi++) {
    const b = bufVec.tbl(bi);
    let data = null;
    const fo = fb.field(b, 0);
    if (fo) {
      const vo = fo + fb.u32(fo);
      const len = fb.u32(vo);
      if (len > 0) { data = new Uint8Array(buf.subarray(vo + 4, vo + 4 + len)); }
    }
    buffers.push({ data });
  }

  return { version, description, opCodes, subgraphs, buffers };
}

// ==================== TFLITE → UNIFIED GRAPH ====================
function tflToGraph(m) {
  const sg = m.subgraphs[0];
  if (!sg) return null;
  const meta = { name: m.description||sg.name||'', format: 'TFLite', producer: 'TensorFlow Lite', irVersion: 'v'+m.version, opsets: '' };

  const nodes = [], edges = [];
  let nid = 0;

  // Map tensor index to producer
  const tensorProducer = {};

  // Subgraph inputs → Parameter nodes
  for (const ti of sg.inputs) {
    const t = sg.tensors[ti];
    if (!t) continue;
    const id = 'n' + nid++;
    const typeStr = TFL_TYPES[t.type] || 'unknown';
    nodes.push({ id, name: t.name||`input_${ti}`, type: 'Input', category: CAT.param, attrs: {},
      inputs: [], outputs: [{ name: t.name, type: typeStr, shape: t.shape.map(String) }],
      extra: { tensorIdx: ti, quant: t.quant } });
    tensorProducer[ti] = { nodeId: id, portIdx: 0 };
  }

  // Operators → Op nodes
  for (let oi = 0; oi < sg.operators.length; oi++) {
    const op = sg.operators[oi];
    const opc = m.opCodes[op.opcode_index];
    const opName = opc ? (opc.code === 32 ? (opc.custom||'CUSTOM') : (TFL_OPS[opc.code]||'OP_'+opc.code)) : 'UNKNOWN';
    const id = 'n' + nid++;

    const inputs = op.inputs.filter(i => i >= 0).map((ti, pi) => {
      const t = sg.tensors[ti];
      return { name: t?t.name:'', type: t?TFL_TYPES[t.type]||'':'', shape: t?t.shape.map(String):[], portName: 'input_'+pi, tensorIdx: ti };
    });
    const outputs = op.outputs.map((ti, pi) => {
      const t = sg.tensors[ti];
      return { name: t?t.name:'', type: t?TFL_TYPES[t.type]||'':'', shape: t?t.shape.map(String):[], portName: 'output_'+pi, tensorIdx: ti };
    });

    // Collect quantization info from output tensors
    const attrs = {};
    for (const out of outputs) {
      const t = sg.tensors[out.tensorIdx];
      if (t && t.quant) {
        if (t.quant.scale.length > 0) attrs['output_scale'] = t.quant.scale.length > 4 ? `[${t.quant.scale.slice(0,4).join(', ')}, ...]` : `[${t.quant.scale.join(', ')}]`;
        if (t.quant.zero_point.length > 0) attrs['output_zp'] = t.quant.zero_point.length > 4 ? `[${t.quant.zero_point.slice(0,4).join(', ')}, ...]` : `[${t.quant.zero_point.join(', ')}]`;
      }
    }

    // Check if any input is an initializer (buffer > 0)
    const constInputs = [];
    for (let pi = 0; pi < op.inputs.length; pi++) {
      const ti = op.inputs[pi];
      if (ti < 0) continue;
      const t = sg.tensors[ti];
      if (t && t.buffer > 0 && !sg.inputs.includes(ti) && !tensorProducer[ti]) {
        // This is a constant tensor
        const cid = 'n' + nid++;
        const typeStr = TFL_TYPES[t.type] || 'unknown';
        const cattrs = { shape: '[' + t.shape.join(', ') + ']', type: typeStr };
        if (t.quant) {
          if (t.quant.scale.length) cattrs.scale = t.quant.scale.length > 4 ? `[${t.quant.scale.slice(0,4).join(', ')}, ...]` : `[${t.quant.scale.join(', ')}]`;
          if (t.quant.zero_point.length) cattrs.zero_point = t.quant.zero_point.length > 4 ? `[${t.quant.zero_point.slice(0,4).join(', ')}, ...]` : `[${t.quant.zero_point.join(', ')}]`;
          if (t.quant.quantized_dimension) cattrs.quantized_dimension = String(t.quant.quantized_dimension);
        }
        nodes.push({ id: cid, name: t.name||`const_${ti}`, type: 'Constant', category: CAT.const,
          attrs: cattrs, inputs: [], outputs: [{ name: t.name, type: typeStr, shape: t.shape.map(String) }],
          extra: { tensorIdx: ti, quant: t.quant, bufferIdx: t.buffer, tensorType: t.type, tensorShape: t.shape } });
        tensorProducer[ti] = { nodeId: cid, portIdx: 0 };
        constInputs.push(ti);
      }
    }

    const extra = { opcode: opName, opIndex: oi, tensors: {} };
    // Store full tensor info for detail view
    for (const inp of inputs) {
      const t = sg.tensors[inp.tensorIdx];
      if (t) extra.tensors[inp.tensorIdx] = t;
    }
    for (const out of outputs) {
      const t = sg.tensors[out.tensorIdx];
      if (t) extra.tensors[out.tensorIdx] = t;
    }

    nodes.push({ id, name: opName + '_' + oi, type: opName, category: CAT.op, attrs, inputs, outputs, extra });

    // Register outputs
    for (let pi = 0; pi < op.outputs.length; pi++) {
      tensorProducer[op.outputs[pi]] = { nodeId: id, portIdx: pi };
    }

    // Create edges
    let portIdx = 0;
    for (const ti of op.inputs) {
      if (ti < 0) { portIdx++; continue; }
      const prod = tensorProducer[ti];
      if (prod) {
        const t = sg.tensors[ti];
        const label = t ? '['+t.shape.join(',')+']' : '';
        edges.push({ from: prod.nodeId, fromPort: prod.portIdx, to: id, toPort: portIdx, label });
      }
      portIdx++;
    }
  }

  // Subgraph outputs → Result nodes
  for (const ti of sg.outputs) {
    const t = sg.tensors[ti];
    if (!t) continue;
    const id = 'n' + nid++;
    const typeStr = TFL_TYPES[t.type] || 'unknown';
    nodes.push({ id, name: t.name||`output_${ti}`, type: 'Output', category: CAT.result, attrs: {},
      inputs: [{ name: t.name, type: typeStr, shape: t.shape.map(String) }], outputs: [],
      extra: { tensorIdx: ti, quant: t.quant } });
    const prod = tensorProducer[ti];
    if (prod) {
      edges.push({ from: prod.nodeId, fromPort: prod.portIdx, to: id, toPort: 0, label: '['+t.shape.join(',')+']' });
    }
  }

  return { meta, nodes, edges };
}

// Decode TFLite buffer data into a typed array of values
function decodeTflBuffer(data, type) {
  if (!data || data.length === 0) return null;
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  switch (type) {
    case 0: { // float32
      const n = Math.floor(data.length / 4), v = new Float32Array(n);
      for (let i = 0; i < n; i++) v[i] = dv.getFloat32(i * 4, true);
      return v;
    }
    case 1: { // float16 -> decode to float32
      const n = Math.floor(data.length / 2), v = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const h = dv.getUint16(i * 2, true);
        const s = (h >> 15) & 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
        if (e === 0) v[i] = (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024);
        else if (e === 31) v[i] = f ? NaN : (s ? -Infinity : Infinity);
        else v[i] = (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024);
      }
      return v;
    }
    case 2: { // int32
      const n = Math.floor(data.length / 4), v = new Int32Array(n);
      for (let i = 0; i < n; i++) v[i] = dv.getInt32(i * 4, true);
      return v;
    }
    case 3: { // uint8
      return new Uint8Array(data);
    }
    case 4: { // int64
      const n = Math.floor(data.length / 8), v = [];
      for (let i = 0; i < n; i++) {
        const lo = dv.getUint32(i * 8, true), hi = dv.getInt32(i * 8 + 4, true);
        v.push(hi * 0x100000000 + lo);
      }
      return v;
    }
    case 6: { // bool
      const v = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) v[i] = data[i] ? 1 : 0;
      return v;
    }
    case 7: { // int16
      const n = Math.floor(data.length / 2), v = new Int16Array(n);
      for (let i = 0; i < n; i++) v[i] = dv.getInt16(i * 2, true);
      return v;
    }
    case 9: { // int8
      const v = new Int8Array(data.length);
      for (let i = 0; i < data.length; i++) v[i] = dv.getInt8(i);
      return v;
    }
    case 10: { // float64
      const n = Math.floor(data.length / 8), v = new Float64Array(n);
      for (let i = 0; i < n; i++) v[i] = dv.getFloat64(i * 8, true);
      return v;
    }
    case 12: { // uint64
      const n = Math.floor(data.length / 8), v = [];
      for (let i = 0; i < n; i++) {
        const lo = dv.getUint32(i * 8, true), hi = dv.getUint32(i * 8 + 4, true);
        v.push(hi * 0x100000000 + lo);
      }
      return v;
    }
    case 15: { // uint32
      const n = Math.floor(data.length / 4), v = new Uint32Array(n);
      for (let i = 0; i < n; i++) v[i] = dv.getUint32(i * 4, true);
      return v;
    }
    case 16: { // uint16
      const n = Math.floor(data.length / 2), v = new Uint16Array(n);
      for (let i = 0; i < n; i++) v[i] = dv.getUint16(i * 2, true);
      return v;
    }
    case 18: { // bfloat16 -> decode to float32
      const n = Math.floor(data.length / 2), v = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const bf = dv.getUint16(i * 2, true);
        const tmp = new DataView(new ArrayBuffer(4));
        tmp.setUint32(0, bf << 16, false);
        v[i] = tmp.getFloat32(0, false);
      }
      return v;
    }
    default: return null;
  }
}
