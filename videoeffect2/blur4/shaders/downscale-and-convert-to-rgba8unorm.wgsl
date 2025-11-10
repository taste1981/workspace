@group(0) @binding(0) var inputTexture: ${inputTextureType};
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let outputDims = textureDimensions(outputTexture);
    if (global_id.x >= outputDims.x || global_id.y >= outputDims.y) {
        return;
    }
    let uv = (vec2<f32>(global_id.xy) + vec2<f32>(0.5, 0.5)) / vec2<f32>(outputDims);
    let color = textureSampleBaseClampToEdge(inputTexture, textureSampler, uv);
    textureStore(outputTexture, global_id.xy, color);
}
