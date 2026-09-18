// WebGL2 camera capture with full GPU adaptation to the MODEL input size:
//   1. cover-fit resize  : video -> RGBA texture at VIDEO dims (also drawn to the
//                          canvas, which shows the video-size frame)
//   2. Y plane           : video-size RGBA -> Y at MODEL dims (BT.709); rows/cols
//                          beyond the video rect edge-replicate in the shader
//                          (same semantics as np.pad mode='edge', bottom-right)
//   3. U/V planes (444)  : video-size RGBA -> full-res interleaved U/V at MODEL
//                          dims — chroma is the 2x2-box average of its block
//                          (nearest upsample x2, replacing the JS 420->444 step),
//                          blocks past the video rect replicate the last block
// readPixels returns planar Y (modelW*modelH) + full-res interleaved U/V
// (modelW*modelH*2) — the encoder's channel-first [Y,U,V] tensor is assembled
// from these without any CPU upsampling or padding.

const VERT = `#version 300 es
  layout(location = 0) in vec2 a_pos;
  layout(location = 1) in vec2 a_uv;
  out vec2 v_uv;
  void main() { v_uv = a_uv; gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const RESIZE_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_tex;
  in vec2 v_uv;
  out vec4 outColor;
  void main() { outColor = vec4(texture(u_tex, v_uv).rgb, 1.0); }`;

// Model-size Y plane; coordinates beyond the video rect clamp to the edge row/col.
const Y_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_tex;
  in vec2 v_uv;
  out vec4 outColor;
  void main() {
    ivec2 size = textureSize(u_tex, 0);
    ivec2 p = min(ivec2(gl_FragCoord.xy), size - 1);
    vec3 c = texelFetch(u_tex, p, 0).rgb;
    float y = clamp(0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, 0.0, 1.0);
    outColor = vec4(y, 0.0, 0.0, 1.0);
  }`;

// Full-res (444) interleaved U/V at MODEL dims. Each output pixel shows the
// 2x2-box-averaged chroma of its block (nearest upsample x2 — the same values
// the JS yuv420To444Nearest produced, but computed on the GPU), and blocks past
// the video rect replicate the last valid block (edge pad). cb/cr are affine in
// rgb, so the block average of per-pixel values equals the value of the averaged
// rgb (matches the JS semantics, which clip after the mean).
const UV444_FS = `#version 300 es
  precision highp float;
  uniform sampler2D u_tex;
  in vec2 v_uv;
  out vec4 outColor;
  void main() {
    ivec2 size = textureSize(u_tex, 0);
    ivec2 block = ivec2(gl_FragCoord.xy) >> 1; // 2x2 block of the 444 grid
    ivec2 p = min(block * 2, size - 2);        // clamp to last valid block
    vec4 c00 = texelFetch(u_tex, p, 0);
    vec4 c10 = texelFetch(u_tex, p + ivec2(1, 0), 0);
    vec4 c01 = texelFetch(u_tex, p + ivec2(0, 1), 0);
    vec4 c11 = texelFetch(u_tex, p + ivec2(1, 1), 0);
    vec4 avg = (c00 + c10 + c01 + c11) * 0.25;
    float y = 0.2126 * avg.r + 0.7152 * avg.g + 0.0722 * avg.b;
    float cb = clamp(0.5 * (avg.b - y) / 0.9278 + 0.5, 0.0, 1.0);
    float cr = clamp(0.5 * (avg.r - y) / 0.7874 + 0.5, 0.0, 1.0);
    outColor = vec4(cb, cr, 0.0, 1.0);
  }`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(`shader compile failed: ${gl.getShaderInfoLog(sh)}`);
  }
  return sh;
}

function makeProgram(gl, fsSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(prog)}`);
  }
  return prog;
}

function makeFbo(gl, w, h, internalFormat) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, internalFormat, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fbo };
}

