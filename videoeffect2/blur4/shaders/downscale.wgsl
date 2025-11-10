struct VertexOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vertMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  var pos = array<vec2f, 4>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0), vec2f(1.0, 1.0),
  );
  var uv = pos[vertexIndex] * vec2f(0.5, -0.5) + 0.5;
  return VertexOut(vec4f(pos[vertexIndex], 0, 1), uv);
}

@group(0) @binding(0) var inputTexture: ${inputTextureType};
@group(0) @binding(1) var textureSampler: sampler;

@fragment
fn fragMain(@location(0) uv: vec2f) -> @location(0) vec4f {
    return textureSampleBaseClampToEdge(inputTexture, textureSampler, uv);
}
