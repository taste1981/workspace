# WebNN SR webapp — fp16 lightB model on ORT.js

Single-page app: 3x single-channel (luma) super-resolution in the browser
using ONNX Runtime Web with a **WebNN → WebGPU → WASM** execution-provider
fallback chain, running the converted **fp16 lightB** SR model
(240×360 → 720×1080).

The app center-crops the input image to the 2:3 model aspect, feeds luma as
FP16, and displays **Original (bilinear 3×)** next to the **SR output**
(SR luma fused with bilinear-upsampled chroma), with inference time and
PSNR-vs-bilinear readouts.

## Files

| File | Purpose |
|---|---|
| `index.html`, `app.js` | the app |
| `ort/` | onnxruntime-web 1.x dist (`ort.min.js` + wasm binaries) |
| `models/sr_x3_lightB_240x360_fp16.onnx` | fp16 ONNX (primary; every tensor FP16, 99 KB) |
| `models/sr_x3_lightB_240x360_fp32.onnx` | fp32 twin, auto-fallback if an EP rejects fp16 |
| `convert_tflite_to_onnx.py` | TFLite → ONNX converter (fp16/fp32 preserved), with verification vs the TFLite model |
| `webnn_runner.js` | raw WebNN fallback: builds the graph with `navigator.ml` directly (no ORT wasm/jsep loader) |
| `export_webnn.py` | exports `models/webnn_weights_fp16.bin/.json` for the runner |
| `samples/*.png` | bundled test images (`gen_sample.py` regenerates them) |
| `gen_sample.py` | test-image generator (text, zone plate, checkerboards, circles, color patches; plus a smooth-gradients variant) |

When every ORT EP combo fails (e.g. the jsep `.mjs` loader cannot be
loaded), the app falls back to a **raw WebNN runner** that builds the same
graph with `navigator.ml.MLGraphBuilder` — conv2d/relu/mul/add/transpose/
reshape/resample2d only — so the NPU remains reachable with zero ORT
involvement. The status line shows `webnn-raw(npu)` when it engages.

The "Built-in sample" button loads `samples/sr_test_pattern_480x720.png`
(falls back to a procedural canvas image if the file is missing).

## Run

```
serve.bat        # or: python serve.py
```
then open `http://localhost:8123` (secure context / localhost is required
for WebGPU and WebNN). `serve.py` is required rather than
`python -m http.server`: it serves `.mjs` as `application/javascript`
(ORT's WebNN/WebGPU jsep loader imports
`ort-wasm-simd-threaded.jsep.mjs` dynamically, and browsers refuse
text/plain modules) and sets COOP/COEP so SharedArrayBuffer works for the
threaded WASM backend. Serve from the webapp root (the jsep import is
resolved against the document base URL).

### Access from other hosts

The default bind is `127.0.0.1` (loopback only). For LAN access:

```
python serve.py --host 0.0.0.0                  # http, LAN clients
python serve.py --https --host 0.0.0.0          # https + self-signed cert
```

- Allow inbound TCP on the port in Windows Defender Firewall.
- **Use `--https` for remote clients if you want WebNN/WebGPU**: browsers
  only treat `localhost` as a secure context over plain http, so a remote
  client on plain http silently drops to the WASM EP (`navigator.ml` /
  WebGPU are unavailable). With `--https`, a self-signed cert
  (`cert.pem`/`key.pem`, auto-generated on first run) makes the origin
  secure; clients must accept the certificate warning once.
- If the client browser routes LAN addresses through a proxy (e.g. a
  corporate PAC), add a bypass for the server's IP.

- Edge or Chrome on Windows: WebNN is available (DirectML backend) — the app
  prefers it and falls back to WebGPU, then WASM.
- **NPU**: select NPU (or Auto) in the Device dropdown — the app passes
  `deviceType: 'npu'` to the WebNN EP, which maps to the DirectML NPU
  device. Requirements: Windows 11 24H2+, an NPU with its driver installed,
  and a recent Edge/Chrome build with WebNN. The stats line shows a probe
  result ("NPU exposed" / "WebNN ok, NPU not exposed" / "no navigator.ml")
  so you can tell what the browser actually sees. Verify NPU utilization in
  Task Manager (NPU graph) while running.
- The fp16 model loads first; if an EP rejects fp16 tensors, the fp32 twin
  is used automatically.

## Model pipeline

`sr_x3_lightB_240x360_nhwc_fp16.tflite` → `convert_tflite_to_onnx.py
--expand-d2s` → ONNX (opset 17, same I/O contract `[1,240,360,1]` →
`[1,720,1080,1]`):

- entry/exit `Transpose` (TFLite NHWC ↔ ONNX NCHW)
- 7× `Conv` (SAME-pad arithmetic recomputed; filters [co,kh,kw,ci] → [co,ci,kh,kw])
- PReLU as the algebraic expansion `a·x + (1−a)·relu(x)` (Relu/Mul/Add) —
  every op has solid fp16 kernels on all EPs; ORT's own fp16 PRelu
  decomposition failed shape inference, hence the expansion
- 2× `DepthToSpace` expanded to Reshape→Transpose→Reshape (WebNN has no
  DepthToSpace). The channel decomposition matches TFLite's actual
  semantics: `k = c + C_out·(Δx + b·Δy)` with perm `[0,3,4,1,5,2]` —
  determined empirically against ORT's native DCR op (the ONNX-spec DCR
  formula does not match what ORT/TFLite compute)
- 1× `Resize` (linear, half-pixel), 3× `Add` (residual fuses + U+R synthesis)

Verification: output matches the TFLite fp32 reference with
max_abs_diff ≈ 0.0008 (fp16 rounding) on random input.
