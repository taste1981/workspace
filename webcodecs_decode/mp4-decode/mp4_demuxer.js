class MP4Source {
  constructor(uri) {
    this.file = MP4Box.createFile();
    this.file.onError = console.error.bind(console);
    this.file.onReady = this.onReady.bind(this);
    this.file.onSamples = this.onSamples.bind(this);

    fetch(uri).then(response => {
      const reader = response.body.getReader();
      let offset = 0;
      let mp4File = this.file;

      function appendBuffers({done, value}) {
        if(done) {
          mp4File.flush();
          return;
        }

        let buf = value.buffer;
        buf.fileStart = offset;

        offset += buf.byteLength;

        mp4File.appendBuffer(buf);

        return reader.read().then(appendBuffers);
      }

      return reader.read().then(appendBuffers);
    })

    this.info = null;
    this._info_resolver = null;
  }

  onReady(info) {
    // TODO: Generate configuration changes.
    this.info = info;

    if (this._info_resolver) {
      this._info_resolver(info);
      this._info_resolver = null;
    }
  }

  getInfo() {
    if (this.info)
      return Promise.resolve(this.info);

    return new Promise((resolver) => { this._info_resolver = resolver; });
  }

  getAvccBox() {
    // TODO: make sure this is coming from the right track.
    const traks = this.file.moov.traks.filter(trak => trak.mdia.minf.stbl.stsd.entries[0].avcC);
    return traks[0].mdia.minf.stbl.stsd.entries[0].avcC;
  }

  getHvccBox() {
    const traks = this.file.moov.traks.filter(trak => trak.mdia.minf.stbl.stsd.entries[0].hvcC);
    return traks[0].mdia.minf.stbl.stsd.entries[0].hvcC;
  }

  start(track, onChunk) {
    this._onChunk = onChunk;
    this.file.setExtractionOptions(track.id);
    this.file.start();
  }

  onSamples(track_id, ref, samples) {
    for (const sample of samples) {
      const type = sample.is_sync ? "key" : "delta";

      const chunk = new EncodedVideoChunk({
        type: type,
        timestamp: sample.cts,
        duration: sample.duration,
        data: sample.data
      });

      this._onChunk(chunk);
    }
  }
}

class Writer {
  constructor(size) {
    this.data = new Uint8Array(size);
    this.idx = 0;
    this.size = size;
  }

  getData() {
    if(this.idx != this.size)
      throw "Mismatch between size reserved and sized used"

    return this.data.slice(0, this.idx);
  }

  writeUint8(value) {
    this.data.set([value], this.idx);
    this.idx++;
  }

  writeUint16(value) {
    // TODO: find a more elegant solution to endianess.
    var arr = new Uint16Array(1);
    arr[0] = value;
    var buffer = new Uint8Array(arr.buffer);
    this.data.set([buffer[1], buffer[0]], this.idx);
    this.idx +=2;
  }

  writeUint32(value) {
    var arr = new Uint32Array(1);
    arr[0] = value;
    var buffer = new Uint8Array(arr.buffer);
    this.data.set([buffer[3], buffer[2], buffer[1], buffer[0]], this.idx);
    this.idx +=4;
  }

  writeUint8Array(value) {
    this.data.set(value, this.idx);
    this.idx += value.length;
  }
}

class MP4Demuxer {
  constructor(uri) {
    this.source = new MP4Source(uri);
  }

