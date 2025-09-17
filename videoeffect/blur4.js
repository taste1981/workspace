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
    // CPU-based segmentation using MediaPipe
    segmenter = await bodySegmentation.createSegmenter(
      bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      {
        runtime: 'mediapipe',
        modelType: 'landscape',
        solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
      }
    );
    console.log('Using CPU (MediaPipe) for segmentation');

    // Update status to show segmentation method
    const rendererType = document.querySelector('input[name="renderer"]:checked').value === 'webgpu' ? 'WebGPU' : 'WebGL2';
    appStatus.innerText = `Segmentation: CPU (MediaPipe) | Renderer: ${rendererType}`;

  } catch (error) {
    console.error('Failed to initialize CPU segmentation:', error);
    appStatus.innerText = 'Segmentation initialization failed';
  }
}

async function segmentMediapipe(downscaledImageData) {
  const segmentation = await segmenter.segmentPeople(downscaledImageData);
  if (!segmentation || segmentation.length === 0) {
    console.warn("Segmentation returned no results.");
    return null;
  }
  const maskImageData = await segmentation[0].mask.toImageData();
  return maskImageData;
}

// Initialize blur renderer based on radio buttons
async function initializeBlurRenderer() {
  const useWebGPU = document.querySelector('input[name="renderer"]:checked').value === 'webgpu';
  const segmenterFunction = fakeSegmentationCheckbox.checked ? createBlurryTriangleMask : segmentMediapipe;

  try {
    if (useWebGPU && 'gpu' in navigator) {
      const zeroCopy = zeroCopyCheckbox.checked;
      const directOutput = directOutputCheckbox.checked;
      appBlurRenderer = await createWebGPUBlurRenderer(segmenterFunction, zeroCopy, directOutput);
      appStatus.innerText = 'Renderer: WebGPU';
      console.log('Using WebGPU for blur rendering');
    } else {
      appBlurRenderer = createWebGL2BlurRenderer(segmenterFunction);
      appStatus.innerText = 'Renderer: WebGL2';
      console.log('Using WebGL2 for blur rendering');
    }

    // Both renderers now output to a video element via MediaStreamTrackGenerator
    appProcessedVideo.style.display = 'block';

  } catch (error) {
    console.warn(`Failed to initialize ${useWebGPU ? 'WebGPU' : 'WebGL2'} renderer:`, error);
    // Fallback to WebGL2 if WebGPU fails
    if (useWebGPU) {
      appBlurRenderer = createWebGL2BlurRenderer(segmenterFunction);
      // The fallback should also use the video element path
      appProcessedVideo.style.display = 'block';

      if (appProcessedVideo) {
        appProcessedVideo.style.display = 'none';
      }
      appStatus.innerText = 'Renderer: WebGL2 (WebGPU fallback)';
      document.querySelector('input[name="renderer"][value="webgl2"]').checked = true;
    }
  }
}

async function processOneFrame(videoFrame) {
  if (!appBlurRenderer) {
    return null;
  }

  try {
    // Render with blur effect
    return await appBlurRenderer.render(videoFrame);
  } catch (error) {
    console.error("Error during frame processing in processOneFrame:", error);
    return null;
  }
}

async function run() {
  appStartRun = performance.now();
  appCount = 0;
  appSegmentTimes.length = 0;

  // FPS tracking variables
  let frameCount = 0;
  let lastFpsTime = performance.now();
  let actualFps = 0;

  // Centralized frame processing setup
  const videoTrack = appStream.getVideoTracks()[0];
  const trackProcessor = new MediaStreamTrackProcessor({ track: videoTrack });
  appReader = trackProcessor.readable.getReader();

  const trackGenerator = new MediaStreamTrackGenerator({ kind: 'video' });
  const writer = trackGenerator.writable.getWriter();
  const outputStream = new MediaStream([trackGenerator]);
  if (outputStream && appProcessedVideo) {
    appProcessedVideo.srcObject = outputStream;
    // Also create the sink on startup if the checkbox is already checked.
    if (webrtcSink.checked && !appWebRTCSink) {
      const codec = document.getElementById('webrtcCodec').value;
      appWebRTCSink = new WebRTCSink(codec);
      appWebRTCSink.setMediaStream(outputStream);
    }
  }

  // Main processing loop
  async function processFrames() {
    while (isRunning) {
      if (rendererSwitchRequested) {
        rendererSwitchRequested = false;
        appStatus.innerText = 'Switching renderer...';
        await initializeBlurRenderer();
        const rendererType = document.querySelector('input[name="renderer"]:checked').value === 'webgpu' ? 'WebGPU' : 'WebGL2';
        appStatus.innerText = `Segmentation: CPU (MediaPipe) | Renderer: ${rendererType}`;
        // Reset counters
        appCount = 0;
        appSegmentTimes.length = 0;
        frameCount = 0;
        lastFpsTime = performance.now();
        appFpsDisplay.textContent = `FPS: --`;
      }

      const result = await appReader.read();
      if (result.done) {
        console.log("Stream has ended.");
        appReader.releaseLock();
        writer.close();
        break;
      }
      const frame = result.value;

      // FPS calculation
      frameCount++;
      const currentTime = performance.now();
      const deltaTime = currentTime - lastFpsTime;
      if (deltaTime >= 1000) {
        actualFps = (frameCount * 1000) / deltaTime;
        appFpsDisplay.textContent = `FPS: ${actualFps.toFixed(1)}`;
        frameCount = 0;
        lastFpsTime = currentTime;
      }

      const processedFrame = await processOneFrame(frame);
      frame.close();

      if (processedFrame) {
        await writer.write(processedFrame);
        processedFrame.close();
      }
    }
  }

  // Start the processing loop
  processFrames().catch(e => {
    if (isRunning) { // Only log error if we weren't intentionally stopped
      console.error("Error in processing loop:", e);
      stopVideoProcessing();
    }
  });
}