// canvas: visible "camera input" display (video-size frame).
// (videoW, videoH): video frame size; (modelW, modelH): model input size.
export function createGLCapture(canvas, videoW, videoH, modelW, modelH) {
  const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return null;
  canvas.width = videoW;
  canvas.height = videoH;

  const resizeProg = makeProgram(gl, RESIZE_FS);
  const yProg = makeProgram(gl, Y_FS);
  const uvProg = makeProgram(gl, UV444_FS);

  const videoTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const rgba = makeFbo(gl, videoW, videoH, gl.RGBA8); // video-size intermediate
  const yfbo = makeFbo(gl, modelW, modelH, gl.R8); // model-size Y (full res)
  const uvfbo = makeFbo(gl, modelW, modelH, gl.RG8); // model-size interleaved U/V (444)

  // fullscreen quad
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const posBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const uvBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(8), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

  // readback buffers are transferred to the worker (which detaches them);
  // reallocate lazily when a transfer has detached the backing store
  let yBytes = new Uint8Array(modelW * modelH);
  let uvBytes = new Uint8Array(modelW * modelH * 2); // full-res interleaved U/V
  let rgbaBytes = new Uint8Array(videoW * videoH * 4);

  gl.pixelStorei(gl.PACK_ALIGNMENT, 1);

  function ensureReadbackBuffers() {
    if (yBytes.byteLength === 0) {
      yBytes = new Uint8Array(modelW * modelH);
      uvBytes = new Uint8Array(modelW * modelH * 2);
      rgbaBytes = new Uint8Array(videoW * videoH * 4);
    }
  }

  function drawTo(prog, tex, u0, v0, u1, v1, fbo, vw, vh) {
    gl.useProgram(prog);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, vw, vh);
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array([u0, v0, u1, v0, u0, v1, u1, v1]));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  return {
    // returns { y, uv } at MODEL dims (Uint8Arrays), or null when the video has
    // no frame yet; rgba (video dims, rows flipped to top-down) when requested
    capture(videoEl, wantRgba) {
      const tw = videoEl.videoWidth;
      const th = videoEl.videoHeight;
      if (!tw || !th) return null;
      ensureReadbackBuffers();

      // upload the video frame
      gl.bindTexture(gl.TEXTURE_2D, videoTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, videoEl);

      // cover-fit source crop into the VIDEO-size rect
      const scale = Math.max(videoW / tw, videoH / th);
      const sw = videoW / scale;
      const sh = videoH / scale;
      const u0 = 0.5 - sw / (2 * tw);
      const u1 = 0.5 + sw / (2 * tw);
      const v0 = 0.5 - sh / (2 * th);
      const v1 = 0.5 + sh / (2 * th);

      // pass 1: display (video dims) + video-size RGBA intermediate.
      // The video uploads with its first row at texture v=0, but GL framebuffer
      // row 0 is the canvas BOTTOM — an unflipped draw shows the frame upside
      // down. For the display, swap the v range (bottom of screen samples the
      // crop bottom). The rgba/FBO draw keeps the unflipped mapping; its
      // readPixels (bottom row first) then yields top-down rows, and the Y/UV
      // passes produce the upright codec planes.
      drawTo(resizeProg, videoTex, u0, v1, u1, v0, null, videoW, videoH);
      drawTo(resizeProg, videoTex, u0, v0, u1, v1, rgba.fbo, videoW, videoH);

      // passes 2-3: Y and full-res (444) U/V at MODEL dims (edge-replicated past
      // the video rect; chroma is nearest-upsampled x2 from its 2x2 blocks)
      drawTo(yProg, rgba.tex, 0, 0, 1, 1, yfbo.fbo, modelW, modelH);
      drawTo(uvProg, rgba.tex, 0, 0, 1, 1, uvfbo.fbo, modelW, modelH);

      gl.bindFramebuffer(gl.FRAMEBUFFER, yfbo.fbo);
      gl.readPixels(0, 0, modelW, modelH, gl.RED, gl.UNSIGNED_BYTE, yBytes);
      gl.bindFramebuffer(gl.FRAMEBUFFER, uvfbo.fbo);
      gl.readPixels(0, 0, modelW, modelH, gl.RG, gl.UNSIGNED_BYTE, uvBytes);

      let rgbaOut = null;
      if (wantRgba) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, rgba.fbo);
        gl.readPixels(0, 0, videoW, videoH, gl.RGBA, gl.UNSIGNED_BYTE, rgbaBytes);
        // the unflipped rgba draw puts the crop top at framebuffer row 0, and
        // readPixels returns row 0 first — so the rows are already top-down and
        // line up with the reconstructed frame for the diff view
        rgbaOut = new Uint8ClampedArray(rgbaBytes);
      }

      return { y: yBytes, uv: uvBytes, rgba: rgbaOut };
    },
    dispose() {
      // delete GL resources but do NOT lose the context — a lost context cannot
      // be recovered by a later getContext() on the same canvas
      gl.deleteFramebuffer(rgba.fbo);
      gl.deleteFramebuffer(yfbo.fbo);
      gl.deleteFramebuffer(uvfbo.fbo);
      gl.deleteTexture(rgba.tex);
      gl.deleteTexture(yfbo.tex);
      gl.deleteTexture(uvfbo.tex);
      gl.deleteTexture(videoTex);
      gl.deleteProgram(resizeProg);
      gl.deleteProgram(yProg);
      gl.deleteProgram(uvProg);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(uvBuf);
      gl.deleteVertexArray(vao);
    },
  };
}
