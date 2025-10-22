// Copyright (C) <2025> Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

import { WebGLBlur } from './webgl-blur.js';

// Helper function to create WebGL program
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

// WebGL2 blur renderer
export async function createWebGL2BlurRenderer(segmenter) {
    // Create a separate canvas for WebGL2 processing at full resolution
    const webglCanvas = new OffscreenCanvas(1280, 720);
    // Always use full video resolution for processing, regardless of display size
    
    const gl = webglCanvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 not supported');

    const blurrer = new WebGLBlur(gl);
    blurrer.init();

    // --- Resurser för nedskalning till segmenteringsstorlek ---
    const segmentationWidth = 256;
    const segmentationHeight = 144;
    const downscaleFramebuffer = gl.createFramebuffer();
    const downscaleTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, downscaleTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, segmentationWidth, segmentationHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, downscaleFramebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, downscaleTexture, 0);

    const fboStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (fboStatus !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Downscale Framebuffer is not complete: ' + fboStatus);
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    const downscaleVertexShaderSource = `#version 300 es
      in vec2 a_position; in vec2 a_texCoord; out vec2 v_texCoord; void main() { gl_Position = vec4(a_position, 0.0, 1.0); v_texCoord = a_texCoord; }`;
    const downscaleFragmentShaderSource = `#version 300 es
      precision highp float; in vec2 v_texCoord; out vec4 fragColor; uniform sampler2D u_image; void main() { fragColor = texture(u_image, vec2(v_texCoord.x, 1.0 - v_texCoord.y)); }`;
    
    const downscaleProgram = createProgram(gl, downscaleVertexShaderSource, downscaleFragmentShaderSource);
    if (!downscaleProgram) {
        throw new Error("Failed to create downscale program");
    }
    const downscalePositionLocation = gl.getAttribLocation(downscaleProgram, 'a_position');
    const downscaleTexCoordLocation = gl.getAttribLocation(downscaleProgram, 'a_texCoord');
    const downscaleImageLocation = gl.getUniformLocation(downscaleProgram, 'u_image');
    // --- Slut på nedskalningsresurser ---
    
    // Set up geometry and buffers
    const positions = new Float32Array([
      -1, -1, 0, 1,  // Bottom-left: flipped Y texture coordinate
       1, -1, 1, 1,  // Bottom-right: flipped Y texture coordinate
      -1,  1, 0, 0,  // Top-left: flipped Y texture coordinate
       1,  1, 1, 0,  // Top-right: flipped Y texture coordinate
    ]);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    // Create textures
    const videoTexture = gl.createTexture();
    const maskTexture = gl.createTexture();
    
    return {
      render: async (videoFrame) => {
        const processingWidth = videoFrame.displayWidth || 1280;
        const processingHeight = videoFrame.displayHeight || 720;
        if (webglCanvas.width !== processingWidth || webglCanvas.height !== processingHeight) {
          webglCanvas.width = processingWidth;
          webglCanvas.height = processingHeight;
        }

        // Downscale
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoFrame);

        gl.bindFramebuffer(gl.FRAMEBUFFER, downscaleFramebuffer);
        gl.viewport(0, 0, segmentationWidth, segmentationHeight);
        gl.useProgram(downscaleProgram);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.enableVertexAttribArray(downscalePositionLocation);
        gl.vertexAttribPointer(downscalePositionLocation, 2, gl.FLOAT, false, 16, 0);
        gl.enableVertexAttribArray(downscaleTexCoordLocation);
        gl.vertexAttribPointer(downscaleTexCoordLocation, 2, gl.FLOAT, false, 16, 8);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
        gl.uniform1i(downscaleImageLocation, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        const pixelData = new Uint8ClampedArray(segmentationWidth * segmentationHeight * 4);
        gl.readPixels(0, 0, segmentationWidth, segmentationHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        const downscaledImageData = new ImageData(pixelData, segmentationWidth, segmentationHeight);

        // Segment
        const maskImageData = await segmenter.segment(downscaledImageData);

        // Upload mask texture
        gl.bindTexture(gl.TEXTURE_2D, maskTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskImageData);

        blurrer.setInputDimensions(processingWidth, processingHeight);
        blurrer.blur(videoTexture, maskTexture, null, 360);
        
        // Create a new VideoFrame from the processed WebGL canvas
        const processedFrame = new VideoFrame(webglCanvas, {
            timestamp: videoFrame.timestamp,
            duration: videoFrame.duration
        });

        return processedFrame;
      }
    };
}