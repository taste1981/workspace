// ==================== STATE ====================
let graph = null;
let selId = null;
let showConst = true;
let tx = 0, ty = 0, sc = 1;
let pan = false, px = 0, py = 0;
let sMatches = [];
let tflParsed = null;     // parsed TFLite model (for carving)
let selectMode = false;   // selection mode toggle
let carveSet = new Set(); // selected node IDs for carving
let selDrag = null;       // {sx,sy} screen coords of drag start in select mode

const $ = id => document.getElementById(id);
const svgEl = $('svg'), rootG = $('groot'), garea = $('garea'), details = $('details');
const sinput = $('sinput'), scnt = $('scnt'), sdd = $('sdd'), loadEl = $('loading');
const welc = $('welcome'), infoEl = $('model-info'), dropov = $('dropov');

// ==================== FILE HANDLING ====================
$('btn-open').onclick = () => $('finput').click();
$('finput').addEventListener('change', e => { if (e.target.files[0]) loadFile(e.target.files[0]); });
$('btn-constants').onclick = function() { showConst = !showConst; this.classList.toggle('active', showConst); if (graph) doLayout(); };
$('btn-constants').classList.add('active');

let dc = 0;
document.addEventListener('dragenter', e => { e.preventDefault(); dc++; dropov.classList.add('on'); });
document.addEventListener('dragleave', e => { e.preventDefault(); dc--; if (!dc) dropov.classList.remove('on'); });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { e.preventDefault(); dc=0; dropov.classList.remove('on');
  const f = Array.from(e.dataTransfer.files); const mf = f.find(x=>x.name.match(/\.(onnx|tflite|xml|pb|pbtxt)$/i));
  if (mf) loadFile(mf);
});

function loadFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'xml') {
    const r = new FileReader();
    r.onload = e => {
      const parsed = ovirParse(e.target.result);
      if (!parsed) { alert('Failed to parse OpenVINO IR XML'); return; }
      graph = ovirToGraph(parsed);
      onModelLoaded(file.name);
    };
    r.readAsText(file);
  } else if (ext === 'onnx') {
    const r = new FileReader();
    r.onload = e => {
      try {
        const parsed = onnxParse(e.target.result);
        graph = onnxToGraph(parsed);
        if (!graph) { alert('Failed to parse ONNX model'); return; }
      } catch (err) { alert('ONNX parse error: ' + err.message); return; }
      onModelLoaded(file.name);
    };
    r.readAsArrayBuffer(file);
  } else if (ext === 'tflite') {
    const r = new FileReader();
    r.onload = e => {
      try {
        tflParsed = tflParse(e.target.result);
        graph = tflToGraph(tflParsed);
        if (!graph) { alert('Failed to parse TFLite model'); return; }
      } catch (err) { alert('TFLite parse error: ' + err.message); return; }
      onModelLoaded(file.name);
    };
    r.readAsArrayBuffer(file);
  } else if (ext === 'dot' || ext === 'gv') {
    const r = new FileReader();
    r.onload = e => {
      try {
        const parsed = dotParse(e.target.result);
        graph = dotToGraph(parsed);
        if (!graph || graph.nodes.length === 0) { alert('Failed to parse DOT file or no nodes found'); return; }
      } catch (err) { alert('DOT parse error: ' + err.message); return; }
      onModelLoaded(file.name);
    };
    r.readAsText(file);
  } else {
    alert('Unsupported format: .' + ext);
  }
}

function onModelLoaded(filename) {
  welc.style.display = 'none';
  svgEl.style.display = '';
  const m = graph.meta;
  infoEl.textContent = `${filename}  |  ${m.format}  |  ${graph.nodes.length} nodes  |  ${graph.edges.length} edges`;
  selId = null;
  carveSet.clear(); updateCarveUI();
  // Show carve tools for TFLite models
  $('carve-group').style.display = m.format === 'TFLite' ? 'flex' : 'none';
  doLayout();
  showModelProps();
}

// ==================== LAYOUT ====================
const DAGRE_LIMIT = 500;
const NW = 170, NH = 40;

function visibleNodes() {
  if (showConst) return graph.nodes;
  return graph.nodes.filter(n => n.category !== CAT.const);
}
function visibleEdges() {
  const vids = new Set(visibleNodes().map(n=>n.id));
  return graph.edges.filter(e => vids.has(e.from) && vids.has(e.to));
}

