// Generic AICC controller test core
(() => {
  'use strict';
  const DEFAULTS = Object.freeze({statusFontSize:14,minFontSize:8,maxFontSize:50,menuSize:56,menuMin:40,menuMax:88,menuX:null,menuY:null,overlayOpacity:.14});
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  class AICCGenericController {
    constructor(root=document.body){
      this.root=root; this.cfg={...DEFAULTS}; this.state={running:false,status:'IDLE',elapsed:0,reloads:0,checkpoint:null};
      this.mount(); this.setStatus('READY');
    }
    mount(){
      this.host=document.createElement('ai-conversation-controller');
      this.shadow=this.host.attachShadow({mode:'open'});
      this.shadow.innerHTML=`
        <style>
          :host{all:initial;--font-size:14px;--menu-size:56px;--overlay-opacity:.14;font-family:system-ui,sans-serif}
          .shield{position:fixed;inset:0;z-index:2147483640;background:rgba(0,0,0,var(--overlay-opacity));display:none}
          .status{position:fixed;inset:0;z-index:2147483641;display:none;place-items:center;pointer-events:none}
          .card{font-size:var(--font-size);padding:10px 14px;border-radius:12px;background:rgba(255,255,255,.88);color:#111;box-shadow:0 8px 30px #0002;text-align:center}
          .menu{position:fixed;z-index:2147483643;width:var(--menu-size);height:var(--menu-size);border:0;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;touch-action:none;cursor:grab;box-shadow:0 8px 24px #0004}
          .console{position:fixed;z-index:2147483644;right:16px;bottom:88px;width:min(330px,calc(100vw - 32px));padding:14px;border-radius:14px;background:#111;color:#fff;display:none}
          .console.open{display:block}.console button{margin:4px;padding:6px 9px}.row{display:flex;gap:8px;align-items:center;margin:8px 0}
          input[type=range]{width:100%}
        </style>
        <div class="shield"></div>
        <div class="status"><div class="card"><span class="icon">⏳</span><span class="label">กำลังประมวลผล...</span><div class="elapsed">00:00</div></div></div>
        <button class="menu" aria-label="AI Controller Menu">●</button>
        <div class="console">
          <b>AI Conversation Controller</b>
          <div class="row"><span>ตัวอักษร</span><input class="font" type="range" min="8" max="50" value="14"><output class="fontOut">14px</output></div>
          <div class="row"><span>ไอคอน</span><input class="size" type="range" min="40" max="88" value="56"><output class="sizeOut">56px</output></div>
          <div class="row"><button class="run">Run</button><button class="stop">Stop</button></div>
          <small>เมนูลากได้ทั่วหน้าจอ</small>
        </div>`;
      this.root.append(this.host);
      this.shield=this.shadow.querySelector('.shield'); this.status=this.shadow.querySelector('.status'); this.menu=this.shadow.querySelector('.menu'); this.console=this.shadow.querySelector('.console');
      this.font=this.shadow.querySelector('.font'); this.size=this.shadow.querySelector('.size');
      this.menu.onclick=()=>this.console.classList.toggle('open');
      this.shadow.querySelector('.run').onclick=()=>this.start('WAIT_TARGET');
      this.shadow.querySelector('.stop').onclick=()=>this.stop();
      this.font.oninput=()=>this.setFont(Number(this.font.value)); this.size.oninput=()=>this.setMenuSize(Number(this.size.value));
      this.installDrag(); this.restorePosition();
    }
    setFont(v){this.cfg.statusFontSize=clamp(v,8,50);this.font.value=this.cfg.statusFontSize;this.shadow.host.style.setProperty('--font-size',this.cfg.statusFontSize+'px');this.shadow.querySelector('.fontOut').textContent=this.cfg.statusFontSize+'px';}
    setMenuSize(v){this.cfg.menuSize=clamp(v,40,88);this.size.value=this.cfg.menuSize;this.shadow.host.style.setProperty('--menu-size',this.cfg.menuSize+'px');this.shadow.querySelector('.sizeOut').textContent=this.cfg.menuSize+'px';}
    restorePosition(){const x=this.cfg.menuX??Math.max(8,innerWidth-72),y=this.cfg.menuY??Math.max(8,innerHeight-72);this.moveMenu(x,y);}
    moveMenu(x,y){const size=this.cfg.menuSize;this.menu.style.left=clamp(x,4,innerWidth-size-4)+'px';this.menu.style.top=clamp(y,4,innerHeight-size-4)+'px';this.cfg.menuX=parseFloat(this.menu.style.left);this.cfg.menuY=parseFloat(this.menu.style.top);}
    installDrag(){let drag=null;this.menu.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;drag={id:e.pointerId,dx:e.clientX-this.menu.offsetLeft,dy:e.clientY-this.menu.offsetTop};this.menu.setPointerCapture(e.pointerId);this.menu.style.cursor='grabbing';});
      this.menu.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;this.moveMenu(e.clientX-drag.dx,e.clientY-drag.dy);});
      this.menu.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;this.menu.style.cursor='grab';});
    }
    setStatus(status,elapsed=0){this.state.status=status;this.shadow.querySelector('.label').textContent=status==='PROCESSING'?'กำลังประมวลผล...':status==='STALLED'?'ตรวจพบว่าหน้าเว็บหยุดทำงาน':status;this.shadow.querySelector('.elapsed').textContent=new Date(elapsed*1000).toISOString().slice(14,19);this.status.style.display=status==='READY'?'none':'grid';}
    lock(){this.shield.style.display='block';this.state.running=true;}
    unlock(){this.shield.style.display='none';this.state.running=false;}
    start(step='WAIT_TARGET'){this.lock();this.state.checkpoint={step};this.setStatus('PROCESSING');}
    stop(){this.unlock();this.setStatus('STOPPED');}
  }
  window.AICCGenericController=AICCGenericController;
})();