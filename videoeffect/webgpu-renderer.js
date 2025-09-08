async function renderWithWebGPU(params, videoFrame) {
  const device = params.device;
  const webgpuCanvas = params.webgpuCanvas;
  const width = params.webgpuCanvas.width;
  const height = params.webgpuCanvas.height;

  // Import external texture.
  let sourceTexture;
  if (params.zeroCopy) {
    sourceTexture = device.importExternalTexture({
      source: videoFrame,
    });
  } else {
    sourceTexture = device.createTexture({
      size: [videoFrame.displayWidth, videoFrame.displayHeight, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
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
    const destTexture = device.createTexture({
      size: [segmentationWidth, segmentationHeight, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC,
    });
    let downscaleBindGroup;
    try {
      downscaleBindGroup = device.createBindGroup({
        layout: params.downscalePipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0, resource: params.zeroCopy ? sourceTexture : sourceTexture.createView()
          },
          { binding: 1, resource: params.downscaleSampler },
          { binding: 2, resource: destTexture.createView() },
        ],
      });
    } catch (error) {
      console.warn('bind failed:', error);
    }

    const commandEncoder = device.createCommandEncoder();
    const computePass = commandEncoder.beginComputePass();
    computePass.setPipeline(params.downscalePipeline);
    computePass.setBindGroup(0, downscaleBindGroup);
    computePass.dispatchWorkgroups(Math.ceil(segmentationWidth / 8), Math.ceil(segmentationHeight / 8));
    computePass.end();

    const bufferSize = segmentationWidth * segmentationHeight * 4;
    const readbackBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    commandEncoder.copyTextureToBuffer(
      { texture: destTexture },
      { buffer: readbackBuffer, bytesPerRow: segmentationWidth * 4 },
      [segmentationWidth, segmentationHeight]
    );
    device.queue.submit([commandEncoder.finish()]);
    await readbackBuffer.mapAsync(GPUMapMode.READ);
    const pixelData = new Uint8Array(readbackBuffer.getMappedRange().slice(0));
    const downscaledImageData = new ImageData(new Uint8ClampedArray(pixelData.buffer), segmentationWidth, segmentationHeight);
    readbackBuffer.unmap();
    readbackBuffer.destroy();
    destTexture.destroy();

    // Segment and upload.
    const segmentation = await segmenter.segmentPeople(downscaledImageData);
    if (!segmentation || segmentation.length === 0) {
      console.warn("Segmentation returned no results.");
      return null;
    }
    const maskImageData = await segmentation[0].mask.toImageData();
    maskTexture = device.createTexture({
      size: [maskImageData.width, maskImageData.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    });
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
    // Reconfigure context with actual video size
    context.configure({
      device: device,
      format: navigator.gpu.getPreferredCanvasFormat(),
      alphaMode: 'premultiplied',
    });
  }

  const outputTexture = device.createTexture({
    size: [width, height, 1],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING,
  });

  // Update uniform buffer
  const uniformData = new Float32Array([width, height, 6.0]); // resolution, blurAmount
  device.queue.writeBuffer(params.uniformBuffer, 0, uniformData);

  // Create bind group
  let bindGroup;
  try {
    bindGroup = device.createBindGroup({
      layout: params.computePipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0, resource: params.zeroCopy ? sourceTexture : sourceTexture.createView()
        },
        {
          binding: 1,
          resource: maskTexture.createView(),
        },
        {
          binding: 2,
          resource: outputTexture.createView(),
        },
        { binding: 3, resource: params.blurSampler },
        { binding: 4, resource: { buffer: params.uniformBuffer } },
      ],
    });
  } catch (error) {
    console.warn('bind failed:', error);
  }

  // Run compute shader
  const commandEncoder = device.createCommandEncoder();
  const computePass = commandEncoder.beginComputePass();
  computePass.setPipeline(params.computePipeline);
  computePass.setBindGroup(0, bindGroup);

  const workgroupCountX = Math.ceil(width / 8);
  const workgroupCountY = Math.ceil(height / 8);
  computePass.dispatchWorkgroups(workgroupCountX, workgroupCountY);
  computePass.end();

  // DOESN*T WORK, INTERMEDIATE SHADERS ALSO NEED TO USE 
  //   commandEncoder.copyTextureToTexture(
  //     { texture: outputTexture }, 
  //     { texture: context.getCurrentTexture() },
  //     [width, height]);

  const renderPipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: params.outputRendererVertexShader,
      entryPoint: 'main',
    },
    fragment: {
      module: params.getOutputRendererFragmentShader(device, width, height),
      entryPoint: 'main',
      targets: [{
        format: navigator.gpu.getPreferredCanvasFormat(),
      }],
    },
    primitive: {
      topology: 'triangle-list',
    },
  });

  const renderBindGroup = device.createBindGroup({
    layout: renderPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: outputTexture.createView() },
      { binding: 1, resource: params.renderSampler },
    ],
  });

  // Render to canvas
  const canvasTexture = params.context.getCurrentTexture();
  const renderPass = commandEncoder.beginRenderPass({
    colorAttachments: [{
      view: canvasTexture.createView(),
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      loadOp: 'clear',
      storeOp: 'store',
    }],
  });

  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, renderBindGroup);
  renderPass.draw(6);
  renderPass.end();

  device.queue.submit([commandEncoder.finish()]);

  // Create a new VideoFrame from the processed WebGPU canvas
  const processedVideoFrame = new VideoFrame(params.webgpuCanvas, {
    timestamp: videoFrame.timestamp,
    duration: videoFrame.duration
  });

  // Clean up textures
  if (!params.zeroCopy) {
    sourceTexture.destroy();
  }
  maskTexture.destroy();
  outputTexture.destroy();

  return processedVideoFrame;
}

