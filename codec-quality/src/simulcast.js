'use strict';

// Borrowed from:
// https://source.chromium.org/chromium/chromium/src/+/main:third_party/blink/web_tests/external/wpt/webrtc/simulcast/simulcast.js

/* Helper functions to munge SDP and split the sending track into
 * separate tracks on the receiving end. This can be done in a number
 * of ways, the one used here uses the fact that the MID and RID header
 * extensions which are used for packet routing share the same wire
 * format. The receiver interprets the rids from the sender as mids
 * which allows receiving the different spatial resolutions on separate
 * m-lines and tracks.
 */

const ridExtensions = [
  'urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id',
  'urn:ietf:params:rtp-hdrext:sdes:repaired-rtp-stream-id',
];

function ridToMid(description, rids) {
  const sections = SDPUtils.splitSections(description.sdp);
  const dtls = SDPUtils.getDtlsParameters(sections[1], sections[0]);
  const ice = SDPUtils.getIceParameters(sections[1], sections[0]);
  const rtpParameters = SDPUtils.parseRtpParameters(sections[1]);
  const setupValue = SDPUtils.matchPrefix(description.sdp, 'a=setup:')[0].substring(8);
  const direction = SDPUtils.getDirection(sections[1]);
  const mline = SDPUtils.parseMLine(sections[1]);

  // Skip mid extension; we are replacing it with the rid extmap
  rtpParameters.headerExtensions = rtpParameters.headerExtensions.filter(
    ext => ext.uri !== 'urn:ietf:params:rtp-hdrext:sdes:mid'
  );

  for (const ext of rtpParameters.headerExtensions) {
    if (ext.uri === 'urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id') {
      ext.uri = 'urn:ietf:params:rtp-hdrext:sdes:mid';
    }
  }

  // Filter rtx as we have no way to (re)interpret rrid.
  // Not doing this makes probing use RTX, it's not understood and ramp-up is slower.
  rtpParameters.codecs = rtpParameters.codecs.filter(c => c.name.toUpperCase() !== 'RTX');
  if (!rids) {
    rids = SDPUtils.matchPrefix(sections[1], 'a=rid:')
      .filter(line => line.endsWith(' send'))
      .map(line => line.substring(6).split(' ')[0]);
  }

  // Change compared to chromium: writeIceParameters() includes a=candidate
  // lines and we've moved them from the top of the SDP (after DTLS) to being
  // part of the `baseRtpDescription`.
  let sdp = SDPUtils.writeSessionBoilerplate() +
    SDPUtils.writeDtlsParameters(dtls, setupValue) +
    'a=group:BUNDLE ' + rids.join(' ') + '\r\n' +
    'a=msid-semantic: WMS *\r\n';
  let baseRtpDescription =
      SDPUtils.writeRtpDescription(mline.kind, rtpParameters) +
      SDPUtils.writeIceParameters(ice);
  for (const rid of rids) {
    sdp += baseRtpDescription +
        'a=mid:' + rid + '\r\n' +
        'a=msid:rid-' + rid + ' rid-' + rid + '\r\n';
    sdp += 'a=' + direction + '\r\n';
  }
  return sdp;
}

function midToRid(description, localDescription, rids) {
  const sections = SDPUtils.splitSections(description.sdp);
  const dtls = SDPUtils.getDtlsParameters(sections[1], sections[0]);
  const ice = SDPUtils.getIceParameters(sections[1], sections[0]);
  const rtpParameters = SDPUtils.parseRtpParameters(sections[1]);
  const setupValue = description.sdp.match(/a=setup:(.*)/)[1];
  const direction = SDPUtils.getDirection(sections[1]);
  const mline = SDPUtils.parseMLine(sections[1]);

  // Skip rid extensions; we are replacing them with the mid extmap
  rtpParameters.headerExtensions = rtpParameters.headerExtensions.filter(
    ext => !ridExtensions.includes(ext.uri)
  );

  for (const ext of rtpParameters.headerExtensions) {
    if (ext.uri === 'urn:ietf:params:rtp-hdrext:sdes:mid') {
      ext.uri = 'urn:ietf:params:rtp-hdrext:sdes:rtp-stream-id';
    }
  }

  const localMid = localDescription ? SDPUtils.getMid(SDPUtils.splitSections(localDescription.sdp)[1]) : '0';
  if (localDescription) {
    const localVideoSection = SDPUtils.splitSections(localDescription.sdp)[1];
    const localParameters = SDPUtils.parseRtpParameters(localVideoSection);

    const localMidExtension = localParameters.headerExtensions
      .find(ext => ext.uri === 'urn:ietf:params:rtp-hdrext:sdes:mid');
    if (localMidExtension) {
      rtpParameters.headerExtensions.push(localMidExtension);
    }
  } else {
    // Find unused id in remote description to formally have a mid.
    for (let id = 1; id < 15; id++) {
      if (rtpParameters.headerExtensions.find(ext => ext.id === id) === undefined) {
        rtpParameters.headerExtensions.push(
          {id, uri: 'urn:ietf:params:rtp-hdrext:sdes:mid'});
        break;
      }
    }
  }

  if (!rids) {
    rids = [];
    for (let i = 1; i < sections.length; i++) {
      rids.push(SDPUtils.getMid(sections[i]));
    }
  }

  let sdp = SDPUtils.writeSessionBoilerplate() +
    SDPUtils.writeDtlsParameters(dtls, setupValue) +
    SDPUtils.writeIceParameters(ice) +
    'a=group:BUNDLE ' + localMid + '\r\n' +
    'a=msid-semantic: WMS *\r\n';
  sdp += SDPUtils.writeRtpDescription(mline.kind, rtpParameters);
  // Although we are converting mids to rids, we still need a mid.
  // The first one will be consistent with trickle ICE candidates.
  sdp += 'a=mid:' + localMid + '\r\n';
  sdp += 'a=' + direction + '\r\n';

  for (const rid of rids) {
    const stringrid = String(rid); // allow integers
    const choices = stringrid.split(',');
    choices.forEach(choice => {
      sdp += 'a=rid:' + choice + ' recv\r\n';
    });
  }
  if (rids.length) {
    sdp += 'a=simulcast:recv ' + rids.join(';') + '\r\n';
  }

  return sdp;
}

