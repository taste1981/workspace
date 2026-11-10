// The demo page. It checks which 10-bit profiles the GPU can encode, decodes
// the first frames of an HDR10 clip, lets you design the reference structure,
// transcodes the frames with Chrome's hardware encoder, and reads the output
// bitstream back to show what the encoder did.

import {isHdrTransfer, matrixName, primariesName, transferName}
    from './cicp.js';
import {writeIvf} from './ivf.js';
import {clonePlan, FRAME_COUNT, PRESETS, simulate} from './refs.js';
import {analyzeOutput, decodeChunks, encodeFrames, encoderConfig, loadSource,
        manualReferencesAvailable, TARGETS} from './transcode.js';

const SOURCE_URL = 'media/bear-1280x720-hevc-10bit-hdr10.hevc';

// Reference buffers the editor offers. Chrome's D3D12 HEVC encoder exposes
// two, and its AV1 encoder up to seven, of which the editor uses three.
const EDITOR_BUFFERS = {hevc: 2, av1: 3};
const BUFFER_COLORS = ['var(--b0)', 'var(--b1)', 'var(--b2)'];
const THUMB_WIDTH = 320;
const THUMB_HEIGHT = 180;
const PLAY_INTERVAL_MS = 400;

const $ = (id) => document.getElementById(id);
const range = (n) => Array.from({length: n}, (_, i) => i);

const state = {
  manual: manualReferencesAvailable(),
  // Per target id: {hardware, manual, l1t2}, from isConfigSupported().
  support: new Map(),
  system: {},
  source: null,
  presetId: null,
  plan: null,
  rateControl: 'variable',
  busy: false,
  error: null,
  result: null,
  selected: 0,
  timer: null,
  urls: [],
};

// DOM helpers

// Creates an element. Attributes that are false, null or undefined are left
// out, and `on*` attributes add event listeners.
function el(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value === null || value === undefined) {
      continue;
    }
    if (name.startsWith('on')) {
      node.addEventListener(name.slice(2), value);
    } else {
      node.setAttribute(name, value === true ? '' : value);
    }
  }
  node.append(...children.flat().filter(
      (child) => child !== null && child !== undefined && child !== false));
  return node;
}

function svgEl(tag, attributes = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) {
    node.setAttribute(name, value);
  }
  return node;
}

// Formatting

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

const formatBytes = (n) => n < 1024 * 1024
    ? `${(n / 1024).toFixed(1)} KB`
    : `${(n / 1024 / 1024).toFixed(2)} MB`;

function formatPsnr(db) {
  if (db === null || db === undefined) {
    return '—';
  }
  return db === Infinity ? '∞ dB' : `${db.toFixed(1)} dB`;
}

// "frame 2", "frames 2 and 0", "frames 1, 2 and 3".
function frameList(indices) {
  if (indices.length < 2) {
    return `frame ${indices[0]}`;
  }
  return `frames ${indices.slice(0, -1).join(', ')} and ${indices.at(-1)}`;
}

const capitalize = (text) => text[0].toUpperCase() + text.slice(1);

const sameSet = (a, b) =>
    new Set(a).size === new Set(b).size && a.every((x) => b.includes(x));

const xy = ([x, y]) => `(${x.toFixed(4)}, ${y.toFixed(4)})`;
const near = (a, b, tolerance = 0.002) =>
    Math.abs(a[0] - b[0]) <= tolerance && Math.abs(a[1] - b[1]) <= tolerance;

const GAMUTS = {
  'Display P3': [[0.68, 0.32], [0.265, 0.69], [0.15, 0.06]],
  'BT.2020': [[0.708, 0.292], [0.17, 0.797], [0.131, 0.046]],
  'BT.709': [[0.64, 0.33], [0.3, 0.6], [0.15, 0.06]],
};
const D65 = [0.3127, 0.329];

function gamutName({red, green, blue}) {
  return Object.keys(GAMUTS).find((name) => {
    const [r, g, b] = GAMUTS[name];
    return near(red, r) && near(green, g) && near(blue, b);
  }) ?? null;
}

const formatNits = (value) =>
    value >= 10 ? value.toFixed(0) : String(Number(value.toFixed(4)));

function formatMdcv(mdcv) {
  if (!mdcv) {
    return 'None';
  }
  const primaries = gamutName(mdcv) ??
      `R ${xy(mdcv.red)} G ${xy(mdcv.green)} B ${xy(mdcv.blue)}`;
  const white = near(mdcv.white, D65) ? 'D65' : xy(mdcv.white);
  const luminance = `${formatNits(mdcv.minLuminance)}–` +
                    `${formatNits(mdcv.maxLuminance)} nits`;
  return `${primaries} primaries, ${white} white, ${luminance}`;
}

const formatCll = (cll) =>
    cll ? `MaxCLL ${cll.maxCll} nits, MaxFALL ${cll.maxFall} nits` : 'None';

// HEVC stores chromaticities in steps of 0.00002 and AV1 in steps of 1/65536,
// so a round trip between them isn't exact.
function sameMdcv(a, b) {
  if (!a || !b) {
    return !a && !b;
  }
  return ['red', 'green', 'blue', 'white'].every(
             (key) => near(a[key], b[key], 0.0005)) &&
         Math.abs(a.maxLuminance - b.maxLuminance) <= 0.5 &&
         Math.abs(a.minLuminance - b.minLuminance) <= 0.0005;
}

function sameCll(a, b) {
  if (!a || !b) {
    return !a && !b;
  }
  return a.maxCll === b.maxCll && a.maxFall === b.maxFall;
}

const formatRange = (color) => color.fullRange ? 'Full' : 'Limited';

const describeColor = (color) =>
    `${primariesName(color.primaries)} · ${transferName(color.transfer)} · ` +
    `${matrixName(color.matrix)} · ${formatRange(color).toLowerCase()} range`;

function dynamicRange(color, hdr) {
  if (!isHdrTransfer(color.transfer)) {
    return 'SDR';
  }
  if (color.transfer === 18) {
    return 'HDR (HLG)';
  }
  return hdr.mdcv || hdr.cll ? 'HDR10 (PQ with static metadata)' : 'HDR (PQ)';
}

