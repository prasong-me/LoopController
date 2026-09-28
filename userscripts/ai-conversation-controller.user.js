// ==UserScript==
// @name         AI Conversation Controller — GPT ↔ Gemini
// @namespace    local.ai.conversation.controller
// @version      0.1.0-test
// @description  Sequential browser-side GPT ↔ Gemini controller with persistent checkpoints and reload recovery.
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @match        https://gemini.google.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  const KEY = 'aicc.state.v1';
  const POLL_MS = 700;
  const TIMEOUT_MS = 120000;
  const MAX_RELOADS = 3;

  const host = location.hostname;
  const engine =
    host === 'chatgpt.com' || host === 'chat.openai.com' ? 'GPT' :
    host === 'gemini.google.com' ? 'GEMINI' : null;

  if (!engine) return;

  const DEFAULT = {
    running: false,
    turn: 0,
    activeEngine: 'GPT',
    step: 'IDLE',
    pendingMessage: '',
    lastResponse: '',
    reloads: 0,
    updatedAt: 0,
    error: null
  };

  const state = () => GM_getValue(KEY, DEFAULT);

  function patch(values) {
    GM_setValue(KEY, { ...state(), ...values, updatedAt: Date.now() });
    render();
  }

  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  function visible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return s.display !== 'none' &&
      s.visibility !== 'hidden' &&
      r.width > 0 && r.height > 0;
  }

  function textOf(el) {
    return (el?.innerText || el?.textContent || '').trim();
  }

  const adapters = {
    GPT: {
      input: () => document.querySelector(
        '#prompt-textarea[contenteditable="true"], textarea[name="prompt-textarea"]'
      ),
      send: () => document.querySelector(
        'button[data-testid="send-button"], button[aria-label*="Send" i]:not([aria-label*="Stop" i])'
      ),
      latestResponse: () => {
        const turns = [...document.querySelectorAll(
          '[data-message-author-role="assistant"], section[data-turn="assistant"]'
        )];
        return turns.at(-1) || null;
      },
      copy: root => root?.querySelector(
        'button[data-testid="copy-turn-action-button"], button[aria-label*="Copy response" i], button[aria-label="Copy" i]'
      )
    },

    GEMINI: {
      input: () => document.querySelector(
        'div.ql-editor[contenteditable="true"], rich-textarea [contenteditable="true"], [aria-label="Enter a prompt here"], [contenteditable="true"][role="textbox"]'
      ),
      send: () => document.querySelector(
        'button[aria-label="Send message"], button[aria-label*="Send" i], button.send-button'
      ),
      latestResponse: () => {
        const nodes = [...document.querySelectorAll(
          'model-response, message-content, .model-response-text, .response-content'
        )];
        return nodes.at(-1) || null;
      },
      copy: root => {
        if (!root) return null;
        return root.querySelector(
          'button[aria-label="Copy" i], button[aria-label*="Copy" i], [role="button"][aria-label*="Copy" i]'
        ) || [...root.querySelectorAll('button,[role="button"]')].find(b =>
          /copy|คัดลอก/i.test(textOf(b) + ' ' + (b.getAttribute('aria-label') || ''))
        );
      }
    }
  };

  const A = adapters[engine];

  function setInput(el, value) {
    if (!el) throw new Error(engine + ': input not found');

    el.focus();

    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      const setter = Object.getOwnPropertyDescriptor(
        el.constructor.prototype, 'value'
      )?.set;
      setter ? setter.call(el, value) : el.value = value;
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
      return;
    }

    el.textContent = '';
    el.appendChild(document.createTextNode(value));
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }));
  }

  function clickSend() {
    const button = A.send();
    if (!button || !visible(button) || button.disabled) {
      throw new Error(engine + ': send button unavailable');
    }
    button.click();
  }

  async function sendPending() {
    const s = state();
    if (!s.pendingMessage) throw new Error('No pending message');

    setInput(A.input(), s.pendingMessage);
    await sleep(150);
    clickSend();

    patch({
      step: 'WAIT_COPY',
      pendingMessage: '',
      error: null,
      reloads: 0
    });
  }

  function findReadyCopy() {
    const root = A.latestResponse();
    if (!root || !visible(root)) return null;

    const button = A.copy(root);
    if (!button || !visible(button) || button.disabled) return null;

    return { root, button };
  }

  async function captureResponse() {
    const ready = findReadyCopy();
    if (!ready) return false;

    const response = textOf(ready.root);
    if (!response) return false;

    // Native provider Copy action is the completion gate.
    ready.button.click();

    // Keep the native copy semantics, and also expose the exact response
    // to the other userscript instance without requiring clipboard read access.
    GM_setClipboard(response, 'text');

    patch({
      step: 'TRANSFER',
      lastResponse: response,
      pendingMessage: response,
      activeEngine: engine === 'GPT' ? 'GEMINI' : 'GPT',
      turn: engine === 'GEMINI' ? state().turn + 1 : state().turn,
      reloads: 0
    });

    return true;
  }

  function requestReload(reason) {
    const s = state();
    const nextReloads = (s.reloads || 0) + 1;

    if (nextReloads > MAX_RELOADS) {
      patch({
        running: false,
        step: 'STOPPED',
        error: reason + ' (reload limit reached)'
      });
      return;
    }

    patch({
      step: 'RELOAD',
      reloads: nextReloads,
      error: reason
    });

    location.reload();
  }

  async function tick() {
    const s = state();
    if (!s.running || s.activeEngine !== engine) return;

    try {
      if (s.step === 'TRANSFER') {
        patch({ step: 'WAIT_TARGET' });
        return;
      }

      if (s.step === 'SEND') {
        await sendPending();
        return;
      }

      if (s.step === 'WAIT_COPY') {
        const deadline = Date.now() + TIMEOUT_MS;

        while (state().running && state().activeEngine === engine) {
          if (await captureResponse()) return;
          if (Date.now() >= deadline) {
            requestReload(engine + ': Copy action did not appear');
            return;
          }
          await sleep(POLL_MS);
        }
      }
    } catch (err) {
      requestReload(err?.message || String(err));
    }
  }

  function start(initialMessage) {
    if (!initialMessage?.trim()) {
      alert('ต้องมีข้อความเริ่มต้น');
      return;
    }

    patch({
      running: true,
      turn: 1,
      activeEngine: 'GPT',
      step: 'SEND',
      pendingMessage: initialMessage.trim(),
      lastResponse: '',
      reloads: 0,
      error: null
    });
  }

  function stop() {
    patch({
      running: false,
      step: 'STOPPED',
      error: null
    });
  }

  function render() {
    if (!panel) return;
    const s = state();
    panel.querySelector('.aicc-engine').textContent = engine;
    panel.querySelector('.aicc-step').textContent = s.step;
    panel.querySelector('.aicc-turn').textContent = String(s.turn);
    panel.querySelector('.aicc-error').textContent = s.error || '';
  }

  let panel;

  function initUI() {
    panel = document.createElement('div');
    panel.innerHTML = `
      <div class="aicc-title">AI Conversation</div>
      <div>Engine: <b class="aicc-engine"></b></div>
      <div>Step: <b class="aicc-step"></b></div>
      <div>Turn: <b class="aicc-turn"></b></div>
      <div class="aicc-error"></div>
      <textarea class="aicc-input" placeholder="ข้อความเริ่มต้น"></textarea>
      <div>
        <button class="aicc-start">START</button>
        <button class="aicc-stop">STOP</button>
      </div>
    `;

    Object.assign(panel.style, {
      position: 'fixed', zIndex: 2147483647, right: '12px', bottom: '12px',
      width: '280px', padding: '12px', borderRadius: '12px',
      background: '#111', color: '#fff', font: '13px system-ui',
      boxShadow: '0 8px 30px rgba(0,0,0,.35)'
    });

    panel.querySelector('.aicc-input').style.cssText =
      'width:100%;min-height:70px;box-sizing:border-box;margin:8px 0;';
    document.body.appendChild(panel);

    panel.querySelector('.aicc-start').onclick = () =>
      start(panel.querySelector('.aicc-input').value);
    panel.querySelector('.aicc-stop').onclick = stop;

    render();
  }

  GM_addValueChangeListener(KEY, () => render());

  GM_registerMenuCommand('AI Controller: START', () => {
    const msg = prompt('ข้อความเริ่มต้น GPT → Gemini');
    if (msg) start(msg);
  });
  GM_registerMenuCommand('AI Controller: STOP', stop);

  initUI();

  // Each page instance is a state-driven worker only when it is the active engine.
  // No server, API, token, or background service is used.
  setInterval(tick, POLL_MS);
})();
