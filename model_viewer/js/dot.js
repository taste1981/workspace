// ==================== GRAPHVIZ DOT PARSER ====================
function dotParse(text) {
  text = text.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const nodes = {};
  const edges = [];
  let graphAttrs = {};

  const gmatch = text.match(/(?:di)?graph\s+(?:"([^"]*)"|([\w.]+))?/i);
  const graphName = gmatch ? (gmatch[1] || gmatch[2] || '') : '';

  const braceStart = text.indexOf('{');
  if (braceStart < 0) return { name: graphName, nodes: {}, edges: [], graphAttrs };
  let depth = 0, bodyStart = -1, bodyEnd = -1;
  for (let i = braceStart; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) bodyStart = i + 1; depth++; }
    else if (text[i] === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
  }
  if (bodyEnd < 0) bodyEnd = text.length;
  const body = text.substring(bodyStart, bodyEnd);

  // Parse key=value pairs from an attribute string.
  // Handles: key="val", key=<html with balanced <>>, key=bare
  function parseAttrs(s) {
    const a = {};
    if (!s) return a;
    let i = 0;
    const len = s.length;
    function skip() { while (i < len && /[\s,;]/.test(s[i])) i++; }
    while (i < len) {
      skip();
      if (i >= len) break;
      let key = '';
      while (i < len && /\w/.test(s[i])) { key += s[i]; i++; }
      if (!key) { i++; continue; }
      skip();
      if (i >= len || s[i] !== '=') continue;
      i++; skip();
      let val = '';
      if (i < len && s[i] === '"') {
        i++;
        while (i < len) {
          if (s[i] === '\\' && i + 1 < len) {
            const nc = s[i + 1];
            if (nc === 'n' || nc === 'l' || nc === 'r') val += '\n';
            else if (nc === '"') val += '"';
            else if (nc === '\\') val += '\\';
            else val += nc;
            i += 2;
          } else if (s[i] === '"') { i++; break; }
          else { val += s[i]; i++; }
        }
      } else if (i < len && s[i] === '<') {
        // HTML label: collect content inside balanced outer <>
        let ad = 0;
        while (i < len) {
          if (s[i] === '<') { ad++; if (ad === 1) { i++; continue; } }
          else if (s[i] === '>') { ad--; if (ad === 0) { i++; break; } }
          val += s[i]; i++;
        }
      } else {
        while (i < len && !/[\s,;\]]/.test(s[i])) { val += s[i]; i++; }
      }
      a[key] = val;
    }
    return a;
  }

  // Tokenize: split on ; or \n, respecting [...] brackets and "..." quotes
  const stmts = [];
  let cur = '', inQ = false, bd = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '"' && (i === 0 || body[i - 1] !== '\\')) { inQ = !inQ; cur += c; continue; }
    if (inQ) { cur += c; continue; }
    if (c === '[') { bd++; cur += c; continue; }
    if (c === ']') { bd--; cur += c; continue; }
    if (bd > 0) { cur += c; continue; }
    if (c === ';' || c === '\n') {
      const t = cur.trim();
      if (t) stmts.push(t);
      cur = ''; continue;
    }
    cur += c;
  }
  if (cur.trim()) stmts.push(cur.trim());

  for (const stmt of stmts) {
    if (/^(graph|node|edge)\s*\[/i.test(stmt)) {
      if (/^graph\s*\[/i.test(stmt)) {
        const ab = stmt.indexOf('['), ae = stmt.lastIndexOf(']');
        graphAttrs = parseAttrs(stmt.substring(ab + 1, ae >= 0 ? ae : undefined));
      }
      continue;
    }
    if (/^(sub)?graph\b/i.test(stmt)) continue;
    if (/^\{$|^\}$/.test(stmt.trim())) continue;

    // Edge detection: look for -> outside quotes. Handle chains: A -> B -> C [attrs]
    const arrowParts = [];
    let tmp = '', eq = false;
    for (let j = 0; j < stmt.length; j++) {
      if (stmt[j] === '"') { eq = !eq; tmp += stmt[j]; continue; }
      if (eq) { tmp += stmt[j]; continue; }
      if (stmt[j] === '-' && j + 1 < stmt.length && stmt[j + 1] === '>') {
        arrowParts.push(tmp.trim()); tmp = ''; j++; continue;
      }
      tmp += stmt[j];
    }
    if (arrowParts.length > 0) {
      arrowParts.push(tmp.trim());
      // Last part may have [attrs]
      let edgeAttrs = {};
      const last = arrowParts[arrowParts.length - 1];
      const bIdx = last.indexOf('[');
      if (bIdx >= 0) {
        const eIdx = last.lastIndexOf(']');
        edgeAttrs = parseAttrs(last.substring(bIdx + 1, eIdx >= 0 ? eIdx : undefined));
        arrowParts[arrowParts.length - 1] = last.substring(0, bIdx).trim();
      }
      for (let j = 0; j < arrowParts.length - 1; j++) {
        let from = arrowParts[j].replace(/^"|"$/g, '').trim();
        let to = arrowParts[j + 1].replace(/^"|"$/g, '').trim();
        // Handle port syntax: node:port -> strip port for node ID
        const fp = from.split(':'), tp = to.split(':');
        const fromId = fp[0], toId = tp[0];
        const fromPort = fp[1] || '', toPort = tp[1] || '';
        if (fromId && toId) {
          edges.push({ from: fromId, to: toId, fromPort, toPort, attrs: j === arrowParts.length - 2 ? edgeAttrs : {} });
          if (!nodes[fromId]) nodes[fromId] = { id: fromId, attrs: {} };
          if (!nodes[toId]) nodes[toId] = { id: toId, attrs: {} };
        }
      }
      continue;
    }

    // Node: <id> [attrs] — use indexOf/lastIndexOf instead of regex for robustness
    const bracketIdx = stmt.indexOf('[');
    if (bracketIdx > 0) {
      const idPart = stmt.substring(0, bracketIdx).trim();
      const lastBracket = stmt.lastIndexOf(']');
      const attrStr = stmt.substring(bracketIdx + 1, lastBracket >= 0 ? lastBracket : undefined);
      const idMatch = idPart.match(/^(?:"([^"]*)"|(\S+))/);
      if (idMatch) {
        const id = idMatch[1] !== undefined ? idMatch[1] : idMatch[2];
        const attrs = parseAttrs(attrStr);
        if (!nodes[id]) nodes[id] = { id, attrs };
        else Object.assign(nodes[id].attrs, attrs);
      }
    }
  }
  return { name: graphName, nodes, edges, graphAttrs };
}

// ==================== DOT → UNIFIED GRAPH ====================
function dotToGraph(parsed) {
  const meta = { name: parsed.name || 'Graph', format: 'DOT', producer: parsed.graphAttrs.label || '', irVersion: '', opsets: '', metadata: {} };
  const nodes = [];
  const edges = [];

  // Extract text rows from an HTML table label (<TABLE><TR><TD>...cells)
  function htmlToLines(html) {
    const rows = [];
    const trRe = /<TR[^>]*>([\s\S]*?)<\/TR>/gi;
    let m;
    while ((m = trRe.exec(html)) !== null) {
      const cells = [];
      const tdRe = /<TD[^>]*>([\s\S]*?)<\/TD>/gi;
      let cm;
      while ((cm = tdRe.exec(m[1])) !== null) {
        const text = cm[1].replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(+c)).trim();
        if (text) cells.push(text);
      }
      if (cells.length) rows.push(cells.join(' | '));
    }
    if (rows.length === 0) {
      // Fallback: strip all HTML tags
      const stripped = html.replace(/<[^>]*>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      if (stripped) rows.push(stripped);
    }
    return rows;
  }

  function classifyNode(id, attrs) {
    const rawLabel = attrs.label || '';
    let lines;

    // Detect HTML label (contains <TABLE, <TR, <FONT, or other HTML tags)
    if (/<\s*(?:TABLE|TR|TD|FONT|B|I|U|BR)\b/i.test(rawLabel)) {
      lines = htmlToLines(rawLabel);
    } else if (rawLabel) {
      lines = rawLabel.split('\n').map(l => l.trim()).filter(Boolean);
    } else {
      lines = [id];
    }

    const firstLine = (lines[0] || id).trim();
    let type = firstLine, name = firstLine || id;

    // Try to extract OpenVINO op type: "opsetN::OpName_123" or "Namespace::OpName"
    const nsMatch = firstLine.match(/(\w+::\w+)/);
    if (nsMatch) type = nsMatch[1];

    // Determine category from type, color, or style
    let cat = CAT.op;
    const color = (attrs.color || '').toLowerCase();
    const fillcolor = (attrs.fillcolor || '').toLowerCase();
    if (/parameter|input/i.test(type)) cat = CAT.param;
    else if (/result|output/i.test(type)) cat = CAT.result;
    else if (/constant|const/i.test(type)) cat = CAT.const;
    else if (color === 'crimson' || fillcolor === 'crimson') cat = CAT.result;

    // Build attributes from remaining label lines
    const extraAttrs = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const ioMatch = line.match(/^((?:in|out)\d+):\s*(.*)/);
      if (ioMatch) {
        extraAttrs[ioMatch[1]] = ioMatch[2];
      } else {
        const kvMatch = line.match(/^([\w_]+)\s*[:=]\s*(.+)/);
        if (kvMatch) extraAttrs[kvMatch[1]] = kvMatch[2];
        else extraAttrs['info_' + i] = line;
      }
    }

    // Extract typed ports from label
    const inputs = [], outputs = [];
    for (const [k, v] of Object.entries(extraAttrs)) {
      const portMatch = k.match(/^(in|out)(\d+)$/);
      if (portMatch) {
        const typeMatch = v.match(/\{([^}]+)\}/);
        const shapeMatch = v.match(/\[([^\]]+)\]/);
        const port = {
          name: k,
          type: typeMatch ? typeMatch[1] : '',
          shape: shapeMatch ? shapeMatch[1].split(',').map(s => s.trim()) : [],
          portName: k
        };
        if (portMatch[1] === 'in') inputs.push(port);
        else outputs.push(port);
      }
    }

    return { id, name, type, cat, attrs: extraAttrs, inputs, outputs };
  }

  // Build nodes
  const nodeMap = {};
  for (const [id, n] of Object.entries(parsed.nodes)) {
    const cl = classifyNode(id, n.attrs);
    nodes.push({
      id: cl.id, name: cl.name, type: cl.type, category: cl.cat,
      attrs: cl.attrs, inputs: cl.inputs, outputs: cl.outputs,
      extra: { dotAttrs: n.attrs }
    });
    nodeMap[id] = nodes[nodes.length - 1];
  }

  // Build edges
  for (const e of parsed.edges) {
    const rawLabel = e.attrs.label || '';
    const label = rawLabel.replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    edges.push({
      from: e.from, fromPort: e.fromPort || '', to: e.to, toPort: e.toPort || '', label
    });
  }

  return { meta, nodes, edges };
}