async function doOfferToSendSimulcast(offerer, answerer) {
  await offerer.setLocalDescription();

  // Is this a renegotiation? If so, we cannot remove (or reorder!) any mids,
  // even if some rids have been removed or reordered.
  let mids = [];
  if (answerer.localDescription) {
    // Renegotiation. Mids must be the same as before, because renegotiation
    // can never remove or reorder mids, nor can it expand the simulcast
    // envelope.
    const sections = SDPUtils.splitSections(answerer.localDescription.sdp);
    sections.shift();
    mids = sections.map(section => SDPUtils.getMid(section));
  } else {
    // First negotiation; the mids will be exactly the same as the rids
    const simulcastAttr = SDPUtils.matchPrefix(offerer.localDescription.sdp,
      'a=simulcast:send ')[0];
    if (simulcastAttr) {
      mids = simulcastAttr.split(' ')[1].split(';');
    }
  }

  const nonSimulcastOffer = ridToMid(offerer.localDescription, mids);
  await answerer.setRemoteDescription({
    type: 'offer',
    sdp: nonSimulcastOffer,
  });
}

async function doAnswerToRecvSimulcast(offerer, answerer, rids) {
  await answerer.setLocalDescription();
  const simulcastAnswer = midToRid(
    answerer.localDescription,
    offerer.localDescription,
    rids
  );
  await offerer.setRemoteDescription({ type: 'answer', sdp: simulcastAnswer });
}

async function doOfferToRecvSimulcast(offerer, answerer, rids) {
  await offerer.setLocalDescription();
  const simulcastOffer = midToRid(
    offerer.localDescription,
    answerer.localDescription,
    rids
  );
  await answerer.setRemoteDescription({ type: 'offer', sdp: simulcastOffer });
}

async function doAnswerToSendSimulcast(offerer, answerer) {
  await answerer.setLocalDescription();

  // See which mids the offerer had; it will barf if we remove or reorder them.
  const sections = SDPUtils.splitSections(offerer.localDescription.sdp);
  sections.shift();
  const mids = sections.map(section => SDPUtils.getMid(section));
  let nonSimulcastAnswer = ridToMid(answerer.localDescription, mids);
  // Restore MID RTP header extension.
  const localParameters = SDPUtils.parseRtpParameters(sections[0]);

  const localMidExtension = localParameters.headerExtensions
    .find(ext => ext.uri === 'urn:ietf:params:rtp-hdrext:sdes:mid');
  if (localMidExtension) {
    nonSimulcastAnswer += SDPUtils.writeExtmap(localMidExtension);
  }
  await offerer.setRemoteDescription({
    type: 'answer',
    sdp: nonSimulcastAnswer,
  });
}

async function doOfferToSendSimulcastAndAnswer(offerer, answerer, rids) {
  await doOfferToSendSimulcast(offerer, answerer);
  await doAnswerToRecvSimulcast(offerer, answerer, rids);
}

async function doOfferToRecvSimulcastAndAnswer(offerer, answerer, rids) {
  await doOfferToRecvSimulcast(offerer, answerer, rids);
  await doAnswerToSendSimulcast(offerer, answerer);
}

function swapRidAndMidExtensionsInSimulcastOffer(offer, rids) {
  return ridToMid(offer, rids);
}

function swapRidAndMidExtensionsInSimulcastAnswer(answer, localDescription, rids) {
  return midToRid(answer, localDescription, rids);
}

async function negotiateWithSimulcastTweaks(
    pc1, pc2, offer, callbackBetweenOfferAndAnswer) {
  const rids = [0, 1, 2];
  if (!offer) {
    offer = await pc1.createOffer();
    await pc1.setLocalDescription(offer);
  }
  await pc2.setRemoteDescription({
    type: 'offer',
    sdp: swapRidAndMidExtensionsInSimulcastOffer(offer, rids),
  });
  if (callbackBetweenOfferAndAnswer) {
    callbackBetweenOfferAndAnswer();
  }
  const answer = await pc2.createAnswer();
  await pc2.setLocalDescription(answer);
  const modifiedAnswer = {
    type: 'answer',
    sdp: swapRidAndMidExtensionsInSimulcastAnswer(answer, offer, rids),
  }
  if (pc1) {
    await pc1.setRemoteDescription(modifiedAnswer);
  }
  return modifiedAnswer;
}
