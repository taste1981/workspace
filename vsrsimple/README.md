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
| `models/webnn_weights_fp16.bin/.json` | pre-exported fp16 weights + manifest consumed by the runner |
| `samples/*.png` | bundled test images |

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

## Graph

The runner rebuilds the lightB graph with basic WebNN ops (the model
weights are pre-exported into `models/webnn_weights_fp16.bin/.json`,
consumed via `MLGraphBuilder.constant`):

- entry/exit `Transpose` (NHWC ↔ NCHW)
- 7× `Conv` (SAME padding; filters [co,ci,kh,kw])
- 9× PReLU as the algebraic expansion `a·x + (1−a)·relu(x)`
  (Relu/Mul/Add)
- 2× `DepthToSpace` expanded to Reshape→Transpose→Reshape (WebNN has no
  DepthToSpace op); the channel decomposition matches TFLite semantics:
  `k = c + C_out·(Δx + b·Δy)` with perm `[0,3,4,1,5,2]`
- 1× `Resize` (linear, half-pixel) as the bilinear baseline, 3× `Add`
  (residual fuses + U+R synthesis)
