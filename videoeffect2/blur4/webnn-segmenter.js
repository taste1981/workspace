// Copyright (C) <2025> Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

import { SelfieSegmentationLandscape } from "./selfie-segmentation-landscape.js";

export class WebNNSegmenter {
  constructor(deviceType, layout = 'nhwc') {
    this.deviceType = deviceType;
    this.layout = layout;
    this.selfieSegmentation = new SelfieSegmentationLandscape({
      deviceType,
      dataType: 'float16',
      layout,
      weightsUrlPrefix: 'blur4/',
    });
    this.built = false;
  }

  async segment(imageData) {
    if (!this.built) {
      const graph = await this.selfieSegmentation.load()
      await this.selfieSegmentation.build(graph);
      this.built = true;
    }
    const { data, width, height } = imageData;
    const pixels = width * height;
    const inputArray = new Float16Array(pixels * 3);
    for (let i = 0, p = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      if (this.layout === 'nhwc') {
        inputArray[p++] = r;
        inputArray[p++] = g;
        inputArray[p++] = b;
      } else {
        inputArray[p] = r;
        inputArray[p + pixels] = g;
        inputArray[p + pixels * 2] = b;
        p++;
      }
    }
    const result = await this.selfieSegmentation.compute(inputArray);
    const img = new ImageData(width, height);
    const dst = img.data;
    for (let i = 0, p = 0; i < dst.length; i += 4) {
      const v = Math.max(0, Math.min(1, result[p++])) * 255;
      dst[i] = dst[i + 1] = dst[i + 2] = dst[i + 3] = Math.round(v);
    }
    return img;
  }

  async getInputBuffer(device) {
    if (!this.built) {
      const graph = await this.selfieSegmentation.load({ gpuDevice: device });
      await this.selfieSegmentation.build(graph);
      this.built = true;
    }
    return this.selfieSegmentation.getInputBuffer();
  }

  async segmentGPUBuffer(width, height) {
    console.assert(this.built);
    const result = await this.selfieSegmentation.compute();
    const img = new ImageData(width, height);
    const dst = img.data;
    for (let i = 0, p = 0; i < dst.length; i += 4) {
      const v = Math.max(0, Math.min(1, result[p++])) * 255;
      dst[i] = dst[i + 1] = dst[i + 2] = dst[i + 3] = Math.round(v);
    }
    return img;
  }
}
