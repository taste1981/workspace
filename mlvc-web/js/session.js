// ORT session management with EP fallback chains.
// NPU: webnn {deviceType:'npu'} -> webgpu -> wasm
// GPU: webgpu -> wasm
// CPU: wasm
// The ort module is injectable so the same code runs in the browser (worker
// imports /ort/ort.all.mjs) and in Node (for the loopback parity tests).
let _ort = null;

export function setOrt(ort) {
  _ort = ort;
}

export const EP_CHAINS = {
  npu: [{ name: "webnn", deviceType: "npu" }, { name: "webgpu" }, { name: "wasm" }],
  gpu: [{ name: "webgpu" }, { name: "wasm" }],
  cpu: [{ name: "wasm" }],
};

export async function probeCapabilities() {
  const caps = {
    webnn: typeof navigator !== "undefined" && !!navigator.ml,
    webgpu: typeof navigator !== "undefined" && !!navigator.gpu,
    wasm: true,
    npuDeviceType: false,
  };
  if (caps.webnn) {
    try {
      const ctx = await navigator.ml.createContext({ deviceType: "npu" });
      caps.npuDeviceType = true;
      ctx.destroy?.();
    } catch {
      caps.npuDeviceType = false;
    }
  }
  return caps;
}

function epLabel(ep) {
  return ep?.name === "webnn" ? `webnn:${ep.deviceType ?? "default"}` : ep?.name ?? "unknown";
}

// Cache the NPU-context probe (navigator.ml.createContext({deviceType:'npu'})).
// If the browser rejects the NPU device type, we skip webnn:npu instead of
// letting ORT silently fall back to another device.
let _npuProbe = null;
async function npuContextSupported() {
  if (_npuProbe !== null) return _npuProbe;
  if (!(typeof navigator !== "undefined" && navigator.ml)) {
    _npuProbe = false;
    return false;
  }
  try {
    const ctx = await navigator.ml.createContext({ deviceType: "npu" });
    ctx.destroy?.();
    _npuProbe = true;
  } catch {
    _npuProbe = false;
  }
  return _npuProbe;
}

async function tryCreate(modelBytes, candidates, log) {
  const warnings = [];
  for (const ep of candidates) {
    try {
      if (ep.name === "webnn" && !(typeof navigator !== "undefined" && navigator.ml)) {
        warnings.push(`webnn skipped: WebNN API not available`);
        continue;
      }
      if (ep.name === "webnn" && ep.deviceType === "npu" && !(await npuContextSupported())) {
        warnings.push(
          "webnn:npu skipped: browser rejected createContext({deviceType:'npu'}) " +
            "(NPU device type needs a recent Edge/Chrome and an NPU driver)"
        );
        continue;
      }
      if (ep.name === "webgpu" && !(typeof navigator !== "undefined" && navigator.gpu)) {
        warnings.push("webgpu skipped: WebGPU not available");
        continue;
      }
      const session = await _ort.InferenceSession.create(modelBytes, {
        executionProviders: [ep],
        graphOptimizationLevel: "all",
      });
      log(`session created on ${epLabel(ep)}`);
      return { session, ep, warnings };
    } catch (e) {
      warnings.push(`${epLabel(ep)} failed: ${e?.message ?? e}`);
      log(warnings[warnings.length - 1]);
    }
  }
  throw new Error(`no execution provider available: ${warnings.join(" | ")}`);
}

// Create encoder + decoder sessions on the SAME resolved EP.
// modelDir: URL prefix, e.g. "/models/640x368"; loadModel(name) overrides the
// fetch for local (Node) loading.
export async function createSessions({ modelDir, device = "npu", log = console.log, loadModel }) {
  const chain = EP_CHAINS[device] ?? EP_CHAINS.cpu;
  const load = loadModel ?? ((name) => fetch(`${modelDir}/${name}`).then((r) => r.arrayBuffer()));
  const [encBytes, decBytes] = await Promise.all([load("MLVCEncoder.onnx"), load("MLVCDecoder.onnx")]);
  const enc = await tryCreate(encBytes, chain, log);
  const dec = await tryCreate(decBytes, [enc.ep], log); // same EP
  const warnings = [...enc.warnings, ...dec.warnings];
  return {
    encoder: wrapSession(enc.session),
    decoder: wrapSession(dec.session),
    actualEp: epLabel(enc.ep),
    warnings,
  };
}

function wrapSession(session) {
  // ort-web 1.30: inputMetadata is an ARRAY aligned with inputNames
  const inputMeta = {};
  session.inputNames.forEach((n, i) => {
    inputMeta[n] = Array.isArray(session.inputMetadata)
      ? session.inputMetadata[i]
      : session.inputMetadata[n];
  });
  return {
    inputNames: session.inputNames,
    inputMeta,
    async run(feeds) {
      const tensors = {};
      for (const [name, data] of Object.entries(feeds)) {
        const meta = inputMeta[name];
        if (!meta) throw new Error(`unknown model input: ${name}`);
        const shape = meta.shape ?? meta.dims;
        if (meta.type === "int32") {
          tensors[name] = new _ort.Tensor("int32", data, shape);
        } else {
          tensors[name] = new _ort.Tensor("float32", data, shape);
        }
      }
      const res = await session.run(tensors);
      const out = {};
      for (const [name, tensor] of Object.entries(res)) {
        out[name] = tensor.data; // Float32Array for fp32 graphs
      }
      return out;
    },
    async release() {
      await session.release();
    },
  };
}
