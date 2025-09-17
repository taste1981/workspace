class WebRTCSink {
  constructor(codec) {
    this.codec = codec;
    this.remoteVideo = document.createElement('video');
    this.remoteVideo.autoplay = true;
    this.remoteVideo.playsInline = true;
    this.remoteVideo.style.display = 'none';
    document.body.appendChild(this.remoteVideo);

    this.pc1 = new RTCPeerConnection();
    this.pc2 = new RTCPeerConnection();

    this.pc1.onicecandidate = e => this.pc2.addIceCandidate(e.candidate);
    this.pc2.onicecandidate = e => this.pc1.addIceCandidate(e.candidate);

    this.pc2.ontrack = e => {
      console.log('WebRTCSink: received remote track');
      this.remoteVideo.srcObject = e.streams[0];
    };
  }

  async setMediaStream(stream) {
    console.log('WebRTCSink: setting media stream');
    stream.getTracks().forEach(track => this.pc1.addTrack(track, stream));
    await this.negotiate();
  }

  async negotiate() {
    try {
      // Prefer selected codec
      const transceiver = this.pc1.getTransceivers()[0];
      if (transceiver && transceiver.setCodecPreferences) {
        const { codecs } = RTCRtpSender.getCapabilities('video');
        const selectedCodecs = codecs.filter(c => c.mimeType === this.codec);
        if (selectedCodecs.length > 0) {
          console.log(`WebRTCSink: setting codec preference to ${this.codec}`);
          transceiver.setCodecPreferences(selectedCodecs);
        } else {
          console.warn(`WebRTCSink: ${this.codec} codec not available.`);
        }
      }

      const offer = await this.pc1.createOffer();
      await this.pc1.setLocalDescription(offer);
      await this.pc2.setRemoteDescription(offer);

      const answer = await this.pc2.createAnswer();
      await this.pc2.setLocalDescription(answer);
      await this.pc1.setRemoteDescription(answer);
      console.log('WebRTCSink: negotiation complete');
    } catch (e) {
      console.error('WebRTCSink: negotiation failed', e);
    }
  }

  destroy() {
    console.log('WebRTCSink: closing peer connections');
    if (this.pc1) {
      this.pc1.close();
      this.pc1 = null;
    }
    if (this.pc2) {
      this.pc2.close();
      this.pc2 = null;
    }
    if (this.remoteVideo) {
      document.body.removeChild(this.remoteVideo);
      this.remoteVideo = null;
    }
  }
}