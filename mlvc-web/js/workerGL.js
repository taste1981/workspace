// Worker-side WebGL2 (OffscreenCanvas): all remaining pixel work runs in
// shaders — the byte->float [Y,U,V] tensor assembly, the decoder-output->RGB
// display conversion, and the PSNR reduction.
//
// Layout convention: model planes are stored plane-major in an R32F texture of
// size (modelW, 3*modelH): rows [0, modelH) = Y, [modelH, 2*modelH) = U,
// [2*modelH, 3*modelH) = V. Row 0 of every buffer/texture = the TOP row of the
// frame (the capture side already cancels the GL flip conventions), so no flips
// are needed anywhere on this side.

const VERT = `#version 300 es
  layout(location = 0) in vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }`;

// Scatter: byte Y (R8) + interleaved U/V (RG8) at model dims -> plane-major
// R32F (modelW, 3*modelH). Output pixel (i, j): plane = j / modelH.
const SCATTER_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_y;    // R8
  uniform sampler2D u_uv;   // RG8 (interleaved U/V, full res)
  uniform int u_modelH;
  out vec4 outColor;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    int plane = p.y / u_modelH;
    int row = p.y - plane * u_modelH;
    float v;
    if (plane == 0) {
      v = texelFetch(u_y, ivec2(p.x, row), 0).r;
    } else {
      vec2 uv = texelFetch(u_uv, ivec2(p.x, row), 0).rg;
      v = plane == 1 ? uv.r : uv.g;
    }
    outColor = vec4(v, 0.0, 0.0, 0.0);
  }`;

// Decoder output (plane-major R32F) -> RGBA8 at VIDEO dims. BT.709 inverse,
// clipped. framebuffer row 0 must show the video TOP row so the readback is
// top-down: sample the same row index (no flip — the convention already cancels).
const DISPLAY_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_tex;   // plane-major R32F (modelW, 3*modelH)
  uniform int u_modelH;
  out vec4 outColor;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    float y = texelFetch(u_tex, ivec2(p.x, p.y), 0).r;
    float cb = texelFetch(u_tex, ivec2(p.x, u_modelH + p.y), 0).r;
    float cr = texelFetch(u_tex, ivec2(p.x, 2 * u_modelH + p.y), 0).r;
    float r = clamp(y + 1.5748 * (cr - 0.5), 0.0, 1.0);
    float b = clamp(y + 1.8556 * (cb - 0.5), 0.0, 1.0);
    float g = clamp((y - 0.2126 * r - 0.0722 * b) / 0.7152, 0.0, 1.0);
    outColor = vec4(r, g, b, 1.0);
  }`;

