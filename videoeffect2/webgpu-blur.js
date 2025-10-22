// Copyright 2025 Google LLC
//
// SPDX-License-Identifier: Apache-2.0

function getTextureFormat(directOutput) {
  return directOutput ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';
}

function getOrCreateResource(cache, key, createFn) {
  if (!cache[key]) {
    cache[key] = createFn();
  }
  return cache[key];
}

function getOrCreateTexture(device, cache, key, size, directOutput, usage) {
  const [width, height] = size;
  const format = getTextureFormat(directOutput);
  const cacheKey = `${key}_${width}x${height}_${format}_${usage}`;

  let texture = cache[cacheKey];
  if (!texture || texture.width !== width || texture.height !== height) {
    if (texture) {
      texture.destroy();
    }
    texture = device.createTexture({
      size,
      format,
      usage,
    });
    cache[cacheKey] = texture;
  }
  return texture;
}


function adjustSizeByResolution(resolution, width, height) {
  let newWidth, newHeight;
  if (width > height) {
    newWidth = Math.round(width * 1.0 / height * resolution);
    newWidth = ((newWidth + 2) >> 2) << 2;
    newHeight = resolution;
  } else {
    newHeight = Math.round(height * 1.0 / width * resolution);
    newHeight = ((newHeight + 2) >> 2) << 2;
    newWidth = resolution;
  }
  return { width: newWidth, height: newHeight };
}

export class WebGPUBlur {
  constructor(device, zeroCopy, directOutput) {
    this.device = device;
    this.zeroCopy = zeroCopy;
    this.directOutput = directOutput;
    this.pipelines = {};
    this.sampler = device.createSampler({
      magFilter: 'linear',
      minFilter: 'linear',
    });
    this.resourceCache = {};
    this.tileSize = 8;
    this.radius = 7;
    this.inputWidth = 0;
    this.inputHeight = 0;
  }

  setInputDimensions(width, height) {
    this.inputWidth = width;
    this.inputHeight = height;
  }

