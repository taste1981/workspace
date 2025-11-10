struct ImageSize {
  width : i32,
  height : i32,
  texel_size : vec2<f32>,
};

@group(0) @binding(0) var input : ${inputTextureType};
@group(0) @binding(1) var mask : texture_2d<f32>;
@group(0) @binding(2) var output : texture_storage_2d<${outputFormat}, write>;
@group(0) @binding(3) var s : sampler;
@group(0) @binding(4) var<uniform> size : ImageSize;

const kRadius = ${radius}u;
const kTileSize = ${tileSize}u;

fn blur(sample_coordinate : vec2<i32>, dir : vec2<f32>, pass_no : i32) {
  if (sample_coordinate.x >= size.width || sample_coordinate.y >= size.height) {
    return;
  }
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

  textureStore(output, sample_coordinate, color);
}

@compute @workgroup_size(kTileSize, kTileSize)
fn main_horizontal(@builtin(global_invocation_id) gid : vec3<u32>) {
  let coord = vec2<i32>(gid.xy);
  let dir = vec2<f32>(size.texel_size.x, 0.0);
  blur(coord, dir, 0);
}

@compute @workgroup_size(kTileSize, kTileSize)
fn main_vertical(@builtin(global_invocation_id) gid : vec3<u32>) {
  let coord = vec2<i32>(gid.xy);
  let dir = vec2<f32>(0.0, size.texel_size.y);
  blur(coord, dir, 1);
}
