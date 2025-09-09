const QueryString = function() {
  var params = {};
  var r = /([^&=]+)=?([^&]*)/g;
  function d(s) { return decodeURIComponent(s.replace(/\+/g, ' ')); }
  var match;
  while (match = r.exec(window.location.search.substring(1)))
    params[d(match[1])] = d(match[2]);
  return params;
}();

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
        appBlurRenderer = createWebGL2BlurRenderer(segmenter);
        appStatus.innerText = 'Renderer: WebGL2';
        console.log('Using WebGL2 for blur rendering');
      }

      // Both renderers now output to a video element via MediaStreamTrackGenerator
      appProcessedVideo.style.display = 'block';
      appCanvas.style.display = 'none';

    } catch (error) {
      console.warn(`Failed to initialize ${useWebGPU ? 'WebGPU' : 'WebGL2'} renderer:`, error);
      // Fallback to WebGL2 if WebGPU fails
      if (useWebGPU) {
        appBlurRenderer = createWebGL2BlurRenderer(segmenter);
        // The fallback should also use the video element path
        appProcessedVideo.style.display = 'block';
        appCanvas.style.display = 'none';
        // If for some reason we need to show the canvas, we can do this:
        // appCanvas.style.display = 'block';

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

      if (processedFrame) {
          try {
            await writer.write(processedFrame);
          } catch (e) {
            console.error('Error writing frame to generator', e);
          }
          processedFrame.close();
      }

      // IMPORTANT: Close the frame to free up resources.
      frame.close();
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

// Get DOM elements for app control
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const webgpuRadio = document.getElementById('webgpuRadio');
const displaySizeSelect = document.getElementById('displaySize');
const appStatus = document.getElementById('status');
const appFpsDisplay = document.getElementById('fpsDisplay');
const appVideo = document.getElementById('webcam');
const appProcessedVideo = document.getElementById('processedVideo');
const appCanvas = document.getElementById('output');
const zeroCopyCheckbox = document.getElementById('zeroCopy');
const zeroCopyLabel = document.getElementById('zeroCopyLabel');
const directOutputCheckbox = document.getElementById('directOutput');
const directOutputLabel = document.getElementById('directOutputLabel');

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
  appVideo.style.width = width + 'px';
  appVideo.style.height = height + 'px';
  appProcessedVideo.style.width = width + 'px';
  appProcessedVideo.style.height = height + 'px';
  appCanvas.style.width = width + 'px';
  appCanvas.style.height = height + 'px';
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
    
    appVideo.srcObject = appStream;
    await new Promise(r => appVideo.onloadedmetadata = r);
    
    // Wait until dimensions are available
    await new Promise(res => {
      const chk = () => (appVideo.videoWidth > 0) ? res() : setTimeout(chk, 50);
      chk();
    });
    
    appVideo.style.display = 'block';
    appCanvas.style.display = 'block';
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
  if (appVideo.srcObject) {
    appVideo.srcObject.getTracks().forEach(t => t.stop());
    appVideo.srcObject = null;
  }
  if (appStream) {
    appStream.getTracks().forEach(t => t.stop());
    appStream = null;
  }

  if (appReader) {
    appReader.cancel().catch(() => {}); // Ignore cancel errors
    appReader = null;
  }
  
  appBlurRenderer = null;
  
  startButton.disabled = false;
  startButton.textContent = 'Start Video Processing';
  startButton.style.display = 'inline-block';
  stopButton.style.display = 'none';
  appStatus.textContent = 'Stopped. You can start again.';
  appFpsDisplay.textContent = 'FPS: --';
}

// Initialize compatibility info and set up event listeners
async function initializeApp() {
  initializeCompatibilityInfo();
  
  // Set initial display size
  updateDisplaySize();
  
  startButton.addEventListener('click', startVideoProcessing);
  stopButton.addEventListener('click', stopVideoProcessing);
  
  // Handle display size changes
  displaySizeSelect.addEventListener('change', updateDisplaySize);
  
  const updateOptionState = () => {
    const isWebGPU = webgpuRadio.checked;
    zeroCopyCheckbox.disabled = !isWebGPU;
    zeroCopyLabel.style.color = isWebGPU ? '' : '#aaa';
    directOutputCheckbox.disabled = !isWebGPU;
    directOutputLabel.style.color = isWebGPU ? '' : '#aaa';
  };
  const changeEventListener = () => {
    updateOptionState();
    if (isRunning) rendererSwitchRequested = true;
  };
  zeroCopyCheckbox.addEventListener('change', changeEventListener);
  directOutputCheckbox.addEventListener('change', changeEventListener);

  document.querySelectorAll('input[name="renderer"]').forEach(radio => {
    radio.addEventListener('change', changeEventListener);
  });

  updateOptionState();
}

// Initialize the app
initializeApp();