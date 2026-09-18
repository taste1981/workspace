// MLVC frame-loop worker: owns ORT sessions, the WASM entropy coder, the scale
// decoder, and the CBR rate controller. Camera frames come in as RGBA buffers;
// reconstructed RGB buffers go back, both transferred (zero-copy).
import createModule from "../wasm/mlvc_rans.mjs";
import * as ort from "../ort/ort.all.mjs";
import { initRansWasm, FrameCodec } from "../js/wasmEntropy.js";
import { MlvcFrameLoop } from "../js/frameLoop.js";
import { RateController } from "../js/rateController.js";
import { createSessions, probeCapabilities, setOrt } from "../js/session.js";
import { rgbaToYuv420, yuv420ToRgba, planes444ToX } from "../js/yuv.js";
import { createWorkerGL } from "../js/workerGL.js";
import {
  createWebCodecsPipeline,
  probeCodec,
  videoFrameToRgba,
  lumaPsnrFromRgba,
} from "../js/webCodecsCodec.js";

setOrt(ort);
// relative to this module — works on any base path (GitHub Pages subpaths included)
ort.env.wasm.wasmPaths = new URL("../ort/", import.meta.url).href;

const RESOLUTIONS = {
  "640x368": { modelW: 640, modelH: 368, videoW: 640, videoH: 360 },
  "1280x720": { modelW: 1280, modelH: 720, videoW: 1280, videoH: 720 },
  "1920x1088": { modelW: 1920, modelH: 1088, videoW: 1920, videoH: 1080 },
};

const CODEC_PARAMS = {
  featureChannels: 96,
  latentChannels: 48,
  frameIndexMap: [0, 1, 0, 2, 0, 2, 0, 2],
  qpShift: [0, 8, 4],
  iframePeriod: 1024,
  resetPeriod: null,
  ltrStartIdx: 8,
  ltrPeriod: 64,
  fps: 30,
};

// state: { enc, dec, codec, loop, mode, resolution, videoW, videoH, busy, gl,
//          lastRecX444, compare, mlvcBits, mlvcFrames }
let state = null;

function post(msg, transfer) {
  self.postMessage(msg, transfer ?? []);
}

function rebuildLoop() {
  const res = RESOLUTIONS[state.resolution];
  state.loop = new MlvcFrameLoop({
    encoderSession: state.enc,
    decoderSession: state.dec,
    frameCodec: state.codec,
    params: { ...CODEC_PARAMS, ...res },
    rate: makeRate(state.mode, res),
  });
}

function makeRate(mode, res) {
  if (mode.mode === "cbr") {
    return {
      mode: "cbr",
      controller: new RateController(res.videoW, res.videoH, mode.bitrateKbps * 1000, CODEC_PARAMS.fps),
    };
  }
  return { mode: "cq", qIndex: mode.qIndex };
}

// fallback original-Y bytes for the compare PSNR when only rgba is available
function rgbaLumaToBytes(rgba, w, h) {
  const bytes = new Uint8Array(w * h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4;
      bytes[j * w + i] = Math.round(
        0.2126 * rgba[o] + 0.7152 * rgba[o + 1] + 0.0722 * rgba[o + 2]
      );
    }
  }
  return bytes;
}

