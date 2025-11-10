struct ImageSize {
  width : i32,
  height : i32,
  texel_size : vec2<f32>,
};

@group(0) @binding(0) var input : ${inputTextureType};
@group(0) @binding(1) var blurred : texture_2d<f32>;
@group(0) @binding(2) var mask : texture_2d<f32>;
@group(0) @binding(3) var output : texture_storage_2d<${outputFormat}, write>;
@group(0) @binding(4) var s : sampler;
@group(0) @binding(5) var<uniform> size : ImageSize;

const k00 = f32(${k00});
const kTileSize = ${tileSize}u;

@compute @workgroup_size(kTileSize, kTileSize)
fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
  let coord = vec2<i32>(gid.xy);
  if (coord.x >= size.width || coord.y >= size.height) {
    return;
  }

  let coord_norm = (vec2<f32>(coord) + vec2<f32>(0.5)) * size.texel_size;
  var m = textureSampleLevel(mask, s, coord_norm, 0.0).r;
  var c = ${textureSampleCall};
  var b = textureSampleLevel(blurred, s, coord_norm, 0.0);
  b = b + (k00 * m) * c;
  b = b / b.a;
  textureStore(output, coord, mix(b, c, m));
}
