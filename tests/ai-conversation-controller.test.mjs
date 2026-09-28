import assert from 'node:assert/strict';

const STEPS = [
  'SEND',
  'WAIT_COPY',
  'TRANSFER',
  'WAIT_TARGET',
  'SEND',
  'WAIT_COPY'
];

function transition(state, event) {
  switch (event) {
    case 'send-ok':
      return { ...state, step: 'WAIT_COPY', error: null };
    case 'copy-ready':
      return { ...state, step: 'TRANSFER', error: null };
    case 'transfer-ok':
      return { ...state, step: 'WAIT_TARGET', error: null };
    case 'target-ready':
      return { ...state, step: 'SEND', error: null };
    case 'reload':
      return { ...state, step: 'RELOAD', reloads: state.reloads + 1 };
    case 'stop':
      return { ...state, running: false, step: 'STOPPED' };
    default:
      throw new Error('unknown event');
  }
}

let s = {
  running: true,
  turn: 1,
  activeEngine: 'GPT',
  step: 'SEND',
  reloads: 0
};

s = transition(s, 'send-ok');
assert.equal(s.step, 'WAIT_COPY');

s = transition(s, 'copy-ready');
assert.equal(s.step, 'TRANSFER');

s = transition(s, 'transfer-ok');
assert.equal(s.step, 'WAIT_TARGET');

s = transition(s, 'target-ready');
assert.equal(s.step, 'SEND');

s = transition(s, 'send-ok');
assert.equal(s.step, 'WAIT_COPY');

s = transition(s, 'reload');
assert.equal(s.step, 'RELOAD');
assert.equal(s.reloads, 1);

s = transition(s, 'stop');
assert.equal(s.running, false);
assert.equal(s.step, 'STOPPED');

assert.deepEqual(STEPS, [
  'SEND', 'WAIT_COPY', 'TRANSFER', 'WAIT_TARGET', 'SEND', 'WAIT_COPY'
]);

console.log('PASS: deterministic step/reload state machine');
