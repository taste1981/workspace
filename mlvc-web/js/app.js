// Main-thread UI: camera capture + controls + stats + display.
// The worker owns all codec state; frames flow main -> worker (RGBA, transferred)
// and worker -> main (reconstructed RGB, transferred) with a depth-1 mailbox.
const RES = {
  "640x368": { videoW: 640, videoH: 360, modelW: 640, modelH: 368 },
  "1280x720": { videoW: 1280, videoH: 720, modelW: 1280, modelH: 720 },
  "1920x1088": { videoW: 1920, videoH: 1080, modelW: 1920, modelH: 1088 },
};

import { createGLCapture } from "./glcapture.js";

const $ = (id) => document.getElementById(id);
const log = (text) => {
  const el = $("log");
  if (el.textContent === "—") el.textContent = "";
  el.textContent += `[${new Date().toLocaleTimeString()}] ${text}\n`;
  el.scrollTop = el.scrollHeight;
};

const worker = new Worker("./workers/frameLoop.worker.js", { type: "module" });

let stream = null;
let videoEl = null;
let captureCanvas = null;
let captureCtx = null;
let glCap = null; // WebGL capture (model-dim planes) when available
let running = false;
let inited = false;
let waiting = false; // depth-1 mailbox
let lastFrameDone = 0;
let rcDrops = 0;
let captureDrops = 0;
let cumBits = 0;
let cumFrames = 0;
let lastOrig = null; // Uint8ClampedArray of the original frame (for diff view)
let qHistory = [];
let fpsHistory = [];

// VideoFrame for the WebCodecs compare pipeline (from the displayed capture canvas)
function makeCompareVideoFrame(canvas, captureTs) {
  if (!el.compareCodec.value || typeof VideoFrame === "undefined") return null;
  try {
    return new VideoFrame(canvas, { timestamp: Math.round(captureTs * 1000) });
  } catch (e) {
    log(`WebCodecs VideoFrame creation failed: ${e.message}`);
    return null;
  }
}

const el = {
  epBadge: $("epBadge"),
  banner: $("banner"),
  resolution: $("resolution"),
  device: $("device"),
  mode: $("mode"),
  bitrate: $("bitrate"),
  qindex: $("qindex"),
  bitrateLabel: $("bitrateLabel"),
  qLabel: $("qLabel"),
  startBtn: $("startBtn"),
  stopBtn: $("stopBtn"),
  iframeBtn: $("iframeBtn"),
  selftestBtn: $("selftestBtn"),
  diffToggle: $("diffToggle"),
  origCanvas: $("origCanvas"),
  recCanvas: $("recCanvas"),
  compCanvas: $("compCanvas"),
  compPanel: $("compPanel"),
  recPanel: $("recPanel"),
  compareCodec: $("compareCodec"),
  sCompKbps: $("sCompKbps"),
  sCompPsnr: $("sCompPsnr"),
};

// init is asynchronous on the worker; keep a promise so Start/camera frames wait
let readyPromise = null;
let readyResolve = null;
let readyReject = null;

// ---------------------------------------------------------------- camera

