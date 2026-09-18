// WebCodecs compare pipeline: encode the same camera frames with a browser
// hardware/software codec at the same bitrate as MLVC, decode them, and report
// per-frame results through a callback.
//
// IMPORTANT design constraint: with latencyMode 'quality' the encoder buffers
// frames for B-frame reordering (VP8/VP9/AV1 especially) and emits NOTHING for
// the first few frames. The pipeline is therefore fully fire-and-forget —
// encode() is never awaited inside the serial MLVC frame loop; decoded frames
// arrive asynchronously through onDecodedFrame with their presentation order
// preserved by the decoder.

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

// onDecodedFrame(VideoFrame) is called in decoder presentation order; the caller
// must close() the frame. onError(err) fires once when the pipeline dies.
export function createWebCodecsPipeline({
  codec,
  encAccel,
  decAccel,
  width,
  height,
  framerate,
  bitrateProvider,
  onDecodedFrame,
  onError,
}) {
  let encoder = null;
  let decoder = null;
  let frameCount = 0;
  let framesDecoded = 0;
  let totalBits = 0;
  let failed = false;
  let needKeyframe = true; // spec: first frame after configure() must be a keyframe
  let descriptionApplied = false;
  let lastBitrate = null; // hysteresis state for mid-stream reconfigure
  let sinceReconfigure = 0;

  function fail(e) {
    if (failed) return;
    failed = true;
    onError?.(e);
  }

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
        try {
          decoder.decode(chunk);
        } catch (e) {
          fail(e);
        }
      },
      error: (e) => fail(e),
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
        framesDecoded += 1;
        try {
          onDecodedFrame?.(frame);
        } catch {
          frame.close();
        }
      },
      error: (e) => fail(e),
    });
    decoder.configure({ codec, codedWidth: width, codedHeight: height, hardwareAcceleration: decAccel });
  }

  resetEncoder();
  resetDecoder();

  return {
    codec,
    get error() {
      return failed;
    },
    get bits() {
      return totalBits;
    },
    get framesDecoded() {
      return framesDecoded;
    },
    get frameCount() {
      return frameCount;
    },

    // Fire-and-forget encode. The caller owns the VideoFrame and may close it
    // after this call returns.
    encodeFrame(videoFrame, { keyFrame = false } = {}) {
      if (failed) {
        try {
          videoFrame.close();
        } catch {}
        return;
      }
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

      try {
        encoder.encode(videoFrame, { keyFrame: keyFrame || needKeyframe });
      } catch (e) {
        fail(e);
      }
      needKeyframe = false;
      frameCount += 1;
    },

    async flush() {
      try {
        await encoder.flush();
      } catch {}
      try {
        await decoder.flush();
      } catch {}
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
