function getTextureFormat(directOutput) {
  return directOutput ? navigator.gpu.getPreferredCanvasFormat() : 'rgba8unorm';
}

function getOrCreateResource(cache, key, createFn) {
  if (!cache[key]) {
    console.log("Creating new resource for ", key);
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
    console.log("Creating new texture for ", cacheKey, " with format ", format, " and usage ", usage);
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

let imageDataCache;

async function renderWithWebGPU(params, videoFrame, resourceCache) {
  const device = params.device;
  const webgpuCanvas = params.webgpuCanvas;
  const width = params.webgpuCanvas.width;
  const height = params.webgpuCanvas.height;
  const segmenter = params.segmenter;

  // Import external texture.
  let sourceTexture;
  if (params.zeroCopy) {
    sourceTexture = device.importExternalTexture({
      source: videoFrame,
    });
  } else {
    sourceTexture = getOrCreateTexture(device, resourceCache, 'sourceTexture',
      [videoFrame.displayWidth, videoFrame.displayHeight, 1],
      params.directOutput,
      GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT);

    device.queue.copyExternalImageToTexture(
      { source: videoFrame },
      { texture: sourceTexture },
      [videoFrame.displayWidth, videoFrame.displayHeight]
    );
  }
  // Scale down input, segment, read back and upload.
  let maskTexture;
  {
    const segmentationWidth = params.segmentationWidth;
    const segmentationHeight = params.segmentationHeight;
    const destTexture = getOrCreateTexture(device, resourceCache, 'downscaleDest',
      [segmentationWidth, segmentationHeight, 1],
      params.directOutput,
      GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT);

    let downscaleBindGroup;
    try {
      downscaleBindGroup = device.createBindGroup({
        layout: params.downscalePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: params.defaultSampler },
          {
            binding: 1, resource: params.zeroCopy ? sourceTexture : sourceTexture.createView()
          },
        ],
      });
    } catch (error) {
      console.warn('bind failed:', error);
    }

    const commandEncoder = device.createCommandEncoder();
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: destTexture.createView(),
        loadOp: 'clear',
        storeOp: 'store',
      }]
    });
    renderPass.setPipeline(params.downscalePipeline);
    renderPass.setBindGroup(0, downscaleBindGroup);
    renderPass.draw(4);
    renderPass.end();

    const bufferSize = segmentationWidth * segmentationHeight * 4;
    const readbackBuffer = getOrCreateResource(resourceCache, `readbackBuffer${bufferSize}`, () =>
      device.createBuffer({
        size: bufferSize,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      }));
    commandEncoder.copyTextureToBuffer(
      { texture: destTexture },
      { buffer: readbackBuffer, bytesPerRow: segmentationWidth * 4 },
      [segmentationWidth, segmentationHeight]
    );
    device.queue.submit([commandEncoder.finish()]);
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    const downscaledImageData = imageDataCache ?
      imageDataCache :
      new ImageData(segmentationWidth, segmentationHeight);
    downscaledImageData.data.set(new Uint8Array(readbackBuffer.getMappedRange()));
    readbackBuffer.unmap();

    // Segment
    const maskImageData = await segmenter(downscaledImageData);

    // Upload
    maskTexture = getOrCreateTexture(device, resourceCache, 'maskTexture',
      [maskImageData.width, maskImageData.height, 1],
      params.directOutput,
      GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT);

    device.queue.writeTexture(
      { texture: maskTexture },
      maskImageData.data,
      { bytesPerRow: maskImageData.width * 4 },
      [maskImageData.width, maskImageData.height, 1]
    );
  }

  // Always process at full video resolution, ignore display size
  const processingWidth = videoFrame.displayWidth || 1280;
  const processingHeight = videoFrame.displayHeight || 720;

  // Update canvas size only if video resolution actually changed
  if (webgpuCanvas.width !== processingWidth || webgpuCanvas.height !== processingHeight) {
    webgpuCanvas.width = processingWidth;
    webgpuCanvas.height = processingHeight;
  }

  const outputTexture = getOrCreateTexture(device, resourceCache, 'outputTexture',
    [width, height, 1],
    params.directOutput,
    GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING);

  // Update uniform buffer
  const uniformData = new Float32Array([width, height, 6.0]); // resolution, blurAmount
  device.queue.writeBuffer(params.uniformBuffer, 0, uniformData);

  // Create bind group
  const canvasTexture = params.context.getCurrentTexture();
  const bindGroup = device.createBindGroup({
    layout: params.blurPipeline.getBindGroupLayout(0),
    label: "blurBindGroup",
    entries: [
      { binding: 0, resource: params.defaultSampler },
      {
        binding: 1, resource: params.zeroCopy ? sourceTexture : sourceTexture.createView()
      },
      {
        binding: 2,
        resource: maskTexture.createView(),
      },
      { binding: 3, resource: { buffer: params.uniformBuffer } },
    ],
  });

  // Run blur shader
  const commandEncoder = device.createCommandEncoder();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: params.directOutput ? canvasTexture.createView() : outputTexture.createView(),
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    }]
  });
  renderPass.setPipeline(params.blurPipeline);
  renderPass.setBindGroup(0, bindGroup);
  renderPass.draw(4);
  renderPass.end();

  if (!params.directOutput) {
    const renderBindGroup = device.createBindGroup({
      layout: params.outputPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: params.defaultSampler },
        { binding: 1, resource: outputTexture.createView() },
      ],
    });

    // Render to canvas
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: canvasTexture.createView(),
        clearValue: { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });

    renderPass.setPipeline(params.outputPipeline);
    renderPass.setBindGroup(0, renderBindGroup);
    renderPass.draw(4);
    renderPass.end();
  }

  device.queue.submit([commandEncoder.finish()]);

  // Create a new VideoFrame from the processed WebGPU canvas
  const processedVideoFrame = new VideoFrame(params.webgpuCanvas, {
    timestamp: videoFrame.timestamp,
    duration: videoFrame.duration
  });

  return processedVideoFrame;
}