async function startCamera() {
  const res = RES[el.resolution.value];
  const { videoW, videoH } = res;
  const modelW = res.modelW ?? videoW;
  const modelH = res.modelH ?? videoH;
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
  }
  stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: videoW }, height: { ideal: videoH }, frameRate: { ideal: 30 } },
    audio: false,
  });
  const settings = stream.getVideoTracks()[0].getSettings();
  log(`camera: requested ${videoW}x${videoH}, got ${settings.width}x${settings.height}@${settings.frameRate}fps`);

  videoEl = document.createElement("video");
  videoEl.srcObject = stream;
  videoEl.muted = true;
  videoEl.playsInline = true;
  await videoEl.play();

  // WebGL capture: resize + YUV420 conversion on the GPU, planes emitted at the
  // MODEL input size. Falls back to the 2D-canvas path when WebGL2 is missing.
  // A fresh canvas per start avoids reusing a stale/lost GL context.
  glCap?.dispose();
  glCap = null;
  const fresh = document.createElement("canvas");
  fresh.id = "origCanvas";
  el.origCanvas.replaceWith(fresh);
  el.origCanvas = fresh;
  glCap = createGLCapture(el.origCanvas, videoW, videoH, modelW, modelH);
  if (glCap) {
    log(`capture: WebGL2 (planes rendered at model size ${modelW}x${modelH})`);
  } else {
    log("capture: WebGL2 unavailable — falling back to 2D canvas + CPU conversion");
  }

  captureCanvas = document.createElement("canvas");
  captureCanvas.width = videoW;
  captureCanvas.height = videoH;
  captureCtx = captureCanvas.getContext("2d", { willReadFrequently: true });

  const onFrame = () => {
    if (!running) return;
    const vw = videoEl.videoWidth;
    const vh = videoEl.videoHeight;
    if (!vw || !vh) {
      // metadata not ready yet — keep the loop alive
      videoEl.requestVideoFrameCallback(onFrame);
      return;
    }

    if (glCap) {
      const captured = glCap.capture(videoEl, el.diffToggle.checked);
      if (!captured) {
        videoEl.requestVideoFrameCallback(onFrame);
        return;
      }
      if (captured.rgba) lastOrig = captured.rgba;
      if (!waiting) {
        waiting = true;
        const msg = {
          type: "frame",
          y: captured.y.buffer,
          uv: captured.uv.buffer,
          width: videoW,
          height: videoH,
          modelWidth: modelW,
          modelHeight: modelH,
          captureTs: performance.now(),
        };
        const transfer = [captured.y.buffer, captured.uv.buffer];
        const videoFrame = makeCompareVideoFrame(el.origCanvas, msg.captureTs);
        if (videoFrame) {
          msg.videoFrame = videoFrame;
          transfer.push(videoFrame);
        }
        worker.postMessage(msg, transfer);
      } else {
        captureDrops += 1;
      }
      videoEl.requestVideoFrameCallback(onFrame);
      return;
    }

    // fallback: 2D canvas path
    const scale = Math.max(videoW / vw, videoH / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    captureCtx.fillStyle = "#000";
    captureCtx.fillRect(0, 0, videoW, videoH);
    captureCtx.drawImage(videoEl, (videoW - dw) / 2, (videoH - dh) / 2, dw, dh);

    const imageData = captureCtx.getImageData(0, 0, videoW, videoH);
    // display the original; keep a COPY for the diff view (the buffer itself is
    // transferred to the worker and gets detached)
    el.origCanvas.width = videoW;
    el.origCanvas.height = videoH;
    el.origCanvas.getContext("2d").putImageData(imageData, 0, 0);
    lastOrig = new Uint8ClampedArray(imageData.data);

    if (!waiting) {
      waiting = true;
      const msg = {
        type: "frame",
        rgba: imageData.data.buffer,
        width: videoW,
        height: videoH,
        captureTs: performance.now(),
      };
      const transfer = [imageData.data.buffer];
      const videoFrame = makeCompareVideoFrame(el.origCanvas, msg.captureTs);
      if (videoFrame) {
        msg.videoFrame = videoFrame;
        transfer.push(videoFrame);
      }
      worker.postMessage(msg, transfer);
    } else {
      captureDrops += 1;
    }
    videoEl.requestVideoFrameCallback(onFrame);
  };
  videoEl.requestVideoFrameCallback(onFrame);
}

function stopCamera() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  videoEl = null;
  glCap?.dispose();
  glCap = null;
}

// ---------------------------------------------------------------- worker messages

