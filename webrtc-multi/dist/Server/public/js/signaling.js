/**
 * Signaling layer — wraps socket.io client for mediasoup SFU events.
 */
import { io } from 'socket.io-client';

function request(socket, event, data) {
  return new Promise((resolve, reject) => {
    const args = data !== undefined ? [event, data] : [event];
    args.push((res) => {
      if (res && res.error) reject(new Error(res.error));
      else resolve(res);
    });
    socket.emit(...args);
  });
}

export class Signaling {
  constructor() {
    this.socket = io();
  }

  /* ── Room management ── */

  async createRoom() {
    const res = await request(this.socket, 'create-room');
    return res.roomId;
  }

  async joinRoom(roomId) {
    return request(this.socket, 'join-room', roomId);
  }

  leaveRoom() {
    this.socket.emit('leave-room');
  }

  /* ── mediasoup signaling ── */

  async getRtpCapabilities() {
    const res = await request(this.socket, 'get-rtp-capabilities');
    return res.rtpCapabilities;
  }

  createSendTransport() {
    return request(this.socket, 'create-send-transport');
  }

  createRecvTransport() {
    return request(this.socket, 'create-recv-transport');
  }

  connectTransport(transportId, dtlsParameters) {
    return request(this.socket, 'connect-transport', { transportId, dtlsParameters });
  }

  async produce(kind, rtpParameters, appData) {
    const res = await request(this.socket, 'produce', { kind, rtpParameters, appData });
    return res.producerId;
  }

  consume(producerId, rtpCapabilities) {
    return request(this.socket, 'consume', { producerId, rtpCapabilities });
  }

  resumeConsumer(consumerId) {
    return request(this.socket, 'resume-consumer', { consumerId });
  }

  closeProducer(producerId) {
    return request(this.socket, 'close-producer', { producerId });
  }

  /* ── Event listeners ── */

  onPeerJoined(cb)    { this.socket.on('peer-joined', cb); }
  onPeerLeft(cb)      { this.socket.on('peer-left', cb); }
  onNewProducer(cb)   { this.socket.on('new-producer', cb); }
  onProducerClosed(cb){ this.socket.on('producer-closed', cb); }

  get id() { return this.socket.id; }

  disconnect() {
    this.socket.disconnect();
  }
}
