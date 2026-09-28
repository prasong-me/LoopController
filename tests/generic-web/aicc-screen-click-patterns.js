// AICC Screen Position Click Pattern.
// Separate from semantic/DOM click patterns. Stores up to 10 viewport positions.
// Runtime resolves the target by viewport coordinates, with page pairing metadata.
(() => {
  'use strict';

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));

  class AICCScreenClickPatterns {
    constructor({controller=null, storageKey='aicc.screenClickPatterns.v1', activatePage=null}={}) {
      this.controller=controller;
      this.storageKey=storageKey;
      this.activatePage=activatePage;
      this.patterns=this.load();
      this.recording=false;
      this.currentPoints=[];
      this.currentPage='A';
      this.markerLayer=null;
      this.onPointerDown=this.capturePoint.bind(this);
    }

    load(){try{return JSON.parse(localStorage.getItem(this.storageKey)||'[]')}catch{return[]}}
    persist(){localStorage.setItem(this.storageKey,JSON.stringify(this.patterns))}
    ensureLayer(){
      if(this.markerLayer)return this.markerLayer;
      const layer=document.createElement('div');
      layer.id='aicc-screen-pattern-markers';
      Object.assign(layer.style,{position:'fixed',inset:'0',zIndex:'2147483638',pointerEvents:'none'});
      document.documentElement.appendChild(layer);
      this.markerLayer=layer;
      return layer;
    }

    addMarker(point){
      const layer=this.ensureLayer();
      const el=document.createElement('div');
      el.dataset.order=String(point.order);
      Object.assign(el.style,{
        position:'fixed',left:(point.xRatio*100)+'vw',top:(point.yRatio*100)+'vh',
        transform:'translate(-50%,-50%)',width:'30px',height:'30px',borderRadius:'50%',
        display:'grid',placeItems:'center',font:'700 13px system-ui,sans-serif',
        color:'#fff',background:'rgba(0,0,0,.86)',border:'2px solid #fff',
        boxShadow:'0 2px 10px rgba(0,0,0,.45)'
      });
      el.textContent=point.order===this.currentPoints.length?'END':String(point.order);
      if(point.order!==this.currentPoints.length) el.textContent=String(point.order);
      layer.appendChild(el);
    }

    refreshMarkers(points=this.currentPoints){
      this.ensureLayer().replaceChildren();
      points.forEach(p=>this.addMarker(p));
    }

    arm(page='A'){
      if(this.currentPoints.length>=10) throw new Error('Maximum 10 screen positions reached');
      this.currentPage=page;
      this.recording=true;
      document.addEventListener('pointerdown',this.onPointerDown,true);
      this.controller?.setStatus('SCREEN_PATTERN_RECORDING');
    }

    disarm(){
      this.recording=false;
      document.removeEventListener('pointerdown',this.onPointerDown,true);
    }

    capturePoint(event){
      if(!this.recording || event.button!==0)return;
      const host=this.controller?.host;
      if(host && (event.target===host || host.contains(event.target)))return;
      const x=clamp(event.clientX,0,innerWidth);
      const y=clamp(event.clientY,0,innerHeight);
      const point={
        order:this.currentPoints.length+1,
        page:this.currentPage,
        x,y,
        xRatio:innerWidth?x/innerWidth:0,
        yRatio:innerHeight?y/innerHeight:0
      };
      this.currentPoints.push(point);
      this.addMarker(point);
      this.controller?.setStatus(point.order===10?'SCREEN_PATTERN_MAX':'SCREEN_PATTERN_POINT_SAVED');
      this.onPointSaved?.(point,this.currentPoints.length);
      if(this.currentPoints.length>=10)this.disarm();
    }

    startNew(page='A'){
      this.disarm();
      this.currentPoints=[];
      this.currentPage=page;
      this.refreshMarkers([]);
    }

    setEnd(){
      if(!this.currentPoints.length)return;
      this.currentPoints.forEach((p,i)=>p.end=(i===this.currentPoints.length-1));
      this.refreshMarkers();
    }

    save(name,{pageMode='single',pageAUrl='',pageBUrl='',intervalMs=500,count=1}={}){
      if(!this.currentPoints.length)throw new Error('No screen positions recorded');
      this.setEnd();
      const pattern={
        id:crypto.randomUUID?crypto.randomUUID():'screen-pattern-'+Date.now(),
        name:String(name||'Screen Click Pattern'),
        pageMode:pageMode==='paired'?'paired':'single',
        pageAUrl:String(pageAUrl||''),
        pageBUrl:String(pageBUrl||''),
        intervalMs:Math.max(0,Number(intervalMs)||0),
        count:Math.max(1,Math.floor(Number(count)||1)),
        maxPoints:10,
        points:this.currentPoints.map(p=>({...p})),
        createdAt:new Date().toISOString()
      };
      this.patterns.push(pattern);
      this.persist();
      return pattern;
    }

    resolvePoint(point){
      const x=clamp(point.xRatio,0,1)*innerWidth;
      const y=clamp(point.yRatio,0,1)*innerHeight;
      const hit=document.elementFromPoint(x,y);
      return {x,y,element:hit||null};
    }

    async run(pattern,{activatePage=this.activatePage}={}){
      for(let cycle=0;cycle<pattern.count;cycle++){
        for(let i=0;i<pattern.points.length;i++){
          const point=pattern.points[i];
          if(pattern.pageMode==='paired' && activatePage) await activatePage(point.page,pattern);
          const target=this.resolvePoint(point);
          if(!target.element)throw new Error('Screen position '+(i+1)+' has no target');
          target.element.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:target.x,clientY:target.y,view:window}));
          if(i<pattern.points.length-1 || cycle<pattern.count-1)await sleep(pattern.intervalMs);
        }
      }
      return {ok:true,patternId:pattern.id,points:pattern.points.length,cycles:pattern.count,intervalMs:pattern.intervalMs};
    }

    getAll(){return[...this.patterns]}
    remove(id){this.patterns=this.patterns.filter(p=>p.id!==id);this.persist()}
    clearMarkers(){this.markerLayer?.replaceChildren()}
  }

  window.AICCScreenClickPatterns=AICCScreenClickPatterns;
})();