worker.onmessage = (e) => {
  const msg = e.data;
  switch (msg.type) {
    case "ready":
      inited = true;
      readyResolve?.();
      el.epBadge.textContent = `EP: ${msg.actualEp}`;
      el.epBadge.className = "badge " + (msg.actualEp.startsWith("wasm") ? "warn" : "ok");
      const caps = msg.capabilities ?? {};
      log(
        `ready on ${msg.actualEp} (${msg.modelLoadMs}ms)` +
          (msg.warmup?.error
            ? `; warmup FAILED: ${msg.warmup.error}`
            : msg.warmup
              ? `; warmup: enc ${msg.warmup.encMs}ms / dec ${msg.warmup.decMs}ms`
              : "") +
          `; WebNN: ${caps.webnn ? "yes" : "no"}` +
          (caps.webnn ? `, NPU deviceType: ${caps.npuDeviceType ? "supported" : "NOT supported"}` : "") +
          `; WebGPU: ${caps.webgpu ? "yes" : "no"}` +
          `; worker GL (convert/PSNR/display shaders): ${msg.workerGL ? "yes" : "no"}`
      );
      if (msg.note) log(msg.note);
      if (msg.warnings?.length) {
        log(`warnings: ${msg.warnings.join(" | ")}`);
      }
      const expectedEp = { npu: "webnn:npu", gpu: "webgpu", cpu: "wasm" }[el.device.value];
      if (msg.actualEp !== expectedEp) {
        el.banner.textContent = `requested '${el.device.value}' -> actual '${msg.actualEp}'. ${msg.warnings?.join(" ") ?? ""}`;
        el.banner.classList.remove("hidden");
      }
      break;

    case "selftestDone": {
      const r = msg.result;
      log(
        `SELF-TEST (${el.resolution.value}, ${el.device.value}, ${el.mode.value}): ` +
          `${r.fps} fps, PSNR ${r.psnr} dB, bpp ${r.bpp}, enc ${r.encMs}ms, dec ${r.decMs}ms, ` +
          `entropy ${r.entropyMs}ms, drops ${r.drops}/${r.frames}`
      );
      const ok = Number(r.psnr) > 20;
      el.banner.textContent = ok
        ? `Self-test OK: PSNR ${r.psnr} dB at ${r.fps} fps on ${el.device.value}.`
        : `Self-test FAILED: PSNR ${r.psnr} dB — pipeline corrupt at this resolution/device.`;
      el.banner.className = ok ? "" : "";
      el.banner.classList.remove("hidden");
      break;
    }

    case "frameDone": {
      const { videoW, videoH } = RES[el.resolution.value];
      const rec = new ImageData(new Uint8ClampedArray(msg.rgbRec), videoW, videoH);
      if (el.diffToggle.checked && lastOrig) {
        const d = new Uint8ClampedArray(rec.data.length);
        for (let i = 0; i < rec.data.length; i += 4) {
          for (let c = 0; c < 3; c++) {
            d[i + c] = Math.min(255, Math.abs(rec.data[i + c] - lastOrig[i + c]) * 5);
          }
          d[i + 3] = 255;
        }
        el.recCanvas.getContext("2d").putImageData(new ImageData(d, videoW, videoH), 0, 0);
      } else {
        el.recCanvas.width = videoW;
        el.recCanvas.height = videoH;
        el.recCanvas.getContext("2d").putImageData(rec, 0, 0);
      }
      waiting = false;
      updateStats(msg.stats, msg.captureTs);
      break;
    }

    case "compFrame": {
      const { videoW, videoH } = RES[el.resolution.value];
      el.compCanvas.width = videoW;
      el.compCanvas.height = videoH;
      el.compCanvas
        .getContext("2d")
        .putImageData(new ImageData(new Uint8ClampedArray(msg.rgbRec), videoW, videoH), 0, 0);
      $("sCompKbps").textContent = `${msg.codec} ${msg.kbpsCum.toFixed(0)} kbps`;
      $("sCompPsnr").textContent = `${msg.psnrY.toFixed(1)} dB`;
      break;
    }

    case "compareEnabled":
      el.compPanel.classList.remove("hidden");
      el.recPanel.style.gridColumn = ""; // MLVC shares the row with the compare panel
      log(`compare on: ${msg.codec} (${msg.note})`);
      break;

    case "compareDisabled":
      el.compPanel.classList.add("hidden");
      el.recPanel.style.gridColumn = "1 / -1"; // MLVC spans the full row
      break;

    case "frameSkipped":
      // worker busy; the capture-drop counter is incremented at the mailbox
      break;

    case "error":
      log(`ERROR [${msg.stage}]: ${msg.message}`);
      el.banner.textContent = `Error: ${msg.message}`;
      el.banner.classList.remove("hidden");
      if (!inited) {
        // init failed — reject the pending promise so Start doesn't hang
        readyReject?.(new Error(msg.message));
        readyPromise = null;
      }
      break;

    case "log":
      log(msg.text);
      break;
  }
};

// ---------------------------------------------------------------- stats

