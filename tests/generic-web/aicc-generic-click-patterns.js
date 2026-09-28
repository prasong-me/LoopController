// AICC custom click-pattern recorder/runtime for the Generic Web test.
// The stored target is semantic-first. Coordinates are only a last-resort snapshot.
(() => {
  'use strict';

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  class AICCCustomClickPatterns {
    constructor({root=document, controller=null, storageKey='aicc.clickPatterns.v1'}={}) {
      this.root=root; this.controller=controller; this.storageKey=storageKey;
      this.patterns=this.load(); this.recording=false; this.onCapture=this.capture.bind(this);
    }
    load(){try{return JSON.parse(localStorage.getItem(this.storageKey)||'[]')}catch{return[]}}
    persist(){localStorage.setItem(this.storageKey,JSON.stringify(this.patterns))}
    describeTarget(el){
      const rect=el.getBoundingClientRect();
      const text=(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,160);
      return {tag:el.tagName.toLowerCase(),id:el.id||null,role:el.getAttribute('role')||null,
        ariaLabel:el.getAttribute('aria-label')||null,name:el.getAttribute('name')||null,text,
        type:el.getAttribute('type')||null,testId:el.getAttribute('data-testid')||null,
        position:{x:Math.round(rect.left),y:Math.round(rect.top),width:Math.round(rect.width),height:Math.round(rect.height)}};
    }
    arm(){if(this.recording)return;this.recording=true;this.root.addEventListener('click',this.onCapture,true);this.controller?.setStatus('PATTERN_RECORDING')}
    disarm(){if(!this.recording)return;this.recording=false;this.root.removeEventListener('click',this.onCapture,true)}
    capture(event){
      if(!this.recording)return;
      const host=this.controller?.host;
      if(host && event.target===host)return;
      const target=event.composedPath().find(node=>node instanceof Element&&/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(node.tagName)) ||
        (event.target instanceof Element?event.target:null);
      if(!target)return;
      event.preventDefault();event.stopImmediatePropagation();this.disarm();
      this.lastTarget=this.describeTarget(target);this.controller?.setStatus('PATTERN_TARGET_SAVED');this.onTargetSaved?.(this.lastTarget);
    }
    add(name,{intervalMs=500,count=1,target=this.lastTarget}={}){
      if(!target)throw new Error('No pattern target recorded');
      const pattern={id:crypto.randomUUID?crypto.randomUUID():'pattern-'+Date.now(),name:String(name||'Custom Click'),
        intervalMs:Math.max(0,Number(intervalMs)||0),count:Math.max(1,Math.floor(Number(count)||1)),target,createdAt:new Date().toISOString()};
      this.patterns.push(pattern);this.persist();return pattern;
    }
    resolveTarget(target){
      const candidates=[];
      if(target.id)candidates.push(()=>document.getElementById(target.id));
      if(target.testId)candidates.push(()=>document.querySelector('[data-testid="'+CSS.escape(target.testId)+'"]'));
      if(target.ariaLabel)candidates.push(()=>document.querySelector('[aria-label="'+CSS.escape(target.ariaLabel)+'"]'));
      if(target.name)candidates.push(()=>document.querySelector('[name="'+CSS.escape(target.name)+'"]'));
      if(target.role&&target.text)candidates.push(()=>[...document.querySelectorAll('[role="'+CSS.escape(target.role)+'"]')].find(el=>this.sameText(el,target.text)));
      if(target.text)candidates.push(()=>[...document.querySelectorAll('button,a,input,textarea,select,[role="button"]')].find(el=>this.sameText(el,target.text)));
      for(const find of candidates){try{const el=find();if(el)return el}catch{}}
      return null;
    }
    sameText(el,text){return((el.innerText||el.textContent||'').trim().replace(/\s+/g,' '))===text}
    async run(pattern){
      let target=this.resolveTarget(pattern.target);
      if(!target)throw new Error('Custom pattern target not found');
      if('disabled' in target&&target.disabled)throw new Error('Custom pattern target is disabled');
      target.scrollIntoView({block:'center',inline:'nearest'});await sleep(50);
      for(let i=0;i<pattern.count;i++){
        const current=this.resolveTarget(pattern.target);
        if(!current)throw new Error('Custom pattern target disappeared');
        if('disabled' in current&&current.disabled)throw new Error('Custom pattern target became disabled');
        current.scrollIntoView({block:'center',inline:'nearest'});current.click();
        if(i+1<pattern.count)await sleep(pattern.intervalMs);
      }
      return{ok:true,patternId:pattern.id,clicks:pattern.count,intervalMs:pattern.intervalMs};
    }
    getAll(){return[...this.patterns]}
    remove(id){this.patterns=this.patterns.filter(p=>p.id!==id);this.persist()}
  }
  window.AICCCustomClickPatterns=AICCCustomClickPatterns;
})();