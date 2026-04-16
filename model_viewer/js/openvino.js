// ==================== OPENVINO IR PARSER ====================
function ovirParse(xmlStr) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlStr, 'text/xml');
  if (doc.querySelector('parsererror')) return null;
  const net = doc.querySelector('net');
  if (!net) return null;
  const meta = { name: net.getAttribute('name')||'', version: net.getAttribute('version')||'' };
  const layers = [], layerMap = {};
  for (const el of net.querySelectorAll('layers > layer')) {
    const l = {
      id: el.getAttribute('id'), name: el.getAttribute('name')||'', type: el.getAttribute('type')||'',
      version: el.getAttribute('version')||'', attrs: {}, inputs: [], outputs: [], rtInfo: null
    };
    const d = el.querySelector(':scope > data');
    if (d) for (const a of d.attributes) l.attrs[a.name] = a.value;
    for (const p of el.querySelectorAll(':scope > input > port')) l.inputs.push(ovirPort(p));
    for (const p of el.querySelectorAll(':scope > output > port')) l.outputs.push(ovirPort(p));
    const ri = el.querySelector(':scope > rt_info');
    if (ri) l.rtInfo = ovirRtInfo(ri);
    layers.push(l); layerMap[l.id] = l;
  }
  const edges = [];
  for (const e of net.querySelectorAll('edges > edge')) {
    edges.push({fromLayer:e.getAttribute('from-layer'), fromPort:e.getAttribute('from-port'), toLayer:e.getAttribute('to-layer'), toPort:e.getAttribute('to-port')});
  }
  return { meta, layers, edges, layerMap };
}
function ovirPort(el) {
  const p = {id:el.getAttribute('id'), precision:el.getAttribute('precision')||'', names:el.getAttribute('names')||'', dims:[], rtInfo:null};
  for (const d of el.querySelectorAll(':scope > dim')) p.dims.push(d.textContent.trim());
  const ri = el.querySelector(':scope > rt_info');
  if (ri) p.rtInfo = ovirRtInfo(ri);
  return p;
}
function ovirRtInfo(el) {
  const info = {};
  for (const c of el.children) {
    if (c.tagName === 'attribute') {
      const n = c.getAttribute('name')||'unknown', obj = {};
      for (const a of c.attributes) if (a.name !== 'name') obj[a.name] = a.value;
      for (const s of c.children) { const sa = {}; for (const a of s.attributes) sa[a.name] = a.value; obj[s.tagName] = Object.keys(sa).length===1&&sa.value!=null?sa.value:sa; }
      info[n] = Object.keys(obj).length===1&&obj.value!=null?obj.value:obj;
    } else { const v = c.getAttribute('value'); if (v!==null) info[c.tagName]=v; else { const a={}; for (const at of c.attributes) a[at.name]=at.value; if (Object.keys(a).length) info[c.tagName]=a; } }
  }
  return Object.keys(info).length ? info : null;
}

// ==================== OPENVINO IR → UNIFIED GRAPH ====================
function ovirToGraph(m) {
  const meta = { name: m.meta.name, format: 'OpenVINO IR', producer: '', irVersion: 'v'+m.meta.version, opsets: '' };
  const nodes = [], edges = [];

  for (const l of m.layers) {
    let cat = CAT.op;
    if (l.type === 'Parameter') cat = CAT.param;
    else if (l.type === 'Result') cat = CAT.result;
    else if (l.type === 'Const' || l.type === 'Constant') cat = CAT.const;

    const inputs = l.inputs.map(p => ({
      name: '', type: p.precision, shape: p.dims, portName: 'port_'+p.id, rtInfo: p.rtInfo
    }));
    const outputs = l.outputs.map(p => ({
      name: p.names||'', type: p.precision, shape: p.dims, portName: 'port_'+p.id, rtInfo: p.rtInfo
    }));
    nodes.push({ id: l.id, name: l.name, type: l.type, category: cat, attrs: l.attrs, inputs, outputs,
      extra: { version: l.version, rtInfo: l.rtInfo } });
  }

  for (const e of m.edges) {
    const src = m.layerMap[e.fromLayer];
    let label = '';
    if (src) {
      const port = src.outputs.find(p => p.id === e.fromPort);
      if (port && port.dims.length) label = '['+port.dims.join(',')+']';
    }
    edges.push({ from: e.fromLayer, fromPort: parseInt(e.fromPort)||0, to: e.toLayer, toPort: parseInt(e.toPort)||0, label });
  }

  return { meta, nodes, edges };
}