// Global variables for app state
let appStartRun = null;
let appCount = 0;
let appSegmentTimes = [];
let appBlurRenderer = null;
let appStream = null;
let isRunning = false;
let appReader = null;
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
const fakeSegmentationCheckbox = document.getElementById('fakeSegmentation');
const webrtcSink = document.getElementById('webrtcSink');
const webrtcCodec = document.getElementById('webrtcCodec');
const webrtcCodecLabel = document.getElementById('webrtcCodecLabel');
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

// Initialize compatibility info
function initializeCompatibilityInfo() {
  if (!hasWebGPU) {
    webgpuRadio.disabled = true;
    webgpuRadio.parentElement.innerHTML = '<input type="radio" name="renderer" value="webgpu" disabled /> WebGPU (Not supported in this browser)';
  }
}

async function startVideoProcessing() {
  if (isRunning) return;
  try {
    startButton.disabled = true;
    startButton.textContent = 'Starting...';
    appStatus.textContent = 'Initializing...';

    appStatus.textContent = 'Requesting camera access...';
    appStream = await navigator.mediaDevices.getUserMedia({
      video: { frameRate: { ideal: 30 }, width: 1280, height: 720 }
    });

    appProcessedVideo.style.display = 'none';

    isRunning = true;
    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';

    // Now run the video processing
    await initializeSegmenter();
    await initializeBlurRenderer();
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

  // Stop any active streams
  if (appStream) {
    appStream.getTracks().forEach(t => t.stop());
    appStream = null;
  }

  if (appReader) {
    appReader.cancel().catch(() => { }); // Ignore cancel errors
    appReader = null;
  }

  if (appWebRTCSink) {
    appWebRTCSink.destroy();
    appWebRTCSink = null;
  }

  appBlurRenderer = null;

  startButton.disabled = false;
  startButton.textContent = 'Start Video Processing';
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
};

async function initializeApp() {
  // Populate WebRTC codec options
  if (RTCRtpSender.getCapabilities) {
    const capabilities = RTCRtpSender.getCapabilities('video');
    if (capabilities) {
      const supportedCodecs = new Set();
      capabilities.codecs.forEach(codec => {
        if (codec.mimeType === 'video/VP9' || codec.mimeType === 'video/H265') {
          supportedCodecs.add(codec.mimeType);
        }
      });
      supportedCodecs.forEach(mimeType => {
        webrtcCodec.add(new Option(mimeType, mimeType));
      });
    }
  }

  initializeCompatibilityInfo();

  startButton.addEventListener('click', startVideoProcessing);
  stopButton.addEventListener('click', stopVideoProcessing);

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
        const codec = document.getElementById('webrtcCodec').value;
        appWebRTCSink = new WebRTCSink(codec);
        // The output stream is on the video element's srcObject
        appWebRTCSink.setMediaStream(appProcessedVideo.srcObject);
      }
    }

    if (event.target.name === 'webrtcCodec' && isRunning && appWebRTCSink) {
      const newCodec = document.getElementById('webrtcCodec').value;
      appWebRTCSink.renegotiate(newCodec);
    }

    // Update enabled/disabled/visible states of options
    updateOptionState();

    // If the app is running, request a restart to apply changes
    if (isRunning && event.target.name !== 'displaySize') {
      rendererSwitchRequested = true;
    }
  });

  // Load settings from URL on initial load and when the hash changes
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

  // IMPORTANT: Reset checkboxes first. Unchecked boxes are omitted from 
  // the URL, so we must manually uncheck them before loading the "checked" ones.
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
