function fourColorsFrame1(ctx, width, height, text) {
  const kYellow = '#FFFF00';
  const kRed = '#FF0000';
  const kBlue = '#0000FF';
  const kGreen = '#00FF00';

  ctx.fillStyle = kYellow;
  ctx.fillRect(0, 0, width / 2, height / 2);

  ctx.fillStyle = kRed;
  ctx.fillRect(width / 2, 0, width / 2, height / 2);

  ctx.fillStyle = kBlue;
  ctx.fillRect(0, height / 2, width / 2, height / 2);

  ctx.fillStyle = kGreen;
  ctx.fillRect(width / 2, height / 2, width / 2, height / 2);

  ctx.fillStyle = 'white';
  ctx.font = (height / 10) + 'px sans-serif';
  ctx.fillText(text, width / 2, height / 2);
}
let hevc =[
  "hvc1.1.6.L93.B0",
  "hvc1.A1.6.L93.B0",
  "hvc1.B1.6.L93.B0",
  "hvc1.C1.6.L93.B0",
  "hvc1.D1.6.L93.B0",
  "hvc1.0.6.L93.B0",
  "hvc1.31.6.L93.B0",
  "hvc1.1.6.L93.B0",
  "hvc1.1.0.L93.B0",
  "hvc1.0.6.L93.B0",
  "hvc1.2.4.L93.B0",
  "hvc1.2.0.L93.B0",
  "hvc1.0.4.L93.B0",
  "hvc1.2.0.L93.B0",
  "hvc1.0.4.L93.B0",
  "hvc1.3.E.L93.B0",
  "hvc1.0.E.L93.B0",
  "hvc1.3.0.L93.B0", 
  "hvc1.4.10.L93.B0",
  "hvc1.4.0.L93.B0",
  "hvc1.0.10.L93.B0",
  "hvc1.5.20.L93.B0",
  "hvc1.5.0.L93.B0",
  "hvc1.0.20.L93.B0", 
  "hvc1.6.40.L93.B0",
  "hvc1.6.0.L93.B0",
  "hvc1.0.40.L93.B0",
  "hvc1.7.80.L93.B0",
  "hvc1.7.0.L93.B0",
  "hvc1.0.80.L93.B0",
  "hvc1.8.100.L93.B0",
  "hvc1.8.0.L93.B0",
  "hvc1.0.100.L93.B0",
  "hvc1.9.200.L93.B0",
  "hvc1.9.0.L93.B0",
  "hvc1.0.200.L93.B0",
  "hvc1.10.400.L93.B0",
  "hvc1.10.0.L93.B0",
  "hvc1.0.400.L93.B0",
  "hvc1.11.800.L93.B0",
  "hvc1.11.0.L93.B0",
  "hvc1.0.800.L93.B0",
  "hvc1.12.1000.L93.B0",
  "hvc1.12.0.L93.B0",
  "hvc1.0.1000.L93.B0",
  "hvc1.-1.6.L93.B0",
  "hvc1.32.6.L93.B0",
  "hvc1.999.6.L93.B0",
  "hvc1.A.6.L93.B0",
  "hvc1.1F.6.L93.B0",
  "hvc1.1.0.L93.B0",
  "hvc1.1.FF.L93.B0",
  "hvc1.1.FFFF.L93.B0",
  "hvc1.1.FFFFFFFF.L93.B0",
  "hvc1.1.100000000.L93.B0",
  "hvc1.1.FFFFFFFFF.L93.B0",
  "hvc1.1.-1.L93.B0",
  "hvc1.1.0G.L93.B0",
  "hvc1.1.6.L93.B0",
  "hvc1.1.0.H93.B0", 
  "hvc1.1.0.93.B0",
  "hvc1.1.0.A93.B0",
  "hvc1.1.6.L0.B0",
  "hvc1.1.6.L1.B0", 
  "hvc1.1.6.L93.B0", 
  "hvc1.1.6.L150.B0",
  "hvc1.1.6.L255.B0",
  "hvc1.1.6.L256.B0",
  "hvc1.1.6.L999.B0",
  "hvc1.1.6.L-1.B0", 
  "hvc1.1.6.L0.0.0.0.0.0.0",
  "hvc1.1.6.L0.00.00.00.00.00.00",
  "hvc1.1.6.L0.12",
  "hvc1.1.6.L0.12.34.56",
  "hvc1.1.6.L0.12.34.56.78.9A.BC", 
  "hvc1.1.6.L0.FF.FF.FF.FF.FF.FF",
  "hvc1.1.6.L0.FF.FF.FF.FF.FF.FF.0",
  "hvc1.1.6.L0.100",
  "hvc1.1.6.L0.1FF",
  "hvc1.1.6.L0.-1",
]

async function createDecodedFrame(codec) {
  const config = {
    // codec:'hvc1.1.6.H120.90',//
    // codec:'hev1.1.6.H120.90',
    // 'hev1.2.6.L150.B0',//
    // "hev1.2.6.L150.B0",//
    // 'hev1.1.6.L150.B0',//
    // 'hev1.1.2.L93.B0',//
    // 'hev1.1.6.H120.B0', //
    // codec:'hvc1.2.4.L93.B0',
    // codec:'hvc1.1',
    codec:codec,
    // codec:'avc1.64001f', 
    codedWidth: 1280, 
    codedHeight: 720
  };

  // const support = await VideoDecoder.isConfigSupported(config);
  // if (!support.supported) {
  //   PerfTestRunner.logFatalError("Skipping test. Unsupported decoder config:" +
  //                                JSON.stringify(config));
  //   return null;
  // }

  // const result = await fetch('resources/720p.h264');
  // const result = await fetch('resources/huaping.h265');
  const result = await fetch('resources/maleAd.h265');
  
  const buf = await result.arrayBuffer();
  const chunk = new EncodedVideoChunk({timestamp: 0, type: 'key', data: buf});

  let frame = null;
  const decoder = new VideoDecoder({
    output: f => frame = f,
    error: e => PerfTestRunner.log('Decode1 error:' + e)
  });
  decoder.configure(config);
  decoder.decode(chunk);
  await decoder.flush();
  return frame;
}

async function createDecodedFrame1(codec) {
  const config = {codec: codec,//'hvc1.2.4.L93.B0', 
  codedWidth: 1280, codedHeight: 720};
  const result = await fetch('https://lf3-cdn-tos.bytegoofy.com/obj/tcs-client/resources/720p.hevc');
  // const result = await fetch('resources/maleAd.h265');
  const buf = await result.arrayBuffer();
  console.log('buf', buf  ,'result',result )
  const chunk = new EncodedVideoChunk({timestamp: 0, type: 'key', data: buf});
  
  let frame = null;
  const decoder = new VideoDecoder({
  output: f => frame = f,
  error: e => console.log('Decode error:' + e)
  });
  decoder.configure(config);
  decoder.decode(chunk);
  await decoder.flush();
  return frame;
  }