// WebGPU blur renderer
export async function createWebGPUBlurRenderer(segmenter, zeroCopy, directOutput) {
  console.log("createWebGPUBlurRenderer zeroCopy: ", zeroCopy, " directOutput: ", directOutput);
  // Always use full resolution for processing, regardless of display size
  const webgpuCanvas = new OffscreenCanvas(1280, 720);

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPU adapter not available');
  }

  const device = await adapter.requestDevice({});
  const context = webgpuCanvas.getContext('webgpu');

  if (!context) {
    throw new Error('WebGPU context not available');
  }

  context.configure({
    device: device,
    format: navigator.gpu.getPreferredCanvasFormat(),
    alphaMode: 'premultiplied',
  });

  const segmentationWidth = 256;
  const segmentationHeight = 144;

  const textureType = zeroCopy ? 'texture_external' : 'texture_2d<f32>';
  const sampleType = zeroCopy ? 'textureSampleBaseClampToEdge' : 'textureSample';

  const downscaleShaderCode = `
    struct VertexOut {
      @builtin(position) pos: vec4f,
      @location(0) uv: vec2f,
    }

    @vertex
    fn vertMain(@builtin(vertex_index) index: u32) -> VertexOut {
      let quad = array<vec2f, 4>(
        vec2f(-1, -1), vec2f(-1, 1), vec2f(1, -1), vec2f(1, 1)
      );
      let pos = quad[index];
      let uv = pos * vec2f(0.5, -0.5) + 0.5; 
      return VertexOut(vec4f(pos, 0, 1), uv);
    }

    struct BlurArgs {
      resolution: vec2f,
      blurAmount: f32,
    }

    @group(0) @binding(0) var textureSampler: sampler;

    // These two can share a binding slot because they will never be used by the
    // same entry point.
    @group(0) @binding(1) var inputImage: ${textureType};
    @group(0) @binding(1) var outputImage: texture_2d<f32>;

    @group(0) @binding(2) var mask: texture_2d<f32>;
    @group(0) @binding(3) var<uniform> args: BlurArgs;
    

    @fragment
    fn downsampleMain(@location(0) uv: vec2f) -> @location(0) vec4f {
      return ${sampleType}(inputImage, textureSampler, uv);
    }

    @fragment
    fn outputMain(@location(0) uv: vec2f) -> @location(0) vec4f {
      return textureSample(outputImage, textureSampler, uv);
    }

    fn blur(uv: vec2f, amount: f32) -> vec4f {
      var color = vec4f();
      var total = 0.0;
      for(var x = -4; x <= 4; x++) {
        for(var y = -4; y <= 4; y++) {
          let vec = vec2f(f32(x), f32(y));
          let offset = vec * amount / args.resolution;
          let weight = 1.0 / (1.0 + length(vec));
          color += ${sampleType}(inputImage, textureSampler, uv + offset) * weight;
          total += weight;
        }
      }
      return color / total;
    }

    @fragment
    fn blurMain(@location(0) uv: vec2f) -> @location(0) vec4f {
      let originalColor = ${sampleType}(inputImage, textureSampler, uv);
      let blurredColor = blur(uv, args.blurAmount);
      let mask = textureSample(mask, textureSampler, uv).${directOutput ? 'b' : 'r'};
      return mix(blurredColor, originalColor, mask);
    }
  `;

  const module = device.createShaderModule({ code: downscaleShaderCode });
  const downscalePipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module,
    },
    primitive: {
      topology: 'triangle-strip',
    },
    fragment: {
      module,
      entryPoint: 'downsampleMain',
      targets: [{
        format: getTextureFormat(directOutput),
      }]
    }
  });

  let outputPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module,
    },
    primitive: {
      topology: 'triangle-strip',
    },
    fragment: {
      module,
      entryPoint: 'outputMain',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
      }]
    }
  });

  const blurPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module,
    },
    primitive: {
      topology: 'triangle-strip',
    },
    fragment: {
      module,
      entryPoint: 'blurMain',
      targets: [{
        format: getTextureFormat(directOutput),
      }]
    }
  });

  const defaultSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });
  // --- Slut på nedskalningsresurser ---

  const uniformBuffer = device.createBuffer({
    // resolution: vec2<f32>, blurAmount: f32.
    // vec2 is 8 bytes, f32 is 4. Total 12. Pad to 16 for alignment.
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  const resourceCache = {};

  return {
    render: async (videoFrame) => {
      const params = {
        device,
        context,
        downscalePipeline,
        blurPipeline,
        outputPipeline,
        webgpuCanvas,
        defaultSampler,
        uniformBuffer,
        segmentationWidth,
        segmentationHeight,
        zeroCopy,
        directOutput,
        segmenter
      };
      try {
        return await renderWithWebGPU(params, videoFrame, resourceCache);
      } catch (error) {
        console.warn('WebGPU rendering failed:', error);
      }
    }
  };
}