function describeRate({rateControl, bitrate, quantizer}) {
  if (rateControl === 'quantizer') {
    return `quantizer ${quantizer}`;
  }
  return `${rateControl === 'constant' ? 'CBR' : 'VBR'} at ` +
         `${bitrate / 1_000_000} Mbps`;
}

// Writes `value` as a JavaScript literal, for the configuration listing.
function formatValue(value, indent = '') {
  if (typeof value === 'string') {
    return `'${value}'`;
  }
  if (typeof value === 'number' && Number.isInteger(value) && value >= 10000) {
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '_');
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (!indent && entries.length > 2) {
      return `{\n${entries.map(([key, item]) =>
          `  ${key}: ${formatValue(item, '  ')},`).join('\n')}\n}`;
    }
    return `{${entries.map(([key, item]) =>
        `${key}: ${formatValue(item, '  ')}`).join(', ')}}`;
  }
  return String(value);
}

// System information

async function browserName() {
  const data = navigator.userAgentData;
  if (!data) {
    return navigator.userAgent;
  }
  const values = await data.getHighEntropyValues(
      ['fullVersionList', 'platformVersion']).catch(() => ({}));
  const brands = values.fullVersionList ?? data.brands;
  const brand =
      brands.find((b) => !/not.?a.?brand/i.test(b.brand) &&
                         b.brand !== 'Chromium') ??
      brands.find((b) => b.brand === 'Chromium');
  let platform = data.platform;
  if (platform === 'Windows' && values.platformVersion) {
    // Windows 11 reports platform versions from 13 up.
    platform = parseInt(values.platformVersion, 10) >= 13 ? 'Windows 11'
                                                         : 'Windows 10';
  }
  const name = brand ? `${brand.brand.replace(/^Google /, '')} ${brand.version}`
                     : 'Unknown browser';
  return `${name} on ${platform}`;
}

function gpuName() {
  const gl = document.createElement('canvas').getContext('webgl');
  if (!gl) {
    return null;
  }
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer =
      gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER);
  gl.getExtension('WEBGL_lose_context')?.loseContext();
  // For example "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti (0x00002182)
  // Direct3D11 vs_5_0 ps_5_0, D3D11)".
  const match = /^ANGLE \([^,]*, (.+?)(?: \(0x[0-9a-f]+\))? Direct3D/i
      .exec(renderer);
  return match ? match[1] : renderer;
}

async function renderSystem() {
  const items = {
    'Browser': await browserName(),
    'GPU': gpuName() ?? 'Unknown',
    'Display': matchMedia('(dynamic-range: high)').matches ? 'HDR' : 'SDR',
    'Manual references': state.manual ? 'On' : 'Off',
  };
  state.system = items;
  $('system').replaceChildren(...Object.entries(items).map(
      ([name, value]) => el('li', {}, el('b', {}, name), value)));
}

// Step 1: capabilities

async function probeTargets() {
  const base = {width: 1280, height: 720, bitrate: 6_000_000, framerate: 30,
                hardwareAcceleration: 'prefer-hardware'};
  const supported = async (config) => {
    try {
      return (await VideoEncoder.isConfigSupported(config)).supported;
    } catch {
      return false;
    }
  };
  await Promise.all(TARGETS.map(async (target) => {
    const config = {...base, codec: target.codec};
    const hardware = await supported(config);
    state.support.set(target.id, {
      hardware,
      manual: hardware && state.manual &&
          await supported({...config, scalabilityMode: 'manual'}),
      l1t2: hardware && await supported({...config, scalabilityMode: 'L1T2'}),
    });
    renderCapabilities();
  }));
}

function renderCapabilities() {
  $('cap-grid').replaceChildren(...TARGETS.map((target) => {
    const support = state.support.get(target.id);
    const pills = [];
    if (!support) {
      pills.push(el('span', {class: 'pill pending'}, 'Checking…'));
    } else if (!support.hardware) {
      pills.push(el('span', {class: 'pill bad'}, 'Not on this GPU'));
    } else {
      pills.push(el('span', {class: 'pill good'}, 'Hardware'));
      if (state.manual && !support.manual) {
        pills.push(el('span', {class: 'pill bad'}, 'No manual references'));
      }
    }
    return el('div', {class: 'cap'},
              el('h4', {}, target.label),
              el('p', {}, target.detail, el('br'),
                 el('code', {}, target.codec)),
              el('div', {class: 'pills'}, pills));
  }));
}

const currentTarget = () =>
    TARGETS.find((target) => target.id === $('target').value) ?? TARGETS[0];

function renderTargets() {
  const select = $('target');
  const current = select.value;
  select.replaceChildren(...TARGETS.map((target) => {
    const unavailable = state.support.get(target.id)?.hardware === false;
    return el('option', {value: target.id, disabled: unavailable},
              `${target.label} · ${target.detail}` +
              (unavailable ? ' (not on this GPU)' : ''));
  }));
  const usable = TARGETS.filter(
      (target) => state.support.get(target.id)?.hardware !== false);
  select.value = usable.some((target) => target.id === current)
      ? current
      : (usable[0] ?? TARGETS[0]).id;
}

// Step 2: source