function updateStats(s, captureTs) {
  const now = performance.now();
  cumFrames += 1;
  cumBits += s.bits;
  fpsHistory.push(now - lastFrameDone);
  lastFrameDone = now;
  if (fpsHistory.length > 60) fpsHistory.shift();
  if (s.dropped) rcDrops += 1;

  const meanDt = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
  $("sFps").textContent = (1000 / meanDt).toFixed(1);
  $("sEnc").textContent = s.encMs.toFixed(1);
  $("sDec").textContent = s.decMs.toFixed(1);
  $("sEnt").textContent = s.entropyMs.toFixed(1);
  const actualKbps = (cumBits / 1000) / (cumFrames / 30);
  const targetKbps = el.mode.value === "cbr" ? Number(el.bitrate.value) : null;
  $("sKbps").textContent = targetKbps !== null ? `${targetKbps} / ${actualKbps.toFixed(0)}` : `— / ${actualKbps.toFixed(0)}`;
  $("sPsnr").textContent = `${s.psnrY.toFixed(1)} / ${s.psnrU.toFixed(1)} / ${s.psnrV.toFixed(1)}`;
  const typeShort = s.frameType === "i_frame" ? "I" : s.frameType === "ltr_recovery" ? "LTR" : "P";
  $("sQ").textContent = s.dropped ? `drop (${typeShort})` : `${s.qIndex} (${typeShort})`;
  $("sDrops").textContent = `${rcDrops} / ${captureDrops}`;

  // q sparkline
  qHistory.push(s.qIndex);
  if (qHistory.length > 300) qHistory.shift();
  const spark = $("qspark");
  const ctx = spark.getContext("2d");
  ctx.clearRect(0, 0, spark.width, spark.height);
  ctx.strokeStyle = "#38bdf8";
  ctx.beginPath();
  qHistory.forEach((q, i) => {
    const x = (i / 299) * spark.width;
    const y = spark.height - 2 - (q / 63) * (spark.height - 4);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // bucket bar
  if (s.bucketLevel !== null) {
    const pct = Math.min(100, s.bucketLevel * 100);
    $("bucketFill").style.width = `${pct}%`;
    $("bucketFill").style.background = s.bucketLevel > 0.9 ? "#f87171" : "#38bdf8";
  }
}

// ---------------------------------------------------------------- controls

el.mode.addEventListener("change", () => {
  const cbr = el.mode.value === "cbr";
  el.bitrateLabel.classList.toggle("hidden", !cbr);
  el.qLabel.classList.toggle("hidden", cbr);
  if (inited) sendMode();
});

async function sendMode() {
  const mode =
    el.mode.value === "cbr"
      ? { mode: "cbr", bitrateKbps: Number(el.bitrate.value) }
      : { mode: "cq", qIndex: Number(el.qindex.value) };
  worker.postMessage({ type: "setMode", mode });
  cumBits = 0;
  cumFrames = 0;
  rcDrops = 0;
  captureDrops = 0;
}

function init() {
  if (inited) return Promise.resolve();
  if (!readyPromise) {
    readyPromise = new Promise((resolve, reject) => {
      readyResolve = resolve;
      readyReject = reject;
    });
    if (!crossOriginIsolated) {
      log("WARNING: not crossOriginIsolated — ORT WASM will run single-threaded (server must send COOP/COEP)");
    }
    const mode =
      el.mode.value === "cbr"
        ? { mode: "cbr", bitrateKbps: Number(el.bitrate.value) }
        : { mode: "cq", qIndex: Number(el.qindex.value) };
    log(`initializing ${el.resolution.value} on ${el.device.value} (models load on first use)...`);
    worker.postMessage({ type: "init", resolution: el.resolution.value, device: el.device.value, mode });
  }
  return readyPromise;
}

el.startBtn.addEventListener("click", async () => {
  el.startBtn.disabled = true;
  try {
    await init(); // wait for the worker 'ready' before starting the feed
  } catch (e) {
    log(`init failed: ${e.message}`);
    el.startBtn.disabled = false;
    return;
  }
  running = true;
  worker.postMessage({ type: "start" });
  await startCamera();
  el.stopBtn.disabled = false;
  el.iframeBtn.disabled = false;
  el.resolution.disabled = true;
  el.device.disabled = true;
  log("encoding started");
});

el.stopBtn.addEventListener("click", () => {
  running = false;
  stopCamera();
  worker.postMessage({ type: "stop" });
  el.startBtn.disabled = false;
  el.stopBtn.disabled = true;
  el.iframeBtn.disabled = true;
  el.resolution.disabled = false;
  el.device.disabled = false;
  log("stopped");
});

el.iframeBtn.addEventListener("click", () => {
  if (!inited) return;
  worker.postMessage({ type: "start" }); // fresh loop = next frame is an I-frame
  log("forcing I-frame (loop reset)");
});

el.selftestBtn.addEventListener("click", async () => {
  el.selftestBtn.disabled = true;
  try {
    await init();
  } catch (e) {
    log(`init failed: ${e.message}`);
    el.selftestBtn.disabled = false;
    return;
  }
  log("running self-test (30 synthetic frames, no camera)...");
  worker.postMessage({ type: "selftest" });
  setTimeout(() => (el.selftestBtn.disabled = false), 500);
});

el.bitrate.addEventListener("change", () => inited && sendMode());
el.qindex.addEventListener("change", () => inited && sendMode());

el.compareCodec.addEventListener("change", async () => {
  if (!el.compareCodec.value) {
    worker.postMessage({ type: "setCompare", codec: "" });
    return;
  }
  await init();
  worker.postMessage({ type: "setCompare", codec: el.compareCodec.value });
});

window.addEventListener("beforeunload", () => {
  stopCamera();
  worker.terminate();
});
