enable f16;
@group(0) @binding(0) var inputTexture: ${inputTextureType};
@group(0) @binding(1) var textureSampler: sampler;
@group(0) @binding(2) var<storage, read_write> outBuf: array<f16>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let outputDims = vec2<u32>(256, 144);
    if (global_id.x >= outputDims.x || global_id.y >= outputDims.y) {
        return;
    }
    let uv = (vec2<f32>(global_id.xy) + vec2<f32>(0.5, 0.5)) / vec2<f32>(outputDims);
    let color = textureSampleBaseClampToEdge(inputTexture, textureSampler, uv);
    let pixelIndex = global_id.y * u32(outputDims.x) + global_id.x;
    let base = pixelIndex * 3u;
    outBuf[base + 0u] = f16(color.r);
    outBuf[base + 1u] = f16(color.g);
    outBuf[base + 2u] = f16(color.b);
}