// WebGPU blur renderer
async function createWebGPUBlurRenderer(segmenter, zeroCopy) {
  console.log("createWebGPUBlurRenderer zeroCopy: ", zeroCopy);
  // Always use full resolution for processing, regardless of display size
  const webgpuCanvas = new OffscreenCanvas(1280, 720);

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPU adapter not available');
  }

  const device = await adapter.requestDevice();
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

  const downscaleShaderCode = `
      @group(0) @binding(0) var inputTexture: ${zeroCopy ? "texture_external" : "texture_2d<f32>"};
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
    `;

  const downscaleShader = device.createShaderModule({ code: downscaleShaderCode });
  const downscalePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: downscaleShader,
      entryPoint: 'main',
    },
  });

  const downscaleSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });
  // --- Slut på nedskalningsresurser ---

  // WebGPU compute shader for blur effect
  const computeShaderCode = `
      @group(0) @binding(0) var inputTexture: ${zeroCopy ? "texture_external" : "texture_2d<f32>"};
      @group(0) @binding(1) var maskTexture: texture_2d<f32>;
      @group(0) @binding(2) var outputTexture: texture_storage_2d<rgba8unorm, write>;
      @group(0) @binding(3) var textureSampler: sampler;
      
      struct Uniforms {
        resolution: vec2<f32>,
        blurAmount: f32,
      };
      @group(0) @binding(4) var<uniform> uniforms: Uniforms;
      
      @compute @workgroup_size(8, 8)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let inputDims = textureDimensions(inputTexture);
        let maskDims = textureDimensions(maskTexture);
        
        if (global_id.x >= inputDims.x || global_id.y >= inputDims.y) {
          return;
        }
        
        let coord = vec2<i32>(i32(global_id.x), i32(global_id.y));
        let uv = (vec2<f32>(coord) + 0.5) / vec2<f32>(inputDims);
        
        let originalColor = textureSampleBaseClampToEdge(inputTexture, textureSampler, uv);
        
        // Calculate corresponding mask coordinate (handle different dimensions)
        let maskCoord = vec2<i32>(
          i32(uv.x * f32(maskDims.x)),
          i32(uv.y * f32(maskDims.y))
        );
        let mask = textureLoad(maskTexture, maskCoord, 0).r;
        
        // Calculate blurred color for the background
        var blurredColor = vec4<f32>(0.0);
        var totalWeight = 0.0;
        
        // Use 9x9 kernel like WebGL2 (from -4 to +4)
        for (var x = -4; x <= 4; x++) {
          for (var y = -4; y <= 4; y++) {
            let offset = vec2<f32>(f32(x), f32(y)) * uniforms.blurAmount / uniforms.resolution;
            let weight = 1.0 / (1.0 + length(vec2<f32>(f32(x), f32(y))));
            blurredColor += textureSampleBaseClampToEdge(inputTexture, textureSampler, uv + offset) * weight;
            totalWeight += weight;
          }
        }
        if (totalWeight > 0.0) {
            blurredColor /= totalWeight;
        }
        
        // Mix original and blurred colors based on the mask.
        let finalColor = mix(blurredColor, originalColor, mask);
        
        textureStore(outputTexture, coord, finalColor);
      }
    `;

  const computeShader = device.createShaderModule({
    code: computeShaderCode,
  });

  const computePipeline = device.createComputePipeline({
    layout: 'auto',
    compute: {
      module: computeShader,
      entryPoint: 'main',
    },
  });

  const blurSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  const uniformBuffer = device.createBuffer({
    // resolution: vec2<f32>, blurAmount: f32.
    // vec2 is 8 bytes, f32 is 4. Total 12. Pad to 16 for alignment.
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  // Create a simple render pipeline to copy the compute shader's output (RGBA)
  // to the canvas, which might have a different format (e.g., BGRA).
  const outputRendererVertexShader = device.createShaderModule({
    code: `
        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
          var pos = array<vec2<f32>, 6>(
            vec2<f32>(-1.0, -1.0),
            vec2<f32>( 1.0, -1.0),
            vec2<f32>(-1.0,  1.0),
            vec2<f32>( 1.0, -1.0),
            vec2<f32>( 1.0,  1.0),
            vec2<f32>(-1.0,  1.0)
          );
          return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
        }
      `
  });

  let outputRendererFragmentShader;
  let lastDim;

  function getOutputRendererFragmentShader(device, width, height) {
    if (!outputRendererFragmentShader || lastDim !== `${width}x${height}`) {
      outputRendererFragmentShader = device.createShaderModule({
        code: `
            @group(0) @binding(0) var inputTexture: texture_2d<f32>;
            @group(0) @binding(1) var textureSampler: sampler;
          
            @fragment
            fn main(@builtin(position) coord: vec4<f32>) -> @location(0) vec4<f32> {
              let uv = coord.xy / vec2<f32>(${width}.0, ${height}.0);
              return textureSample(inputTexture, textureSampler, uv);
            }
          `});

      lastDim = `${width}x${height}`;
    }
    return outputRendererFragmentShader;
  }

  const renderSampler = device.createSampler({
    magFilter: 'linear',
    minFilter: 'linear',
  });

  return {
    render: async (videoFrame) => {
      const params = {
        device,
        context,
        computePipeline,
        webgpuCanvas,
        blurSampler,
        uniformBuffer,
        outputRendererVertexShader,
        getOutputRendererFragmentShader,
        segmentationWidth,
        segmentationHeight,
        downscalePipeline,
        downscaleSampler,
        renderSampler,
        zeroCopy,
      };
      try {
        return await renderWithWebGPU(params, videoFrame);
      } catch (error) {
        console.warn('WebGPU rendering failed:', error);
      }
    }
  };
}
