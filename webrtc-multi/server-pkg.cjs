/**
 * Standalone CJS server entry point for packaging into .exe via pkg.
 * This is a CJS-compatible version of server.js.
 */
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { randomBytes } = require('crypto');
const os = require('os');
const path = require('path');
const fs = require('fs');

/* ── Resolve paths relative to the exe location ── */
const exeDir = path.dirname(process.execPath);
const isPackaged = process.pkg !== undefined;
const baseDir = isPackaged ? exeDir : __dirname;

/* ── mediasoup worker binary ── */
const workerExt = process.platform === 'win32' ? '.exe' : '';
const WORKER_CANDIDATES = [
  path.join(baseDir, 'bin', `mediasoup-worker${workerExt}`),
  path.join(baseDir, 'node_modules', 'mediasoup', 'worker', 'prebuild', `mediasoup-worker${workerExt}`),
  path.join(__dirname, 'bin', `mediasoup-worker${workerExt}`),
  path.join(__dirname, 'node_modules', 'mediasoup', 'worker', 'prebuild', `mediasoup-worker${workerExt}`),
];
if (!process.env.MEDIASOUP_WORKER_BIN) {
  const found = WORKER_CANDIDATES.find(p => fs.existsSync(p));
  if (found) process.env.MEDIASOUP_WORKER_BIN = found;
}

const mediasoup = require('mediasoup');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const MAX_PARTICIPANTS = 9;

/* ── Network helper ── */

function getLocalIp() {
  for (const iface of Object.values(os.networkInterfaces())) {
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) return alias.address;
    }
  }
  return '127.0.0.1';
}

const ANNOUNCED_IP = process.env.ANNOUNCED_IP || getLocalIp();

/* ── mediasoup configuration ── */

const MEDIA_CODECS = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '4d0032',
      'level-asymmetry-allowed': 1,
      'x-google-start-bitrate': 1500,
    },
  },
];

const TRANSPORT_OPTIONS = {
  listenInfos: [
    { protocol: 'udp', ip: '0.0.0.0', announcedAddress: ANNOUNCED_IP },
    { protocol: 'tcp', ip: '0.0.0.0', announcedAddress: ANNOUNCED_IP },
  ],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  initialAvailableOutgoingBitrate: 1_000_000,
};

/* ── State ── */

let worker;
const rooms = new Map();

function generateRoomId() {
  return randomBytes(3).toString('hex');
}

/* ── mediasoup worker ── */

async function createWorker() {
  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    rtcMinPort: 10000,
    rtcMaxPort: 10100,
  });
  worker.on('died', () => {
    console.error('mediasoup Worker died, exiting.');
    process.exit(1);
  });
  console.log(`mediasoup Worker created [pid:${worker.pid}]`);
}

async function getOrCreateRoom(roomId) {
  if (rooms.has(roomId)) return rooms.get(roomId);
  const router = await worker.createRouter({ mediaCodecs: MEDIA_CODECS });
  const room = { router, peers: new Map() };
  rooms.set(roomId, room);
  return room;
}

function newPeerState() {
  return {
    sendTransport: null,
    recvTransport: null,
    producers: new Map(),
    consumers: new Map(),
  };
}

/* ── Static files ── */

const publicDir = path.join(baseDir, 'public');
app.use(express.static(publicDir));

/* ── Start ── */

