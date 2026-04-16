// ==================== UNIFIED GRAPH MODEL ====================
// { meta: {...}, nodes: [{id, name, type, category, attrs, inputs:[{name,type,shape}], outputs:[{name,type,shape}], extra}], edges: [{from, fromPort, to, toPort, label}] }

const CAT = { param:'param', result:'result', const:'const', op:'op' };

// ==================== OP COLORS ====================
const OP_COLORS = {
  'Input':'#43a047','Output':'#e53935','Parameter':'#43a047','Result':'#e53935',
  'Initializer':'#5c6bc0','Constant':'#5c6bc0','Const':'#5c6bc0',
  'Conv':'#1e88e5','CONV_2D':'#1e88e5','CONV_3D':'#1e88e5','Convolution':'#1e88e5','GroupConvolution':'#1e88e5','ConvolutionBackpropData':'#1e88e5','DEPTHWISE_CONV_2D':'#1e88e5','TRANSPOSE_CONV':'#1e88e5',
  'Gemm':'#1565c0','MatMul':'#1565c0','FULLY_CONNECTED':'#1565c0','BATCH_MATMUL':'#1565c0','FullyConnected':'#1565c0',
  'Add':'#f4511e','ADD':'#f4511e','Mul':'#f4511e','MUL':'#f4511e','Sub':'#f4511e','SUB':'#f4511e','Div':'#f4511e','DIV':'#f4511e','Multiply':'#f4511e','Subtract':'#f4511e',
  'Relu':'#8e24aa','RELU':'#8e24aa','RELU6':'#8e24aa','ReLU':'#8e24aa','LeakyRelu':'#8e24aa','LEAKY_RELU':'#8e24aa','Sigmoid':'#8e24aa','LOGISTIC':'#8e24aa','Tanh':'#8e24aa','TANH':'#8e24aa','Softmax':'#8e24aa','SOFTMAX':'#8e24aa','Swish':'#8e24aa','HARD_SWISH':'#8e24aa','Gelu':'#8e24aa','GELU':'#8e24aa','Clip':'#8e24aa',
  'Reshape':'#546e7a','RESHAPE':'#546e7a','Transpose':'#546e7a','TRANSPOSE':'#546e7a','Squeeze':'#546e7a','SQUEEZE':'#546e7a','Unsqueeze':'#546e7a','Flatten':'#546e7a','EXPAND_DIMS':'#546e7a',
  'Convert':'#fdd835','CAST':'#fdd835','Cast':'#fdd835',
  'FakeQuantize':'#d81b60','QUANTIZE':'#d81b60','DEQUANTIZE':'#d81b60','FAKE_QUANT':'#d81b60',
  'Gather':'#00897b','GATHER':'#00897b','GATHER_ND':'#00897b','GatherND':'#00897b','Concat':'#00897b','CONCATENATION':'#00897b','Split':'#00897b','SPLIT':'#00897b','SPLIT_V':'#00897b','SLICE':'#00897b','Slice':'#00897b','StridedSlice':'#00897b','STRIDED_SLICE':'#00897b',
  'AVERAGE_POOL_2D':'#0277bd','MAX_POOL_2D':'#0277bd','MaxPool':'#0277bd','AveragePool':'#0277bd','GlobalAveragePool':'#0277bd',
  'ReduceMean':'#0277bd','MEAN':'#0277bd','ReduceMax':'#0277bd','REDUCE_MAX':'#0277bd','ReduceSum':'#0277bd','SUM':'#0277bd',
  'BatchNormalization':'#6d4c41','InstanceNormalization':'#6d4c41','LayerNormalization':'#6d4c41','MVN':'#6d4c41',
  'Resize':'#039be5','RESIZE_BILINEAR':'#039be5','RESIZE_NEAREST_NEIGHBOR':'#039be5','Interpolate':'#039be5',
  'Shape':'#78909c','ShapeOf':'#78909c','SHAPE':'#78909c','ConstantOfShape':'#78909c',
  'Pad':'#78909c','PAD':'#78909c','PADV2':'#78909c','Tile':'#78909c','TILE':'#78909c',
  'PACK':'#00897b','UNPACK':'#00897b',
};
function opColor(type) { return OP_COLORS[type] || '#607d8b'; }

// Format decoded tensor values for display, respecting shape for multi-dim tensors
function formatTensorValues(values, shape, maxPreview) {
  if (!values || values.length === 0) return '<span style="color:#999;">empty</span>';
  const total = values.length;
  maxPreview = maxPreview || 200;
  const isFloat = values instanceof Float32Array || values instanceof Float64Array;

  function fmtVal(v) {
    if (isFloat) {
      if (Number.isNaN(v)) return 'NaN';
      if (!Number.isFinite(v)) return v > 0 ? 'Inf' : '-Inf';
      // Show compact representation
      if (Number.isInteger(v) && Math.abs(v) < 1e6) return String(v);
      return v.toPrecision(6).replace(/\.?0+$/, '');
    }
    return String(v);
  }

  // For scalar
  if (shape.length === 0 || (shape.length === 1 && shape[0] <= 1 && total <= 1)) {
    return `<span style="font-family:monospace;font-size:11px;">${H(fmtVal(values[0]))}</span>`;
  }

  // For 1-D
  if (shape.length === 1 || shape.reduce((a,b) => a*b, 1) === total) {
    if (total <= maxPreview) {
      const strs = [];
      for (let i = 0; i < total; i++) strs.push(fmtVal(values[i]));
      return `<span style="font-family:monospace;font-size:10px;word-break:break-all;">[${strs.join(', ')}]</span>`;
    } else {
      const head = [], tail = [];
      const headN = Math.min(Math.floor(maxPreview / 2), 100);
      const tailN = Math.min(maxPreview - headN, 100);
      for (let i = 0; i < headN; i++) head.push(fmtVal(values[i]));
      for (let i = total - tailN; i < total; i++) tail.push(fmtVal(values[i]));
      return `<span style="font-family:monospace;font-size:10px;word-break:break-all;">[${head.join(', ')},<br><span style="color:#999;"> ... ${total - headN - tailN} more values ...</span><br>${tail.join(', ')}]</span>`;
    }
  }

  // For multi-dimensional: show as nested brackets for first few rows
  const lastDim = shape[shape.length - 1];
  const numRows = Math.floor(total / lastDim);
  const maxRows = Math.min(numRows, Math.floor(maxPreview / Math.min(lastDim, 20)));
  let html = '<div style="font-family:monospace;font-size:10px;max-height:300px;overflow-y:auto;word-break:break-all;">';
  for (let r = 0; r < maxRows; r++) {
    const start = r * lastDim;
    const rowVals = [];
    const showN = Math.min(lastDim, 20);
    for (let c = 0; c < showN; c++) rowVals.push(fmtVal(values[start + c]));
    const suffix = lastDim > showN ? ', ...' : '';
    html += `[${rowVals.join(', ')}${suffix}]<br>`;
  }
  if (numRows > maxRows) {
    html += `<span style="color:#999;">... ${numRows - maxRows} more rows (${total} total values)</span>`;
  }
  html += '</div>';
  return html;
}