function doLayout() {
  loadEl.style.display = 'flex';
  requestAnimationFrame(() => setTimeout(() => {
    try {
      const vn = visibleNodes(), ve = visibleEdges();
      let lg;
      if (vn.length <= DAGRE_LIMIT) {
        try { lg = dagreLayout(vn, ve); } catch(e) { console.warn('Dagre fail:', e.message); lg = iterLayout(vn, ve); }
      } else { lg = iterLayout(vn, ve); }
      render(lg);
      fit();
    } catch(e) { console.error(e); alert('Layout error: '+e.message); }
    loadEl.style.display = 'none';
  }, 30));
}

function dagreLayout(vn, ve) {
  const g = new dagre.graphlib.Graph({multigraph:true});
  g.setGraph({rankdir:'TB',nodesep:35,ranksep:55,edgesep:12,marginx:25,marginy:25});
  g.setDefaultEdgeLabel(()=>({}));
  for (const n of vn) g.setNode(n.id,{label:n.name,width:NW,height:NH,node:n});
  for (const e of ve) { const k=`${e.from}:${e.fromPort}->${e.to}:${e.toPort}`; g.setEdge(e.from,e.to,{label:e.label},k); }
  dagre.layout(g);
  return g;
}

function iterLayout(vn, ve) {
  const ids = new Set(vn.map(n=>n.id));
  const ch={}, pa={}, indeg={};
  for (const n of vn) { ch[n.id]=[]; pa[n.id]=[]; indeg[n.id]=0; }
  for (const e of ve) { if(ids.has(e.from)&&ids.has(e.to)){ch[e.from].push(e.to);pa[e.to].push(e.from);indeg[e.to]++;} }
  const rank={}, q=[], topo=[];
  for(const n of vn) if(indeg[n.id]===0){q.push(n.id);rank[n.id]=0;}
  let h=0;
  while(h<q.length){const id=q[h++];topo.push(id);for(const c of ch[id]){rank[c]=Math.max(rank[c]||0,rank[id]+1);indeg[c]--;if(indeg[c]===0)q.push(c);}}
  for(const n of vn) if(rank[n.id]===undefined){rank[n.id]=0;topo.push(n.id);}
  const rg={};let mr=0;
  for(const id of topo){const r=rank[id];if(!rg[r])rg[r]=[];rg[r].push(id);if(r>mr)mr=r;}
  const px={},py={};
  for(let r=0;r<=mr;r++){const g=rg[r]||[];const tw=g.length*NW+(g.length-1)*35;const sx=-tw/2+NW/2;for(let i=0;i<g.length;i++){px[g[i]]=sx+i*(NW+35);py[g[i]]=r*(NH+55);}}
  for(let sw=0;sw<2;sw++){
    for(let r=1;r<=mr;r++){const g=rg[r]||[];const b={};for(const id of g){const ps=pa[id];if(ps.length){let s=0;for(const p of ps)s+=px[p];b[id]=s/ps.length;}else b[id]=px[id];}g.sort((a,b2)=>b[a]-b[b2]);const tw=g.length*NW+(g.length-1)*35;const sx=-tw/2+NW/2;for(let i=0;i<g.length;i++)px[g[i]]=sx+i*(NW+35);}
    for(let r=mr-1;r>=0;r--){const g=rg[r]||[];const b={};for(const id of g){const cs=ch[id];if(cs.length){let s=0;for(const c of cs)s+=px[c];b[id]=s/cs.length;}else b[id]=px[id];}g.sort((a,b2)=>b[a]-b[b2]);const tw=g.length*NW+(g.length-1)*35;const sx=-tw/2+NW/2;for(let i=0;i<g.length;i++)px[g[i]]=sx+i*(NW+35);}
  }
  const nodeMap={}; for(const n of vn) nodeMap[n.id]=n;
  const nd={};for(const n of vn) nd[n.id]={x:px[n.id],y:py[n.id],width:NW,height:NH,node:n};
  const el=[], edm={};
  for(const e of ve){if(!ids.has(e.from)||!ids.has(e.to))continue;const k=`${e.from}:${e.fromPort}->${e.to}:${e.toPort}`;
    const s=nd[e.from],d=nd[e.to];el.push({v:e.from,w:e.to,name:k});
    edm[k]={label:e.label,points:[{x:s.x,y:s.y+NH/2},{x:(s.x+d.x)/2,y:(s.y+d.y)/2},{x:d.x,y:d.y-NH/2}]};}
  return {nodes(){return Object.keys(nd);},node(id){return nd[id];},edges(){return el;},edge(e){return edm[e.name];}};
}