// deterministic synthetic test feed: gradients + a moving block
function syntheticRgba(w, h, t) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  const cx = ((t * 9) % Math.max(1, w - 200)) + 100;
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const o = (j * w + i) * 4;
      let r = (i * 255) / w;
      let g = (j * 255) / h;
      let b = (i + j + t * 3) % 256;
      if (Math.abs(i - cx) < 40 && j > h / 4 && j < (3 * h) / 4) {
        r = 255;
        g = 200;
        b = 0;
      }
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 255;
    }
  }
  return rgba;
}

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case "init": {
        const res = RESOLUTIONS[msg.resolution];
        if (!res) throw new Error(`unknown resolution ${msg.resolution}`);
        if (state) {
          state.codec.destroy();
          state = null;
        }
        const t0 = performance.now();
        const mod = await initRansWasm(createModule);
        const [gaussianPmf, zPmf] = await Promise.all([
          (await fetch("../models/shared/gaussian_pmf.json")).json(),
          (await fetch("../models/shared/bit_estimator_pmf.json")).json(),
        ]);
        const sessions = await createSessions({
          modelDir: `../models/${msg.resolution}`,
          device: msg.device,
          log: (l) => post({ type: "log", level: "info", text: l }),
        });
        const codec = new FrameCodec(mod, gaussianPmf, zPmf, CODEC_PARAMS.latentChannels);
        // worker-side WebGL2 (OffscreenCanvas): tensor assembly, display
        // conversion and PSNR reduction run in shaders when available; any
        // failure falls back to the CPU paths silently
        let gl = null;
        try {
          gl = createWorkerGL();
          gl?.configure(res.modelW, res.modelH, res.videoW, res.videoH);
        } catch (e) {
          gl = null;
          post({ type: "log", level: "warn", text: `worker GL disabled: ${e?.message ?? e}` });
        }
        state = {
          enc: sessions.encoder,
          dec: sessions.decoder,
          codec,
          loop: null,
          mode: msg.mode,
          resolution: msg.resolution,
          videoW: res.videoW,
          videoH: res.videoH,
          busy: false,
          gl,
          lastRecX444: null,
          compare: null,
          mlvcBits: 0,
          mlvcFrames: 0,
        };
        rebuildLoop();
        const caps = await probeCapabilities();

        // warmup: one synthetic frame through the resolved EP so the first real
        // frame doesn't pay compile cost and the user gets an EP health check
        let warmup = null;
        try {
          const rgba = syntheticRgba(res.videoW, res.videoH, 0);
          const r = await state.loop.processFrame(rgbaToYuv420(rgba, res.videoW, res.videoH));
          warmup = { encMs: Math.round(r.encMs * 10) / 10, decMs: Math.round(r.decMs * 10) / 10 };
        } catch (e) {
          warmup = { error: e?.message ?? String(e) };
        }
        rebuildLoop(); // fresh state after warmup

        post({
          type: "ready",
          actualEp: sessions.actualEp,
          warnings: sessions.warnings,
          modelLoadMs: Math.round(performance.now() - t0),
          capabilities: caps,
          workerGL: !!gl,
          warmup,
          note:
            sessions.actualEp.startsWith("webnn")
              ? "WebNN deviceType:'npu' requests the NPU through the browser's WebNN API; " +
                "the underlying backend is chosen by the browser/OS and may be ORT- or platform-specific."
              : null,
        });
        break;
      }

      case "setMode": {
        if (!state) {
          post({ type: "log", level: "warn", text: "setMode ignored: worker not initialized" });
          break;
        }
        state.mode = msg.mode;
        rebuildLoop();
        post({ type: "modeSet", mode: msg.mode });
        break;
      }

      case "setCompare": {
        if (!state) {
          post({ type: "log", level: "warn", text: "setCompare ignored: worker not initialized" });
          break;
        }
        state.compare?.close?.();
        state.compare = null;
        if (!msg.codec) {
          post({ type: "compareDisabled" });
          break;
        }
        if (typeof VideoEncoder === "undefined") {
          post({
            type: "log",
            level: "warn",
            text: "WebCodecs not available in this browser — compare mode disabled",
          });
          post({ type: "compareDisabled" });
          break;
        }
        // probe the codec string against this browser's encoder support
        const bitrateProvider = () => {
          const kbps = state.mode.mode === "cbr"
            ? state.mode.bitrateKbps
            : state.mlvcFrames > 0
              ? (state.mlvcBits / state.mlvcFrames) * CODEC_PARAMS.fps / 1000
              : 300;
          return kbps * 1000;
        };
        const resolved = await probeCodec(
          msg.codec,
          state.videoW,
          state.videoH,
          bitrateProvider(),
          CODEC_PARAMS.fps
        );
        if (!resolved) {
          post({
            type: "log",
            level: "warn",
            text: `codec '${msg.codec}' not supported by this browser's encoders`,
          });
          post({ type: "compareDisabled" });
          break;
        }
        state.compare = createWebCodecsPipeline({
          codec: resolved,
          width: state.videoW,
          height: state.videoH,
          framerate: CODEC_PARAMS.fps,
          bitrateProvider,
        });
        post({
          type: "compareEnabled",
          codec: resolved,
          note: `compare codec ${msg.codec} -> ${resolved} (bitrate tracks MLVC's ${state.mode.mode === "cbr" ? "target" : "measured"} rate)`,
        });
        break;
      }

      case "start": {
        if (!state) {
          post({ type: "log", level: "warn", text: "start ignored: worker not initialized" });
          break;
        }
        rebuildLoop(); // fresh loop state (refs, RC, frame counters)
        post({ type: "started" });
        break;
      }

      case "selftest": {
        if (!state) {
          post({ type: "log", level: "warn", text: "selftest ignored: worker not initialized" });
          break;
        }
        const res = RESOLUTIONS[state.resolution];
        rebuildLoop();
        const stats = [];
        const t0 = performance.now();
        let drops = 0;
        for (let t = 0; t < 30; t++) {
          const rgba = syntheticRgba(res.videoW, res.videoH, t);
          const r = await state.loop.processFrame(rgbaToYuv420(rgba, res.videoW, res.videoH));
          stats.push(r);
          if (r.dropped) drops += 1;
        }
        const elapsed = performance.now() - t0;
        const mean = (f) => stats.filter((r) => !r.dropped).reduce((a, r) => a + f(r), 0) / Math.max(1, stats.length - drops);
        post({
          type: "selftestDone",
          result: {
            frames: 30,
            drops,
            fps: Math.round((30000 / elapsed) * 10) / 10,
            psnr: mean((r) => r.psnr).toFixed(2),
            bpp: mean((r) => r.bpp).toFixed(4),
            encMs: mean((r) => r.encMs).toFixed(1),
            decMs: mean((r) => r.decMs).toFixed(1),
            entropyMs: mean((r) => r.entropyMs).toFixed(1),
          },
        });
        break;
      }

      case "frame": {
        if (!state || !state.loop) {
          // not ready yet — silently drop (main thread awaits 'ready' before sending)
          break;
        }
        if (state.busy) {
          // depth-1 mailbox: drop the frame while busy (capture drop, not RC drop)
          post({ type: "frameSkipped" });
          break;
        }
        state.busy = true;
        try {
          const { rgba, y, uv, width, height, captureTs, videoFrame } = msg;
          let r;
          let rgb;
          let psnrStats = null;

          if (y && uv && state.gl) {
            // full GPU pipeline: scatter bytes -> [Y,U,V] tensor, codec run with
            // CPU metrics skipped, then GPU display conversion + GPU PSNR
            const x = state.gl.planesToX(new Uint8Array(y), new Uint8Array(uv));
            r = await state.loop.processFrame(null, { x444: x, skipMetrics: true });
            const recX = r.reconstructedX444 ?? state.lastRecX444;
            if (recX) {
              psnrStats = state.gl.psnrStats(x, recX);
              rgb = state.gl.xHatToRgba(recX);
            } else {
              rgb = yuv420ToRgba(r.reconstructed, width, height);
            }
            if (r.reconstructedX444) state.lastRecX444 = r.reconstructedX444;
          } else if (y && uv) {
            // WebGL capture, no worker GL: CPU tensor assembly + CPU metrics
            const x444 = planes444ToX(
              new Uint8Array(y),
              new Uint8Array(uv),
              msg.modelWidth ?? width,
              msg.modelHeight ?? height
            );
            r = await state.loop.processFrame(null, { x444 });
            rgb = yuv420ToRgba(r.reconstructed, width, height);
          } else {
            // 2D-canvas capture fallback: CPU conversion everywhere
            const yuv420 = rgbaToYuv420(new Uint8ClampedArray(rgba), width, height);
            r = await state.loop.processFrame(yuv420);
            rgb = yuv420ToRgba(r.reconstructed, width, height);
          }

          // ---- non-ML codec comparison (WebCodecs, same bitrate) ----
          let comp = null;
          if (state.compare && videoFrame && !r.dropped) {
            const t0 = performance.now();
            const chunk = await state.compare.encodeFrame(videoFrame, {
              keyFrame: state.compare.frameCount % 30 === 0,
            });
            const encMs = performance.now() - t0;
            if (chunk) {
              const t1 = performance.now();
              const decFrame = await state.compare.decodeChunk(chunk);
              const decMs = performance.now() - t1;
              if (decFrame) {
                const compRgba = videoFrameToRgba(decFrame, width, height);
                decFrame.close();
                const yBytes = y
                  ? new Uint8Array(y)
                  : rgbaLumaToBytes(rgba, width, height);
                comp = {
                  rgbRec: compRgba.buffer,
                  bits: chunk.byteLength * 8,
                  psnrY: lumaPsnrFromRgba(yBytes, compRgba, width, height),
                  encMs,
                  decMs,
                };
              }
            }
            try {
              videoFrame.close();
            } catch {}
            if (state.compare.error) {
              post({
                type: "log",
                level: "warn",
                text: `compare codec error: ${state.compare.error?.message ?? state.compare.error}`,
              });
              state.compare.close?.();
              state.compare = null;
              post({ type: "compareDisabled" });
            }
          } else {
            try {
              videoFrame?.close();
            } catch {}
          }

          state.mlvcBits += r.bits;
          state.mlvcFrames += 1;

          post(
            {
              type: "frameDone",
              rgbRec: rgb.buffer,
              comp: comp
                ? { ...comp, kbps: (comp.bits * CODEC_PARAMS.fps) / 1000, codec: state.compare?.codec ?? "" }
                : null,
              captureTs,
              stats: {
                frameType: r.frameType,
                qIndex: r.qIndex,
                dropped: r.dropped,
                bits: r.bits,
                bpp: r.bpp,
                psnr: psnrStats?.psnr ?? r.psnr,
                psnrY: psnrStats?.psnrY ?? r.psnrY,
                psnrU: psnrStats?.psnrU ?? r.psnrU,
                psnrV: psnrStats?.psnrV ?? r.psnrV,
                encMs: r.encMs,
                decMs: r.decMs,
                entropyMs: r.entropyMs,
                bucketLevel: r.rcInfo?.actualBucketLevel ?? null,
                targetLevel: r.rcInfo?.targetBucketLevel ?? null,
                nominalFrameBits: r.rcInfo?.nominalFrameBits ?? null,
                allocatedFrameBits: r.rcInfo?.allocatedFrameBits ?? null,
                actualFrameBits: r.rcInfo?.actualFrameBits ?? null,
              },
            },
            comp ? [rgb.buffer, comp.rgbRec] : [rgb.buffer]
          );
        } finally {
          state.busy = false;
        }
        break;
      }

      case "stop":
        state?.loop?.reset();
        post({ type: "stopped" });
        break;

      default:
        post({ type: "log", level: "warn", text: `unknown message: ${msg.type}` });
    }
  } catch (err) {
    post({ type: "error", stage: msg.type, message: err?.message ?? String(err) });
  }
};
