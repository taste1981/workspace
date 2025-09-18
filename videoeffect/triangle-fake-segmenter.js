let cachedImageData;

async function createBlurryTriangleMask(inputImageData) {
  function sub(v1, v2) {
    return { x: v1.x - v2.x, y: v1.y - v2.y };
  }
  function dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }
  function lengthSq(v) {
    return dot(v, v);
  }
  function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
  }
  function cross2D(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  }

  /**
   * Calculates the squared distance from point 'p' to the line segment 'a'-'b'.
   */
  function distToSegmentSq(p, a, b) {
    const pa = sub(p, a);
    const ba = sub(b, a);
    // Project 'pa' onto 'ba', clamp the result 'h' to [0, 1] to stay on the segment
    const h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    // Vector from the projected point on the segment back to 'p'
    const diff = sub(pa, { x: ba.x * h, y: ba.y * h });
    // Return the squared length of that difference vector
    return lengthSq(diff);
  }

  /**
   * Calculates the Signed Distance Field (SDF) for a 2D triangle.
   * Assumes vertices a, b, c are given in Counter-Clockwise (CCW) order.
   * Returns negative distance if inside, positive distance if outside.
   */
  function sdfTriangle(p, a, b, c) {
    // Edge vectors (CCW)
    const e0 = sub(b, a);
    const e1 = sub(c, b);
    const e2 = sub(a, c);

    // Vectors from vertices to point p
    const v0 = sub(p, a);
    const v1 = sub(p, b);
    const v2 = sub(p, c);

    // Calculate squared distances to each line segment
    const pq0_sq = distToSegmentSq(p, a, b);
    const pq1_sq = distToSegmentSq(p, b, c);
    const pq2_sq = distToSegmentSq(p, c, a);

    // Find the minimum distance (unsigned) to the triangle boundary
    const minDistSq = Math.min(pq0_sq, pq1_sq, pq2_sq);
    const dist = Math.sqrt(minDistSq);

    // Determine the sign (inside/outside)
    // Using the 2D cross-product "sign test".
    // If p is on the same side of all edges, it's inside.
    const s0 = cross2D(e0, v0);
    const s1 = cross2D(e1, v1);
    const s2 = cross2D(e2, v2);

    const isInside = (s0 >= 0 && s1 >= 0 && s2 >= 0) ||
      (s0 <= 0 && s1 <= 0 && s2 <= 0);

    return isInside ? -dist : dist;
  }
  const width = inputImageData.width;
  const height = inputImageData.height;

  // Create a new ImageData object for the output mask.
  const outputMaskData = cachedImageData ?
    cachedImageData : new ImageData(width, height);
  cachedImageData = outputMaskData;

  const outData = outputMaskData.data; // This is a Uint8ClampedArray

  // Define the triangle vertices (ensure they are Counter-Clockwise)
  const pA = { x: width * 0.5, y: height * 0.2 }; // Top-center
  const pB = { x: width * 0.2, y: height * 0.85 }; // Bottom-left
  const pC = { x: width * 0.8, y: height * 0.85 }; // Bottom-right

  // Define the blur "thickness". A larger value creates a softer edge.
  const blurRadius = Math.min(width, height) * 0.02; // 8% of smallest dimension
  const blurDiameter = blurRadius * 2.0;

  let currentPixelPos = { x: 0, y: 0 };

  // Iterate over every pixel
  for (let y = 0; y < height; y++) {
    currentPixelPos.y = y;
    for (let x = 0; x < width; x++) {
      currentPixelPos.x = x;

      const dist = sdfTriangle(currentPixelPos, pA, pB, pC);
      const normIntensity = clamp(0.5 - dist / blurDiameter, 0.0, 1.0);
      const maskValue = dist < 0 ? 255 : normIntensity * 255;

      // 4. Write the value to the output ImageData
      const idx = (y * width + x) * 4;

      // Conditionally, only R or B are used.
      outData[idx + 0] = maskValue; // Store mask in the R (Red) component
      outData[idx + 1] = 0;         // Set G to 0
      outData[idx + 2] = maskValue; // Set B to 0
      outData[idx + 3] = 255;       // Set Alpha to fully opaque
    }
  }
  return outputMaskData;
}