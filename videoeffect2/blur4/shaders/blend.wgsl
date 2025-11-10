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

struct ImageSize {
  width : i32,
  height : i32,
  texel_size : vec2<f32>,
};

@group(0) @binding(0) var input : ${inputTextureType};
@group(0) @binding(1) var blurred : texture_2d<f32>;
@group(0) @binding(2) var mask : texture_2d<f32>;
@group(0) @binding(3) var s : sampler;
@group(0) @binding(4) var<uniform> size : ImageSize;

const k00 = f32(${k00});
const kTileSize = ${tileSize}u;

@fragment
fn fragMain(@location(0) uv: vec2f) -> @location(0) vec4f {
  let coord_norm = uv + (0.5 * size.texel_size);
  var m = textureSampleLevel(mask, s, coord_norm, 0.0).r;
  var c = ${textureSampleCall};
  var b = textureSampleLevel(blurred, s, coord_norm, 0.0);
  b = b + (k00 * m) * c;
  b = b / b.a;
  return mix(b, c, m);
}
