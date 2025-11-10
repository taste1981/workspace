// Copyright (C) <2025> Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

// This script runs in a dedicated worker.

// All state is managed within the worker, not via global scope from the main thread.
let isRunning = false;
let appBlurRenderer = null;
let segmenter = null;

// Import scripts that are also needed in the worker.
// These scripts must not access `document` or `window`.
import { createWebGL2BlurRenderer } from './webgl-renderer.js';
import { getWebGPUDevice, createWebGPUBlurRenderer } from './webgpu-renderer.js';
import { TriangleFakeSegmenter } from './blur4/triangle-fake-segmenter.js';
import { MediaPipeSegmenter } from "./blur4/mediapipe-segmenter";
import { WebNNSegmenter } from './blur4/webnn-segmenter.js';

// Since the worker can't access the main thread's 'bodySegmentation' object directly,
// we need to load the scripts that provide it.
async function initializeSegmenter(segmenterType, webGpuDevice) {
  try {
    switch (segmenterType) {
      case 'triangle':
        segmenter = new TriangleFakeSegmenter();
        console.log('Worker: Using Triangle Fake Segmenter');
        break;
      case 'mediapipe':
        // Dynamically import the necessary scripts for MediaPipe.
        // These scripts register themselves on the global `self` scope.
        await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core/dist/tf-core.js');
        await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter/dist/tf-converter.js');
        await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu/dist/tf-backend-cpu.js');
        await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-segmentation/dist/body-segmentation.js');
        await import('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js');

        segmenter = new MediaPipeSegmenter();
        console.log('Worker: Using CPU (MediaPipe) for segmentation');
        break;
      case 'webnn-gpu':
        segmenter = new WebNNSegmenter({ deviceType: 'gpu', webGpuDevice });
        console.log('Worker: Using WebNN GPU for segmentation');
        break;
      case 'webnn-npu':
        segmenter = new WebNNSegmenter({ deviceType: 'npu' });
        console.log('Worker: Using WebNN NPU for segmentation');
        break;
      default:
        throw new Error(`Unknown segmenter in worker: ${segmenterType}`);
    }
  } catch (error) {
    console.error('Worker: Failed to initialize segmenter:', error);
    throw error; // Propagate error to the main thread
  }
}

async function initializeBlurRenderer(options) {
  const { webGpuDevice, segmenterType, zeroCopy, directOutput } = options;
  await initializeSegmenter(segmenterType, webGpuDevice);

  try {
    if (webGpuDevice) {
      console.log('Instantiate WebGPU renderer')
      appBlurRenderer = await createWebGPUBlurRenderer(webGpuDevice, segmenter, zeroCopy, directOutput);
    } else {
      console.log('Instantiate WebGL renderer')
      appBlurRenderer = await createWebGL2BlurRenderer(segmenter);
    }
  } catch (error) {
    console.error('Worker: Failed to initialize renderer', error);
    // Attempt to fallback to WebGL2 if WebGPU fails
    appBlurRenderer = await createWebGL2BlurRenderer(segmenter);
  }
}

async function processOneFrame(videoFrame) {
  if (!appBlurRenderer) return videoFrame;
  return await appBlurRenderer.render(videoFrame);
}

self.onmessage = async (event) => {
  const { type, readable, writable, options } = event.data;

  if (type === 'start') {
    isRunning = true;
    options.webGpuDevice = await getWebGPUDevice();
    await initializeBlurRenderer(options);

    const reader = readable.getReader();
    const writer = writable.getWriter();

    let frameCount = 0;
    let lastFpsTime = performance.now();

    self.postMessage({ type: 'ready' });

    while (isRunning) {
      const { done, value: frame } = await reader.read();
      if (done) break;

      const processedFrame = await processOneFrame(frame);
      await writer.write(processedFrame);
      processedFrame.close();
      frame.close();

      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastFpsTime >= 1000) {
        const fps = (frameCount * 1000) / (currentTime - lastFpsTime);
        self.postMessage({ type: 'fpsUpdate', fps: fps.toFixed(1) });
        frameCount = 0;
        lastFpsTime = currentTime;
      }
    }
    reader.releaseLock();
    writer.close();
  } else if (type === 'stop') {
    isRunning = false;
  }
};