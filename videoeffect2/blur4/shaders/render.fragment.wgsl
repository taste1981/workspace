@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var textureSampler: sampler;

@fragment
fn main(@location(0) uv: vec2f) -> @location(0) vec4f {
    return textureSample(inputTexture, textureSampler, uv);
}
