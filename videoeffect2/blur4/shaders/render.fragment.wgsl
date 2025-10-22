@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var textureSampler: sampler;

@fragment
fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
    let uv = coord.xy / vec2<f32>(${width}.0, ${height}.0);
    return textureSample(inputTexture, textureSampler, uv);
}
