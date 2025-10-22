// Copyright 2025 Google LLC
//
// SPDX-License-Identifier: Apache-2.0

function createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function adjustSizeByResolution(resolution, width, height) {
  let newWidth, newHeight;
  if (width > height) {
    newWidth = Math.round(width * 1.0 / height * resolution);
    newWidth = ((newWidth + 2) >> 2) << 2;
    newHeight = resolution;
  } else {
    newHeight = Math.round(height * 1.0 / width * resolution);
    newHeight = ((newHeight + 2) >> 2) << 2;
    newWidth = resolution;
  }
  return { width: newWidth, height: newHeight };
}


export class WebGLBlur {
    constructor(gl) {
        this.gl = gl;
        this.programs = {};
        this.locations = {};
        this.resources = {};
        this.radius = 7;
        this.inputWidth = 0;
        this.inputHeight = 0;
        this.blurWidth = 0;
        this.blurHeight = 0;
    }

    setInputDimensions(width, height) {
        this.inputWidth = width;
        this.inputHeight = height;
    }

    init() {
        const gl = this.gl;
        this.kernel = this.calculateKernel(this.radius);
        this.k00 = this.kernel[0] * this.kernel[0];

        const vertexShaderSource = `#version 300 es
          in vec2 a_position;
          in vec2 a_texCoord;
          out vec2 v_texCoord;
          void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
            v_texCoord = a_texCoord;
          }
        `;

        const horizontalBlurShader = this.getBlurShader(true);
        this.programs.horizontal = createProgram(gl, vertexShaderSource, horizontalBlurShader);

        const verticalBlurShader = this.getBlurShader(false);
        this.programs.vertical = createProgram(gl, vertexShaderSource, verticalBlurShader);

        const blendShader = this.getBlendShader();
        this.programs.blend = createProgram(gl, vertexShaderSource, blendShader);

        this.locations.horizontal = {
            position: gl.getAttribLocation(this.programs.horizontal, 'a_position'),
            texCoord: gl.getAttribLocation(this.programs.horizontal, 'a_texCoord'),
            image: gl.getUniformLocation(this.programs.horizontal, 'u_image'),
            mask: gl.getUniformLocation(this.programs.horizontal, 'u_mask'),
            resolution: gl.getUniformLocation(this.programs.horizontal, 'u_resolution'),
        };

        this.locations.vertical = {
            position: gl.getAttribLocation(this.programs.vertical, 'a_position'),
            texCoord: gl.getAttribLocation(this.programs.vertical, 'a_texCoord'),
            image: gl.getUniformLocation(this.programs.vertical, 'u_image'),
            resolution: gl.getUniformLocation(this.programs.vertical, 'u_resolution'),
        };

        this.locations.blend = {
            position: gl.getAttribLocation(this.programs.blend, 'a_position'),
            texCoord: gl.getAttribLocation(this.programs.blend, 'a_texCoord'),
            image: gl.getUniformLocation(this.programs.blend, 'u_image'),
            blurred: gl.getUniformLocation(this.programs.blend, 'u_blurred'),
            mask: gl.getUniformLocation(this.programs.blend, 'u_mask'),
            k00: gl.getUniformLocation(this.programs.blend, 'u_k00'),
        };

        const positions = new Float32Array([
          -1, -1, 0, 1,
           1, -1, 1, 1,
          -1,  1, 0, 0,
           1,  1, 1, 0,
        ]);
        this.resources.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.resources.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    }

    calculateKernel(radius) {
        const kernel = new Array(radius + 1).fill(0.0);
        kernel[0] = 1.0;
        let kernelSum = kernel[0];
        const coeff = -2.0 / (radius * radius);
        for (let i = 1; i < kernel.length; ++i) {
            kernel[i] = Math.exp(coeff * i * i);
            kernelSum += 2.0 * kernel[i];
        }
        return kernel.map(v => v / kernelSum);
    }

    getBlurShader(isHorizontal) {
        const radius = this.radius;

        if (isHorizontal) {
            let unrolledLoop = '';
            for (let i = 1; i <= radius; ++i) {
                unrolledLoop += `
                    {
                        vec2 coord1 = v_texCoord + offset;
                        float w1 = ${this.kernel[i].toPrecision(8)} * (1.0 - texture(u_mask, coord1).r);
                        vec4 sample1 = texture(u_image, coord1);
                        color += sample1 * w1;

                        vec2 coord2 = v_texCoord - offset;
                        float w2 = ${this.kernel[i].toPrecision(8)} * (1.0 - texture(u_mask, coord2).r);
                        vec4 sample2 = texture(u_image, coord2);
                        color += sample2 * w2;

                        offset += step;
                    }
                `;
            }
            return `#version 300 es
              precision highp float;
              in vec2 v_texCoord;
              out vec4 fragColor;

              uniform sampler2D u_image;
              uniform sampler2D u_mask;
              uniform vec2 u_resolution;

              void main() {
                  vec2 texelSize = 1.0 / u_resolution;
                  float alpha = 1.0 - texture(u_mask, v_texCoord).r;
                  vec2 step = texelSize * vec2(1.0, 0.0) * alpha;
                  vec2 offset = step;
                  
                  vec4 color = texture(u_image, v_texCoord);
                  float weight = ${this.kernel[0].toPrecision(8)} * alpha;
                  color *= weight;

                  ${unrolledLoop}
                  
                  fragColor = color;
              }`;
        } else { // Vertical
            let unrolledLoop = '';
            for (let i = 1; i <= radius; ++i) {
                unrolledLoop += `
                    {
                        colorAndWeight += texture(u_image, v_texCoord + offset) * ${this.kernel[i].toPrecision(8)};
                        colorAndWeight += texture(u_image, v_texCoord - offset) * ${this.kernel[i].toPrecision(8)};
                        offset += step;
                    }
                `;
            }
            return `#version 300 es
              precision highp float;
              in vec2 v_texCoord;
              out vec4 fragColor;

              uniform sampler2D u_image; // This is the output of horizontal pass
              uniform vec2 u_resolution;

              void main() {
                  vec2 texelSize = 1.0 / u_resolution;
                  vec2 step = texelSize * vec2(0.0, 1.0);
                  vec2 offset = step;
                  
                  vec4 colorAndWeight = texture(u_image, v_texCoord) * ${this.kernel[0].toPrecision(8)};

                  ${unrolledLoop}
                  
                  fragColor = colorAndWeight;
              }`;
        }
    }