// ==================== RENDERER ====================
function render(lg) {
  rootG.innerHTML = '';
  const eg = ns('g'); eg.setAttribute('class','eg');
  const ng = ns('g'); ng.setAttribute('class','ng');
  rootG.appendChild(eg); rootG.appendChild(ng);

  for (const e of lg.edges()) {
    const ed = lg.edge(e); if(!ed||!ed.points||ed.points.length<2)continue;
    const g = ns('g'); g.setAttribute('class','edge'); g.dataset.from=e.v; g.dataset.to=e.w;
    const p = ns('path'); p.setAttribute('d',epath(ed.points)); p.setAttribute('marker-end','url(#ah)'); g.appendChild(p);
    if (ed.label) { const mid=ed.points[Math.floor(ed.points.length/2)]; const t=ns('text');t.setAttribute('class','edge-lbl');t.setAttribute('x',mid.x+3);t.setAttribute('y',mid.y-3);t.textContent=ed.label;g.appendChild(t); }
    eg.appendChild(g);
  }

  for (const nid of lg.nodes()) {
    const nd = lg.node(nid); if(!nd)continue;
    const n = nd.node, x = nd.x-nd.width/2, y = nd.y-nd.height/2, col = opColor(n.type);
    const g = ns('g'); g.setAttribute('class','node'); g.setAttribute('transform',`translate(${x},${y})`); g.dataset.id=n.id;
    const r = ns('rect'); r.setAttribute('width',nd.width); r.setAttribute('height',nd.height); r.setAttribute('fill',col); r.setAttribute('stroke',shade(col,-20)); g.appendChild(r);
    const tt = ns('text'); tt.setAttribute('class','ntype'); tt.setAttribute('x',nd.width/2); tt.setAttribute('y',n.name&&n.name!==n.type?16:22); tt.setAttribute('text-anchor','middle');
    if(n.type==='Convert'||n.type==='CAST'||n.type==='Cast')tt.setAttribute('fill','#333');
    tt.textContent=n.type; g.appendChild(tt);
    if(n.name&&n.name!==n.type){const nt=ns('text');nt.setAttribute('class','nname');nt.setAttribute('x',nd.width/2);nt.setAttribute('y',30);nt.setAttribute('text-anchor','middle');
      if(n.type==='Convert'||n.type==='CAST')nt.setAttribute('fill','#666');
      nt.textContent=n.name.length>22?n.name.slice(0,22)+'...':n.name;g.appendChild(nt);}
    g.addEventListener('click',ev=>{ev.stopPropagation();selectNode(n.id);});
    ng.appendChild(g);
  }
  svgEl.addEventListener('click',()=>selectNode(null));
}

