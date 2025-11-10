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
@group(0) @binding(1) var mask : texture_2d<f32>;
@group(0) @binding(2) var s : sampler;
@group(0) @binding(3) var<uniform> size : ImageSize;

const kRadius = ${radius}u;
const kTileSize = ${tileSize}u;

fn blur(sample_coordinate : vec2<i32>, dir : vec2<f32>, pass_no : i32) -> vec4f {
  let sample_coordinate_norm =
      (vec2<f32>(sample_coordinate) + vec2<f32>(0.5)) * size.texel_size;

  var kKernel = array<f32, ${kernelSize}>(${kernelInitializer});

  let alpha = 1.0 - textureSampleLevel(mask, s, sample_coordinate_norm, 0.0).r;
  var color = ${textureSampleCall};
  var w = kKernel[0];
  if (pass_no == 0) {
    w = w * alpha;
  }
  color = color * w;

  let step = dir * alpha;
  var offset = step;

  var coord : vec2<f32>;
  for (var i = 1u; i <= kRadius; i=i+1u) {
      coord = sample_coordinate_norm + offset;
      w = kKernel[i];
      if (pass_no == 0) {
        w = w * (1.0 - textureSampleLevel(mask, s, coord, 0.0).r);
      }
      color = color + (w * ${loopTextureSampleCall});

      coord = sample_coordinate_norm - offset;
      w = kKernel[i];
      if (pass_no == 0) {
        w = w * (1.0 - textureSampleLevel(mask, s, coord, 0.0).r);
      }
      color = color + (w * ${loopTextureSampleCall});

      offset = offset + step;
  }

  return color;
}

@fragment
fn main_horizontal(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let dir = vec2<f32>(size.texel_size.x, 0.0);
  return blur(vec2i(pos.xy), dir, 0);
}

@fragment
fn main_vertical(@builtin(position) pos: vec4f) -> @location(0) vec4f {
  let dir = vec2<f32>(0.0, size.texel_size.y);
  return blur(vec2i(pos.xy), dir, 1);
}
