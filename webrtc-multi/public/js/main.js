import { Signaling } from './signaling.js';
import { SfuClient } from './sfu-client.js';

/* ── DOM refs ── */
const $landing       = document.getElementById('landing');
const $call          = document.getElementById('call');
const $btnCreate     = document.getElementById('btn-create');
const $btnJoin       = document.getElementById('btn-join');
const $inputRoom     = document.getElementById('input-room');
const $landingError  = document.getElementById('landing-error');
const $roomIdDisplay = document.getElementById('room-id-display');
const $participantCount = document.getElementById('participant-count');
const $videoGrid     = document.getElementById('video-grid');
const $btnCopy       = document.getElementById('btn-copy');
const $btnMic        = document.getElementById('btn-mic');
const $btnCam        = document.getElementById('btn-cam');
const $btnScreen     = document.getElementById('btn-screen');
const $btnLeave      = document.getElementById('btn-leave');

/* ── Constants ── */
const JOINER_STREAM_COUNT = 8;

/* ── State ── */
let signaling = null;
let sfuClient = null;
let localStream = null;
let screenStream = null;
let isSharingScreen = false;
let roomId = null;
let role = null; // 'creator' | 'joiner'
let remoteVideoIndex = 0; // counter for remote video tile labels
const clonedTracks = []; // joiner's 8 cloned video tracks
// Map<producerId, tileId> — each remote video producer gets its own tile
const producerTileMap = new Map();

/* ── Helpers ── */

function showError(msg) {
  $landingError.textContent = msg;
  $landingError.classList.remove('hidden');
}

function clearError() {
  $landingError.textContent = '';
  $landingError.classList.add('hidden');
}

function showCallView(id) {
  roomId = id;
  $roomIdDisplay.textContent = roomId;
  $landing.classList.add('hidden');
  $call.classList.remove('hidden');
  updateGrid();
}

function showLandingView() {
  $call.classList.add('hidden');
  $landing.classList.remove('hidden');
  clearError();
}

function updateGrid() {
  const count = $videoGrid.children.length;
  $participantCount.textContent = `${count} stream${count !== 1 ? 's' : ''}`;
  $videoGrid.setAttribute('data-count', count);
}

/* ── Video tile management ── */

function createVideoTile(id, stream, label, isLocal = false) {
  if (document.getElementById(`tile-${id}`)) return;
  const tile = document.createElement('div');
  tile.classList.add('video-tile');
  if (isLocal) tile.classList.add('local');
  tile.id = `tile-${id}`;

  const video = document.createElement('video');
  video.autoplay = true;
  video.playsInline = true;
  video.muted = isLocal;
  video.srcObject = stream;

  const lbl = document.createElement('div');
  lbl.classList.add('tile-label');
  lbl.textContent = label;

  tile.appendChild(video);
  tile.appendChild(lbl);
  $videoGrid.appendChild(tile);
  updateGrid();
}

function removeVideoTile(id) {
  const tile = document.getElementById(`tile-${id}`);
  if (tile) {
    const video = tile.querySelector('video');
    if (video) video.srcObject = null;
    tile.remove();
  }
  updateGrid();
}

function removeAllTiles() {
  $videoGrid.innerHTML = '';
}

/* ── getUserMedia ── */

async function getLocalMedia(width, height) {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: width }, height: { ideal: height } },
      audio: true,
    });
  } catch {
    showError('Camera/mic access denied. Please allow permissions and try again.');
    throw new Error('Camera/mic access denied');
  }
}

/* ── SFU setup ── */

async function setupSfu() {
  signaling = new Signaling();
  sfuClient = new SfuClient(signaling);

  // Remote track callback — each video producer gets its own tile
  sfuClient.onRemoteTrack = (peerId, track, kind, producerId) => {
    if (kind === 'audio') {
      // Attach audio to the first existing tile for this peer, or ignore if no tile yet
      // Audio will be mixed by the browser; just attach it to any existing video tile's stream
      for (const [pId, tileId] of producerTileMap) {
        const tile = document.getElementById(`tile-${tileId}`);
        if (tile) {
          const video = tile.querySelector('video');
          if (video && video.srcObject) {
            video.srcObject.addTrack(track);
            return;
          }
        }
      }
      return;
    }

    // Video track — each producer gets its own tile
    remoteVideoIndex++;
    const tileId = `remote-${remoteVideoIndex}`;
    producerTileMap.set(producerId, tileId);
    const stream = new MediaStream([track]);
    const res = role === 'creator' ? '360p' : '720p';
    createVideoTile(tileId, stream, `Remote #${remoteVideoIndex} (${res})`);
  };

  signaling.onPeerJoined(() => {});

  signaling.onPeerLeft((peerId) => {
    sfuClient.removeConsumersByPeer(peerId);
    // Remove all tiles for this peer
    for (const [pId, tileId] of producerTileMap) {
      removeVideoTile(tileId);
    }
    producerTileMap.clear();
    remoteVideoIndex = 0;
    updateGrid();
  });

  signaling.onNewProducer(async ({ producerId, peerId, kind }) => {
    try {
      await sfuClient.consumeProducer(producerId, peerId);
    } catch (err) {
      console.error('Failed to consume producer:', err);
    }
  });

  signaling.onProducerClosed(({ consumerId, producerId }) => {
    const tileId = producerTileMap.get(producerId);
    if (tileId) {
      removeVideoTile(tileId);
      producerTileMap.delete(producerId);
    }
    sfuClient.removeConsumer(consumerId);
  });
}

