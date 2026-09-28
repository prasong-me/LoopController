// ==UserScript==
// @name         AI Conversation Controller — GPT ↔ Gemini
// @namespace    local.ai.conversation.controller
// @version      0.2.0-test
// @updateURL     https://raw.githubusercontent.com/prasong-me/LoopController/test/generic-controller-ui/userscripts/ai-conversation-controller.user.js
// @downloadURL   https://raw.githubusercontent.com/prasong-me/LoopController/test/generic-controller-ui/userscripts/ai-conversation-controller.user.js
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


// ===== AICC SCREEN POSITION PATTERN =====

(() => {
  'use strict';

  const screenSleep = ms => new Promise(r => setTimeout(r, ms));
  const screenClamp = (n, min, max) => Math.min(max, Math.max(min, n));

  class AICCScreenClickPatterns {
    constructor({ controller = null, storageKey = 'aicc.screenClickPatterns.v1', activatePage = null } = {}) {
      this.controller = controller;
      this.storageKey = storageKey;
      this.activatePage = activatePage;
      this.patterns = this.load();
      this.recording = false;
      this.currentPoints = [];
      this.currentPage = 'A';
      this.markerLayer = null;
      this.onPointerDown = this.capturePoint.bind(this);
    }

    load() {
      try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); }
      catch { return []; }
    }

    persist() {
      localStorage.setItem(this.storageKey, JSON.stringify(this.patterns));
    }

    ensureLayer() {
      if (this.markerLayer) return this.markerLayer;
      const layer = document.createElement('div');
      layer.id = 'aicc-screen-pattern-markers';
      Object.assign(layer.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '2147483638',
        pointerEvents: 'none'
      });
      document.documentElement.appendChild(layer);
      this.markerLayer = layer;
      return layer;
    }

    addMarker(point) {
      const layer = this.ensureLayer();
      const el = document.createElement('div');
      el.dataset.order = String(point.order);
      Object.assign(el.style, {
        position: 'fixed',
        left: (point.xRatio * 100) + 'vw',
        top: (point.yRatio * 100) + 'vh',
        transform: 'translate(-50%,-50%)',
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        font: '700 12px system-ui,sans-serif',
        color: '#fff',
        background: point.end ? 'rgba(180, 40, 40, .95)' : 'rgba(0,0,0,.86)',
        border: '2px solid #fff',
        boxShadow: '0 2px 10px rgba(0,0,0,.45)'
      });
      el.textContent = point.end ? 'END' : String(point.order);
      layer.appendChild(el);
    }

    refreshMarkers(points = this.currentPoints) {
      this.ensureLayer().replaceChildren();
      points.forEach(p => this.addMarker(p));
    }

    arm(page = 'A') {
      if (this.currentPoints.length >= 10) throw new Error('Maximum 10 screen positions reached');
      this.currentPage = page;
      this.recording = true;
      document.addEventListener('pointerdown', this.onPointerDown, true);
      this.controller?.setStatus('SCREEN_PATTERN_RECORDING_' + page);
    }

    disarm() {
      this.recording = false;
      document.removeEventListener('pointerdown', this.onPointerDown, true);
    }

    capturePoint(event) {
      if (!this.recording || event.button !== 0) return;
      const host = this.controller?.host;
      if (host && (event.target === host || host.contains(event.target))) return;

      const x = screenClamp(event.clientX, 0, innerWidth);
      const y = screenClamp(event.clientY, 0, innerHeight);
      const point = {
        order: this.currentPoints.length + 1,
        page: this.currentPage,
        x,
        y,
        xRatio: innerWidth ? x / innerWidth : 0,
        yRatio: innerHeight ? y / innerHeight : 0
      };

      this.currentPoints.push(point);
      this.addMarker(point);
      this.controller?.setStatus(
        point.order === 10 ? 'SCREEN_PATTERN_MAX' : 'SCREEN_PATTERN_POINT_' + point.order
      );
      this.onPointSaved?.(point, this.currentPoints.length);

      if (this.currentPoints.length >= 10) this.disarm();
    }

    startNew(page = 'A') {
      this.disarm();
      this.currentPoints = [];
      this.currentPage = page;
      this.refreshMarkers([]);
      this.controller?.setStatus('SCREEN_PATTERN_NEW_' + page);
    }

    setEnd() {
      if (!this.currentPoints.length) return;
      this.currentPoints.forEach((p, i) => p.end = i === this.currentPoints.length - 1);
      this.refreshMarkers();
    }

    save(name, {
      pageMode = 'single',
      pageAUrl = '',
      pageBUrl = '',
      intervalMs = 500,
      count = 1
    } = {}) {
      if (!this.currentPoints.length) throw new Error('No screen positions recorded');

      this.setEnd();

      const pattern = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'screen-pattern-' + Date.now(),
        name: String(name || 'Screen Click Pattern'),
        pageMode: pageMode === 'paired' ? 'paired' : 'single',
        pageAUrl: String(pageAUrl || ''),
        pageBUrl: String(pageBUrl || ''),
        intervalMs: Math.max(0, Number(intervalMs) || 0),
        count: Math.max(1, Math.floor(Number(count) || 1)),
        maxPoints: 10,
        points: this.currentPoints.map(p => ({ ...p })),
        createdAt: new Date().toISOString()
      };

      this.patterns.push(pattern);
      this.persist();
      return pattern;
    }

    resolvePoint(point) {
      const x = screenClamp(point.xRatio, 0, 1) * innerWidth;
      const y = screenClamp(point.yRatio, 0, 1) * innerHeight;
      return { x, y, element: document.elementFromPoint(x, y) || null };
    }

    async run(pattern, { activatePage = this.activatePage, pointerClick = null } = {}) {
      for (let cycle = 0; cycle < pattern.count; cycle++) {
        for (let i = 0; i < pattern.points.length; i++) {
          const point = pattern.points[i];

          if (pattern.pageMode === 'paired' && activatePage) {
            await activatePage(point.page, pattern);
          }

          const target = this.resolvePoint(point);
          if (!target.element) {
            throw new Error('Screen position ' + (i + 1) + ' has no target');
          }

          if (pointerClick) {
            await pointerClick(target.x, target.y);
          } else {
            target.element.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: target.x,
              clientY: target.y,
              view: window
            }));
          }

          if (i < pattern.points.length - 1 || cycle < pattern.count - 1) {
            await screenSleep(pattern.intervalMs);
          }
        }
      }

      return {
        ok: true,
        patternId: pattern.id,
        points: pattern.points.length,
        cycles: pattern.count,
        intervalMs: pattern.intervalMs
      };
    }

    getAll() {
      return [...this.patterns];
    }

    remove(id) {
      this.patterns = this.patterns.filter(p => p.id !== id);
      this.persist();
    }

    clearMarkers() {
      this.markerLayer?.replaceChildren();
    }
  }

  window.AICCScreenClickPatterns = AICCScreenClickPatterns;
})();


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

  // Screen Position Pattern is intentionally separate from semantic/DOM patterns.
  const screenPatterns = new window.AICCScreenClickPatterns({
    controller: {
      setStatus: value => {
        const status = panel?.querySelector('.aicc-error');
        if (status) status.textContent = 'Pattern: ' + value;
      },
      host: panel
    }
  });

  function saveScreenPatternFromUI() {
    try {
      const name = panel.querySelector('.aicc-pattern-name').value.trim() || 'Screen Click Pattern';
      const pageMode = panel.querySelector('.aicc-pattern-mode').value;
      const pageAUrl = panel.querySelector('.aicc-pattern-a').value.trim();
      const pageBUrl = panel.querySelector('.aicc-pattern-b').value.trim();
      const intervalMs = Number(panel.querySelector('.aicc-pattern-interval').value || 500);
      const count = Number(panel.querySelector('.aicc-pattern-count').value || 1);

      const pattern = screenPatterns.save(name, {
        pageMode,
        pageAUrl,
        pageBUrl,
        intervalMs,
        count
      });

      screenPatterns.disarm();
      panel.querySelector('.aicc-pattern-status').textContent =
        'บันทึกแล้ว: ' + pattern.name + ' (' + pattern.points.length + ' ตำแหน่ง)';
      render();
    } catch (err) {
      panel.querySelector('.aicc-pattern-status').textContent =
        'Pattern Error: ' + (err?.message || String(err));
    }
  }

  function initScreenPatternUI() {
    const box = document.createElement('div');
    box.className = 'aicc-pattern-box';
    box.innerHTML = `
      <div style="font-weight:700;margin-top:10px;">Screen Position Pattern</div>
      <select class="aicc-pattern-mode" style="width:100%;margin-top:6px;">
        <option value="single">หน้าเดียว</option>
        <option value="paired">จับคู่ 2 หน้า</option>
      </select>
      <input class="aicc-pattern-name" placeholder="ชื่อ Pattern" style="width:100%;box-sizing:border-box;margin-top:6px;">
      <input class="aicc-pattern-a" placeholder="URL หน้า A" style="width:100%;box-sizing:border-box;margin-top:6px;">
      <input class="aicc-pattern-b" placeholder="URL หน้า B (ถ้าจับคู่)" style="width:100%;box-sizing:border-box;margin-top:6px;">
      <div style="display:flex;gap:6px;margin-top:6px;">
        <input class="aicc-pattern-interval" type="number" min="0" value="500" placeholder="ms" style="width:50%;box-sizing:border-box;">
        <input class="aicc-pattern-count" type="number" min="1" value="1" placeholder="รอบ" style="width:50%;box-sizing:border-box;">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px;">
        <button class="aicc-pattern-new">เริ่ม Pattern ใหม่</button>
        <button class="aicc-pattern-end">ปิดท้ายจุดล่าสุด</button>
        <button class="aicc-pattern-rec-a">บันทึกตำแหน่ง A</button>
        <button class="aicc-pattern-rec-b">บันทึกตำแหน่ง B</button>
        <button class="aicc-pattern-save" style="grid-column:1/-1;">บันทึก Pattern</button>
      </div>
      <div class="aicc-pattern-status" style="margin-top:6px;font-size:12px;opacity:.8;">
        ยังไม่มีตำแหน่ง
      </div>
    `;

    panel.appendChild(box);

    box.querySelector('.aicc-pattern-new').onclick = () => {
      screenPatterns.startNew('A');
      box.querySelector('.aicc-pattern-status').textContent = 'เริ่มใหม่ — สูงสุด 10 ตำแหน่ง';
    };
    box.querySelector('.aicc-pattern-end').onclick = () => {
      try {
        screenPatterns.setEnd();
        box.querySelector('.aicc-pattern-status').textContent = 'กำหนดตำแหน่งล่าสุดเป็น END แล้ว';
      } catch (err) {
        box.querySelector('.aicc-pattern-status').textContent = err.message;
      }
    };
    box.querySelector('.aicc-pattern-rec-a').onclick = () => {
      try {
        screenPatterns.arm('A');
        box.querySelector('.aicc-pattern-status').textContent = 'กำลังบันทึกตำแหน่งบนหน้า A — คลิกจุดที่ต้องการ';
      } catch (err) {
        box.querySelector('.aicc-pattern-status').textContent = err.message;
      }
    };
    box.querySelector('.aicc-pattern-rec-b').onclick = () => {
      try {
        screenPatterns.arm('B');
        box.querySelector('.aicc-pattern-status').textContent = 'กำลังบันทึกตำแหน่งบนหน้า B — คลิกจุดที่ต้องการ';
      } catch (err) {
        box.querySelector('.aicc-pattern-status').textContent = err.message;
      }
    };
    box.querySelector('.aicc-pattern-save').onclick = saveScreenPatternFromUI;
  }

  initScreenPatternUI();


  // Each page instance is a state-driven worker only when it is the active engine.
  // No server, API, token, or background service is used.
  setInterval(tick, POLL_MS);
})();

