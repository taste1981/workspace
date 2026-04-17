// ==================== PROTOBUF DECODER (for ONNX) ====================
function pbReadVarint(buf, pos) {
  let val = 0, shift = 0;
  while (pos < buf.length) {
    const b = buf[pos++];
    val |= (b & 0x7f) * Math.pow(2, shift); // avoid bitwise for >32 bits
    shift += 7;
    if (!(b & 0x80)) return [val, pos];
    if (shift > 63) break;
  }
  return [val, pos];
}
function pbReadSVarint(buf, pos) {
  const [v, p] = pbReadVarint(buf, pos);
  return [v & 1 ? -(v + 1) / 2 : v / 2, p];
}
function pbReadF32(buf, pos) {
  const dv = new DataView(buf.buffer, buf.byteOffset + pos, 4);
  return [dv.getFloat32(0, true), pos + 4];
}
function pbReadF64(buf, pos) {
  const dv = new DataView(buf.buffer, buf.byteOffset + pos, 8);
  return [dv.getFloat64(0, true), pos + 8];
}
function pbReadFixed32(buf, pos) {
  const dv = new DataView(buf.buffer, buf.byteOffset + pos, 4);
  return [dv.getUint32(0, true), pos + 4];
}
function pbReadFixed64(buf, pos) {
  const dv = new DataView(buf.buffer, buf.byteOffset + pos, 8);
  const lo = dv.getUint32(0, true), hi = dv.getUint32(4, true);
  return [hi * 0x100000000 + lo, pos + 8];
}
function pbUTF8(buf, start, end) {
  const dec = new TextDecoder();
  return dec.decode(buf.subarray(start, end));
}
// Decode packed repeated varints
function pbPackedVarints(buf, start, end) {
  const out = []; let pos = start;
  while (pos < end) { const [v, p] = pbReadVarint(buf, pos); out.push(v); pos = p; }
  return out;
}
function pbPackedF32(buf, start, end) {
  const out = []; let pos = start;
  while (pos < end) { const [v, p] = pbReadF32(buf, pos); out.push(v); pos = p; }
  return out;
}
function pbPackedI64(buf, start, end) {
  return pbPackedVarints(buf, start, end); // for simplicity: int64 as varint
}

// ==================== ONNX PARSER ====================
const ONNX_DTYPE = {0:'undefined',1:'float32',2:'uint8',3:'int8',4:'uint16',5:'int16',6:'int32',7:'int64',8:'string',9:'bool',10:'float16',11:'float64',12:'uint32',13:'uint64',14:'complex64',15:'complex128',16:'bfloat16',17:'float8e4m3fn',18:'float8e4m3fnuz',19:'float8e5m2',20:'float8e5m2fnuz',21:'uint4',22:'int4',23:'float4e2m1'};
const ONNX_ATTR_TYPE = {0:'UNDEFINED',1:'FLOAT',2:'INT',3:'STRING',4:'TENSOR',5:'GRAPH',6:'FLOATS',7:'INTS',8:'STRINGS',9:'TENSORS',10:'GRAPHS',11:'SPARSE_TENSOR',12:'SPARSE_TENSORS',13:'TYPE_PROTO',14:'TYPE_PROTOS'};

function onnxParse(arrayBuf) {
  const buf = new Uint8Array(arrayBuf);
  return onnxDecodeModel(buf, 0, buf.length);
}

function onnxDecodeModel(buf, s, e) {
  const m = {ir_version:0, opset_import:[], producer_name:'', producer_version:'', domain:'', model_version:0, doc_string:'', graph:null, metadata:[]};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [v, p2] = pbReadVarint(buf, p); p = p2; if (fn===1) m.ir_version=v; else if (fn===5) m.model_version=v; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===2) m.producer_name = pbUTF8(buf,p,end);
      else if (fn===3) m.producer_version = pbUTF8(buf,p,end);
      else if (fn===4) m.domain = pbUTF8(buf,p,end);
      else if (fn===6) m.doc_string = pbUTF8(buf,p,end);
      else if (fn===7) m.graph = onnxDecodeGraph(buf,p,end);
      else if (fn===8) m.opset_import.push(onnxDecodeOpset(buf,p,end));
      else if (fn===14) m.metadata.push(onnxDecodeStrEntry(buf,p,end));
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return m;
}