// Draws a decoded frame into an sRGB canvas, which tone maps HDR video, and
// keeps the picture, a thumbnail, and the luma used for PSNR.
async function rasterize(frame) {
  const width = frame.displayWidth;
  const height = frame.displayHeight;
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d', {willReadFrequently: true});
  context.drawImage(frame, 0, 0, width, height);
  const {data} = context.getImageData(0, 0, width, height);
  const luma = new Float32Array(width * height);
  for (let i = 0, p = 0; i < luma.length; i++, p += 4) {
    luma[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
  }
  const scale = Math.min(THUMB_WIDTH / width, THUMB_HEIGHT / height);
  return {
    width,
    height,
    luma,
    image: await createImageBitmap(canvas),
    thumb: await createImageBitmap(canvas, {
      resizeWidth: Math.round(width * scale),
      resizeHeight: Math.round(height * scale),
      resizeQuality: 'high',
    }),
  };
}

function psnr(a, b) {
  if (!a || !b || a.length !== b.length) {
    return null;
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  const mse = sum / a.length;
  return mse === 0 ? Infinity : 10 * Math.log10(255 * 255 / mse);
}

function thumbCanvas(bitmap) {
  const canvas = el('canvas', {width: THUMB_WIDTH, height: THUMB_HEIGHT});
  if (bitmap) {
    canvas.getContext('2d').drawImage(
        bitmap, (THUMB_WIDTH - bitmap.width) / 2,
        (THUMB_HEIGHT - bitmap.height) / 2);
  }
  return canvas;
}

async function loadSourceBytes(name, bytes) {
  const previous = state.source;
  $('source-name').textContent = `Decoding ${name}…`;
  try {
    const source = loadSource(bytes, FRAME_COUNT);
    const frames = await decodeChunks(source.codec, source.chunks, FRAME_COUNT);
    let pictures;
    try {
      if (frames.length < FRAME_COUNT) {
        throw new Error(`the demo needs ${FRAME_COUNT} frames, and it ` +
                        `decoded to ${frames.length}`);
      }
      pictures = await Promise.all(frames.map(rasterize));
    } finally {
      frames.forEach((frame) => frame.close());
    }
    state.source = {...source, name, size: bytes.length, pictures,
                    width: pictures[0].width, height: pictures[0].height};
  } catch (e) {
    $('source-name').textContent = `Couldn't use ${name}: ${e.message}` +
        (previous ? `. Still using ${previous.name}.` : '');
    return;
  }
  stopPlayback();
  state.result = null;
  state.error = null;
  $('results').hidden = true;
  renderSource();
  renderEditor({animate: true});
}

async function fetchDefaultSource() {
  const name = SOURCE_URL.split('/').pop();
  try {
    const response = await fetch(SOURCE_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    await loadSourceBytes(name, new Uint8Array(await response.arrayBuffer()));
  } catch (e) {
    $('source-name').textContent = `Couldn't load ${name}: ${e.message}`;
  }
}

function renderSource() {
  const {name, size, codec, info, hdr, pictures} = state.source;
  $('source-name').textContent =
      `${name} · ${formatBytes(size)} · the first ${FRAME_COUNT} frames`;
  $('source-strip').replaceChildren(...pictures.map((picture, i) =>
      el('div', {class: 'thumb'}, thumbCanvas(picture.thumb),
         el('span', {class: 'frame-no'}, `Frame ${i}`))));
  const facts = {
    'Codec': `${info.profile} · ${codec}`,
    'Format': `${info.width}×${info.height}, ` +
              `${info.bitDepth}-bit ${info.chroma}`,
    'Color': describeColor(info.color),
    'Dynamic range': dynamicRange(info.color, hdr),
    'Mastering display': formatMdcv(hdr.mdcv),
    'Content light level': formatCll(hdr.cll),
  };
  $('source-facts').replaceChildren(...Object.entries(facts).map(
      ([term, value]) =>
          el('div', {}, el('dt', {}, term), el('dd', {}, value))));
}

// Step 3: reference structure

const currentPreset = () =>
    PRESETS.find((preset) => preset.id === state.presetId) ?? null;

function editorContext() {
  const {family} = currentTarget();
  return {family, bufferCount: EDITOR_BUFFERS[family]};
}

function selectPreset(id) {
  state.presetId = id;
  state.plan = clonePlan(currentPreset().frames);
  state.error = null;
  renderEditor({animate: true});
}

function editPlan(change) {
  change(state.plan);
  state.presetId = PRESETS.find((preset) =>
      JSON.stringify(preset.frames) === JSON.stringify(state.plan))?.id ?? null;
  state.error = null;
  renderEditor();
}

function toggleReference(i, buffer) {
  editPlan((plan) => {
    const {refs} = plan[i];
    const at = refs.indexOf(buffer);
    if (at >= 0) {
      refs.splice(at, 1);
    } else {
      refs.push(buffer);
    }
  });
}

function setUpdate(i, buffer) {
  editPlan((plan) => {
    plan[i].update = buffer;
  });
}

function toggleKey(i) {
  editPlan((plan) => {
    plan[i].key = !plan[i].key;
    plan[i].refs = plan[i].key ? [] : [0];
  });
}

function renderPresets() {
  $('presets').replaceChildren(...PRESETS.map((preset) => {
    const usable = state.manual || preset.scalabilityMode;
    return el('button', {
      'aria-pressed': String(preset.id === state.presetId),
      'disabled': !usable || state.busy,
      'title': usable ? null : 'Needs manual reference control',
      'onclick': () => selectPreset(preset.id),
    }, preset.name);
  }));
  const preset = currentPreset();
  let description = preset?.description ?? 'Your own structure.';
  if (!state.manual && preset) {
    description += ` The encoder makes it for scalabilityMode ` +
                   `'${preset.scalabilityMode}'.`;
  }
  $('preset-description').textContent = description;
}

function bufferChip(buffer, pressed, editable, onclick) {
  return el('button', {
    'class': editable ? 'chip' : 'chip static',
    'aria-pressed': String(pressed),
    'style': buffer === null ? null : `--chip-color: ${BUFFER_COLORS[buffer]}`,
    'tabindex': editable ? null : '-1',
    'onclick': editable ? onclick : null,
  }, buffer === null ? 'None' : `B${buffer}`);
}

const row = (label, content) =>
    el('div', {}, el('span', {class: 'row-label'}, label), content);

function planCard(i, step, family, bufferCount, editable) {
  const picture = state.source?.pictures[i];
  const predicts = step.key
      ? el('span', {class: 'note'}, 'Nothing: key frames stand alone')
      : el('div', {class: 'chips'}, range(bufferCount).map((b) =>
            bufferChip(b, step.refs.includes(b), editable,
                       () => toggleReference(i, b))));
  const stores = step.key && family === 'av1'
      ? el('span', {class: 'note'}, 'Every buffer: AV1 key frames refresh all')
      : el('div', {class: 'chips'},
           range(bufferCount).map((b) => bufferChip(
               b, step.update === b, editable, () => setUpdate(i, b))),
           bufferChip(null, step.update === null, editable,
                      () => setUpdate(i, null)));
  return el('div', {class: 'frame-card'},
            el('div', {class: 'thumb'}, thumbCanvas(picture?.thumb),
               el('span', {class: 'frame-no'}, `Frame ${i}`),
               el('span', {class: `badge ${step.key ? 'key' : 'delta'}`},
                  step.key ? 'KEY' : 'DELTA')),
            row('Predicts from', predicts),
            row('Then stores in', stores),
            i > 0 && editable
                ? el('button', {class: 'link', onclick: () => toggleKey(i)},
                     step.key ? 'Make it a delta frame' : 'Make it a key frame')
                : null);
}

function bufferTable(simulation, bufferCount) {
  return el('table', {},
      el('thead', {}, el('tr', {}, el('th', {}, 'Buffer'),
          range(FRAME_COUNT).map((i) => el('th', {}, `After frame ${i}`)))),
      el('tbody', {}, range(bufferCount).map((b) => {
        const color = `--chip-color: ${BUFFER_COLORS[b]}`;
        return el('tr', {},
            el('td', {}, el('span', {class: 'slot', style: color}, `B${b}`)),
            simulation.steps.map(({buffersAfter}, i) => {
              const frame = buffersAfter[b];
              if (frame === null) {
                return el('td', {}, el('span', {class: 'slot empty'}, 'empty'));
              }
              return el('td', {}, el('span', {
                class: frame === i ? 'slot changed' : 'slot',
                style: color,
              }, `F${frame}`));
            }));
      })));
}

function renderValidation(simulation, family, bufferCount) {
  const node = $('validation');
  const {errors} = simulation;
  if (errors.length) {
    node.className = 'validation bad';
    node.textContent = `✗ ${errors[0]}` + (errors.length > 1
        ? ` (and ${plural(errors.length - 1, 'more problem')})` : '');
    return;
  }
  const dropped = state.plan.flatMap(
      (step, i) => !step.key && step.update === null ? [i] : []);
  node.className = 'validation good';
  node.textContent =
      `✓ Valid for ${family === 'av1' ? 'AV1' : 'HEVC'} with ` +
      `${plural(bufferCount, 'buffer')}.` + (dropped.length
          ? ` ${capitalize(frameList(dropped))} ` +
            `${dropped.length === 1 ? 'is' : 'are'} never stored, so a ` +
            `receiver can drop ${dropped.length === 1 ? 'it' : 'them'} ` +
            'without affecting other frames.'
          : '');
}

// The frames each buffer holds just before frame `i`.
const buffersBefore = (simulation, i) =>
    i ? simulation.steps[i - 1].buffersAfter : [];

function planArcs(plan, simulation) {
  return plan.flatMap((step, i) => {
    if (step.key) {
      return [];
    }
    const before = buffersBefore(simulation, i);
    return step.refs.filter((b) => (before[b] ?? null) !== null)
        .map((b) => ({from: before[b], to: i, color: BUFFER_COLORS[b],
                      label: `B${b}`}));
  });
}

function renderEditor({animate = false} = {}) {
  renderPresets();
  const {family, bufferCount} = editorContext();
  const simulation = simulate(state.plan, {family, bufferCount});
  const editable = state.manual && !state.busy;
  $('timeline').replaceChildren(...state.plan.map(
      (step, i) => planCard(i, step, family, bufferCount, editable)));
  $('buffer-grid').replaceChildren(bufferTable(simulation, bufferCount));
  renderValidation(simulation, family, bufferCount);
  drawArcs($('plan-arcs'), planArcs(state.plan, simulation), animate);
  updateTranscodeButton();
}

// Draws prediction arcs above the frame cards in the same wrapper as `svg`.
// Each arc runs from the referenced frame to the frame that predicts from it.
function drawArcs(svg, arcs, animate) {
  svg.arcs = arcs;
  svg.replaceChildren();
  svg.classList.toggle('animate', animate);
  const wrap = svg.parentElement;
  const cards = [...wrap.querySelectorAll('.frame-card')];
  if (!cards.length || getComputedStyle(svg).display === 'none') {
    return;
  }
  const box = wrap.getBoundingClientRect();
  svg.drawnWidth = box.width;
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  const defs = svgEl('defs');
  svg.append(defs);
  const markers = new Map();
  const markerFor = (color) => {
    if (!markers.has(color)) {
      const id = `${svg.id}-arrow-${markers.size}`;
      const marker = svgEl('marker', {
        id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 6,
        markerHeight: 6, orient: 'auto-start-reverse',
      });
      marker.append(svgEl('path', {d: 'M0,1 L9,5 L0,9 z',
                                   style: `fill: ${color}; stroke: none`}));
      defs.append(marker);
      markers.set(color, id);
    }
    return markers.get(color);
  };
  const anchors = cards.map((card) => {
    const r = card.getBoundingClientRect();
    return {x: r.left - box.left + r.width / 2, y: r.top - box.top - 4,
            out: 0, in: 0};
  });
  for (const arc of arcs) {
    const from = anchors[arc.from];
    const to = anchors[arc.to];
    if (!from || !to) {
      continue;
    }
    // Spread the ends of arcs that share a card.
    const x1 = from.x + 10 + 12 * from.out++;
    const x2 = to.x - 10 - 12 * to.in++;
    const lift = Math.min(84, 34 + 14 * Math.abs(arc.to - arc.from));
    svg.append(svgEl('path', {
      'd': `M ${x1} ${from.y} C ${x1} ${from.y - lift}, ` +
           `${x2} ${to.y - lift}, ${x2} ${to.y}`,
      'style': `stroke: ${arc.color}`,
      'marker-end': `url(#${markerFor(arc.color)})`,
    }));
    if (arc.label) {
      // A cubic with both control points `lift` high peaks at 3/4 of it.
      const label = svgEl('text', {
        'x': (x1 + x2) / 2, 'y': from.y - 0.75 * lift - 6,
        'text-anchor': 'middle', 'class': 'label',
        'style': `fill: ${arc.color}`,
      });
      label.textContent = arc.label;
      svg.append(label);
    }
  }
}

// Step 4: encode

function transcodeBlocker() {
  if (!state.source) {
    return 'Waiting for the source frames…';
  }
  const target = currentTarget();
  const support = state.support.get(target.id);
  if (!support) {
    return 'Checking what this GPU can encode…';
  }
  if (!support.hardware) {
    return `This GPU can't encode ${target.label} in hardware.`;
  }
  if (state.manual) {
    if (!support.manual) {
      return `The ${target.label} encoder doesn't support manual reference ` +
             'control.';
    }
    if (simulate(state.plan, editorContext()).errors.length) {
      return 'Fix the reference structure to transcode.';
    }
    return null;
  }
  const preset = currentPreset();
  if (!preset?.scalabilityMode) {
    return 'Pick a structure that a scalability mode can make.';
  }
  if (preset.scalabilityMode === 'L1T2' && !support.l1t2) {
    return `The ${target.label} encoder doesn't support L1T2.`;
  }
  return null;
}

function setStatus(text, bad = false) {
  $('status').textContent = text;
  $('status').className = bad ? 'status bad' : 'status';
}

function updateTranscodeButton() {
  const blocker = transcodeBlocker();
  $('transcode').disabled = state.busy || blocker !== null;
  if (state.busy) {
    return;
  }
  if (state.error) {
    setStatus(state.error, true);
  } else {
    setStatus(blocker ?? '');
  }
}

function updateRateControls() {
  for (const button of $('rate-control').querySelectorAll('button')) {
    button.setAttribute('aria-pressed',
                        String(button.dataset.mode === state.rateControl));
    button.disabled = state.busy;
  }
  $('bitrate-control').hidden = state.rateControl === 'quantizer';
  $('quantizer-control').hidden = state.rateControl !== 'quantizer';
  // WebCodecs quantizers go up to 51 for HEVC and 63 for AV1.
  const quantizer = $('quantizer');
  quantizer.max = currentTarget().family === 'av1' ? 63 : 51;
  quantizer.value = Math.min(Number(quantizer.value), Number(quantizer.max));
  $('bitrate-value').textContent = `${$('bitrate').value} Mbps`;
  $('quantizer-value').textContent = quantizer.value;
}

function setBusy(busy) {
  state.busy = busy;
  $('target').disabled = busy;
  $('source-file').disabled = busy;
  $('bitrate').disabled = busy;
  $('quantizer').disabled = busy;
  updateRateControls();
  renderEditor();
}

const STAGES = ['decode', 'encode', 'parse', 'verify'];

function setStage(stage, status) {
  $('pipeline').querySelector(`[data-stage="${stage}"]`).className = status;
}

async function transcode() {
  const target = currentTarget();
  const source = state.source;
  const plan = clonePlan(state.plan);
  const preset = currentPreset();
  const settings = {
    width: source.width,
    height: source.height,
    rateControl: state.rateControl,
    bitrate: Number($('bitrate').value) * 1_000_000,
    quantizer: Number($('quantizer').value),
    manual: state.manual,
    scalabilityMode: state.manual ? null : preset.scalabilityMode,
  };
  stopPlayback();
  state.error = null;
  $('results').hidden = true;
  STAGES.forEach((stage) => setStage(stage, ''));
  setBusy(true);
  let stage = 'decode';
  const enter = (next, message) => {
    setStage(stage, 'done');
    stage = next;
    setStage(stage, 'active');
    setStatus(message);
  };
  try {
    setStage(stage, 'active');
    setStatus('Decoding the source on the GPU…');
    const frames =
        await decodeChunks(source.codec, source.chunks, FRAME_COUNT);
    let encoded;
    try {
      enter('encode', `Encoding with ${target.label}…`);
      encoded = await encodeFrames(frames, target, settings, plan,
          (i, chunk) => setStatus(
              `Encoded frame ${i}: ${formatBytes(chunk.data.length)}`));
    } finally {
      frames.forEach((frame) => frame.close());
    }
    enter('parse', 'Reading the output bitstream…');
    const analysis = analyzeOutput(target.family, encoded.chunks);
    enter('verify', 'Decoding the output…');
    let output = null;
    let verifyError = null;
    try {
      const decoded = await decodeChunks(
          encoded.decoderConfig?.codec ?? target.codec, encoded.chunks);
      try {
        output = await Promise.all(decoded.map(rasterize));
      } finally {
        decoded.forEach((frame) => frame.close());
      }
    } catch (e) {
      verifyError = e;
    }
    setStage(stage, verifyError ? 'failed' : 'done');
    setBusy(false);
    renderResults({target, source, plan, preset, settings, encoded, analysis,
                   output, verifyError});
  } catch (e) {
    setStage(stage, 'failed');
    state.error = `${capitalize(stage)} failed: ${e.message}`;
    setBusy(false);
  }
}

// Step 5: results

function compareRows(source, analysis) {
  const rows = [];
  // `preserve` rows should come through the transcode unchanged; the others
  // change with the output profile.
  const add = (label, from, to, preserve, same = from === to) => rows.push(
      {label, source: from, output: to,
       verdict: same ? 'same' : preserve ? 'lost' : 'changed'});
  const src = source.info;
  const out = analysis.info;
  add('Profile', src.profile, out?.profile ?? '—', false);
  add('Bit depth', `${src.bitDepth}-bit`, out ? `${out.bitDepth}-bit` : '—',
      false);
  add('Chroma', src.chroma, out?.chroma ?? '—', false);
  const color = (info, name) => info?.color.described
      ? name(info.color) : 'Not signaled';
  add('Color primaries', color(src, (c) => primariesName(c.primaries)),
      color(out, (c) => primariesName(c.primaries)), true);
  add('Transfer', color(src, (c) => transferName(c.transfer)),
      color(out, (c) => transferName(c.transfer)), true);
  add('Matrix', color(src, (c) => matrixName(c.matrix)),
      color(out, (c) => matrixName(c.matrix)), true);
  add('Range', formatRange(src.color), out ? formatRange(out.color) : '—',
      true);
  add('Mastering display', formatMdcv(source.hdr.mdcv),
      formatMdcv(analysis.hdr.mdcv), true,
      sameMdcv(source.hdr.mdcv, analysis.hdr.mdcv));
  add('Content light level', formatCll(source.hdr.cll),
      formatCll(analysis.hdr.cll), true,
      sameCll(source.hdr.cll, analysis.hdr.cll));
  return rows;
}

function configCode({settings, encoded, plan, target}) {
  const lines = [
    'const encoder = new VideoEncoder({output, error});',
    `encoder.configure(${formatValue(encoded.config)});`,
  ];
  if (settings.manual) {
    lines.push('const buffers = encoder.getAllFrameBuffers();  // ' +
               `${plural(encoded.bufferCount, 'buffer')} here`);
  }
  lines.push('');
  plan.forEach((step, i) => {
    const options = [`keyFrame: ${step.key}`];
    if (settings.manual && !step.key) {
      options.push('referenceBuffers: ' +
                   `[${step.refs.map((b) => `buffers[${b}]`).join(', ')}]`);
    }
    if (settings.manual && step.update !== null) {
      options.push(`updateBuffer: buffers[${step.update}]`);
    }
    if (settings.rateControl === 'quantizer') {
      options.push(`${target.family}: {quantizer: ${settings.quantizer}}`);
    }
    lines.push(`encoder.encode(frames[${i}], {${options.join(', ')}});`);
  });
  return lines.join('\n');
}

function concatChunks(chunks) {
  const out = new Uint8Array(chunks.reduce((n, c) => n + c.data.length, 0));
  let pos = 0;
  for (const {data} of chunks) {
    out.set(data, pos);
    pos += data.length;
  }
  return out;
}

function report(run, rows) {
  const {target, source, settings, encoded, analysis, plan, frames} = run;
  return {
    generated: new Date().toISOString(),
    userAgent: navigator.userAgent,
    system: state.system,
    source: {name: source.name, codec: source.codec, info: source.info,
             hdr: source.hdr},
    target: {id: target.id, label: target.label, codec: target.codec},
    config: encoded.config,
    decoderCodec: encoded.decoderConfig?.codec ?? null,
    rateControl: describeRate(settings),
    referenceBuffers: encoded.bufferCount,
    plan,
    frames: frames.map((f) => ({
      index: f.index, type: f.type, bytes: f.bytes,
      temporalLayer: f.layer, temporalId: f.temporalId,
      plannedReferences: f.planned, references: f.actual, kept: f.kept,
      droppedReferences: f.missing, matches: f.matches,
      psnr: Number.isFinite(f.psnr) ? Number(f.psnr.toFixed(2)) : null,
      units: f.structure, detail: f.detail,
    })),
    output: {info: analysis.info, hdr: analysis.hdr},
    signaling: rows,
    outputDecoded: !!run.output,
  };
}

function setDownloads(run, rows) {
  state.urls.forEach((url) => URL.revokeObjectURL(url));
  const {target, settings, encoded, preset} = run;
  const stream = target.family === 'av1'
      ? writeIvf({width: settings.width, height: settings.height,
                  frames: encoded.chunks.map((chunk) => chunk.data)})
      : concatChunks(encoded.chunks);
  const name = `d3d12-${target.id}-${preset?.id ?? 'custom'}`;
  const streamUrl = URL.createObjectURL(
      new Blob([stream], {type: 'application/octet-stream'}));
  const reportUrl = URL.createObjectURL(new Blob(
      [JSON.stringify(report(run, rows), null, 2)],
      {type: 'application/json'}));
  state.urls = [streamUrl, reportUrl];
  Object.assign($('download-stream'), {
    href: streamUrl,
    download: `${name}.${target.family === 'av1' ? 'ivf' : 'hevc'}`,
  });
  Object.assign($('download-report'),
                {href: reportUrl, download: `${name}-report.json`});
}

// Frame chips colored by the buffer the plan reads them from. References the
// plan doesn't have, or to frames already dropped, are red.
function referenceSlots(references, i, run, missing = []) {
  if (!references.length) {
    return '—';
  }
  const before = buffersBefore(run.simulation, i);
  return references.map((frame) => {
    const buffer = run.plan[i].refs.find((b) => before[b] === frame);
    const bad = buffer === undefined || missing.includes(frame);
    return el('span', {
      class: 'slot',
      style: `--chip-color: ${bad ? 'var(--bad)' : BUFFER_COLORS[buffer]}`,
      title: missing.includes(frame)
          ? 'Already dropped from the decoded picture buffer' : null,
    }, `F${frame}`);
  });
}

function storedIn(step, family) {
  if (step.key && family === 'av1') {
    return 'Every buffer';
  }
  if (step.update === null) {
    return 'Not stored';
  }
  return el('span', {class: 'slot',
                     style: `--chip-color: ${BUFFER_COLORS[step.update]}`},
            `B${step.update}`);
}

function resultArcs(run) {
  return run.frames.flatMap((f, i) => {
    const before = buffersBefore(run.simulation, i);
    return f.actual.map((frame) => {
      const buffer = run.plan[i].refs.find((b) => before[b] === frame);
      if (f.missing.includes(frame)) {
        return {from: frame, to: i, color: 'var(--bad)', label: 'dropped'};
      }
      return buffer === undefined
          ? {from: frame, to: i, color: 'var(--bad)', label: '?'}
          : {from: frame, to: i, color: BUFFER_COLORS[buffer],
             label: `B${buffer}`};
    });
  });
}

// Explains references to frames that an earlier picture left out of its
// reference picture set, grouped by the dropped frame.
function describeMissing(frames) {
  const causes = new Map();
  for (const f of frames) {
    for (const missing of f.missing) {
      const dropper = frames.find(
          (g) => g.index < f.index && g.dropped.includes(missing));
      const key = `${missing}:${dropper?.index}`;
      if (!causes.has(key)) {
        causes.set(key, {missing, dropper: dropper?.index, users: []});
      }
      causes.get(key).users.push(f.index);
    }
  }
  return [...causes.values()].map(({missing, dropper, users}) =>
      `${capitalize(frameList(users))} ` +
      `${users.length === 1 ? 'predicts' : 'predict'} from frame ${missing}, ` +
      `but ${dropper === undefined ? 'an earlier frame' : `frame ${dropper}`}` +
      ' left it out of its reference picture set, so decoders had already ' +
      'dropped it').join('; ');
}

function renderSummary(run, rows) {
  const {target, source, settings, encoded, frames, output, verifyError} = run;
  const items = [];
  const wrong = frames.filter((f) => !f.refsMatch);
  const planned = settings.manual
      ? 'you planned' : `scalabilityMode '${settings.scalabilityMode}' makes`;
  const headers = target.family === 'hevc' ? 'slice headers' : 'frame headers';
  if (frames.length !== FRAME_COUNT) {
    items.push(['bad', `✗ The encoder returned ${plural(frames.length,
        'frame')} for ${FRAME_COUNT} inputs.`]);
  }
  items.push(wrong.length
      ? ['bad', '✗ ' + wrong.map((f) =>
            `Frame ${f.index} predicts from ` +
            `${f.actual.length ? frameList(f.actual) : 'nothing'} instead of ` +
            `${f.planned.length ? frameList(f.planned) : 'nothing'}`)
            .join('; ') + '.']
      : ['good', `✓ Every frame predicts from exactly the frames ${planned}, ` +
                 `as read back from the ${headers}.`]);
  if (target.family === 'hevc') {
    items.push(frames.some((f) => f.missing.length)
        ? ['bad', `✗ ${describeMissing(frames)}. The stream can't be ` +
                  'decoded correctly.']
        : ['good', '✓ Every reference is still in the decoded picture ' +
                   'buffer when a frame uses it.']);
  }
  const lost = rows.filter((r) => r.verdict === 'lost');
  const hdr = isHdrTransfer(source.info.color.transfer);
  const carriers = target.family === 'hevc'
      ? 'VUI and SEI messages' : 'sequence header and metadata OBUs';
  items.push(lost.length
      ? ['bad', `✗ Lost in the output: ` +
                `${lost.map((r) => r.label.toLowerCase()).join(', ')}.`]
      : ['good', `✓ ${hdr ? 'HDR10' : 'Color'} signaling came through ` +
                 `unchanged, in the ${carriers}.`]);
  if (output) {
    const values = frames.map((f) => f.psnr).filter(Number.isFinite);
    const average = values.length
        ? values.reduce((a, b) => a + b, 0) / values.length : null;
    // Lossy coding moves PSNR by a few dB from frame to frame. A frame far
    // below the best one decoded from the wrong reference pictures.
    const best = Math.max(...values);
    const poor = frames.filter((f) => f.psnr < best - 10);
    items.push(poor.length
        ? ['bad', '✗ The output decodes to ' +
                  `${plural(output.length, 'frame')}, ` +
                  `but ${frameList(poor.map((f) => f.index))} come` +
                  `${poor.length === 1 ? 's' : ''} out far from the source: ` +
                  `${poor.map((f) => formatPsnr(f.psnr)).join(' and ')} ` +
                  `PSNR, against ${formatPsnr(best)} for the best frame.`]
        : ['good', `✓ The output decodes back to ` +
                   `${plural(output.length, 'frame')}` + (average === null
                       ? '.' : `, ${average.toFixed(1)} dB PSNR on average.`)]);
  } else {
    items.push([verifyError?.name === 'NotSupportedError' ? 'info' : 'bad',
                `${verifyError?.name === 'NotSupportedError' ? 'ℹ' : '✗'} ` +
                `This browser couldn't decode the output: ` +
                `${verifyError?.message}`]);
  }
  const bytes = encoded.chunks.reduce((n, c) => n + c.data.length, 0);
  const mbps = bytes * 8 / (FRAME_COUNT / 30) / 1_000_000;
  items.push(['info', `ℹ ${target.label}, ${target.detail}, ` +
      `${describeRate(settings)}: ${formatBytes(bytes)} for ` +
      `${FRAME_COUNT} frames, ${mbps.toFixed(1)} Mbps at 30 fps.`]);
  $('summary').replaceChildren(...items.map(
      ([kind, text]) => el('p', {class: kind}, text)));
}

function renderResults(run) {
  const {target, source, plan, preset, settings, encoded, analysis} = run;
  const family = target.family;
  run.simulation = simulate(plan, {
    family, bufferCount: encoded.bufferCount || EDITOR_BUFFERS[family]});
  run.frames = analysis.frames.map((f, i) => {
    const planned = run.simulation.steps[i]?.refFrames ?? [];
    const actual = f.references.filter((r) => r !== null);
    const missing = f.missing.filter((r) => r !== null);
    const refsMatch = actual.length === f.references.length &&
                      sameSet(planned, actual) && f.key === !!plan[i]?.key;
    return {
      ...f, planned, actual, missing, refsMatch,
      kept: f.kept.filter((r) => r !== null),
      matches: refsMatch && !missing.length,
      psnr: run.output
          ? psnr(source.pictures[i]?.luma, run.output[i]?.luma) : null,
    };
  });
  state.result = run;
  const rows = compareRows(source, analysis);

  $('results-subtitle').textContent =
      `${target.label} (${target.detail}) · ` +
      `${preset?.name ?? 'Your own structure'} · ` + (settings.manual
          ? plural(encoded.bufferCount, 'reference buffer')
          : `scalabilityMode '${settings.scalabilityMode}'`);
  renderSummary(run, rows);

  const pictures = run.output ?? source.pictures;
  const maxBytes = Math.max(...run.frames.map((f) => f.bytes));
  $('result-timeline').replaceChildren(...run.frames.map((f, i) =>
      el('div', {class: 'frame-card', onclick: () => showFrame(i)},
         el('div', {class: 'thumb'}, thumbCanvas(pictures[i]?.thumb),
            el('span', {class: 'frame-no'}, `Frame ${i}`),
            el('span', {class: `badge ${f.key ? 'key' : 'delta'}`},
               f.key ? (family === 'hevc' ? 'IDR' : 'KEY')
                     : f.type.toUpperCase())),
         el('div', {class: 'size-bar',
                    style: `width: ${Math.max(4, 100 * f.bytes / maxBytes)}%`}),
         el('div', {class: 'frame-meta'},
            el('span', {}, formatBytes(f.bytes)),
            el('span', {}, formatPsnr(f.psnr))))));

  // HEVC pictures also list the frames they keep for later ones; a frame
  // missing from that list is gone for every later picture.
  const hevc = family === 'hevc';
  // With temporal layers, show the layer WebCodecs reports next to the
  // temporal ID in the bitstream, which is what a server reads to drop frames.
  const layered = run.frames.some((f) => f.layer > 0 || f.temporalId > 0);
  $('frame-table').replaceChildren(
      el('thead', {}, el('tr', {}, ['Frame', 'Type',
          layered ? 'Layer (WebCodecs / bitstream)' : null, 'Planned refs',
          'Bitstream refs', hevc ? 'Keeps' : null, '', 'Stored in', 'Size',
          'PSNR', hevc ? 'NAL units' : 'OBUs', 'Details']
          .filter((name) => name !== null)
          .map((name) => el('th', {}, name)))),
      el('tbody', {}, run.frames.map((f, i) => el('tr', {},
          el('td', {}, String(i)),
          el('td', {}, f.type),
          layered ? el('td', {class: 'mono'},
                       `TL${f.layer ?? '?'} / TL${f.temporalId ?? '?'}`)
                  : null,
          el('td', {}, referenceSlots(f.planned, i, run)),
          el('td', {}, referenceSlots(f.actual, i, run, f.missing)),
          hevc ? el('td', {}, f.kept.length
              ? f.kept.map((frame) => el('span', {class: 'slot kept'},
                                         `F${frame}`))
              : '—') : null,
          el('td', {class: f.matches ? 'ok' : 'ko'}, f.matches ? '✓' : '✗'),
          el('td', {}, storedIn(plan[i], family)),
          el('td', {class: 'mono'}, formatBytes(f.bytes)),
          el('td', {class: 'mono'}, formatPsnr(f.psnr)),
          el('td', {class: 'units'}, f.structure.join(' ')),
          el('td', {class: 'units'}, f.detail)))));

  const verdicts = {same: ['ok', '✓'], changed: ['', '→'], lost: ['ko', '✗']};
  $('hdr-table').replaceChildren(
      el('thead', {}, el('tr', {}, ['', 'Source', 'Output', '']
          .map((name) => el('th', {}, name)))),
      el('tbody', {}, rows.map((r) => el('tr', {},
          el('td', {}, r.label),
          el('td', {class: 'mono'}, r.source),
          el('td', {class: 'mono'}, r.output),
          el('td', {class: verdicts[r.verdict][0]},
             verdicts[r.verdict][1])))));

  $('config').textContent = configCode(run);
  setDownloads(run, rows);

  $('results').hidden = false;
  drawArcs($('result-arcs'), resultArcs(run), true);
  showFrame(0);
  $('results').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function showFrame(i) {
  const run = state.result;
  if (!run) {
    return;
  }
  state.selected = i;
  const picture = (run.output ?? run.source.pictures)[i];
  const canvas = $('player');
  if (picture) {
    if (canvas.width !== picture.width || canvas.height !== picture.height) {
      canvas.width = picture.width;
      canvas.height = picture.height;
    }
    canvas.getContext('2d').drawImage(picture.image, 0, 0);
  }
  const f = run.frames[i];
  $('player-caption').textContent = [
    `Frame ${i}`,
    f.type,
    f.actual.length ? `predicts from ${frameList(f.actual)}` : 'no references',
    f.missing.length ? `${frameList(f.missing)} already dropped` : null,
    formatBytes(f.bytes),
    run.output ? `${formatPsnr(f.psnr)} PSNR`
               : 'showing the source, the output did not decode',
  ].filter(Boolean).join(' · ');
  [...$('result-timeline').children].forEach(
      (card, j) => card.classList.toggle('selected', j === i));
}

function togglePlay() {
  if (state.timer) {
    stopPlayback();
    return;
  }
  state.timer = setInterval(
      () => showFrame((state.selected + 1) % FRAME_COUNT), PLAY_INTERVAL_MS);
  $('play').textContent = 'Pause';
}

function stopPlayback() {
  clearInterval(state.timer);
  state.timer = null;
  $('play').textContent = 'Play';
}

// Setup

function bindControls() {
  for (const button of $('rate-control').querySelectorAll('button')) {
    button.addEventListener('click', () => {
      state.rateControl = button.dataset.mode;
      state.error = null;
      updateRateControls();
      updateTranscodeButton();
    });
  }
  $('bitrate').addEventListener('input', updateRateControls);
  $('quantizer').addEventListener('input', updateRateControls);
  $('target').addEventListener('change', () => {
    state.error = null;
    updateRateControls();
    renderEditor();
  });
  $('transcode').addEventListener('click', transcode);
  $('source-file').addEventListener('change', async () => {
    const [file] = $('source-file').files;
    if (file) {
      await loadSourceBytes(file.name,
                            new Uint8Array(await file.arrayBuffer()));
    }
    $('source-file').value = '';
  });
  $('play').addEventListener('click', togglePlay);
  // Arcs follow the cards when the layout width changes.
  const observer = new ResizeObserver(() => {
    for (const svg of [$('plan-arcs'), $('result-arcs')]) {
      const width = svg.parentElement.getBoundingClientRect().width;
      if (svg.arcs && Math.abs(width - (svg.drawnWidth ?? 0)) > 0.5) {
        drawArcs(svg, svg.arcs, false);
      }
    }
  });
  observer.observe($('timeline'));
  observer.observe($('result-timeline'));
}

async function main() {
  if (!('VideoEncoder' in window && 'VideoDecoder' in window)) {
    // WebCodecs only exists in secure contexts: HTTPS pages, and plain HTTP
    // ones on localhost.
    if (isSecureContext) {
      $('flag-banner').textContent = 'This demo needs WebCodecs. Open it in ' +
                                     'Chrome 158 or later on Windows.';
    } else {
      $('flag-banner').replaceChildren(
          'WebCodecs only works on secure pages, and ',
          el('code', {}, location.origin), " isn't one. Open the demo over " +
          'HTTPS or from localhost, or add this origin to ',
          el('code', {}, 'chrome://flags/#unsafely-treat-insecure-origin-as-secure'),
          ' and relaunch Chrome.');
    }
    $('flag-banner').hidden = false;
    return;
  }
  $('flag-banner').hidden = state.manual;
  const preset = state.manual
      ? PRESETS[0] : PRESETS.find((p) => p.scalabilityMode);
  state.presetId = preset.id;
  state.plan = clonePlan(preset.frames);
  bindControls();
  renderCapabilities();
  renderTargets();
  updateRateControls();
  renderEditor({animate: true});
  renderSystem();
  await Promise.all([
    probeTargets().then(() => {
      renderTargets();
      updateRateControls();
      renderEditor();
    }),
    fetchDefaultSource(),
  ]);
}

main();
