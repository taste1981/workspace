/**
 * PeerConnectionManager — manages one RTCPeerConnection per remote peer.
 */

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class PeerConnectionManager {
  /**
   * @param {MediaStream} localStream
   * @param {Signaling} signaling
   * @param {(peerId: string, stream: MediaStream) => void} onRemoteStream
   * @param {(peerId: string) => void} onPeerDisconnected
   */
  constructor(localStream, signaling, onRemoteStream, onPeerDisconnected) {
    this.localStream = localStream;
    this.signaling = signaling;
    this.onRemoteStream = onRemoteStream;
    this.onPeerDisconnected = onPeerDisconnected;

    /** @type {Map<string, RTCPeerConnection>} */
    this.peers = new Map();
  }

  /**
   * Create a new peer connection. If isInitiator, create and send an offer.
   */
  async addPeer(peerId, isInitiator) {
    if (this.peers.has(peerId)) return;

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.peers.set(peerId, pc);

    // Add local tracks
    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream);
    }

    // ICE candidates → relay via signaling
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.signaling.sendIceCandidate(peerId, e.candidate);
      }
    };

    // Remote tracks → notify UI
    pc.ontrack = (e) => {
      // Use the first stream associated with the track
      if (e.streams && e.streams[0]) {
        this.onRemoteStream(peerId, e.streams[0]);
      }
    };

    // Monitor connection state for unexpected disconnects
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        this.removePeer(peerId);
        this.onPeerDisconnected(peerId);
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signaling.sendOffer(peerId, pc.localDescription);
    }
  }

  async handleOffer(peerId, sdp) {
    let pc = this.peers.get(peerId);
    if (!pc) {
      // Create the connection if it doesn't exist yet (race condition guard)
      await this.addPeer(peerId, false);
      pc = this.peers.get(peerId);
    }
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.signaling.sendAnswer(peerId, pc.localDescription);
  }

  async handleAnswer(peerId, sdp) {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  async handleIceCandidate(peerId, candidate) {
    const pc = this.peers.get(peerId);
    if (!pc) return;
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.oniceconnectionstatechange = null;
      pc.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Replace the video track on all peer connections (used for screen share toggle).
   * @param {MediaStreamTrack} newTrack
   */
  replaceVideoTrack(newTrack) {
    for (const pc of this.peers.values()) {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(newTrack);
      }
    }
  }

  /** Close all connections. */
  closeAll() {
    for (const peerId of this.peers.keys()) {
      this.removePeer(peerId);
    }
  }

  get peerCount() {
    return this.peers.size;
  }
}