  getAvcExtradata(avccBox) {
    var i;
    var size = 7;
    for (i = 0; i < avccBox.SPS.length; i++) {
      // nalu length is encoded as a uint16.
      size+= 2 + avccBox.SPS[i].length;
    }
    for (i = 0; i < avccBox.PPS.length; i++) {
      // nalu length is encoded as a uint16.
      size+= 2 + avccBox.PPS[i].length;
    }

    var writer = new Writer(size);

    writer.writeUint8(avccBox.configurationVersion);
    writer.writeUint8(avccBox.AVCProfileIndication);
    writer.writeUint8(avccBox.profile_compatibility);
    writer.writeUint8(avccBox.AVCLevelIndication);
    writer.writeUint8(avccBox.lengthSizeMinusOne + (63<<2));

    writer.writeUint8(avccBox.nb_SPS_nalus + (7<<5));
    for (i = 0; i < avccBox.SPS.length; i++) {
      writer.writeUint16(avccBox.SPS[i].length);
      writer.writeUint8Array(avccBox.SPS[i].nalu);
    }

    writer.writeUint8(avccBox.nb_PPS_nalus);
    for (i = 0; i < avccBox.PPS.length; i++) {
      writer.writeUint16(avccBox.PPS[i].length);
      writer.writeUint8Array(avccBox.PPS[i].nalu);
    }

    return writer.getData();
  }

  getHvcExtradata(hvccBox) {
    var i,j;
    var size = 23;

    for (i = 0; i < hvccBox.nalu_arrays.length; i++) {
      size+= 3;
      for (j = 0; j < hvccBox.nalu_arrays[i].length; j++) {
        size+= 2 + hvccBox.nalu_arrays[i][j].data.length;
      }
    }

    var writer = new Writer(size);

    writer.writeUint8(hvccBox.configurationVersion);
    writer.writeUint8(hvccBox.general_profile_space << 6 +
                      hvccBox.general_tier_flag << 5 +
                      hvccBox.general_profile_idc);
    writer.writeUint32(hvccBox.general_profile_compatibility);
    writer.writeUint8Array(hvccBox.general_constraint_indicator);
    writer.writeUint8(hvccBox.general_level_idc);
    writer.writeUint16(hvccBox.min_spatial_segmentation_idc + (15<<24));
    writer.writeUint8(hvccBox.parallelismType + (63<<2));
    writer.writeUint8(hvccBox.chroma_format_idc + (63<<2));
    writer.writeUint8(hvccBox.bit_depth_luma_minus8 + (31<<3));
    writer.writeUint8(hvccBox.bit_depth_chroma_minus8 + (31<<3));
    writer.writeUint16(hvccBox.avgFrameRate);
    writer.writeUint8((hvccBox.constantFrameRate<<6) +
                   (hvccBox.numTemporalLayers<<3) +
                   (hvccBox.temporalIdNested<<2) +
                   hvccBox.lengthSizeMinusOne);
    writer.writeUint8(hvccBox.nalu_arrays.length);
    for (i = 0; i < hvccBox.nalu_arrays.length; i++) {
      // bit(1) array_completeness + bit(1) reserved = 0 + bit(6) nal_unit_type
      writer.writeUint8((hvccBox.nalu_arrays[i].completeness<<7) +
                         hvccBox.nalu_arrays[i].nalu_type);
      writer.writeUint16(hvccBox.nalu_arrays[i].length);
      for (j = 0; j < hvccBox.nalu_arrays[i].length; j++) {
        writer.writeUint16(hvccBox.nalu_arrays[i][j].data.length);
        writer.writeUint8Array(hvccBox.nalu_arrays[i][j].data);
      }
    }

    return writer.getData();
  }

  async getConfig() {
    let info = await this.source.getInfo();
    this.track = info.videoTracks[0];

    var extradata;
    if (this.track.codec.startsWith('avc')) {
      extradata = this.getAvcExtradata(this.source.getAvccBox());
    } else if (this.track.codec.startsWith('hvc') || this.track.codec.startsWith('hev')) {
      extradata = this.getHvcExtradata(this.source.getHvccBox());
    }

    let config = {
      codec: this.track.codec,
      codedHeight: this.track.video.height,
      codedWidth: this.track.video.width,
      description: extradata,
    }

    return Promise.resolve(config);
  }

  start(onChunk) {
    this.source.start(this.track, onChunk);
  }
}