function onnxDecodeGraph(buf, s, e) {
  const g = {name:'', doc_string:'', node:[], input:[], output:[], initializer:[], value_info:[]};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [,p2] = pbReadVarint(buf,p); p = p2; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) g.node.push(onnxDecodeNode(buf,p,end));
      else if (fn===2) g.name = pbUTF8(buf,p,end);
      else if (fn===10) g.doc_string = pbUTF8(buf,p,end);
      else if (fn===5) g.initializer.push(onnxDecodeTensor(buf,p,end));
      else if (fn===11) g.input.push(onnxDecodeValueInfo(buf,p,end));
      else if (fn===12) g.output.push(onnxDecodeValueInfo(buf,p,end));
      else if (fn===13) g.value_info.push(onnxDecodeValueInfo(buf,p,end));
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return g;
}

function onnxDecodeNode(buf, s, e) {
  const n = {input:[], output:[], name:'', op_type:'', domain:'', doc_string:'', attribute:[]};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [,p2] = pbReadVarint(buf,p); p = p2; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) n.input.push(pbUTF8(buf,p,end));
      else if (fn===2) n.output.push(pbUTF8(buf,p,end));
      else if (fn===3) n.name = pbUTF8(buf,p,end);
      else if (fn===4) n.op_type = pbUTF8(buf,p,end);
      else if (fn===6) n.doc_string = pbUTF8(buf,p,end);
      else if (fn===7) n.domain = pbUTF8(buf,p,end);
      else if (fn===5) n.attribute.push(onnxDecodeAttr(buf,p,end));
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return n;
}

function onnxDecodeAttr(buf, s, e) {
  const a = {name:'', type:0, f:0, i:0, s:'', t:null, floats:[], ints:[], strings:[], doc_string:'', ref_attr_name:''};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) {
      const [v, p2] = pbReadVarint(buf, p); p = p2;
      if (fn===3) a.i = v; // int64
      else if (fn===20) a.type = v;
    } else if (wt === 5) {
      const [v, p2] = pbReadF32(buf, p); p = p2;
      if (fn===2) a.f = v;
    } else if (wt === 2) {
      const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) a.name = pbUTF8(buf,p,end);
      else if (fn===4) a.s = pbUTF8(buf,p,end);
      else if (fn===13) a.doc_string = pbUTF8(buf,p,end);
      else if (fn===21) a.ref_attr_name = pbUTF8(buf,p,end);
      else if (fn===5) a.t = onnxDecodeTensor(buf,p,end);
      else if (fn===7) { // packed repeated floats
        if (a.floats.length === 0) a.floats = pbPackedF32(buf,p,end); else a.floats.push(...pbPackedF32(buf,p,end));
      } else if (fn===8) { // packed repeated ints
        if (a.ints.length === 0) a.ints = pbPackedVarints(buf,p,end); else a.ints.push(...pbPackedVarints(buf,p,end));
      } else if (fn===9) a.strings.push(pbUTF8(buf,p,end));
      p = end;
    } else if (wt === 1) { p += 8; }
  }
  return a;
}

function onnxDecodeTensor(buf, s, e) {
  const t = {dims:[], data_type:0, name:'', doc_string:'', raw_data_size:0};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) {
      const [v, p2] = pbReadVarint(buf, p); p = p2;
      if (fn===2) t.data_type = v;
    } else if (wt === 2) {
      const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) t.dims = pbPackedVarints(buf,p,end); // packed int64
      else if (fn===8) t.name = pbUTF8(buf,p,end);
      else if (fn===12) t.doc_string = pbUTF8(buf,p,end);
      else if (fn===9) t.raw_data_size = len; // skip raw_data
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return t;
}

