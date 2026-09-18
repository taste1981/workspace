// WebCodecs compare pipeline: encode the same camera frames with a browser
// hardware codec at the same bitrate as MLVC, decode them, and return stats.
// The VideoEncoder/VideoDecoder APIs are callback-driven; each public method
// returns a Promise resolved from the matching output event.

const CODEC_CANDIDATES = {
  h264: ["avc1.64001f", "avc1.4d401f", "avc1.42e01f", "avc1.42001f"], // 3.1 High/Main/Baseline
  hevc: ["hvc1.1.6.L93.B0"],
  vp8: ["vp8"],
  vp9: ["vp09.00.10.08"],
  av1: ["av01.0.04M.08"],
};

// Probe a codec family for BOTH the encoder and the decoder, preferring hardware
// acceleration but falling back to software (VP8/VP9/AV1 hardware encoders are
// far from universal; software fallback keeps the comparison working).
const ACCEL_CASCADE = ["prefer-hardware", "prefer-software", "no-preference"];

async function probe(isConfigSupported, config) {
  for (const hardwareAcceleration of ACCEL_CASCADE) {
    try {
      const res = await isConfigSupported({ ...config, hardwareAcceleration });
      if (res.supported) {
        return hardwareAcceleration === "no-preference" ? undefined : hardwareAcceleration;
      }
    } catch {
      /* try the next acceleration mode */
    }
  }
  return null;
}

export async function probeCodec(codecName, width, height, bitrate, framerate) {
  if (typeof VideoEncoder === "undefined") return null;
  for (const codec of CODEC_CANDIDATES[codecName] ?? []) {
    const encAccel = await probe(VideoEncoder.isConfigSupported.bind(VideoEncoder), {
      codec,
      width,
      height,
      bitrate,
      framerate,
      latencyMode: "quality",
    });
    if (encAccel === null) continue;
    const decAccel = await probe(VideoDecoder.isConfigSupported.bind(VideoDecoder), {
      codec,
      codedWidth: width,
      codedHeight: height,
    });
    if (decAccel === null) continue;
    return { codec, encAccel, decAccel };
  }
  return null;
}