function ns(tag){return document.createElementNS('http://www.w3.org/2000/svg',tag);}
function epath(pts){if(pts.length===2)return`M${pts[0].x} ${pts[0].y}L${pts[1].x} ${pts[1].y}`;let d=`M${pts[0].x} ${pts[0].y}`;for(let i=1;i<pts.length-1;i++){const p1=pts[i],p2=pts[i+1];d+=` Q${p1.x} ${p1.y} ${(p1.x+p2.x)/2} ${(p1.y+p2.y)/2}`;}const l=pts[pts.length-1];d+=` L${l.x} ${l.y}`;return d;}
function shade(hex,pct){const n=parseInt(hex.slice(1),16);const r=Math.min(255,Math.max(0,(n>>16)+pct));const g=Math.min(255,Math.max(0,((n>>8)&0xff)+pct));const b=Math.min(255,Math.max(0,(n&0xff)+pct));return'#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);}

// ==================== PAN / ZOOM ====================
function applyTx(){rootG.setAttribute('transform',`translate(${tx},${ty}) scale(${sc})`);}
svgEl.addEventListener('wheel',e=>{e.preventDefault();const r=garea.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const d=e.deltaY>0?0.9:1.1;const ns2=Math.min(5,Math.max(0.02,sc*d));tx=mx-(mx-tx)*(ns2/sc);ty=my-(my-ty)*(ns2/sc);sc=ns2;applyTx();},{passive:false});
svgEl.addEventListener('mousedown',e=>{if(e.button!==0||selectMode)return;if(e.target===svgEl||e.target===rootG||e.target.closest('.eg')){pan=true;px=e.clientX-tx;py=e.clientY-ty;svgEl.classList.add('dragging');}});
window.addEventListener('mousemove',e=>{if(!pan)return;tx=e.clientX-px;ty=e.clientY-py;applyTx();});
window.addEventListener('mouseup',()=>{pan=false;svgEl.classList.remove('dragging');});
$('btn-zi').onclick=()=>{const r=garea.getBoundingClientRect();const cx=r.width/2,cy=r.height/2;const ns2=Math.min(5,sc*1.3);tx=cx-(cx-tx)*(ns2/sc);ty=cy-(cy-ty)*(ns2/sc);sc=ns2;applyTx();};
$('btn-zo').onclick=()=>{const r=garea.getBoundingClientRect();const cx=r.width/2,cy=r.height/2;const ns2=Math.max(0.02,sc/1.3);tx=cx-(cx-tx)*(ns2/sc);ty=cy-(cy-ty)*(ns2/sc);sc=ns2;applyTx();};
$('btn-fit').onclick=fit;

function fit(){const bb=rootG.getBBox();if(!bb.width||!bb.height)return;const r=garea.getBoundingClientRect();const pd=30;const sx=(r.width-pd*2)/bb.width,sy=(r.height-pd*2)/bb.height;sc=Math.min(sx,sy,2);tx=(r.width-bb.width*sc)/2-bb.x*sc;ty=(r.height-bb.height*sc)/2-bb.y*sc;applyTx();}

// ==================== NODE SELECTION ====================
function selectNode(id) {
  selId = id;
  rootG.querySelectorAll('.node').forEach(n=>n.classList.remove('sel'));
  rootG.querySelectorAll('.edge').forEach(e=>{e.classList.remove('sel');const p=e.querySelector('path');if(p)p.setAttribute('marker-end','url(#ah)');});
  if (id != null) {
    const el = rootG.querySelector(`.node[data-id="${CSS.escape(id)}"]`);
    if (el) el.classList.add('sel');
    rootG.querySelectorAll('.edge').forEach(e=>{if(e.dataset.from===id||e.dataset.to===id){e.classList.add('sel');const p=e.querySelector('path');if(p)p.setAttribute('marker-end','url(#ah-s)');}});
    showNodeDetails(id);
  } else { showModelProps(); }
}
window.selectNode = selectNode;

function navTo(id) {
  const el = rootG.querySelector(`.node[data-id="${CSS.escape(id)}"]`);
  if (!el) return;
  const m = el.getAttribute('transform')?.match(/translate\(([\d.e+-]+),([\d.e+-]+)\)/);
  if (!m) return;
  const nx = parseFloat(m[1])+NW/2, ny = parseFloat(m[2])+NH/2;
  const r = garea.getBoundingClientRect();
  if (sc < 0.5) sc = 1;
  tx = r.width/2 - nx*sc; ty = r.height/2 - ny*sc;
  applyTx();
}

// ==================== DETAILS PANEL ====================
function H(s){return s==null?'':String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function showModelProps() {
  if (!graph) return;
  const m = graph.meta;
  let h = sec('Format', `<span class="badge">${H(m.format)}</span>`);
  if (m.name) h += sec('Name', H(m.name));
  if (m.producer) h += sec('Producer', H(m.producer));
  if (m.irVersion) h += sec('Version', H(m.irVersion));
  if (m.opsets) h += sec('Opsets', H(m.opsets));
  h += sec('Nodes', graph.nodes.length);
  h += sec('Edges', graph.edges.length);

  // Op type stats
  const tc = {};
  for (const n of graph.nodes) tc[n.type] = (tc[n.type]||0)+1;
  const sorted = Object.entries(tc).sort((a,b)=>b[1]-a[1]);
  h += '<div class="sec"><div class="lbl">Op Types</div><table class="tbl">';
  for (const [t,c] of sorted) h += `<tr><td>${H(t)}</td><td>${c}</td></tr>`;
  h += '</table></div>';

  // Metadata
  if (m.metadata && m.metadata.length) {
    h += '<div class="sec"><div class="lbl">Metadata</div><table class="tbl">';
    for (const e of m.metadata) h += `<tr><td>${H(e.key)}</td><td>${H(e.value)}</td></tr>`;
    h += '</table></div>';
  }
  details.innerHTML = h;
}

function showNodeDetails(id) {
  const node = graph.nodes.find(n => n.id === id);
  if (!node) return;
  let h = sec('Name', H(node.name));
  h += sec('Type', `<span class="badge">${H(node.type)}</span>`);
  h += sec('ID', H(node.id));
  if (node.extra?.domain) h += sec('Domain', H(node.extra.domain));
  if (node.extra?.version) h += sec('Version', H(node.extra.version));
  if (node.extra?.doc) h += sec('Description', H(node.extra.doc));

  // Attributes
  const ak = Object.keys(node.attrs);
  if (ak.length) {
    h += '<div class="sec"><div class="lbl">Attributes</div><table class="tbl">';
    for (const k of ak) {
      const v = node.attrs[k];
      const d = v && v.length > 300 ? v.slice(0,300)+'...' : v;
      h += `<tr><td>${H(k)}</td><td>${H(d)}</td></tr>`;
    }
    h += '</table></div>';
  }

  // Inputs
  if (node.inputs.length) {
    h += '<div class="sec"><div class="lbl">Inputs</div>';
    for (let i = 0; i < node.inputs.length; i++) {
      const inp = node.inputs[i];
      h += portHtml(inp, i);
    }
    // Connected from
    const srcs = graph.edges.filter(e => e.to === id);
    if (srcs.length) {
      h += '<div style="margin-top:4px;font-size:10px;color:#aaa;">Connected from:</div>';
      for (const e of srcs) {
        const sn = graph.nodes.find(n=>n.id===e.from);
        const nm = sn ? `${sn.name} (${sn.type})` : e.from;
        h += `<div class="conn" onclick="selectNode('${H(e.from)}');navTo('${H(e.from)}')">&larr; ${H(nm)}</div>`;
      }
    }
    h += '</div>';
  }

  // Outputs
  if (node.outputs.length) {
    h += '<div class="sec"><div class="lbl">Outputs</div>';
    for (let i = 0; i < node.outputs.length; i++) {
      const out = node.outputs[i];
      h += portHtml(out, i);
    }
    // Connected to
    const dsts = graph.edges.filter(e => e.from === id);
    if (dsts.length) {
      h += '<div style="margin-top:4px;font-size:10px;color:#aaa;">Connected to:</div>';
      for (const e of dsts) {
        const dn = graph.nodes.find(n=>n.id===e.to);
        const nm = dn ? `${dn.name} (${dn.type})` : e.to;
        h += `<div class="conn" onclick="selectNode('${H(e.to)}');navTo('${H(e.to)}')">&rarr; ${H(nm)}</div>`;
      }
    }
    h += '</div>';
  }

  // Quantization info (TFLite)
  if (node.extra?.quant) {
    const q = node.extra.quant;
    h += '<div class="sec"><div class="lbl">Quantization</div><table class="tbl">';
    if (q.scale?.length) h += `<tr><td>scale</td><td>${H(q.scale.length > 8 ? q.scale.slice(0,8).join(', ')+', ...' : q.scale.join(', '))}</td></tr>`;
    if (q.zero_point?.length) h += `<tr><td>zero_point</td><td>${H(q.zero_point.length > 8 ? q.zero_point.slice(0,8).join(', ')+', ...' : q.zero_point.join(', '))}</td></tr>`;
    if (q.min?.length) h += `<tr><td>min</td><td>${H(q.min.join(', '))}</td></tr>`;
    if (q.max?.length) h += `<tr><td>max</td><td>${H(q.max.join(', '))}</td></tr>`;
    if (q.quantized_dimension) h += `<tr><td>axis</td><td>${q.quantized_dimension}</td></tr>`;
    h += '</table></div>';
  }

  // Constant value display (TFLite)
  if (node.extra?.bufferIdx !== undefined && tflParsed) {
    const bufData = tflParsed.buffers[node.extra.bufferIdx]?.data;
    if (bufData && bufData.length > 0) {
      const decoded = decodeTflBuffer(bufData, node.extra.tensorType);
      if (decoded) {
        const shape = node.extra.tensorShape || [];
        const total = decoded.length || (Array.isArray(decoded) ? decoded.length : 0);
        const typeStr = TFL_TYPES[node.extra.tensorType] || 'unknown';
        h += '<div class="sec"><div class="lbl">Value <span style="font-size:9px;color:#aaa;text-transform:none;">(' + H(typeStr) + ', ' + total + ' elements, ' + bufData.length + ' bytes)</span></div>';
        h += '<div class="const-val">' + formatTensorValues(decoded, shape) + '</div>';
        h += '</div>';
      } else {
        h += '<div class="sec"><div class="lbl">Value</div><div class="val" style="font-size:11px;color:#999;">Raw data: ' + bufData.length + ' bytes (type: ' + H(TFL_TYPES[node.extra.tensorType] || '?') + ')</div></div>';
      }
    }
  }

  // Tensor details for TFLite operator nodes
  if (node.extra?.tensors) {
    const tkeys = Object.keys(node.extra.tensors);
    if (tkeys.length) {
      h += '<div class="sec"><div class="lbl">Tensor Details</div>';
      for (const ti of tkeys) {
        const t = node.extra.tensors[ti];
        const typeStr = TFL_TYPES[t.type] || '?';
        h += `<div style="font-size:10px;padding:2px 0;"><span class="tag">${H(t.name||'tensor_'+ti)}</span> ${H(typeStr)} [${t.shape.join(',')}]`;
        if (t.quant && t.quant.scale?.length) {
          h += `<div style="padding-left:8px;font-size:9px;color:#888;">scale: ${t.quant.scale.length > 4 ? t.quant.scale.slice(0,4).join(', ')+', ...' : t.quant.scale.join(', ')}`;
          if (t.quant.zero_point?.length) h += ` | zp: ${t.quant.zero_point.length > 4 ? t.quant.zero_point.slice(0,4).join(', ')+', ...' : t.quant.zero_point.join(', ')}`;
          h += '</div>';
        }
        h += '</div>';
      }
      h += '</div>';
    }
  }

  // RT info (OpenVINO)
  if (node.extra?.rtInfo) {
    h += rtInfoHtml('Runtime Info', node.extra.rtInfo);
  }

  // Edit Layer UI for TFLite FULLY_CONNECTED
  if (graph.meta.format === 'TFLite' && node.type === 'FULLY_CONNECTED' && node.extra?.opIndex !== undefined && tflParsed) {
    const sg = tflParsed.subgraphs[0];
    const fcOp = sg.operators[node.extra.opIndex];
    if (fcOp) {
      const actTi = fcOp.inputs[0];
      const outTi = fcOp.outputs[0];
      const actType = sg.tensors[actTi]?.type ?? 0;
      const outType = sg.tensors[outTi]?.type ?? 0;
      const typeOptions = [
        [0, 'float32'], [1, 'float16'], [9, 'int8'], [3, 'uint8']
      ];
      function typeSelect(name, curType) {
        let s = `<select id="${name}">`;
        for (const [code, label] of typeOptions) {
          s += `<option value="${code}"${code === curType ? ' selected' : ''}>${label}</option>`;
        }
        return s + '</select>';
      }
      h += '<div class="sec edit-sec"><div class="lbl">Edit Layer Types</div>';
      h += '<div class="edit-row"><label>Input type:</label>' + typeSelect('edit-in-type', actType);
      h += '<span class="arrow">&rarr;</span><span style="font-size:10px;color:#888;">activation input [0]</span></div>';
      h += '<div class="edit-row"><label>Output type:</label>' + typeSelect('edit-out-type', outType);
      h += '<span class="arrow">&rarr;</span><span style="font-size:10px;color:#888;">output [0]</span></div>';
      h += '<div class="edit-preview" id="edit-preview"></div>';
      h += '<button class="btn-apply" id="btn-apply-edit">Apply &amp; Download</button>';
      h += '</div>';
    }
  }

  details.innerHTML = h;

  // Wire up edit UI events after DOM insertion
  if (graph.meta.format === 'TFLite' && node.type === 'FULLY_CONNECTED' && node.extra?.opIndex !== undefined) {
    const sg = tflParsed.subgraphs[0];
    const fcOp = sg.operators[node.extra.opIndex];
    if (fcOp) {
      const actTi = fcOp.inputs[0];
      const outTi = fcOp.outputs[0];
      const origInType = sg.tensors[actTi]?.type ?? 0;
      const origOutType = sg.tensors[outTi]?.type ?? 0;
      const inSel = document.getElementById('edit-in-type');
      const outSel = document.getElementById('edit-out-type');
      const prevEl = document.getElementById('edit-preview');
      const applyBtn = document.getElementById('btn-apply-edit');
      function updatePreview() {
        if (!inSel || !outSel || !prevEl || !applyBtn) return;
        const newIn = parseInt(inSel.value);
        const newOut = parseInt(outSel.value);
        const noChange = newIn === origInType && newOut === origOutType;
        applyBtn.disabled = noChange;
        if (noChange) { prevEl.textContent = '(no changes)'; prevEl.style.color = '#999'; return; }
        prevEl.style.color = '#1565c0';
        let lines = [];
        if (newIn !== origInType) {
          lines.push('[prev] ──' + TFL_TYPES[origInType] + '──► [CAST ' + TFL_TYPES[origInType] + '→' + TFL_TYPES[newIn] + ']');
          lines.push('  ──' + TFL_TYPES[newIn] + '──► [FULLY_CONNECTED]');
        } else {
          lines.push('[prev] ──' + TFL_TYPES[origInType] + '──► [FULLY_CONNECTED]');
        }
        if (newOut !== origOutType) {
          lines.push('  ──' + TFL_TYPES[newOut] + '──► [CAST ' + TFL_TYPES[newOut] + '→' + TFL_TYPES[origOutType] + ']');
          lines.push('  ──' + TFL_TYPES[origOutType] + '──► [next]');
        } else {
          lines.push('  ──' + TFL_TYPES[origOutType] + '──► [next]');
        }
        prevEl.textContent = lines.join('\n');
      }
      if (inSel) inSel.addEventListener('change', updatePreview);
      if (outSel) outSel.addEventListener('change', updatePreview);
      if (applyBtn) applyBtn.addEventListener('click', () => {
        const newIn = parseInt(inSel.value);
        const newOut = parseInt(outSel.value);
        if (newIn === origInType && newOut === origOutType) return;
        try {
          const data = applyFCTypeChange(node.extra.opIndex, newIn, newOut);
          const blob = new Blob([data], { type: 'application/octet-stream' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'modified_model.tflite';
          a.click();
          URL.revokeObjectURL(url);
        } catch (err) {
          alert('Edit failed: ' + err.message);
          console.error(err);
        }
      });
      updatePreview();
    }
  }
}

function portHtml(p, idx) {
  const shape = p.shape?.length ? '['+p.shape.join(', ')+']' : 'scalar';
  let h = `<div class="port"><span class="pid">${idx}</span><span class="pshape">${H(shape)}</span><span class="ptype">${H(p.type)}</span></div>`;
  if (p.name) h += `<div style="font-size:9px;color:#bbb;padding-left:4px;">${H(p.name)}</div>`;
  if (p.rtInfo) h += rtInfoInline(p.rtInfo);
  return h;
}

function rtInfoInline(info) {
  let h = '<div style="padding-left:4px;">';
  for (const [k,v] of Object.entries(info)) {
    if (typeof v === 'string') h += `<div style="font-size:9px;"><span class="tag">${H(k)}</span> <span style="font-family:monospace;color:#666;font-size:9px;">${H(v)}</span></div>`;
    else if (typeof v === 'object' && v) {
      h += `<div style="font-size:9px;"><span class="tag">${H(k)}</span>`;
      for (const [sk,sv] of Object.entries(v)) { const d = typeof sv==='object'?JSON.stringify(sv):String(sv); h += `<div style="padding-left:6px;font-size:9px;color:#777;">${H(sk)}: <span style="font-family:monospace;">${H(d)}</span></div>`; }
      h += '</div>';
    }
  }
  return h + '</div>';
}

function rtInfoHtml(title, info) {
  if (!info || !Object.keys(info).length) return '';
  let h = `<div class="sec"><div class="lbl">${H(title)}</div><table class="tbl">`;
  for (const [k,v] of Object.entries(info)) {
    if (typeof v === 'string') h += `<tr><td>${H(k)}</td><td>${H(v)}</td></tr>`;
    else if (typeof v === 'object' && v) {
      const d = Object.entries(v).map(([sk,sv])=>`${sk}: ${typeof sv==='object'?JSON.stringify(sv):sv}`).join(', ');
      h += `<tr><td>${H(k)}</td><td>${H(d)}</td></tr>`;
    }
  }
  return h + '</table></div>';
}

function sec(lbl, val) { return `<div class="sec"><div class="lbl">${H(lbl)}</div><div class="val">${val}</div></div>`; }

// ==================== SEARCH ====================
let sto = null;
sinput.addEventListener('input', () => { clearTimeout(sto); sto = setTimeout(doSearch, 200); });
sinput.addEventListener('focus', () => { if (sMatches.length) sdd.classList.add('vis'); });
document.addEventListener('click', e => { if (!e.target.closest('.search') && !e.target.closest('.search-dd')) sdd.classList.remove('vis'); });

function doSearch() {
  const q = sinput.value.trim().toLowerCase();
  rootG.querySelectorAll('.node.hl').forEach(n=>n.classList.remove('hl'));
  sMatches = []; sdd.innerHTML = '';
  if (!q || !graph) { scnt.textContent=''; sdd.classList.remove('vis'); return; }
  for (const n of graph.nodes) {
    if (n.name.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)) sMatches.push(n);
  }
  scnt.textContent = sMatches.length;
  for (const n of sMatches) {
    const el = rootG.querySelector(`.node[data-id="${CSS.escape(n.id)}"]`);
    if (el) el.classList.add('hl');
  }
  const lim = Math.min(sMatches.length, 40);
  for (let i = 0; i < lim; i++) {
    const n = sMatches[i];
    const it = document.createElement('div'); it.className='sri';
    it.innerHTML=`<span class="st">${H(n.type)}</span><span class="sn">${H(n.name)}</span>`;
    it.addEventListener('click',()=>{selectNode(n.id);navTo(n.id);sdd.classList.remove('vis');});
    sdd.appendChild(it);
  }
  if (sMatches.length > lim) { const m=document.createElement('div');m.className='sri';m.innerHTML=`<span class="sn" style="color:#888;">... ${sMatches.length-lim} more</span>`;sdd.appendChild(m); }
  if (sMatches.length) sdd.classList.add('vis'); else sdd.classList.remove('vis');
}

// Keyboard
document.addEventListener('keydown', e => {
  if ((e.ctrlKey||e.metaKey) && e.key === 'f') { e.preventDefault(); sinput.focus(); sinput.select(); }
  if (e.key === 'Escape') { if (document.activeElement===sinput) { sinput.blur(); sdd.classList.remove('vis'); } else selectNode(null); }
});

// ==================== SUBGRAPH CARVING UI ====================
function validateAndCarve() {
  if (!tflParsed || carveSet.size === 0) return;

  // Map selected node IDs to TFLite op indices
  const opIndices = [];
  for (const n of graph.nodes) {
    if (carveSet.has(n.id) && n.category === CAT.op && n.extra?.opIndex !== undefined) {
      opIndices.push(n.extra.opIndex);
    }
  }
  if (opIndices.length === 0) {
    alert('No operator nodes selected. Select operator nodes (not inputs/constants/outputs) to carve.');
    return;
  }

  try {
    const data = buildCarvedTFLite(opIndices);
    // Download
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carved_subgraph.tflite';
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    alert('Carve failed: ' + err.message);
    console.error(err);
  }
}

// --- Selection UI ---
function updateCarveUI() {
  const opCount = [...carveSet].filter(id => graph?.nodes.find(n=>n.id===id)?.category === CAT.op).length;
  $('btn-carve').style.display = opCount > 0 ? '' : 'none';
  $('btn-clear-sel').style.display = carveSet.size > 0 ? '' : 'none';
  $('sel-info').textContent = carveSet.size > 0 ? `${opCount} ops selected` : '';
  // Update node visuals
  rootG.querySelectorAll('.node').forEach(n => {
    n.classList.toggle('carved', carveSet.has(n.dataset.id));
  });
}

function toggleCarveNode(id) {
  if (carveSet.has(id)) carveSet.delete(id); else carveSet.add(id);
  updateCarveUI();
}

function screenToGraph(sx, sy) {
  const r = garea.getBoundingClientRect();
  return { x: (sx - r.left - tx) / sc, y: (sy - r.top - ty) / sc };
}

// Select mode button
$('btn-select').addEventListener('click', function() {
  selectMode = !selectMode;
  this.classList.toggle('active', selectMode);
  svgEl.classList.toggle('selecting', selectMode);
});
$('btn-carve').addEventListener('click', validateAndCarve);
$('btn-clear-sel').addEventListener('click', () => { carveSet.clear(); updateCarveUI(); });

// Rectangle drag selection in select mode
const selRectEl = $('sel-rect');
svgEl.addEventListener('mousedown', function(e) {
  if (!selectMode || e.button !== 0) return;
  // Don't start selection if clicking directly on a node
  if (e.target.closest('.node')) {
    // Toggle that node
    const nodeG = e.target.closest('.node');
    if (nodeG) { e.stopPropagation(); toggleCarveNode(nodeG.dataset.id); }
    return;
  }
  e.preventDefault();
  selDrag = { sx: e.clientX, sy: e.clientY };
  selRectEl.style.display = '';
});

window.addEventListener('mousemove', function(e) {
  if (!selDrag) return;
  const r = garea.getBoundingClientRect();
  const x1 = Math.min(selDrag.sx, e.clientX) - r.left;
  const y1 = Math.min(selDrag.sy, e.clientY) - r.top;
  const x2 = Math.max(selDrag.sx, e.clientX) - r.left;
  const y2 = Math.max(selDrag.sy, e.clientY) - r.top;
  selRectEl.setAttribute('x', x1);
  selRectEl.setAttribute('y', y1);
  selRectEl.setAttribute('width', x2 - x1);
  selRectEl.setAttribute('height', y2 - y1);
});

window.addEventListener('mouseup', function(e) {
  if (!selDrag) return;
  // Compute graph-space rectangle
  const g1 = screenToGraph(Math.min(selDrag.sx, e.clientX), Math.min(selDrag.sy, e.clientY));
  const g2 = screenToGraph(Math.max(selDrag.sx, e.clientX), Math.max(selDrag.sy, e.clientY));
  selDrag = null;
  selRectEl.style.display = 'none';

  // Only count as drag if area > 100 sq pixels screen
  const dx = g2.x - g1.x, dy = g2.y - g1.y;
  if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return; // too small, ignore

  // Select all nodes whose center falls within the rectangle
  rootG.querySelectorAll('.node').forEach(nd => {
    const t = nd.getAttribute('transform');
    const m = t?.match(/translate\(([\d.e+-]+),([\d.e+-]+)\)/);
    if (!m) return;
    const cx = parseFloat(m[1]) + NW/2, cy = parseFloat(m[2]) + NH/2;
    if (cx >= g1.x && cx <= g2.x && cy >= g1.y && cy <= g2.y) {
      carveSet.add(nd.dataset.id);
    }
  });
  updateCarveUI();
});

// Expose
window.navTo = navTo;