(async () => {
  await createWorker();

  io.on('connection', (socket) => {
    let currentRoom = null;
    let currentRoomId = null;

    socket.on('create-room', async (callback) => {
      try {
        if (currentRoomId) return callback({ error: 'Already in a room' });
        const roomId = generateRoomId();
        const room = await getOrCreateRoom(roomId);
        room.peers.set(socket.id, newPeerState());
        currentRoomId = roomId;
        currentRoom = room;
        socket.join(roomId);
        callback({ roomId });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('join-room', async (roomId, callback) => {
      try {
        if (currentRoomId) return callback({ error: 'Already in a room' });
        if (typeof roomId !== 'string') return callback({ error: 'Invalid room ID' });
        const room = rooms.get(roomId);
        if (!room) return callback({ error: 'Room not found' });
        if (room.peers.size >= MAX_PARTICIPANTS) return callback({ error: 'Room is full (max 9 participants)' });

        const existingProducers = [];
        for (const [peerId, peer] of room.peers) {
          for (const [producerId, producer] of peer.producers) {
            existingProducers.push({ producerId, peerId, kind: producer.kind });
          }
        }

        socket.to(roomId).emit('peer-joined', socket.id);

        room.peers.set(socket.id, newPeerState());
        currentRoomId = roomId;
        currentRoom = room;
        socket.join(roomId);
        callback({
          peers: Array.from(room.peers.keys()).filter((id) => id !== socket.id),
          existingProducers,
        });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('get-rtp-capabilities', (callback) => {
      if (!currentRoom) return callback({ error: 'Not in a room' });
      callback({ rtpCapabilities: currentRoom.router.rtpCapabilities });
    });

    socket.on('create-send-transport', async (callback) => {
      try {
        if (!currentRoom) return callback({ error: 'Not in a room' });
        const transport = await currentRoom.router.createWebRtcTransport(TRANSPORT_OPTIONS);
        currentRoom.peers.get(socket.id).sendTransport = transport;
        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('create-recv-transport', async (callback) => {
      try {
        if (!currentRoom) return callback({ error: 'Not in a room' });
        const transport = await currentRoom.router.createWebRtcTransport(TRANSPORT_OPTIONS);
        currentRoom.peers.get(socket.id).recvTransport = transport;
        callback({
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('connect-transport', async ({ transportId, dtlsParameters }, callback) => {
      try {
        const peer = currentRoom.peers.get(socket.id);
        const transport =
          peer.sendTransport?.id === transportId ? peer.sendTransport :
          peer.recvTransport?.id === transportId ? peer.recvTransport : null;
        if (!transport) return callback({ error: 'Transport not found' });
        await transport.connect({ dtlsParameters });
        callback({});
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('produce', async ({ kind, rtpParameters, appData }, callback) => {
      try {
        const peer = currentRoom.peers.get(socket.id);
        const producer = await peer.sendTransport.produce({ kind, rtpParameters, appData });
        peer.producers.set(producer.id, producer);

        producer.on('transportclose', () => {
          peer.producers.delete(producer.id);
        });

        socket.to(currentRoomId).emit('new-producer', {
          producerId: producer.id,
          peerId: socket.id,
          kind: producer.kind,
        });

        callback({ producerId: producer.id });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('consume', async ({ producerId, rtpCapabilities }, callback) => {
      try {
        if (!currentRoom.router.canConsume({ producerId, rtpCapabilities })) {
          return callback({ error: 'Cannot consume' });
        }
        const peer = currentRoom.peers.get(socket.id);
        const consumer = await peer.recvTransport.consume({
          producerId,
          rtpCapabilities,
          paused: true,
        });

        peer.consumers.set(consumer.id, consumer);

        consumer.on('transportclose', () => peer.consumers.delete(consumer.id));
        consumer.on('producerclose', () => {
          peer.consumers.delete(consumer.id);
          socket.emit('producer-closed', { consumerId: consumer.id, producerId });
        });

        callback({
          consumerId: consumer.id,
          producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('resume-consumer', async ({ consumerId }, callback) => {
      try {
        const peer = currentRoom.peers.get(socket.id);
        const consumer = peer.consumers.get(consumerId);
        if (!consumer) return callback({ error: 'Consumer not found' });
        await consumer.resume();
        callback({});
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('close-producer', async ({ producerId }, callback) => {
      try {
        const peer = currentRoom.peers.get(socket.id);
        const producer = peer.producers.get(producerId);
        if (producer) {
          producer.close();
          peer.producers.delete(producerId);
        }
        callback({});
      } catch (err) {
        callback({ error: err.message });
      }
    });

    socket.on('leave-room', () => leaveRoom());
    socket.on('disconnect', () => leaveRoom());

    function leaveRoom() {
      if (!currentRoom || !currentRoomId) return;
      const peer = currentRoom.peers.get(socket.id);
      if (peer) {
        peer.sendTransport?.close();
        peer.recvTransport?.close();
        currentRoom.peers.delete(socket.id);
      }
      socket.to(currentRoomId).emit('peer-left', socket.id);
      if (currentRoom.peers.size === 0) {
        currentRoom.router.close();
        rooms.delete(currentRoomId);
      }
      socket.leave(currentRoomId);
      currentRoom = null;
      currentRoomId = null;
    }
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Announced IP: ${ANNOUNCED_IP}`);
  });
})();
