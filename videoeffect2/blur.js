// Copyright (C) <2025> Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

import { createWebGPUBlurRenderer } from './webgpu-renderer.js';
import { createWebGL2BlurRenderer } from './webgl-renderer.js';
import { TriangleFakeSegmenter } from './blur4/triangle-fake-segmenter.js';
import { MediaPipeSegmenter } from './blur4/mediapipe-segmenter.js';
import { WebNNSegmenter } from './blur4/webnn-segmenter.js';
import { WebRTCSink } from './webrtc-sink.js';


function getMedianValue(array) {
  array = array.sort((a, b) => a - b);
  return array.length % 2 !== 0 ? array[Math.floor(array.length / 2)] :
    (array[array.length / 2 - 1] + array[array.length / 2]) / 2;
}

let segmenter = null;
let rendererSwitchRequested = false;

// Initialize CPU-only segmenter using MediaPipe
async function initializeSegmenter() {
  try {
    const segmenterType = document.querySelector('input[name="segmenter"]:checked').value;
    switch (segmenterType) {
      case 'triangle':
        segmenter = new TriangleFakeSegmenter();
        console.log('Using Triangle Fake Segmenter');
        break;
      case 'mediapipe':
        // CPU-based segmentation using MediaPipe
        segmenter = new MediaPipeSegmenter();
        console.log('Using CPU (MediaPipe) for segmentation');
        break;
      case 'webnn-gpu':
        segmenter = new WebNNSegmenter('gpu');
        console.log('Using WebNN GPU for segmentation');
        break;
      case 'webnn-npu':
        segmenter = new WebNNSegmenter('npu');
        console.log('Using WebNN NPU for segmentation');
        break;
      default:
        throw new Error(`Unknown segmenter: ${segmenterType}`);
    }
  } catch (error) {
    console.error('Failed to initialize CPU segmentation:', error);
    appStatus.innerText = 'Segmentation initialization failed';
  }
}

// Initialize blur renderer based on radio buttons
async function initializeBlurRenderer() {
  const useWebGPU = document.querySelector('input[name="renderer"]:checked').value === 'webgpu';

  try {
    if (useWebGPU && 'gpu' in navigator) {
      const zeroCopy = zeroCopyCheckbox.checked;
      const directOutput = directOutputCheckbox.checked;
      appBlurRenderer = await createWebGPUBlurRenderer(segmenter, zeroCopy, directOutput);
      appStatus.innerText = 'Renderer: WebGPU';
      console.log('Using WebGPU for blur rendering');
    } else {
      appBlurRenderer = await createWebGL2BlurRenderer(segmenter);
      appStatus.innerText = 'Renderer: WebGL2';
      console.log('Using WebGL2 for blur rendering');
    }
    appProcessedVideo.style.display = 'block';

  } catch (error) {
    console.warn(`Failed to initialize ${useWebGPU ? 'WebGPU' : 'WebGL2'} renderer:`, error);
    // Fallback to WebGL2 if WebGPU fails
    if (useWebGPU) {
      appBlurRenderer = await createWebGL2BlurRenderer(segmenter);
      // The fallback should also use the video element path
      appProcessedVideo.style.display = 'block';
      appStatus.innerText = 'Renderer: WebGL2 (WebGPU fallback)';
      document.querySelector('input[name="renderer"][value="webgl2"]').checked = true;
    }
  }
}

async function processOneFrame(videoFrame) {
  return await appBlurRenderer.render(videoFrame);
}

// Main processing loop
async function processFrames(readable, writable, onFpsUpdate) {
  const reader = readable.getReader();
  appReader = reader;
  const writer = writable.getWriter();

  // FPS tracking variables
  let frameCount = 0;
  let lastFpsTime = performance.now();

  while (isRunning) {
    const result = await reader.read();
    if (result.done) {
      console.log("Stream has ended.");
      reader.releaseLock();
      writer.close();
      break;
    }
    const frame = result.value;

    // FPS calculation
    frameCount++;
    const currentTime = performance.now();
    const deltaTime = currentTime - lastFpsTime;
    if (deltaTime >= 1000) {
      const actualFps = (frameCount * 1000) / deltaTime;
      onFpsUpdate(actualFps.toFixed(1));
      frameCount = 0;
      lastFpsTime = currentTime;
    }

    const processedFrame = await processOneFrame(frame);
    frame.close();
    await writer.write(processedFrame);
    processedFrame.close();
  }
}

