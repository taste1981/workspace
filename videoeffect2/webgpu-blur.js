// Copyright 2025 Google LLC
//
// SPDX-License-Identifier: Apache-2.0

function getOrCreateResource(cache, key, createFn) {
  if (!cache[key]) {
    cache[key] = createFn();
  }
  return cache[key];
}

function getOrCreateTexture(device, cache, key, size, directOutput, usage) {
  const [width, height] = size;
  const format = directOutput ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';
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

    const format = this.directOutput ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';

    const blurHorizontalShader = await this.getBlurShader(this.radius, this.tileSize, kernel.length, kernelInitializer, true);
    const blurHorizontalModule = this.device.createShaderModule({ code: blurHorizontalShader });
    this.pipelines.horizontal = await this.device.createRenderPipelineAsync({
      label: 'blurHorizontal',
      layout: 'auto',
      vertex: {
        module: blurHorizontalModule,
      },
      primitive: {
        topology: 'triangle-strip'
      },
      fragment: {
        module: blurHorizontalModule,
        entryPoint: 'main_horizontal',
        targets: [{ format }]
      },
    });

    const blurVerticalShader = await this.getBlurShader(this.radius, this.tileSize, kernel.length, kernelInitializer, false);
    const blurVerticalModule = this.device.createShaderModule({ code: blurVerticalShader });
    this.pipelines.vertical = await this.device.createRenderPipelineAsync({
      label: 'blurVertical',
      layout: 'auto',
      vertex: {
        module: blurVerticalModule,
      },
      primitive: {
        topology: 'triangle-strip'
      },
      fragment: {
        module: blurVerticalModule,
        entryPoint: 'main_vertical',
        targets: [{ format }]
      },
    });

    const k00 = kernel[0] * kernel[0];
    const blendShader = await this.getBlendShader(k00, this.tileSize);
    const blendModule = this.device.createShaderModule({ label: 'blend', code: blendShader });
    this.pipelines.blend = await this.device.createRenderPipelineAsync({
      label: 'blend',
      layout: 'auto',
      vertex: {
        module: blendModule,
      },
      primitive: {
        topology: 'triangle-strip'
      },
      fragment: {
        module: blendModule,
        targets: [{ format }]
      },
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
    return fetch('blur4/shaders/blur.wgsl').then(res => res.text()).then(code => code.replace(/\${(\w+)}/g, (...groups) => ({
      inputTextureType: (isHorizontal && this.zeroCopy) ? 'texture_external' : 'texture_2d<f32>',
      outputFormat: this.directOutput ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm',
      radius,
      tileSize,
      kernelSize,
      kernelInitializer,
      textureSampleCall: (isHorizontal && this.zeroCopy) ?
        'textureSampleBaseClampToEdge(input, s, sample_coordinate_norm)' :
        'textureSampleLevel(input, s, sample_coordinate_norm, 0.0)',
      loopTextureSampleCall: (isHorizontal && this.zeroCopy) ?
        'textureSampleBaseClampToEdge(input, s, coord)' :
        'textureSampleLevel(input, s, coord, 0.0)',
    }[groups[1]])));
  }

  getBlendShader(k00, tileSize) {
    return fetch('blur4/shaders/blend.wgsl').then(res => res.text()).then(code => code.replace(/\${(\w+)}/g, (...groups) => ({
      inputTextureType: this.zeroCopy ? 'texture_external' : 'texture_2d<f32>',
      outputFormat: this.directOutput ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm',
      k00,
      tileSize,
      textureSampleCall: this.zeroCopy ?
        'textureSampleBaseClampToEdge(input, s, coord_norm)' :
        'textureSampleLevel(input, s, coord_norm, 0.0)',
    }[groups[1]])));
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

    const horizontalTexture = getOrCreateTexture(device, this.resourceCache, 'horizontal', [blurWidth, blurHeight], this.directOutput, GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING);
    const blurredTexture = getOrCreateTexture(device, this.resourceCache, 'blurred', [blurWidth, blurHeight], this.directOutput, GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING);

    let passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: horizontalTexture.createView(),
        loadOp: 'clear',
        storeOp: 'store',
      }]
    });

    const horizontalBindGroup = device.createBindGroup({
      layout: this.pipelines.horizontal.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.zeroCopy ? inputTexture : inputTexture.createView() },
        { binding: 1, resource: maskTexture.createView() },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: blurSizeBuffer } },
      ],
    });
    passEncoder.setPipeline(this.pipelines.horizontal);
    passEncoder.setBindGroup(0, horizontalBindGroup);
    passEncoder.draw(4);

    passEncoder.end();

    passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: blurredTexture.createView(),
        loadOp: 'clear',
        storeOp: 'store',
      }]
    });

    const verticalBindGroup = device.createBindGroup({
      layout: this.pipelines.vertical.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: horizontalTexture.createView() },
        { binding: 1, resource: maskTexture.createView() },
        { binding: 2, resource: this.sampler },
        { binding: 3, resource: { buffer: blurSizeBuffer } },
      ],
    });
    passEncoder.setPipeline(this.pipelines.vertical);
    passEncoder.setBindGroup(0, verticalBindGroup);
    passEncoder.draw(4);

    passEncoder.end();

    passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: outputTexture.createView(),
        loadOp: 'clear',
        storeOp: 'store',
      }]
    });

    const blendBindGroup = device.createBindGroup({
      layout: this.pipelines.blend.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: this.zeroCopy ? inputTexture : inputTexture.createView() },
        { binding: 1, resource: blurredTexture.createView() },
        { binding: 2, resource: maskTexture.createView() },
        { binding: 3, resource: this.sampler },
        { binding: 4, resource: { buffer: imageSizeBuffer } },
      ],
    });
    passEncoder.setPipeline(this.pipelines.blend);
    passEncoder.setBindGroup(0, blendBindGroup);
    passEncoder.draw(6);

    passEncoder.end();
  }
}