// PSNR reduction: per-tile sums of squared differences, chroma on the 420 grid
// (2x2 block averages — parity with the Python reference). Output RGBA32F 16x16:
// r = sumY, g = sumU, b = sumV (w counts implied: pixels n, blocks n/4).
const PSNR_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_orig;   // plane-major R32F
  uniform sampler2D u_rec;    // plane-major R32F
  uniform ivec2 u_model;      // modelW, modelH
  uniform int u_pixels;       // n = modelW * modelH
  uniform int u_blocks;       // n / 4
  out vec4 outColor;

  float fetchOrig(int plane, ivec2 p) {
    return texelFetch(u_orig, ivec2(p.x, plane * u_model.y + p.y), 0).r;
  }
  float fetchRec(int plane, ivec2 p) {
    return texelFetch(u_rec, ivec2(p.x, plane * u_model.y + p.y), 0).r;
  }

  void main() {
    int idx = int(gl_FragCoord.y * 16.0 + gl_FragCoord.x);
    float sY = 0.0, sU = 0.0, sV = 0.0;
    int hw = u_model.x / 2;

    for (int p = idx; p < u_pixels; p += 256) {
      ivec2 xy = ivec2(p % u_model.x, p / u_model.x);
      float d = fetchOrig(0, xy) - fetchRec(0, xy);
      sY += d * d;
    }

    for (int b = idx; b < u_blocks; b += 256) {
      ivec2 blk = ivec2(b % hw, b / hw);
      ivec2 p00 = blk * 2;
      float ou = (fetchOrig(1, p00) + fetchOrig(1, p00 + ivec2(1, 0)) +
                  fetchOrig(1, p00 + ivec2(0, 1)) + fetchOrig(1, p00 + ivec2(1, 1))) * 0.25;
      float ru = (fetchRec(1, p00) + fetchRec(1, p00 + ivec2(1, 0)) +
                  fetchRec(1, p00 + ivec2(0, 1)) + fetchRec(1, p00 + ivec2(1, 1))) * 0.25;
      float ov = (fetchOrig(2, p00) + fetchOrig(2, p00 + ivec2(1, 0)) +
                  fetchOrig(2, p00 + ivec2(0, 1)) + fetchOrig(2, p00 + ivec2(1, 1))) * 0.25;
      float rv = (fetchRec(2, p00) + fetchRec(2, p00 + ivec2(1, 0)) +
                  fetchRec(2, p00 + ivec2(0, 1)) + fetchRec(2, p00 + ivec2(1, 1))) * 0.25;
      float du = ou - ru;
      float dv = ov - rv;
      sU += du * du;
      sV += dv * dv;
    }

    outColor = vec4(sY, sU, sV, 0.0);
  }`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`workerGL shader compile failed: ${gl.getShaderInfoLog(sh)}`);
  }
  return sh;
}

function makeProgram(gl, fsSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`workerGL program link failed: ${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

function makeFbo(gl, w, h, internalFormat, format, type, filter = gl.NEAREST) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`workerGL FBO incomplete (0x${status.toString(16)})`);
  }
  return { tex, fbo };
}