function onnxDecodeValueInfo(buf, s, e) {
  const v = {name:'', doc_string:'', type:null};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [,p2] = pbReadVarint(buf,p); p = p2; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) v.name = pbUTF8(buf,p,end);
      else if (fn===2) v.type = onnxDecodeTypeProto(buf,p,end);
      else if (fn===3) v.doc_string = pbUTF8(buf,p,end);
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return v;
}

function onnxDecodeTypeProto(buf, s, e) {
  const tp = {tensor_type:null, denotation:''};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [,p2] = pbReadVarint(buf,p); p = p2; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) tp.tensor_type = onnxDecodeTensorType(buf,p,end);
      else if (fn===6) tp.denotation = pbUTF8(buf,p,end);
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return tp;
}

function onnxDecodeTensorType(buf, s, e) {
  const tt = {elem_type:0, shape:null};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [v, p2] = pbReadVarint(buf,p); p = p2; if (fn===1) tt.elem_type = v; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===2) tt.shape = onnxDecodeShape(buf,p,end);
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return tt;
}

function onnxDecodeShape(buf, s, e) {
  const dims = [];
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) dims.push(onnxDecodeDim(buf,p,end));
      p = end;
    } else if (wt === 0) { const [,p2] = pbReadVarint(buf,p); p = p2; }
    else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return dims;
}

function onnxDecodeDim(buf, s, e) {
  let dim_value = null, dim_param = null;
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [v, p2] = pbReadVarint(buf,p); p = p2; if (fn===1) dim_value = v; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===2) dim_param = pbUTF8(buf,p,end);
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return dim_param || (dim_value != null ? dim_value : '?');
}

function onnxDecodeOpset(buf, s, e) {
  const o = {domain:'', version:0};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 0) { const [v, p2] = pbReadVarint(buf,p); p = p2; if (fn===2) o.version = v; }
    else if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) o.domain = pbUTF8(buf,p,end);
      p = end;
    } else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return o;
}

function onnxDecodeStrEntry(buf, s, e) {
  const o = {key:'', value:''};
  let p = s;
  while (p < e) {
    const [tag, p1] = pbReadVarint(buf, p); p = p1;
    const fn = tag >>> 3, wt = tag & 7;
    if (wt === 2) { const [len, p2] = pbReadVarint(buf, p); p = p2; const end = p + len;
      if (fn===1) o.key = pbUTF8(buf,p,end);
      else if (fn===2) o.value = pbUTF8(buf,p,end);
      p = end;
    } else if (wt === 0) { const [,p2] = pbReadVarint(buf,p); p = p2; }
    else if (wt === 5) { p += 4; } else if (wt === 1) { p += 8; }
  }
  return o;
}

