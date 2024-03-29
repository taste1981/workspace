function prepareFrames(width, height, count) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const duration = 1_000_000 / 30;  // 1/30 s
  let timestamp = 0;
  const frames = [];
  for (let i = 0; i < count; i++) {
    fourColorsFrame1(ctx, width, height, timestamp.toString());
    let frame = new VideoFrame(canvas, {timestamp: timestamp});
    frames.push(frame);
    timestamp += duration;
  }
  return frames;
}

async function testEncodingConfiguration(name, width, height, count, acc) {
  const encoder_config = {
    codec: "hev1.1.6.L120.B0",
    hardwareAcceleration: acc,
    width: width,
    height: height,
    bitrate: 2000000,
    framerate: 30
  };

  let support = await VideoEncoder.isConfigSupported(encoder_config);
  if (!support.supported) {
    PerfTestRunner.log("Skipping test. Unsupported encoder config" +
                       JSON.stringify(encoder_config));
    return;
  }

  let frames = prepareFrames(width, height, count);
  let is_done = false;

  const init = {
    output(chunk, metadata) {},
    error(e) {
      PerfTestRunner.logFatalError("Encoding error: " + e);
    }
  };

  async function runTest() {
    const encoder = new VideoEncoder(init);
    encoder.configure(encoder_config);

    PerfTestRunner.addRunTestStartMarker();

    // Encode first frame without timing it, this will given the encoder
    // chance to finish initialization.
    encoder.encode(frames[0], { keyFrame: false });
    await encoder.flush().catch(e => {
      PerfTestRunner.logFatalError("Test error: " + e);
    });

    let start_time = PerfTestRunner.now();
    for (let frame of frames.slice(1)) {
      encoder.encode(frame, { keyFrame: false });
    }

    encoder.flush().then(
     _ => {
      let run_time = PerfTestRunner.now() - start_time;
      PerfTestRunner.measureValueAsync(run_time);
      PerfTestRunner.addRunTestEndMarker();
      encoder.close();
      if (!is_done)
        runTest();
    },
    e => {
      PerfTestRunner.logFatalError("Test error: " + e);
    });
  }

  PerfTestRunner.startMeasureValuesAsync({
        unit: 'ms',
        done: function () {
          is_done = true;
          for (let frame of frames)
            frame.close();
        },
        run: function() {
            runTest();
        },
        warmUpCount: 0,
        iterationCount: 3,
        description: name,
  });
}
