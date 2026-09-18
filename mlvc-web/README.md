# MLVC in the browser

Microsoft MLVC (Multi-platform Learned Video Codec) running fully in the browser:
camera → WebGL2 (resize + RGB→YUV444) → MLVC encoder (ONNX Runtime Web) → rANS
entropy coding (WASM) → bitstream → rANS decode → MLVC decoder → reconstructed
frames, with **CBR rate control** (leaky-bucket + adaptive rate models) or
constant-QP mode.

- **Backends**: CPU (`wasm`), GPU (`webgpu`), NPU (`webnn` +
  `deviceType:'npu'` — the backend is chosen by the browser/OS; the app
  probes NPU support and reports the resolved EP), with an automatic fallback
  chain and an always-visible EP banner.
- **Resolutions**: 360p (640×368), 720p (1280×720), 1080p (1920×1088 model inputs).
- **Entropy coder**: the original C++ `msrtc_rans` compiled to WASM (byte-exact
  with the native library; golden-vector tested).

## Live demo

Host this folder as GitHub Pages (Settings → Pages → deploy from branch), or serve
it with any static file server (e.g. `python -m http.server`). Open the page in
**Edge or Chrome**, allow camera access, pick resolution/device/mode, set the CBR
bitrate, press **Start**.

## Notes

- GitHub Pages does not send `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy`,
  so `crossOriginIsolated` is false and the WASM CPU EP runs single-threaded
  (slower on CPU; WebGPU/WebNN are unaffected). The app logs a warning when this
  happens.
- The FP32 ONNX models are ~110 MB total across the three resolutions and are
  loaded lazily per selected resolution. If the repo size is a concern, move
  `models/` to GitHub Releases and adjust the `../models/` fetch paths in
  `workers/frameLoop.worker.js`.
- The "Self-test" button runs 30 synthetic frames without a camera to verify the
  codec at the selected resolution/device.
