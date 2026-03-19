/**
 * SFU client — wraps mediasoup-client Device for produce/consume.
 * Each peer sends media once to the server; the server forwards to all others.
 */
import { Device } from 'mediasoup-client';

export class SfuClient {
  /**
   * @param {import('./signaling.js').Signaling} signaling
   */
  constructor(signaling) {
    this.signaling = signaling;
    this.device = new Device();
    this.sendTransport = null;
    this.recvTransport = null;
    /** @type {Map<string, import('mediasoup-client').types.Producer>} kind -> Producer */
    this.producers = new Map();
    /** @type {Map<string, { consumer: any, peerId: string }>} consumerId -> entry */
    this.consumers = new Map();

    /** Callback: (peerId, track, kind) => void */
    this.onRemoteTrack = null;
    /** Callback: (consumerId, producerId) => void */
    this.onRemoteTrackEnded = null;
  }

  /** Load the device with the router's RTP capabilities. */
  async init() {
    const rtpCapabilities = await this.signaling.getRtpCapabilities();
    await this.device.load({ routerRtpCapabilities: rtpCapabilities });
  }

  /** Create send and receive transports. */
  async createTransports() {
    // --- Send transport ---
    const sendParams = await this.signaling.createSendTransport();
    this.sendTransport = this.device.createSendTransport(sendParams);

    this.sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.connectTransport(this.sendTransport.id, dtlsParameters);
        callback();
      } catch (err) { errback(err); }
    });

    this.sendTransport.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
      try {
        const producerId = await this.signaling.produce(kind, rtpParameters, appData);
        callback({ id: producerId });
      } catch (err) { errback(err); }
    });

    // --- Receive transport ---
    const recvParams = await this.signaling.createRecvTransport();
    this.recvTransport = this.device.createRecvTransport(recvParams);

    this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      try {
        await this.signaling.connectTransport(this.recvTransport.id, dtlsParameters);
        callback();
      } catch (err) { errback(err); }
    });
  }

  /** Produce a local track (audio or video). */
  async produceTrack(track) {
    const producer = await this.sendTransport.produce({ track });
    this.producers.set(producer.id, producer);
    return producer;
  }

  /** Consume a remote producer's track via the SFU. */
  async consumeProducer(producerId, peerId) {
    const params = await this.signaling.consume(producerId, this.device.rtpCapabilities);
    const consumer = await this.recvTransport.consume({
      id: params.consumerId,
      producerId: params.producerId,
      kind: params.kind,
      rtpParameters: params.rtpParameters,
    });

    this.consumers.set(consumer.id, { consumer, peerId, producerId });

    // Resume on server (consumers start paused)
    await this.signaling.resumeConsumer(consumer.id);

    if (this.onRemoteTrack) {
      this.onRemoteTrack(peerId, consumer.track, consumer.kind, producerId);
    }
    return consumer;
  }

  /** Replace the video track on the existing video producer (e.g. screen share). */
  async replaceVideoTrack(newTrack) {
    for (const producer of this.producers.values()) {
      if (producer.kind === 'video') {
        await producer.replaceTrack({ track: newTrack });
        return;
      }
    }
  }

  /** Close a specific producer by its ID. */
  async closeProducer(producerId) {
    const producer = this.producers.get(producerId);
    if (producer) {
      producer.close();
      this.producers.delete(producerId);
      await this.signaling.closeProducer(producerId);
    }
  }

  /** Remove all consumers associated with a peer. */
  removeConsumersByPeer(peerId) {
    for (const [consumerId, entry] of this.consumers) {
      if (entry.peerId === peerId) {
        entry.consumer.close();
        this.consumers.delete(consumerId);
      }
    }
  }

  /** Remove a single consumer. */
  removeConsumer(consumerId) {
    const entry = this.consumers.get(consumerId);
    if (entry) {
      entry.consumer.close();
      this.consumers.delete(consumerId);
    }
  }

  /** Close everything. */
  closeAll() {
    for (const producer of this.producers.values()) producer.close();
    this.producers.clear();
    for (const { consumer } of this.consumers.values()) consumer.close();
    this.consumers.clear();
    this.sendTransport?.close();
    this.recvTransport?.close();
  }

  /** Number of unique remote peers we are receiving from. */
  get peerCount() {
    const ids = new Set();
    for (const { peerId } of this.consumers.values()) ids.add(peerId);
    return ids.size;
  }
}