/* ── Create Room (1 stream @ 720p) ── */

async function handleCreate() {
  clearError();
  try {
    role = 'creator';
    localStream = await getLocalMedia(1280, 720);
    await setupSfu();

    const id = await signaling.createRoom();
    showCallView(id);
    createVideoTile('local', localStream, 'You (720p)', true);

    await sfuClient.init();
    await sfuClient.createTransports();

    // Produce 1 audio + 1 video
    for (const track of localStream.getTracks()) {
      await sfuClient.produceTrack(track);
    }
  } catch (err) {
    showError(err.message);
  }
}

/* ── Join Room (8 streams @ 360p) ── */

async function handleJoin() {
  clearError();
  const id = $inputRoom.value.trim().toLowerCase();
  if (!id) {
    showError('Please enter a room ID');
    return;
  }
  try {
    role = 'joiner';
    localStream = await getLocalMedia(640, 360);
    await setupSfu();

    const { existingProducers } = await signaling.joinRoom(id);
    showCallView(id);

    await sfuClient.init();
    await sfuClient.createTransports();

    // Produce 1 audio track
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      await sfuClient.produceTrack(audioTrack);
    }

    // Produce 8 cloned video tracks
    const videoTrack = localStream.getVideoTracks()[0];
    for (let i = 0; i < JOINER_STREAM_COUNT; i++) {
      const clone = videoTrack.clone();
      clonedTracks.push(clone);
      await sfuClient.produceTrack(clone);

      // Show a local tile for each stream
      const stream = new MediaStream([clone]);
      createVideoTile(`local-${i}`, stream, `Local #${i + 1} (360p)`, true);
    }

    // Consume existing producers (the creator's streams)
    for (const { producerId, peerId } of existingProducers) {
      await sfuClient.consumeProducer(producerId, peerId);
    }
  } catch (err) {
    showError(err.message);
    cleanup(false);
  }
}

/* ── Controls ── */

function toggleMic() {
  if (!localStream) return;
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) return;
  audioTrack.enabled = !audioTrack.enabled;
  $btnMic.classList.toggle('muted', !audioTrack.enabled);
}

function toggleCam() {
  if (!localStream) return;
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return;
  const enabled = !videoTrack.enabled;
  videoTrack.enabled = enabled;
  // Also toggle all cloned tracks for joiner
  for (const clone of clonedTracks) {
    clone.enabled = enabled;
  }
  $btnCam.classList.toggle('muted', !enabled);
}

async function toggleScreen() {
  if (isSharingScreen) {
    await stopScreenShare();
    return;
  }
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];
    await sfuClient.replaceVideoTrack(screenTrack);

    const localVideo = document.querySelector('#tile-local video');
    if (localVideo) localVideo.srcObject = screenStream;

    isSharingScreen = true;
    $btnScreen.classList.add('active');
    screenTrack.onended = () => stopScreenShare();
  } catch {
    console.log('Screen share cancelled');
  }
}

async function stopScreenShare() {
  if (!isSharingScreen) return;
  isSharingScreen = false;
  $btnScreen.classList.remove('active');

  const cameraTrack = localStream.getVideoTracks()[0];
  await sfuClient.replaceVideoTrack(cameraTrack);

  const localVideo = document.querySelector('#tile-local video');
  if (localVideo) localVideo.srcObject = localStream;

  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }
}

function handleLeave() {
  cleanup(true);
  showLandingView();
}

function cleanup(notify) {
  if (isSharingScreen) stopScreenShare();
  if (sfuClient) {
    sfuClient.closeAll();
    sfuClient = null;
  }
  if (notify && signaling) signaling.leaveRoom();
  if (signaling) {
    signaling.disconnect();
    signaling = null;
  }
  // Stop cloned tracks
  for (const t of clonedTracks) t.stop();
  clonedTracks.length = 0;
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  removeAllTiles();
  roomId = null;
  role = null;
  remoteVideoIndex = 0;
  producerTileMap.clear();
  $btnMic.classList.remove('muted');
  $btnCam.classList.remove('muted');
  $btnScreen.classList.remove('active');
}

function copyRoomId() {
  if (roomId) {
    navigator.clipboard.writeText(roomId).then(() => {
      $btnCopy.textContent = '\u2713';
      setTimeout(() => { $btnCopy.textContent = '\uD83D\uDCCB'; }, 1500);
    });
  }
}

/* ── Event bindings ── */
$btnCreate.addEventListener('click', handleCreate);
$btnJoin.addEventListener('click', handleJoin);
$inputRoom.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleJoin(); });
$btnMic.addEventListener('click', toggleMic);
$btnCam.addEventListener('click', toggleCam);
$btnScreen.addEventListener('click', toggleScreen);
$btnLeave.addEventListener('click', handleLeave);
$btnCopy.addEventListener('click', copyRoomId);
