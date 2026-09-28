// Deterministic two-page loop coordinator for the Generic Web test.
// Runtime/browser tab activation is deliberately injected by the runtime/test runner.
(() => {
  'use strict';

  class AICCTwoPageClipboardLoop {
    constructor({activate, clipboard, rounds=10}) {
      this.activate=activate;
      this.clipboard=clipboard;
      this.rounds=rounds;
      this.history=[];
    }

    async waitReady(api, timeoutMs=5000) {
      const deadline=Date.now()+timeoutMs;
      while(Date.now()<deadline) {
        if(await api.isReadyToCopy()) return;
        await new Promise(r=>setTimeout(r,20));
      }
      throw new Error('READY_TO_COPY timeout');
    }

    async transfer(from,to,payload) {
      await this.activate(from.pageId);
      await from.api.paste(payload);
      await from.api.submit();
      await this.waitReady(from.api);
      const copied=await from.api.nativeCopy();
      await this.clipboard.write(copied);
      const pasted=await this.clipboard.read();
      await this.activate(to.pageId);
      await to.api.paste(pasted);
      return {copied,pasted};
    }

    async run(pageA,pageB,seed) {
      let payload=seed;
      for(let round=1;round<=this.rounds;round++) {
        const a=await this.transfer(pageA,pageB,payload);
        const b=await this.transfer(pageB,pageA,a.pasted);
        await this.activate(pageA.pageId);
        const final=await pageA.api.snapshot();
        this.history.push({round,a,b,final});
        payload=b.pasted;
      }
      return {ok:true,rounds:this.rounds,history:this.history};
    }
  }

  window.AICCTwoPageClipboardLoop=AICCTwoPageClipboardLoop;
})();
