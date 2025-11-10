// Copyright (C) <2025> Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

import { SelfieSegmentationLandscape } from "./selfie-segmentation-landscape.js";

export class WebNNSegmenter {
  constructor({ deviceType, layout = 'nhwc', webGpuDevice = null }) {
    this.deviceType = deviceType;
    this.layout = layout;
    this.webGpuDevice = webGpuDevice;
    this.selfieSegmentation = new SelfieSegmentationLandscape({
      deviceType,
      dataType: 'float16',
      layout,
      weightsUrlPrefix: 'blur4/',
    });
    console.log('Compiling WebNN SelfieSegmentation model for', deviceType, 'with layout', layout);
    this.built = this.selfieSegmentation.load({ webGpuDevice })
      .then(graph => this.selfieSegmentation.build(graph))
      .then(() => console.log('Compiled WebNN SelfieSegmentation model'));
  }

  async segment(imageData) {
    await this.built;
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
    console.assert(this.webGpuDevice !== null);
    await this.built;
    return this.selfieSegmentation.getInputBuffer();
  }

  async getOutputBuffer(device) {
    console.assert(this.webGpuDevice !== null);
    await this.built;
    return this.selfieSegmentation.getOutputBuffer();
  }

  async segmentGPUBuffer() {
    console.assert(this.webGpuDevice !== null);
    await this.built;
    await this.selfieSegmentation.compute();
  }
}
