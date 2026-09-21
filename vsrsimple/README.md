# WebNN SR webapp — fp16 lightB model on the raw WebNN API

Single-page app: 3x single-channel (luma) super-resolution in the browser,
running the fp16 lightB SR model (240×360 → 720×1080) directly with the
WebNN API (`navigator.ml` / `MLGraphBuilder`) — **no ONNX Runtime, no wasm,
no loader**. The graph is built with `navigator.ml.MLGraphBuilder` —
conv2d/relu/mul/add/transpose/reshape/resample2d only — so the NPU is
reached with zero runtime dependencies beyond the browser.

The app center-crops the input image to the 2:3 model aspect, feeds luma as
FP16, and displays **Original (bilinear 3×)** next to the **SR output**
(SR luma fused with bilinear-upsampled chroma), with inference time and
PSNR-vs-bilinear readouts. The status line shows the engaged WebNN device
(`webnn(npu)` etc.).

## Files

| File | Purpose |
|---|---|
| `index.html`, `app.js` | the app |
| `webnn_runner.js` | builds the graph with `navigator.ml` directly |
| `models/webnn_weights_fp16.bin/.json` | fp16 weights + manifest consumed by the runner |
| `models/sr_x3_lightB_240x360_fp16.onnx` | fp16 ONNX, input to `export_webnn.py` (not loaded by the app) |
| `convert_tflite_to_onnx.py` | TFLite → ONNX converter (fp16/fp32 preserved), with verification vs the TFLite model |
| `export_webnn.py` | exports `models/webnn_weights_fp16.bin/.json` from the ONNX |
| `samples/*.png` | bundled test images (`gen_sample.py` regenerates them) |
| `gen_sample.py` | test-image generator (text, zone plate, checkerboards, circles, color patches; plus a smooth-gradients variant) |

The "Built-in sample" button loads `samples/sr_test_pattern_480x720.png`
(falls back to a procedural canvas image if the file is missing).

## Hosting / Run

The app is pure static files — host it on GitHub Pages or serve the folder
with any static server:

```
python -m http.server 8123
```

then open `http://localhost:8123` (secure context / localhost is required
for WebNN; GitHub Pages serves https, which qualifies).

- Edge or Chrome on Windows: WebNN is available (DirectML backend).
- **NPU**: select NPU (or Auto) in the Device dropdown — the app passes
  `deviceType: 'npu'` to `navigator.ml.createContext()`, which maps to the
  DirectML NPU device. Requirements: Windows 11 24H2+, an NPU with its
  driver installed, and a recent Edge/Chrome build with WebNN. The stats
  line shows a probe result ("NPU exposed" / "WebNN ok, NPU not exposed" /
  "no navigator.ml") so you can tell what the browser actually sees.
  Verify NPU utilization in Task Manager (NPU graph) while running.

## Model pipeline

`sr_x3_lightB_240x360_nhwc_fp16.tflite` → `convert_tflite_to_onnx.py
--expand-d2s` → ONNX (opset 17, same I/O contract `[1,240,360,1]` →
`[1,720,1080,1]`) → `export_webnn.py` →
`models/webnn_weights_fp16.bin/.json`:

- entry/exit `Transpose` (TFLite NHWC ↔ NCHW)
- 7× `Conv` (SAME-pad arithmetic recomputed; filters [co,kh,kw,ci] → [co,ci,kh,kw])
- 9× PReLU as the algebraic expansion `a·x + (1−a)·relu(x)` (Relu/Mul/Add)
- 2× `DepthToSpace` expanded to Reshape→Transpose→Reshape (WebNN has no
  DepthToSpace). The channel decomposition matches TFLite's actual
  semantics: `k = c + C_out·(Δx + b·Δy)` with perm `[0,3,4,1,5,2]` —
  determined empirically against ORT's native DCR op (the ONNX-spec DCR
  formula does not match what ORT/TFLite compute)
- 1× `Resize` (linear, half-pixel), 3× `Add` (residual fuses + U+R synthesis)

Verification: output matches the TFLite fp32 reference with
max_abs_diff ≈ 0.0008 (fp16 rounding) on random input.
