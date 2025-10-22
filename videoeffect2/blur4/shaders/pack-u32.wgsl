@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var<storage, read_write> outBuf: array<u32>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let dims = textureDimensions(inputTexture);
    if (global_id.x >= dims.x || global_id.y >= dims.y) {
        return;
    }
    let coords = vec2<i32>(i32(global_id.x), i32(global_id.y));
    let texel = textureLoad(inputTexture, coords, 0);
    let rgb = texel.rgb / 255.0;
    let index = (global_id.y * u32(dims.x) + global_id.x) * 2u;
    outBuf[index] = pack2x16float(vec2<f32>(rgb.r, rgb.g));
    outBuf[index + 1u] = pack2x16float(vec2<f32>(rgb.b, 0.0));
}