export function createWorkerGL() {
  let canvas;
  try {
    canvas = new OffscreenCanvas(8, 8);
  } catch {
    return null;
  }
  const gl = canvas.getContext("webgl2", { antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  // R32F color attachments are not core-renderable — require the extension
  // (near-universal on desktop Chromium/ANGLE); otherwise the CPU path takes over.
  if (!gl.getExtension("EXT_color_buffer_float")) return null;

  const scatterProg = makeProgram(gl, SCATTER_FS);
  const displayProg = makeProgram(gl, DISPLAY_FS);
  const psnrProg = makeProgram(gl, PSNR_FS);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  let modelW = 0;
  let modelH = 0;
  let videoW = 0;
  let videoH = 0;
  let yTex = null;
  let uvTex = null;
  let planeTex = null; // R32F (modelW, 3*modelH), plane-major
  let planeFbo = null;
  let recTex = null; // R32F, same layout (x_hat upload)
  let recFbo = null;
  let displayFbo = null; // RGBA8 video dims
  let psnrFbo = null; // RGBA32F 16x16

  function configure(mw, mh, vw, vh) {
    modelW = mw;
    modelH = mh;
    videoW = vw;
    videoH = vh;
    yTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, yTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, mw, mh);
    uvTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, uvTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG8, mw, mh);
    planeFbo = makeFbo(gl, mw, 3 * mh, gl.R32F, gl.RED, gl.FLOAT);
    planeTex = planeFbo.tex;
    recFbo = makeFbo(gl, mw, 3 * mh, gl.R32F, gl.RED, gl.FLOAT);
    recTex = recFbo.tex;
    displayFbo = makeFbo(gl, vw, vh, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, gl.NEAREST);
    psnrFbo = makeFbo(gl, 16, 16, gl.RGBA32F, gl.RGBA, gl.FLOAT, gl.NEAREST);
  }

  function draw(prog, fbo, vw, vh) {
    gl.useProgram(prog);
    gl.bindVertexArray(vao);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, vw, vh);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    ok: true,

    configure,

    // bytes -> interleaved [Y,U,V] Float32 tensor at model dims (GPU scatter)
    planesToX(yBytes, uvBytes) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, yTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, modelW, modelH, gl.RED, gl.UNSIGNED_BYTE, yBytes);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, uvTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, modelW, modelH, gl.RG, gl.UNSIGNED_BYTE, uvBytes);

      gl.useProgram(scatterProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, yTex);
      gl.uniform1i(gl.getUniformLocation(scatterProg, "u_y"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, uvTex);
      gl.uniform1i(gl.getUniformLocation(scatterProg, "u_uv"), 1);
      gl.uniform1i(gl.getUniformLocation(scatterProg, "u_modelH"), modelH);
      draw(scatterProg, planeFbo.fbo, modelW, 3 * modelH);

      gl.bindFramebuffer(gl.FRAMEBUFFER, planeFbo.fbo);
      const out = new Float32Array(modelW * modelH * 3);
      gl.readPixels(0, 0, modelW, 3 * modelH, gl.RED, gl.FLOAT, out);
      return out;
    },

    // decoder output x_hat (Float32, plane-major at model dims) -> RGBA8 at video
    // dims, top-down in the readback (putImageData-ready)
    xHatToRgba(xHat) {
      gl.bindTexture(gl.TEXTURE_2D, recTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, modelW, 3 * modelH, gl.RED, gl.FLOAT, xHat);

      gl.useProgram(displayProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, recTex);
      gl.uniform1i(gl.getUniformLocation(displayProg, "u_tex"), 0);
      gl.uniform1i(gl.getUniformLocation(displayProg, "u_modelH"), modelH);
      draw(displayProg, displayFbo.fbo, videoW, videoH);

      gl.bindFramebuffer(gl.FRAMEBUFFER, displayFbo.fbo);
      const rgba = new Uint8Array(videoW * videoH * 4);
      gl.readPixels(0, 0, videoW, videoH, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
      return rgba;
    },

    // orig/rec tensors (Float32, plane-major) -> per-plane PSNR on the 420 grid
    psnrStats(origX, recX) {
      // upload rec into the rec texture; orig is the capture-side scatter output
      gl.bindTexture(gl.TEXTURE_2D, planeTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, modelW, 3 * modelH, gl.RED, gl.FLOAT, origX);
      gl.bindTexture(gl.TEXTURE_2D, recTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, modelW, 3 * modelH, gl.RED, gl.FLOAT, recX);

      gl.useProgram(psnrProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, planeTex);
      gl.uniform1i(gl.getUniformLocation(psnrProg, "u_orig"), 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, recTex);
      gl.uniform1i(gl.getUniformLocation(psnrProg, "u_rec"), 1);
      gl.uniform2i(gl.getUniformLocation(psnrProg, "u_model"), modelW, modelH);
      gl.uniform1i(gl.getUniformLocation(psnrProg, "u_pixels"), modelW * modelH);
      gl.uniform1i(gl.getUniformLocation(psnrProg, "u_blocks"), (modelW * modelH) / 4);
      draw(psnrProg, psnrFbo.fbo, 16, 16);

      gl.bindFramebuffer(gl.FRAMEBUFFER, psnrFbo.fbo);
      const sums = new Float32Array(16 * 16 * 4);
      gl.readPixels(0, 0, 16, 16, gl.RGBA, gl.FLOAT, sums);
      let sY = 0;
      let sU = 0;
      let sV = 0;
      for (let i = 0; i < sums.length; i += 4) {
        sY += sums[i];
        sU += sums[i + 1];
        sV += sums[i + 2];
      }
      const n = modelW * modelH;
      const psnr = (mse) => {
        if (!Number.isFinite(mse)) return -999.9;
        if (mse < 1e-10) return 999.9;
        return -10 * Math.log10(mse);
      };
      const psnrY = psnr(sY / n);
      const psnrU = psnr(sU / (n / 4));
      const psnrV = psnr(sV / (n / 4));
      return { psnrY, psnrU, psnrV, psnr: (6 * psnrY + psnrU + psnrV) / 8 };
    },

    dispose() {
      // no loseContext — worker lives for the page lifetime
    },
  };
}
