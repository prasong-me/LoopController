// Generic Web Runtime Adapter + minimal workflow harness.
// This file is intentionally target-agnostic in its interface; the selectors below
// belong only to the controlled Generic Web Test Target.
(() => {
  'use strict';

  class GenericWebAdapter {
    constructor(doc=document) { this.doc=doc; }

    input() { return this.doc.querySelector('#message'); }
    send() { return this.doc.querySelector('#send'); }
    latestResponse() { return this.doc.querySelector('#response'); }
    copy() { return this.doc.querySelector('#copy'); }

    getResponseState() {
      const response=this.latestResponse();
      const copy=this.copy();
      const activity=this.doc.querySelector('#activity')?.textContent?.trim() || '';
      if (!response || !response.textContent.trim()) return 'WAITING';
      if (activity === 'Processing' || copy?.disabled) return 'PROCESSING';
      if (!copy?.disabled) return 'READY_TO_CAPTURE';
      return 'WAITING';
    }

    sendMessage(message) {
      const input=this.input(), button=this.send();
      if (!input || !button) throw new Error('Generic target input/send unavailable');
      input.value=message;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      button.click();
    }

    findCopyAction() {
      const button=this.copy();
      return button && !button.disabled ? button : null;
    }

    capture() {
      const button=this.findCopyAction();
      if (!button) return false;
      button.click();
      return this.copy()?.dataset.copied === 'true';
    }
  }

  class GenericWorkflow {
    constructor(controller, adapter) {
      this.controller=controller;
      this.adapter=adapter;
      this.checkpoint={step:'IDLE',reloads:0};
    }

    async run(message, {pollMs=100,maxWaitMs=8000}={}) {
      this.checkpoint={step:'SEND_MESSAGE',reloads:0};
      this.controller.lock();
      this.controller.setStatus('PROCESSING');

      this.adapter.sendMessage(message);
      this.checkpoint={step:'WAIT_RESPONSE_READY',reloads:0};

      const deadline=Date.now()+maxWaitMs;
      while(Date.now()<deadline) {
        if(this.adapter.getResponseState()==='READY_TO_CAPTURE') break;
        await new Promise(r=>setTimeout(r,pollMs));
      }

      if(this.adapter.getResponseState()!=='READY_TO_CAPTURE') {
        this.checkpoint={step:'STALLED',reloads:0};
        this.controller.setStatus('STALLED');
        this.controller.unlock();
        return {ok:false,step:this.checkpoint.step};
      }

      this.checkpoint={step:'COPY_LATEST_RESPONSE',reloads:0};
      this.controller.setStatus('CAPTURING');
      const ok=this.adapter.capture();

      this.checkpoint={step:ok?'CAPTURED':'CAPTURE_FAILED',reloads:0};
      this.controller.setStatus(ok?'CAPTURED':'CAPTURE_FAILED');
      this.controller.unlock();
      return {ok,step:this.checkpoint.step};
    }
  }

  window.AICCGenericWebAdapter=GenericWebAdapter;
  window.AICCGenericWorkflow=GenericWorkflow;
})();