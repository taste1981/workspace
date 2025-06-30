'use strict';

import {EncodingTest} from './encoding-test.mjs';

const encodingTest = new EncodingTest();

document.getElementById('start-encoding')
    .addEventListener('click', async () => {
      const mediaStream = await encodingTest.initMediaStream();
      const keyFrameMode = document.querySelector('input[name="key-frame"]:checked').value;
      // if keyFrameMode is 'hybrid', we will use 4 key frames, if it is 'triple', we will use 3 key frames,  if it is 'consecutive', we will use 2 key frames, otherwise we will use 1 key frame.
      let keyFrames = 1;
      if (keyFrameMode === 'hybrid') {
        keyFrames = 5;
      } else if (keyFrameMode === 'triple') {
        keyFrames = 3;
      } else if (keyFrameMode === 'consecutive') {
        keyFrames = 2;
      }
      encodingTest.configure(keyFrames,
          document.getElementById('resolutions-select').value,
          document.getElementById('scalability-select').value,
          document.getElementById('hw-select').value);
      const videoElement = document.getElementById('local-preview');
      videoElement.srcObject = mediaStream;
      videoElement.play();
      document.getElementById('playback').play();
      encodingTest.startTest();
    });

document.getElementById('key-frame-request').addEventListener('click',()=>{
  encodingTest.requestKeyFrame();
});

const resolutionList = encodingTest.resolutionList();
const resolutionSelectElement = document.getElementById('resolutions-select');
let resolutionIndex = 0;
for (const [name, _] of resolutionList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = resolutionIndex;
  resolutionSelectElement.add(option);
  resolutionIndex += 1;
}

const scalabilityModeList = encodingTest.scalabilityModeList();
const scalabilitySelectElement = document.getElementById('scalability-select');
for (const name of scalabilityModeList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = name;
  scalabilitySelectElement.add(option);
}

const hardwareAccelerationList = encodingTest.hardwareAccelerationList();
const hardwareAccelerationSelectElement = document.getElementById('hw-select');
for (const name of hardwareAccelerationList) {
  const option = document.createElement('option');
  option.text = name;
  option.value = name;
  hardwareAccelerationSelectElement.add(option);
}
