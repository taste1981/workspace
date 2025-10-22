export class MediaPipeSegmenter {
  constructor() {
    self.segmenter = bodySegmentation.createSegmenter(
        bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
        {
          runtime: 'mediapipe',
          modelType: 'landscape',
          solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
        });
  }

  async segment(imageData) {
    const segmentation = await (await self.segmenter).segmentPeople(imageData);
    if (segmentation.length === 0) {
      return null;
    }
    return await segmentation[0].mask.toImageData();
  }
}