async function runInWorker(trackProcessor, trackGenerator) {
  return new Promise((resolve) => {
    const worker = new Worker('blur-worker.js', { type: 'module' });
    appWorker = worker; // Store worker instance for termination

    const onFpsUpdate = (fps) => {
      appFpsDisplay.textContent = `FPS: ${fps}`;
    };

    worker.onmessage = (event) => {
      if (event.data.type === 'ready') {
        console.log('Worker is ready and processing.');
        resolve();
      } else if (event.data.type === 'fpsUpdate') {
        onFpsUpdate(event.data.fps);
      }
    };

    const zeroCopyCheckbox = document.getElementById('zeroCopy');
    const directOutputCheckbox = document.getElementById('directOutput');
    const options = {
      useWebGPU: document.querySelector('input[name="renderer"]:checked').value === 'webgpu',
      segmenterType: document.querySelector('input[name="segmenter"]:checked').value,
      zeroCopy: zeroCopyCheckbox ? zeroCopyCheckbox.checked : false,
      directOutput: directOutputCheckbox ? directOutputCheckbox.checked : false,
    };

    // Transfer the readable and writable streams to the worker for zero-copy data handling.
    worker.postMessage({
      type: 'start',
      readable: trackProcessor.readable,
      writable: trackGenerator.writable,
      options: options
    }, [trackProcessor.readable, trackGenerator.writable]);
  });
}

async function run() {
  appStartRun = performance.now();
  appCount = 0;
  appSegmentTimes.length = 0;

  const videoTrack = appStream.getVideoTracks()[0];
  const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
  const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });

  if (useWorkerCheckbox.checked) {
    await runInWorker(trackProcessor, trackGenerator); // This now waits for the worker
    appProcessedVideo.srcObject = new MediaStream([trackGenerator]);
    appProcessedVideo.style.display = 'block';
  } else {
    // Fallback to main thread processing
    await initializeSegmenter();
    await initializeBlurRenderer();
    const onFpsUpdate = (fps) => { appFpsDisplay.textContent = `FPS: ${fps}`; };
    processFrames(trackProcessor.readable, trackGenerator.writable, onFpsUpdate).catch(e => {
      if (isRunning) {
        console.error("Error in processing loop:", e);
        stopVideoProcessing();
      }
    });
    appProcessedVideo.srcObject = new MediaStream([trackGenerator]);
  }
}

// Global variables for app state
let appStartRun = null;
let appCount = 0;
let appSegmentTimes = [];
let appBlurRenderer = null;
let appStream = null;
let isRunning = false;
let appReader = null;
let appWorker = null;
let appWebRTCSink = null;

// Get DOM elements for app control
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const webgpuRadio = document.getElementById('webgpuRadio');
const displaySizeSelect = document.getElementById('displaySize');
const appStatus = document.getElementById('status');
const appFpsDisplay = document.getElementById('fpsDisplay');
const appProcessedVideo = document.getElementById('processedVideo');
const zeroCopyCheckbox = document.getElementById('zeroCopy');
const zeroCopyLabel = document.getElementById('zeroCopyLabel');
const directOutputCheckbox = document.getElementById('directOutput');
const directOutputLabel = document.getElementById('directOutputLabel');
const webrtcSink = document.getElementById('webrtcSink');
const webrtcCodec = document.getElementById('webrtcCodec');
const webrtcCodecLabel = document.getElementById('webrtcCodecLabel');
const useWorkerCheckbox = document.getElementById('useWorker');
const videoContainer = document.getElementById('videoContainer');

// Function to update URL from UI state

// Check browser compatibility
const hasWebGPU = 'gpu' in navigator;

// Function to update display size of video elements (does NOT affect processing resolution)
function updateDisplaySize() {
  const size = displaySizeSelect.value;
  let width, height;

  if (size === 'small') {
    width = 320;
    height = 180;
  } else {
    width = 1280;
    height = 720;
  }

  // Update video elements display size only - processing remains at full resolution
  videoContainer.style.width = width + 'px';
  videoContainer.style.height = height + 'px';
}

async function startVideoProcessing() {
  if (isRunning) return;
  try {
    startButton.disabled = true;
    startButton.textContent = 'Starting...';
    appStatus.textContent = 'Initializing...';

    if (!appStream) {
      appStatus.textContent = 'Requesting camera access...';
      appStream = await navigator.mediaDevices.getUserMedia({ video: { frameRate: { ideal: 30 }, width: 1280, height: 720 } });
    }

    isRunning = true;
    startButton.textContent = 'Start Video Processing'; // Reset text in case it was 'Starting...'
    stopButton.style.display = 'inline-block';

    // Now run the video processing
    await run();

  } catch (error) {
    console.error('Failed to start video processing:', error);
    appStatus.textContent = 'Error: ' + error.message;
    startButton.disabled = false;
    startButton.textContent = 'Start Video Processing';
    if (appStream) {
      appStream.getTracks().forEach(t => t.stop());
      appStream = null;
    }
  }
}