    getBlendShader() {
        return `#version 300 es
          precision highp float;
          in vec2 v_texCoord;
          out vec4 fragColor;

          uniform sampler2D u_image; // original
          uniform sampler2D u_blurred; // from vertical pass
          uniform sampler2D u_mask;
          uniform float u_k00;

          void main() {
              float mask = texture(u_mask, v_texCoord).r;
              vec4 originalColor = texture(u_image, v_texCoord);
              vec4 blurredColorAndWeight = texture(u_blurred, v_texCoord);
              
              blurredColorAndWeight += (u_k00 * mask) * originalColor;
              
              vec4 blurredColor;
              if (blurredColorAndWeight.a > 0.0) {
                  blurredColor = vec4(blurredColorAndWeight.rgb / blurredColorAndWeight.a, 1.0);
              } else {
                  blurredColor = vec4(0.0, 0.0, 0.0, 1.0);
              }
              
              fragColor = mix(blurredColor, originalColor, mask);
          }`;
    }

    blur(inputTexture, maskTexture, outputFramebuffer, resolution) {
        const gl = this.gl;
        const { width: blurWidth, height: blurHeight } = adjustSizeByResolution(resolution, this.inputWidth, this.inputHeight);

        if (this.blurWidth !== blurWidth || this.blurHeight !== blurHeight) {
            this.blurWidth = blurWidth;
            this.blurHeight = blurHeight;
            this.recreateIntermediateTextures(blurWidth, blurHeight);
        }

        // Setup vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.resources.positionBuffer);
        
        // Horizontal pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.resources.horizontalFramebuffer);
        gl.viewport(0, 0, blurWidth, blurHeight);
        gl.useProgram(this.programs.horizontal);
        gl.enableVertexAttribArray(this.locations.horizontal.position);
        gl.vertexAttribPointer(this.locations.horizontal.position, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(this.locations.horizontal.texCoord);
        gl.vertexAttribPointer(this.locations.horizontal.texCoord, 2, gl.FLOAT, false, 16, 8);
        gl.uniform2f(this.locations.horizontal.resolution, blurWidth, blurHeight);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(this.locations.horizontal.image, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, maskTexture);
        gl.uniform1i(this.locations.horizontal.mask, 1);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Vertical pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.resources.blurredFramebuffer);
        gl.viewport(0, 0, blurWidth, blurHeight);
        gl.useProgram(this.programs.vertical);
        gl.enableVertexAttribArray(this.locations.vertical.position);
        gl.vertexAttribPointer(this.locations.vertical.position, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(this.locations.vertical.texCoord);
        gl.vertexAttribPointer(this.locations.vertical.texCoord, 2, gl.FLOAT, false, 16, 8);
        gl.uniform2f(this.locations.vertical.resolution, blurWidth, blurHeight);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.resources.horizontalTexture);
        gl.uniform1i(this.locations.vertical.image, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Blend pass
        gl.bindFramebuffer(gl.FRAMEBUFFER, outputFramebuffer);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.useProgram(this.programs.blend);
        gl.enableVertexAttribArray(this.locations.blend.position);
        gl.vertexAttribPointer(this.locations.blend.position, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(this.locations.blend.texCoord);
        gl.vertexAttribPointer(this.locations.blend.texCoord, 2, gl.FLOAT, false, 16, 8);
        gl.uniform1f(this.locations.blend.k00, this.k00);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        gl.uniform1i(this.locations.blend.image, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.resources.blurredTexture);
        gl.uniform1i(this.locations.blend.blurred, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, maskTexture);
        gl.uniform1i(this.locations.blend.mask, 2);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    recreateIntermediateTextures(blurWidth, blurHeight) {
        const gl = this.gl;

        if (this.resources.horizontalTexture) gl.deleteTexture(this.resources.horizontalTexture);
        if (this.resources.horizontalFramebuffer) gl.deleteFramebuffer(this.resources.horizontalFramebuffer);
        if (this.resources.blurredTexture) gl.deleteTexture(this.resources.blurredTexture);
        if (this.resources.blurredFramebuffer) gl.deleteFramebuffer(this.resources.blurredFramebuffer);

        this.resources.horizontalTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.resources.horizontalTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, blurWidth, blurHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.resources.horizontalFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.resources.horizontalFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.resources.horizontalTexture, 0);

        this.resources.blurredTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.resources.blurredTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, blurWidth, blurHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        this.resources.blurredFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.resources.blurredFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.resources.blurredTexture, 0);
    }
}