// ==================== ONNX → UNIFIED GRAPH ====================
function onnxToGraph(m) {
  const g = m.graph;
  if (!g) return null;
  const meta = { name: g.name||m.domain||'', format: 'ONNX', producer: m.producer_name+(m.producer_version?' v'+m.producer_version:''), irVersion: m.ir_version, opsets: m.opset_import.map(o=>(o.domain||'ai.onnx')+' v'+o.version).join(', '), metadata: m.metadata };

  const initNames = new Set(g.initializer.map(t => t.name));
  const tensorInfo = {}; // name -> {type, shape}
  // Collect type info from graph inputs, outputs, value_info
  for (const vi of [...g.input, ...g.output, ...g.value_info]) {
    const info = {};
    if (vi.type && vi.type.tensor_type) {
      info.type = ONNX_DTYPE[vi.type.tensor_type.elem_type] || 'unknown';
      if (vi.type.tensor_type.shape) info.shape = vi.type.tensor_type.shape.map(d => String(d));
    }
    tensorInfo[vi.name] = info;
  }
  for (const init of g.initializer) {
    tensorInfo[init.name] = { type: ONNX_DTYPE[init.data_type]||'unknown', shape: init.dims.map(String) };
  }

  const nodes = [], edges = [];
  let nid = 0;

  // Tensor name -> producing node/port
  const tensorProducer = {}; // name -> {nodeId, portIdx}

  // Parameter nodes (inputs that are not initializers)
  for (const vi of g.input) {
    if (initNames.has(vi.name)) continue;
    const info = tensorInfo[vi.name] || {};
    const id = 'n' + nid++;
    nodes.push({ id, name: vi.name, type: 'Input', category: CAT.param, attrs: {}, inputs: [],
      outputs: [{ name: vi.name, type: info.type||'', shape: info.shape||[] }], extra: { doc: vi.doc_string } });
    tensorProducer[vi.name] = { nodeId: id, portIdx: 0 };
  }

  // Initializer (constant) nodes
  for (const init of g.initializer) {
    const info = tensorInfo[init.name] || {};
    const id = 'n' + nid++;
    const attrs = { shape: '[' + init.dims.join(', ') + ']', type: ONNX_DTYPE[init.data_type]||'unknown' };
    if (init.raw_data_size > 0) attrs.data_size = init.raw_data_size + ' bytes';
    nodes.push({ id, name: init.name, type: 'Initializer', category: CAT.const, attrs,
      inputs: [], outputs: [{ name: init.name, type: info.type||'', shape: info.shape||init.dims.map(String) }], extra: {} });
    tensorProducer[init.name] = { nodeId: id, portIdx: 0 };
  }

  // Op nodes
  for (const node of g.node) {
    const id = 'n' + nid++;
    const attrs = {};
    for (const a of node.attribute) {
      if (a.type === 1) attrs[a.name] = String(a.f);
      else if (a.type === 2) attrs[a.name] = String(a.i);
      else if (a.type === 3) attrs[a.name] = a.s;
      else if (a.type === 6) attrs[a.name] = '[' + a.floats.map(x => x.toPrecision(6)).join(', ') + ']';
      else if (a.type === 7) attrs[a.name] = '[' + a.ints.join(', ') + ']';
      else if (a.type === 8) attrs[a.name] = '[' + a.strings.join(', ') + ']';
      else if (a.type === 4 && a.t) attrs[a.name] = `Tensor<${ONNX_DTYPE[a.t.data_type]||'?'}>[${a.t.dims.join(',')}]`;
      else attrs[a.name] = ONNX_ATTR_TYPE[a.type] || '?';
    }
    const inputs = node.input.map((name, i) => {
      const info = tensorInfo[name] || {};
      return { name: name||'', type: info.type||'', shape: info.shape||[], portName: 'input_'+i };
    });
    const outputs = node.output.map((name, i) => {
      const info = tensorInfo[name] || {};
      return { name: name||'', type: info.type||'', shape: info.shape||[], portName: 'output_'+i };
    });
    const extra = { domain: node.domain, doc: node.doc_string };
    nodes.push({ id, name: node.name || node.op_type, type: node.op_type, category: CAT.op, attrs, inputs, outputs, extra });

    // Register outputs
    for (let i = 0; i < node.output.length; i++) {
      if (node.output[i]) tensorProducer[node.output[i]] = { nodeId: id, portIdx: i };
    }

    // Create edges from inputs
    for (let i = 0; i < node.input.length; i++) {
      const iname = node.input[i];
      if (!iname) continue;
      const prod = tensorProducer[iname];
      if (prod) {
        const info = tensorInfo[iname] || {};
        const shapeStr = info.shape ? '['+info.shape.join(',')+']' : '';
        edges.push({ from: prod.nodeId, fromPort: prod.portIdx, to: id, toPort: i, label: shapeStr });
      }
    }
  }

  // Result nodes
  for (const vi of g.output) {
    const info = tensorInfo[vi.name] || {};
    const id = 'n' + nid++;
    nodes.push({ id, name: vi.name, type: 'Output', category: CAT.result, attrs: {},
      inputs: [{ name: vi.name, type: info.type||'', shape: info.shape||[] }], outputs: [], extra: { doc: vi.doc_string } });
    const prod = tensorProducer[vi.name];
    if (prod) {
      const shapeStr = info.shape ? '['+info.shape.join(',')+']' : '';
      edges.push({ from: prod.nodeId, fromPort: prod.portIdx, to: id, toPort: 0, label: shapeStr });
    }
  }

  return { meta, nodes, edges };
}
