// Reference structure presets and the buffer model used to validate them.
//
// The model follows Chrome's D3D12 encoder: an HEVC key frame (IDR) is kept
// only in its update buffer and makes every other buffer unusable, while an
// AV1 key frame refreshes all reference slots. A delta frame predicts from
// the frames in its reference buffers, then optionally replaces the content
// of its update buffer.

export const FRAME_COUNT = 5;

// Every preset uses buffers 0 and 1 only: Chrome's D3D12 HEVC encoder exposes
// two buffers, and AV1 encoders at least that many. Presets with a
// `scalabilityMode` are also what the encoder produces in that mode, so they
// work without manual reference control.
export const PRESETS = [
  {
    id: 'recovery',
    name: 'Anchor + chain',
    description: 'The key frame stays in buffer 0 while a chain runs in ' +
        'buffer 1. Frame 3 predicts from both, and frame 4 restarts the ' +
        'chain from the anchor, as a receiver recovering from loss would ' +
        'ask for.',
    frames: [
      {key: true, refs: [], update: 0},
      {key: false, refs: [0], update: 1},
      {key: false, refs: [1], update: 1},
      {key: false, refs: [1, 0], update: 1},
      {key: false, refs: [0], update: 1},
    ],
  },
  {
    id: 'chain',
    name: 'Chain',
    description: 'Each frame predicts from the one before it (IPPPP), the ' +
        'classic low-latency structure.',
    scalabilityMode: 'L1T1',
    frames: [
      {key: true, refs: [], update: 0},
      {key: false, refs: [0], update: 0},
      {key: false, refs: [0], update: 0},
      {key: false, refs: [0], update: 0},
      {key: false, refs: [0], update: 0},
    ],
  },
  {
    id: 'layers',
    name: 'Two temporal layers',
    description: 'Even frames form the base layer. Odd frames predict from ' +
        'it but are never referenced, so a server can drop them to halve ' +
        'the frame rate.',
    scalabilityMode: 'L1T2',
    frames: [
      {key: true, refs: [], update: 0},
      {key: false, refs: [0], update: null},
      {key: false, refs: [0], update: 0},
      {key: false, refs: [0], update: null},
      {key: false, refs: [0], update: 0},
    ],
  },
  {
    id: 'anchor',
    name: 'Star',
    description: 'Every frame predicts from the key frame and none is ' +
        'referenced again, so any delta frame can be lost without harming ' +
        'the others.',
    frames: [
      {key: true, refs: [], update: 0},
      {key: false, refs: [0], update: null},
      {key: false, refs: [0], update: null},
      {key: false, refs: [0], update: null},
      {key: false, refs: [0], update: null},
    ],
  },
];

export function clonePlan(frames) {
  return frames.map((f) => ({key: f.key, refs: [...f.refs], update: f.update}));
}

// Walks `plan` through the buffer model. Returns, for each frame, the frames
// it predicts from and the buffer contents after it, plus any problems.
export function simulate(plan, {family, bufferCount}) {
  let buffers = new Array(bufferCount).fill(null);
  const steps = [];
  const errors = [];
  plan.forEach((step, i) => {
    const refFrames = [];
    if (i === 0 && !step.key) {
      errors.push('Frame 0 must be a key frame.');
    }
    if (step.key) {
      buffers = new Array(bufferCount).fill(family === 'av1' ? i : null);
    } else {
      if (!step.refs.length) {
        errors.push(`Frame ${i} is a delta frame without a reference buffer.`);
      }
      for (const b of step.refs) {
        if (b >= bufferCount) {
          errors.push(`Frame ${i} uses buffer ${b}, but the encoder has ` +
                      `${bufferCount}.`);
        } else if (buffers[b] === null) {
          errors.push(`Frame ${i} references buffer ${b}, which is empty.`);
        } else {
          refFrames.push(buffers[b]);
        }
      }
    }
    if (step.update !== null && !(step.key && family === 'av1')) {
      if (step.update >= bufferCount) {
        errors.push(`Frame ${i} updates buffer ${step.update}, but the ` +
                    `encoder has ${bufferCount}.`);
      } else {
        buffers[step.update] = i;
      }
    }
    steps.push({refFrames: [...new Set(refFrames)],
                buffersAfter: buffers.slice()});
  });
  return {steps, errors};
}
