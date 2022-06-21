
import { MP4Box } from "./mp4box.all.js";
import * as Utils from "./utils.js"

//////////////////////////////////////
// General state
const canvas = document.getElementById("canvas");
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;
const ctx = canvas.getContext("2d");
const frameRate = 60;
const dt = 1000 / frameRate;	// in ms
let currentTime = 0;			// in ms
let frameNum = 0;
const maxTime = 10000;
const totalFrames = Math.floor(maxTime / dt);

let keyframeInterval = 1000;	// keyframe every 1 second
let lastKeyframeTime = 0;

function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)'),
        results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(
        /\+/g, ' '));
}

var fps = getParameterByName('fps') === 'true'? true:false;

//////////////////////////////////////
// VideoEncoder
const videoEncoder = new VideoEncoder({
	output: VideoEncoderOutput,
	error: VideoEncoderError
});

if (fps) {
  await videoEncoder.configure({
	codec: "avc1.420034",		// AVC (H.264), Baseline profile, level 5.2
	width: canvasWidth,
	height: canvasHeight,
	
	// BUG: specifying this causes an unplayable video.
	// Commenting it out allows the playback to work.
	framerate: frameRate,
	
	avc: {format: "avc"} 
  });
} else {
  await videoEncoder.configure({
	codec: "avc1.420034",		// AVC (H.264), Baseline profile, level 5.2
	width: canvasWidth,
	height: canvasHeight,
	
	avc: {format: "avc"} 
  });	
}

//////////////////////////////////////
// MP4Box for muxing
let mp4file = MP4Box.createFile();
let videoTrack = null;

function VideoEncoderOutput(encodedChunk, config)
{
	const arrayBuffer = new ArrayBuffer(encodedChunk.byteLength);
	encodedChunk.copyTo(arrayBuffer);
	
	if (videoTrack === null)
	{
		videoTrack = mp4file.addTrack({
			timescale: 1000000,
			width: canvasWidth,
			height: canvasHeight,
			nb_samples: totalFrames,
			avcDecoderConfigRecord: config.decoderConfig.description
		});
	}
	
	mp4file.addSample(videoTrack, arrayBuffer, {
		duration: dt * 1000,
		dts: encodedChunk.timestamp,
		cts: encodedChunk.timestamp,
		is_sync: (encodedChunk.type === "key")
	});
}

function VideoEncoderError(err)
{
	console.error("Video encoder error:", err);
}

async function Done()
{
	console.log("Done, flushing...");
	
	await videoEncoder.flush();
	
	console.log("Flushed");
	
	const arrayBuffer = mp4file.getBuffer();
	
	const blob = new Blob([arrayBuffer], { type: "video/mp4" });
	
	Utils.Download("video.mp4", URL.createObjectURL(blob));
	
	console.log("Completed!");
}


function Tick()
{
	ctx.fillStyle = "blue";
	ctx.fillRect(0, 0, canvasWidth, canvasHeight);
	ctx.fillStyle = "yellow";
	ctx.fillRect(10, 10, canvasWidth - 20, canvasHeight - 20);
	
	ctx.fillStyle = "black";
	ctx.font = "24pt Arial";
	ctx.fillText("Current time: " + Math.round(currentTime / 10) / 100, 100, 100);
	ctx.fillText("Frame number: " + frameNum, 100, 200);
	
	ctx.fillStyle = "red";
	const boxX = 300 + Math.sin(currentTime / 300) * 200;
	ctx.fillRect(boxX - 30, 300, 60, 60);
	
	let isKeyframe = false;
	if (currentTime >= lastKeyframeTime + keyframeInterval)
	{
		isKeyframe = true;
		lastKeyframeTime += keyframeInterval;
	}
	
	const videoFrame = new VideoFrame(canvas, {
		timestamp: currentTime * 1000
	});
	videoEncoder.encode(videoFrame, {
		keyFrame: isKeyframe
	});
	videoFrame.close();
	
	// Step time and frame number and keep posting tasks to encode another frame
	// (note not using rAF to ensure faster-than-realtime) up until the maximum time
	currentTime += dt;
	frameNum++;
	
	if (frameNum < totalFrames)
		Utils.PostTask(Tick);
	else
		Done();
}

function Start()
{
	console.log("Starting");
	
	Tick();
}

Start();