function stopVideoProcessing() {
  if (!isRunning) return;
  isRunning = false;

  if (appWorker) {
    appWorker.postMessage({ type: 'stop' });
    appWorker.terminate();
    appWorker = null;
  }

  if (appReader) {
    appReader.cancel().catch(() => { }); // Ignore cancel errors
    appReader = null;
  }

  appBlurRenderer = null;

  startButton.disabled = false;
  startButton.style.display = 'inline-block';
  stopButton.style.display = 'none';
  appStatus.textContent = 'Stopped. You can start again.';
  appFpsDisplay.textContent = 'FPS: --';
}

function updateOptionState() {
  const isWebGPU = webgpuRadio.checked;
  zeroCopyCheckbox.disabled = !isWebGPU;
  zeroCopyLabel.style.color = isWebGPU ? '' : '#aaa';
  directOutputCheckbox.disabled = !isWebGPU;
  directOutputLabel.style.color = isWebGPU ? '' : '#aaa';

  const useWebRTCSink = webrtcSink.checked;
  webrtcCodec.style.display = useWebRTCSink ? 'inline-block' : 'none';
  webrtcCodecLabel.style.display = useWebRTCSink ? 'block' : 'none';
}

async function initializeApp() {
  // Populate WebRTC codec options
  if (RTCRtpSender.getCapabilities) {
    const capabilities = RTCRtpSender.getCapabilities('video');
    if (capabilities) {
      const supportedCodecs = new Set();
      capabilities.codecs.forEach(codec => {
        if (codec.mimeType === 'video/VP9' || codec.mimeType === 'video/H265' || codec.mimeType === 'video/H264') {
          supportedCodecs.add(codec.mimeType);
        }
      });
      supportedCodecs.forEach(mimeType => {
        webrtcCodec.add(new Option(mimeType, mimeType));
      });
    }
  }

  if (!hasWebGPU) {
    webgpuRadio.disabled = true;
    webgpuRadio.parentElement.innerHTML = '<input type="radio" name="renderer" value="webgpu" disabled /> WebGPU (Not supported in this browser)';
  }

  startButton.addEventListener('click', async () => {
    await startVideoProcessing();
    if (webrtcSink.checked) {
      appWebRTCSink = new WebRTCSink(webrtcCodec.value);
      appWebRTCSink.setMediaStream(appProcessedVideo.srcObject);
    }
  });
  stopButton.addEventListener('click', () => {
    // This is the explicit user "Stop" action.
    stopVideoProcessing();
    if (appStream) {
      appStream.getTracks().forEach(t => t.stop());
      appStream = null;
    }
    if (appWebRTCSink) {
      appWebRTCSink.destroy();
      appWebRTCSink = null;
    }
  });

  const form = document.getElementById('settings-form');
  form.addEventListener('change', (event) => {
    // Update URL from all form data
    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    history.replaceState(null, '', '#' + params.toString());

    // Handle specific UI updates or actions based on what changed
    if (event.target.name === 'displaySize') {
      updateDisplaySize();
    }

    if (event.target.name === 'webrtcSink') {
      if (!webrtcSink.checked && appWebRTCSink) {
        appWebRTCSink.destroy();
        appWebRTCSink = null;
      }
      if (webrtcSink.checked && isRunning && !appWebRTCSink) {
        appWebRTCSink = new WebRTCSink(webrtcCodec.value);
        appWebRTCSink.setMediaStream(appProcessedVideo.srcObject);
      }
    }

    if (event.target.name === 'webrtcCodec' && isRunning && appWebRTCSink) {
      appWebRTCSink.renegotiate(webrtcCodec.value);
    }

    // Update enabled/disabled/visible states of options
    updateOptionState();

    // If the app is running, and a core pipeline option changed, restart the pipeline.
    const restartNeededOptions = ['renderer', 'useWorker', 'segmenter', 'zeroCopy', 'directOutput'];
    if (isRunning && restartNeededOptions.includes(event.target.name)) {
      console.log(`Restarting pipeline due to change in '${event.target.name}'`);
      stopVideoProcessing();
      startVideoProcessing();
    }
  });

  window.addEventListener('load', loadSettingsFromUrl);
  window.addEventListener('hashchange', loadSettingsFromUrl);

  // Manually trigger loading for the initial state
  loadSettingsFromUrl();
}

// Initialize the app
initializeApp();

function loadSettingsFromUrl() {
  // This function now also handles the initial UI setup like display size.
  const form = document.getElementById('settings-form');
  const params = new URLSearchParams(location.hash.substring(1));

  // Reset checkboxes first. Unchecked boxes are omitted from the URL, so we
  // must manually uncheck them before loading the "checked" ones.
  form.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
  for (const [key, value] of params.entries()) {
    const input = form.elements[key];

    if (!input) continue; // Skip params that don't match a setting

    if (input.type === 'checkbox') {
      input.checked = (input.value === value);
    } else if (input.type === 'radio') {
      const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      // Handle text, range, select-one, color, etc.
      input.value = value;
    }
  }
  // After loading settings, update the dependent UI state
  updateOptionState();
  updateDisplaySize();
}