export function createWebCodecsPipeline({ codec, encAccel, decAccel, width, height, framerate, bitrateProvider }) {
  let encoder = null;
  let decoder = null;
  let frameCount = 0;
  let totalBits = 0;
  let encError = null;
  let decError = null;
  let needKeyframe = true; // spec: first frame after configure() must be a keyframe
  let descriptionApplied = false;
  let lastBitrate = null; // hysteresis state for mid-stream reconfigure
  let sinceReconfigure = 0;

  // pending-promise queues (one event at a time)
  let encChunkResolve = null;
  let decFrameResolve = null;
  let decFrameReject = null;

  function resetEncoder() {
    encoder = new VideoEncoder({
      output: (chunk, metadata) => {
        totalBits += chunk.byteLength * 8;
        // With 'annexb' the decoder initializes from the bitstream itself, but if
        // the encoder still provides a decoderConfig description, apply it — it
        // makes HEVC-style streams decode even where annexb is unsupported.
        if (!descriptionApplied && metadata?.decoderConfig?.description && decoder) {
          try {
            decoder.configure({
              codec,
              codedWidth: width,
              codedHeight: height,
              description: metadata.decoderConfig.description,
              hardwareAcceleration: decAccel,
            });
            descriptionApplied = true;
          } catch {
            /* keep the annexb self-describing path */
          }
        }
        if (encChunkResolve) {
          const r = encChunkResolve;
          encChunkResolve = null;
          r(chunk);
        }
      },
      error: (e) => {
        encError = e;
        if (encChunkResolve) {
          const r = encChunkResolve;
          encChunkResolve = null;
          r(null);
        }
      },
    });
    const initialBitrate = bitrateProvider();
    encoder.configure({
      codec,
      width,
      height,
      bitrate: initialBitrate,
      framerate,
      latencyMode: "quality",
      hardwareAcceleration: encAccel, // resolved HW/SW preference (SW fallback allowed)
      // annexb: the decoder does not need a separate description entry
      avc: codec.startsWith("avc") ? { format: "annexb" } : undefined,
      hevc: codec.startsWith("hvc") ? { format: "annexb" } : undefined,
    });
    lastBitrate = initialBitrate;
    needKeyframe = true;
  }

  function resetDecoder() {
    decoder = new VideoDecoder({
      output: (frame) => {
        if (decFrameResolve) {
          const r = decFrameResolve;
          decFrameResolve = null;
          r(frame);
        } else {
          frame.close();
        }
      },
      error: (e) => {
        decError = e;
        if (decFrameResolve) {
          const r = decFrameResolve;
          const rej = decFrameReject;
          decFrameResolve = null;
          decFrameReject = null;
          rej(e);
          r?.(null);
        }
      },
    });
    decoder.configure({ codec, codedWidth: width, codedHeight: height, hardwareAcceleration: decAccel });
  }

  resetEncoder();
  resetDecoder();

  return {
    codec,
    get error() {
      return encError ?? decError;
    },
    get bits() {
      return totalBits;
    },

    // Encode one frame; resolves with the EncodedVideoChunk (or null on error).
    encodeFrame(videoFrame, { keyFrame = false } = {}) {
      if (sinceReconfigure >= 30) {
        sinceReconfigure = 0;
        // hysteresis: reconfigure only when the target moved meaningfully, so
        // the encoder's rate control isn't thrashed by small drifts
        const next = bitrateProvider();
        if (lastBitrate === null || Math.abs(next - lastBitrate) / lastBitrate > 0.15) {
          try {
            encoder.configure({ bitrate: next });
            lastBitrate = next;
            needKeyframe = true; // spec: keyframe required right after configure()
          } catch {
            /* some encoders reject mid-stream reconfigure; keep the old rate */
          }
        }
      }
      sinceReconfigure += 1;

      const chunkPromise = new Promise((resolve) => {
        encChunkResolve = resolve;
      });
      encoder.encode(videoFrame, { keyFrame: keyFrame || needKeyframe });
      needKeyframe = false;
      frameCount += 1;
      return chunkPromise;
    },

    // Decode a chunk; resolves with the decoded VideoFrame (or null on error).
    decodeChunk(chunk) {
      const framePromise = new Promise((resolve, reject) => {
        decFrameResolve = resolve;
        decFrameReject = reject;
      });
      decoder.decode(chunk);
      return framePromise;
    },

    async flushDecoder() {
      try {
        await decoder.flush();
      } catch {
        /* flush can reject if the stream was never started */
      }
    },

    get frameCount() {
      return frameCount;
    },

    close() {
      try {
        encoder.close();
      } catch {}
      try {
        decoder.close();
      } catch {}
    },
  };
}

// Convert a decoded VideoFrame to top-down RGBA bytes (via an OffscreenCanvas).
export function videoFrameToRgba(frame, width, height) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(frame, 0, 0, width, height);
  const data = ctx.getImageData(0, 0, width, height).data;
  return new Uint8Array(data.buffer);
}

// Luma-only PSNR between the MLVC input Y plane (bytes, 0..255) and the
// WebCodecs-decoded RGBA frame — a fair single-channel comparison of the two
// pipelines' distortion at the same bitrate.
export function lumaPsnrFromRgba(yBytes, rgba, width, height) {
  // yBytes may cover model dims (>= video dims, row-major, modelW == videoW
  // for all resolutions); only the video rect participates.
  const modelW = width;
  let sum = 0;
  let n = 0;
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const o = (j * width + i) * 4;
      const r = rgba[o] / 255;
      const g = rgba[o + 1] / 255;
      const b = rgba[o + 2] / 255;
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const d = yBytes[j * modelW + i] / 255 - y;
      sum += d * d;
      n += 1;
    }
  }
  const mse = sum / n;
  if (!Number.isFinite(mse)) return -999.9;
  if (mse < 1e-10) return 999.9;
  return -10 * Math.log10(mse);
}
