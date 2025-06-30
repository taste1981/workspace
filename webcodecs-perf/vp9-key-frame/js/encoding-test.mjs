'use strict'

const resolutionList = [
  ['720p', [1280, 720]],
  ['360p', [640, 360]]
];

const scalabilityModeList = ['L1T1', 'L1T2'];

const hardwareAccelerationList =
    ['prefer-hardware', 'prefer-software', 'no-preference'];

export class EncodingTest {
  constructor() {
    this._mediaStream = null;
    this._trackWriter=null;
    this._worker = new Worker('js/codecs-worker.mjs?r=1', {type: 'module'});
    this.bindEventHandlers();
  }

  bindEventHandlers() {
    this._worker.addEventListener('message', (event) => {
      const [messageType, args] = event.data;
      switch (messageType) {
        case 'decoded-frame':
          this.renderFrame(...args);
          break;
        default:
          console.warn('Unknown message ' + JSON.stringify(event.data));
      }
    });
  }

  renderFrame(frame){
    this._trackWriter.write(frame);
  }

  async initMediaStream() {
    this._mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: 1280,
        height: 720,
      }
    });
    this.initPlayer();
    return this._mediaStream;
  }

  async initPlayer() {
    const mediaStreamTrackGenerator = new MediaStreamTrackGenerator({ kind: "video" });
    this._trackWriter = mediaStreamTrackGenerator.writable.getWriter();
    document.getElementById('playback').srcObject = new MediaStream([mediaStreamTrackGenerator]);
  }

  configure(keyFrames, resolutionsIndex, scalabilityMode, hardwareAcceleration) {
    this._worker.postMessage([
      'configure',
      [
        keyFrames, resolutionList[resolutionsIndex][1], scalabilityMode,
        hardwareAcceleration
      ]
    ]);
  }

  async startTest() {
    const processor = new MediaStreamTrackProcessor(
        {track: this._mediaStream.getVideoTracks()[0]});
    const reader = processor.readable.getReader();
    while (true) {
      const {value, done} = await reader.read();
      if (done) {
        console.debug('Video track ends.');
        break;
      }
      this._worker.postMessage(['raw-frame', [value]], [value]);
    }
  }

  resolutionList() {
    return resolutionList;
  }

  scalabilityModeList() {
    return scalabilityModeList;
  }

  hardwareAccelerationList() {
    return hardwareAccelerationList;
  }

  requestKeyFrame() {
    this._worker.postMessage([
      'key-frame-request',
    ]);
  }
}