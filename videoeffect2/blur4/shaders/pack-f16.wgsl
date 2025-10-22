enable f16;
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> outBuf: array<f16>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(inputTexture);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));
    let texel = textureLoad(inputTexture, coords, 0);
    let pixelIndex = global_id.y * u32(dims.x) + global_id.x;
    let base = pixelIndex * 3u;
    outBuf[base + 0u] = f16(texel.rgb.r);
    outBuf[base + 1u] = f16(texel.rgb.g);
    outBuf[base + 2u] = f16(texel.rgb.b);
}
