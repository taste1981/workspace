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

function renderWithWebGL2(gl, program, videoFrame, maskImageData, resources) {
    const { positionBuffer, videoTexture, maskTexture, 
            positionLocation, texCoordLocation, imageLocation, 
            maskLocation, resolutionLocation, blurAmountLocation, webglCanvas } = resources;
    
    // Always process at full video resolution, ignore display size
    const processingWidth = videoFrame.displayWidth || 1280;
    const processingHeight = videoFrame.displayHeight || 720;
    
    // Update canvas size only if video resolution actually changed
    if (webglCanvas.width !== processingWidth || webglCanvas.height !== processingHeight) {
      webglCanvas.width = processingWidth;
      webglCanvas.height = processingHeight;
    }
    
    gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
    gl.useProgram(program);
    
    // Update video texture
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Update mask texture
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskImageData);
    
    // Set up vertex attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);
    
    // Set uniforms
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, videoTexture);
    gl.uniform1i(imageLocation, 0);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.uniform1i(maskLocation, 1);
    
    gl.uniform2f(resolutionLocation, webglCanvas.width, webglCanvas.height);
    gl.uniform1f(blurAmountLocation, 6.0); // Blur amount
    
    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// WebGL2 blur renderer
export async function createWebGL2BlurRenderer(segmenterFunction) {
    // Create a separate canvas for WebGL2 processing at full resolution
    const webglCanvas = new OffscreenCanvas(1280, 720);
    // Always use full video resolution for processing, regardless of display size
    
    const gl = webglCanvas.getContext('webgl2');
    if (!gl) throw new Error('WebGL2 not supported');

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

    // Simple blur implementation using WebGL2
    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      out vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 fragColor;
      uniform sampler2D u_image;
      uniform sampler2D u_mask;
      uniform vec2 u_resolution;
      uniform float u_blurAmount;
      
      vec4 blur(sampler2D image, vec2 uv, float amount) {
        vec4 color = vec4(0.0);
        float total = 0.0;
        for(int x = -4; x <= 4; x++) {
          for(int y = -4; y <= 4; y++) {
            vec2 offset = vec2(float(x), float(y)) * amount / u_resolution;
            float weight = 1.0 / (1.0 + length(vec2(x, y)));
            color += texture(image, uv + offset) * weight;
            total += weight;
          }
        }
        return color / total;
      }
      
      void main() {
        vec4 originalColor = texture(u_image, v_texCoord);
        vec4 blurredColor = blur(u_image, v_texCoord, u_blurAmount);
        float mask = texture(u_mask, v_texCoord).r;
        fragColor = mix(blurredColor, originalColor, mask);
      }
    `;

    // Create and compile shaders, program, etc.
    const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    
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
    
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    const imageLocation = gl.getUniformLocation(program, 'u_image');
    const maskLocation = gl.getUniformLocation(program, 'u_mask');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const blurAmountLocation = gl.getUniformLocation(program, 'u_blurAmount');
    
    return {
      render: async (videoFrame) => {
        // Downscale
        gl.bindTexture(gl.TEXTURE_2D, videoTexture);
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
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        const downscaledImageData = new ImageData(pixelData, segmentationWidth, segmentationHeight);

        // Segment
        const maskImageData = await segmenterFunction(downscaledImageData);

        // WebGL2 rendering implementation with actual blur effect
        renderWithWebGL2(gl, program, videoFrame, maskImageData, {
          positionBuffer, videoTexture, maskTexture,
          positionLocation, texCoordLocation, imageLocation, 
          maskLocation, resolutionLocation, blurAmountLocation,
          webglCanvas
        });
        
        // Create a new VideoFrame from the processed WebGL canvas
        const processedFrame = new VideoFrame(webglCanvas, {
            timestamp: videoFrame.timestamp,
            duration: videoFrame.duration
        });

        return processedFrame;
      }
    };
}