  async init() {
    const kernel = this.calculateKernel(this.radius);
    const kernelInitializer = kernel.join(', ');

    const blurHorizontalShader = this.getBlurShader(this.radius, this.tileSize, kernel.length, kernelInitializer, true);
    const blurHorizontalModule = this.device.createShaderModule({ code: blurHorizontalShader });
    this.pipelines.horizontal = await this.device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module: blurHorizontalModule, entryPoint: 'main_horizontal' },
    });

    const blurVerticalShader = this.getBlurShader(this.radius, this.tileSize, kernel.length, kernelInitializer, false);
    const blurVerticalModule = this.device.createShaderModule({ code: blurVerticalShader });
    this.pipelines.vertical = await this.device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module: blurVerticalModule, entryPoint: 'main_vertical' },
    });

    const k00 = kernel[0] * kernel[0];
    const blendShader = this.getBlendShader(k00, this.tileSize);
    const blendModule = this.device.createShaderModule({ code: blendShader });
    this.pipelines.blend = await this.device.createComputePipelineAsync({
      layout: 'auto',
      compute: { module: blendModule, entryPoint: 'main' },
    });
  }

  calculateKernel(radius) {
    const kernel = new Array(radius + 1).fill(0.0);
    kernel[0] = 1.0;
    let kernelSum = kernel[0];
    const coeff = -2.0 / (radius * radius);
    for (let i = 1; i < kernel.length; ++i) {
      kernel[i] = Math.exp(coeff * i * i);
      kernelSum += 2.0 * kernel[i];
    }
    return kernel.map(v => v / kernelSum);
  }

  getBlurShader(radius, tileSize, kernelSize, kernelInitializer, isHorizontal) {
    const inputTextureType = (isHorizontal && this.zeroCopy) ? 'texture_external' : 'texture_2d<f32>';
    const textureSampleCall = (isHorizontal && this.zeroCopy) ?
      'textureSampleBaseClampToEdge(input, s, sample_coordinate_norm)' :
      'textureSampleLevel(input, s, sample_coordinate_norm, 0.0)';
    const loopTextureSampleCall = (isHorizontal && this.zeroCopy) ?
      'textureSampleBaseClampToEdge(input, s, coord)' :
      'textureSampleLevel(input, s, coord, 0.0)';
    const maskChannel = this.directOutput ? "b" : "r";

    return `
struct ImageSize {
  width : i32,
  height : i32,
  texel_size : vec2<f32>,
};

@group(0) @binding(0) var input : ${inputTextureType};
@group(0) @binding(1) var mask : texture_2d<f32>;
@group(0) @binding(2) var output : texture_storage_2d<${getTextureFormat(this.directOutput)}, write>;
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

  let alpha = 1.0 - textureSampleLevel(mask, s, sample_coordinate_norm, 0.0).${maskChannel};
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
        w = w * (1.0 - textureSampleLevel(mask, s, coord, 0.0).${maskChannel});
      }
      color = color + (w * ${loopTextureSampleCall});

      coord = sample_coordinate_norm - offset;
      w = kKernel[i];
      if (pass_no == 0) {
        w = w * (1.0 - textureSampleLevel(mask, s, coord, 0.0).${maskChannel});
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
`;
  }

  getBlendShader(k00, tileSize) {
    const inputTextureType = this.zeroCopy ? 'texture_external' : 'texture_2d<f32>';
    const textureSampleCall = this.zeroCopy ?
      'textureSampleBaseClampToEdge(input, s, coord_norm)' :
      'textureSampleLevel(input, s, coord_norm, 0.0)';
    const maskChannel = this.directOutput ? "b" : "r";

    return `
struct ImageSize {
  width : i32,
  height : i32,
  texel_size : vec2<f32>,
};

@group(0) @binding(0) var input : ${inputTextureType};
@group(0) @binding(1) var blurred : texture_2d<f32>;
@group(0) @binding(2) var mask : texture_2d<f32>;
@group(0) @binding(3) var output : texture_storage_2d<${getTextureFormat(this.directOutput)}, write>;
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
  var m = textureSampleLevel(mask, s, coord_norm, 0.0).${maskChannel};
  var c = ${textureSampleCall};
  var b = textureSampleLevel(blurred, s, coord_norm, 0.0);
  b = b + (k00 * m) * c;
  b = b / b.a;
  textureStore(output, coord, mix(b, c, m));
}
`;
  }

  blur(commandEncoder, inputTexture, maskTexture, outputTexture, resolution) {
    const device = this.device;
    const { width: blurWidth, height: blurHeight } = adjustSizeByResolution(resolution, this.inputWidth, this.inputHeight);

    const width = outputTexture.width;
    const height = outputTexture.height;

    const imageSizeBuffer = getOrCreateResource(this.resourceCache, `imageSizeBuffer_${width}x${height}`, () =>
      device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, })
    );
    const blurSizeBuffer = getOrCreateResource(this.resourceCache, `blurSizeBuffer_${blurWidth}x${blurHeight}`, () =>
      device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, })
    );

    const imageSizeData = new Int32Array([width, height]);
    const imageTexelSizeData = new Float32Array([1/width, 1/height]);
    device.queue.writeBuffer(imageSizeBuffer, 0, imageSizeData);
    device.queue.writeBuffer(imageSizeBuffer, 8, imageTexelSizeData);

    const blurSizeData = new Int32Array([blurWidth, blurHeight]);
    const blurTexelSizeData = new Float32Array([1/blurWidth, 1/blurHeight]);
    device.queue.writeBuffer(blurSizeBuffer, 0, blurSizeData);
    device.queue.writeBuffer(blurSizeBuffer, 8, blurTexelSizeData);

    const horizontalTexture = getOrCreateTexture(device, this.resourceCache, 'horizontal', [blurWidth, blurHeight], this.directOutput, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);
    const blurredTexture = getOrCreateTexture(device, this.resourceCache, 'blurred', [blurWidth, blurHeight], this.directOutput, GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING);

    const passEncoder = commandEncoder.beginComputePass();

    const horizontalBindGroup = device.createBindGroup({
      layout: this.pipelines.horizontal.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.zeroCopy ? inputTexture : inputTexture.createView() },
        { binding: 1, resource: maskTexture.createView() },
        { binding: 2, resource: horizontalTexture.createView() },
        { binding: 3, resource: this.sampler },
        { binding: 4, resource: { buffer: blurSizeBuffer } },
      ],
    });
    passEncoder.setPipeline(this.pipelines.horizontal);
    passEncoder.setBindGroup(0, horizontalBindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(blurWidth / this.tileSize), Math.ceil(blurHeight / this.tileSize));

    const verticalBindGroup = device.createBindGroup({
      layout: this.pipelines.vertical.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: horizontalTexture.createView() },
        { binding: 1, resource: maskTexture.createView() },
        { binding: 2, resource: blurredTexture.createView() },
        { binding: 3, resource: this.sampler },
        { binding: 4, resource: { buffer: blurSizeBuffer } },
      ],
    });
    passEncoder.setPipeline(this.pipelines.vertical);
    passEncoder.setBindGroup(0, verticalBindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(blurWidth / this.tileSize), Math.ceil(blurHeight / this.tileSize));

    const blendBindGroup = device.createBindGroup({
      layout: this.pipelines.blend.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.zeroCopy ? inputTexture : inputTexture.createView() },
        { binding: 1, resource: blurredTexture.createView() },
        { binding: 2, resource: maskTexture.createView() },
        { binding: 3, resource: outputTexture.createView() },
        { binding: 4, resource: this.sampler },
        { binding: 5, resource: { buffer: imageSizeBuffer } },
      ],
    });
    passEncoder.setPipeline(this.pipelines.blend);
    passEncoder.setBindGroup(0, blendBindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(width / this.tileSize), Math.ceil(height / this.tileSize));

    passEncoder.end();
  }
}
