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
          <details class="patterns"><summary>รูปแบบการกดอัตโนมัติ · DOM</summary>
            <div class="patternBox">
              <input class="patternName" placeholder="ชื่อแพตเทิร์น" style="width:100%;box-sizing:border-box;margin:6px 0">
              <div class="row"><span>ความเร็ว</span><input class="interval" type="number" min="0" step="50" value="500"><span>ms</span></div>
              <div class="row"><span>จำนวนครั้ง</span><input class="count" type="number" min="1" step="1" value="1"></div>
              <button class="recordPattern">จำปุ่มบนหน้าเว็บ</button>
              <button class="savePattern" disabled>บันทึกแพตเทิร์น</button>
              <select class="patternList" style="width:100%;margin-top:6px"></select>
              <button class="runPattern">รันแพตเทิร์น</button>
              <small class="patternInfo">กด “จำปุ่ม” แล้วคลิกปุ่มเป้าหมายบนหน้าเว็บหนึ่งครั้ง</small>
            </div>
          </details>
          <details class="screenPatterns"><summary>รูปแบบตำแหน่งปุ่มบนหน้าจอ</summary>
            <div class="screenPatternBox">
              <input class="screenName" placeholder="ชื่อแพตเทิร์น" style="width:100%;box-sizing:border-box;margin:6px 0">
              <div class="row"><span>หน้า</span><select class="screenPageMode"><option value="single">หน้าเดียว</option><option value="paired">จับคู่ 2 หน้า</option></select></div>
              <input class="pageAUrl" placeholder="ลิงก์หน้า A" style="width:100%;box-sizing:border-box;margin:4px 0">
              <input class="pageBUrl" placeholder="ลิงก์หน้า B (เมื่อจับคู่)" style="width:100%;box-sizing:border-box;margin:4px 0;display:none">
              <div class="row"><span>จุดที่จะบันทึก</span><select class="screenPage"><option value="A">หน้า A</option><option value="B">หน้า B</option></select></div>
              <div class="row"><span>ความเร็ว</span><input class="screenInterval" type="number" min="0" step="50" value="500"><span>ms</span></div>
              <div class="row"><span>จำนวนรอบ</span><input class="screenCount" type="number" min="1" step="1" value="1"></div>
              <div class="row"><button class="newScreenPattern">เริ่มชุดใหม่</button><button class="recordScreenPoint">เพิ่มตำแหน่ง</button></div>
              <div class="row"><button class="endScreenPoint">กำหนดจุดปิดท้าย</button><button class="saveScreenPattern">บันทึก</button></div>
              <select class="screenPatternList" style="width:100%;margin-top:6px"></select>
              <button class="runScreenPattern">รันแพตเทิร์น</button>
              <small class="screenPatternInfo">สูงสุด 10 ตำแหน่งต่อแพตเทิร์น · จุดจะแสดงหมายเลขบนหน้าจอ</small>
            </div>
          </details>
          <small>เมนูลากได้ทั่วหน้าจอ</small>
        </div>`;
      this.root.append(this.host);
      this.shield=this.shadow.querySelector('.shield'); this.status=this.shadow.querySelector('.status'); this.menu=this.shadow.querySelector('.menu'); this.console=this.shadow.querySelector('.console');
      this.font=this.shadow.querySelector('.font'); this.size=this.shadow.querySelector('.size');
      this.patternName=this.shadow.querySelector('.patternName'); this.interval=this.shadow.querySelector('.interval'); this.count=this.shadow.querySelector('.count');
      this.recordPattern=this.shadow.querySelector('.recordPattern'); this.savePattern=this.shadow.querySelector('.savePattern'); this.runPattern=this.shadow.querySelector('.runPattern');
      this.patternList=this.shadow.querySelector('.patternList'); this.patternInfo=this.shadow.querySelector('.patternInfo');
      this.screenName=this.shadow.querySelector('.screenName'); this.screenPageMode=this.shadow.querySelector('.screenPageMode'); this.pageAUrl=this.shadow.querySelector('.pageAUrl'); this.pageBUrl=this.shadow.querySelector('.pageBUrl');
      this.screenPage=this.shadow.querySelector('.screenPage'); this.screenInterval=this.shadow.querySelector('.screenInterval'); this.screenCount=this.shadow.querySelector('.screenCount');
      this.newScreenPattern=this.shadow.querySelector('.newScreenPattern'); this.recordScreenPoint=this.shadow.querySelector('.recordScreenPoint'); this.endScreenPoint=this.shadow.querySelector('.endScreenPoint'); this.saveScreenPattern=this.shadow.querySelector('.saveScreenPattern'); this.screenPatternList=this.shadow.querySelector('.screenPatternList'); this.runScreenPattern=this.shadow.querySelector('.runScreenPattern'); this.screenPatternInfo=this.shadow.querySelector('.screenPatternInfo');
      this.menu.onclick=()=>this.console.classList.toggle('open');
      this.shadow.querySelector('.run').onclick=()=>this.start('WAIT_TARGET');
      this.shadow.querySelector('.stop').onclick=()=>this.stop();
      this.font.oninput=()=>this.setFont(Number(this.font.value)); this.size.oninput=()=>this.setMenuSize(Number(this.size.value));
      this.patterns=window.AICCCustomClickPatterns ? new window.AICCCustomClickPatterns({controller:this}) : null;
      this.screenPatterns=window.AICCScreenClickPatterns ? new window.AICCScreenClickPatterns({controller:this}) : null;
      this.screenPageMode.onchange=()=>{this.pageBUrl.style.display=this.screenPageMode.value==='paired'?'block':'none';};
      this.newScreenPattern.onclick=()=>{this.screenPatterns?.startNew(this.screenPage.value);this.screenPatternInfo.textContent='เริ่มชุดใหม่แล้ว · เลือกหน้าแล้วกด “เพิ่มตำแหน่ง”';};
      this.recordScreenPoint.onclick=()=>this.screenPatterns?.arm(this.screenPage.value);
      this.endScreenPoint.onclick=()=>{this.screenPatterns?.setEnd();this.screenPatternInfo.textContent='กำหนดตำแหน่งล่าสุดเป็นจุดปิดท้ายแล้ว';};
      this.saveScreenPattern.onclick=()=>this.saveCurrentScreenPattern();
      this.runScreenPattern.onclick=()=>this.runSelectedScreenPattern();
      this.refreshScreenPatternList();
      if(this.patterns) this.patterns.onTargetSaved=(target)=>{this.savePattern.disabled=false;this.patternInfo.textContent='จำปุ่มแล้ว: '+(target.text || target.ariaLabel || target.tag);};
      this.recordPattern.onclick=()=>this.patterns?.arm();
      this.savePattern.onclick=()=>this.saveCurrentPattern();
      this.runPattern.onclick=()=>this.runSelectedPattern();
      this.refreshPatternList();
      this.installDrag(); this.restorePosition();
    }
    saveCurrentScreenPattern(){
      if(!this.screenPatterns)return;
      try{
        const p=this.screenPatterns.save(this.screenName.value.trim()||'Screen Click Pattern',{
          pageMode:this.screenPageMode.value,pageAUrl:this.pageAUrl.value.trim(),pageBUrl:this.pageBUrl.value.trim(),
          intervalMs:Number(this.screenInterval.value),count:Number(this.screenCount.value)
        });
        this.refreshScreenPatternList();this.screenPatternList.value=p.id;this.screenPatternInfo.textContent='บันทึกแล้ว · '+p.points.length+' ตำแหน่ง · '+(p.pageMode==='paired'?'2 หน้า':'หน้าเดียว');
      }catch(error){this.screenPatternInfo.textContent=String(error?.message||error)}
    }
    refreshScreenPatternList(){
      if(!this.screenPatternList||!this.screenPatterns)return;
      this.screenPatternList.innerHTML='';
      for(const p of this.screenPatterns.getAll()){const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' · '+p.points.length+' จุด / '+p.count+' รอบ';this.screenPatternList.append(o)}
    }
    async runSelectedScreenPattern(){
      const p=this.screenPatterns?.getAll().find(x=>x.id===this.screenPatternList.value);if(!p)return;
      try{this.lock();this.setStatus('SCREEN_PATTERN_RUNNING');const result=await this.screenPatterns.run(p);this.setStatus('SCREEN_PATTERN_DONE');return result}
      catch(error){this.state.screenPatternError=String(error?.message||error);this.setStatus('SCREEN_PATTERN_FAILED')}
      finally{this.unlock()}
    }
    saveCurrentPattern(){
      if(!this.patterns) return;
      const p=this.patterns.add(this.patternName.value.trim() || 'Custom Click',{intervalMs:Number(this.interval.value),count:Number(this.count.value)});
      this.savePattern.disabled=true; this.patternName.value=''; this.refreshPatternList(); this.patternList.value=p.id; this.patternInfo.textContent='บันทึกแล้ว: '+p.name;
    }
    refreshPatternList(){
      if(!this.patternList || !this.patterns) return;
      const list=this.patterns.getAll(); this.patternList.innerHTML='';
      for(const p of list){const o=document.createElement('option');o.value=p.id;o.textContent=p.name+' · '+p.count+' ครั้ง / '+p.intervalMs+'ms';this.patternList.append(o);}
    }
    async runSelectedPattern(){
      const p=this.patterns?.getAll().find(x=>x.id===this.patternList.value);
      if(!p) return;
      try{this.lock();this.setStatus('PATTERN_RUNNING');const result=await this.patterns.run(p);this.setStatus('PATTERN_DONE');return result;}
      catch(error){this.setStatus('PATTERN_FAILED');this.state.patternError=String(error?.message||error);}
      finally{this.unlock();}
    }
    setFont(v){this.cfg.statusFontSize=clamp(v,8,50);this.font.value=this.cfg.statusFontSize;this.shadow.host.style.setProperty('--font-size',this.cfg.statusFontSize+'px');this.shadow.querySelector('.fontOut').textContent=this.cfg.statusFontSize+'px';}
    setMenuSize(v){this.cfg.menuSize=clamp(v,40,88);this.size.value=this.cfg.menuSize;this.shadow.host.style.setProperty('--menu-size',this.cfg.menuSize+'px');this.shadow.querySelector('.sizeOut').textContent=this.cfg.menuSize+'px';}
    restorePosition(){const x=this.cfg.menuX??Math.max(8,innerWidth-72),y=this.cfg.menuY??Math.max(8,innerHeight-72);this.moveMenu(x,y);}
    moveMenu(x,y){const size=this.cfg.menuSize;this.menu.style.left=clamp(x,4,innerWidth-size-4)+'px';this.menu.style.top=clamp(y,4,innerHeight-size-4)+'px';this.cfg.menuX=parseFloat(this.menu.style.left);this.cfg.menuY=parseFloat(this.menu.style.top);}
    installDrag(){let drag=null;this.menu.addEventListener('pointerdown',e=>{if(e.button!==undefined&&e.button!==0)return;drag={id:e.pointerId,dx:e.clientX-this.menu.offsetLeft,dy:e.clientY-this.menu.offsetTop};this.menu.setPointerCapture(e.pointerId);this.menu.style.cursor='grabbing';});
      this.menu.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;this.moveMenu(e.clientX-drag.dx,e.clientY-drag.dy);});
      this.menu.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;drag=null;this.menu.style.cursor='grab';});
    }
    setStatus(status,elapsed=0){this.state.status=status;const labels={PROCESSING:'กำลังประมวลผล...',STALLED:'ตรวจพบว่าหน้าเว็บหยุดทำงาน',PATTERN_RECORDING:'กำลังจำปุ่ม...',PATTERN_TARGET_SAVED:'จำปุ่มเป้าหมายแล้ว',PATTERN_RUNNING:'กำลังกดตามแพตเทิร์น...',PATTERN_DONE:'แพตเทิร์นเสร็จแล้ว',PATTERN_FAILED:'แพตเทิร์นทำงานไม่สำเร็จ',SCREEN_PATTERN_RECORDING:'กำลังบันทึกตำแหน่งหน้าจอ...',SCREEN_PATTERN_POINT_SAVED:'บันทึกตำแหน่งแล้ว',SCREEN_PATTERN_MAX:'ครบ 10 ตำแหน่งแล้ว',SCREEN_PATTERN_RUNNING:'กำลังรันตำแหน่งบนหน้าจอ...',SCREEN_PATTERN_DONE:'แพตเทิร์นตำแหน่งเสร็จแล้ว',SCREEN_PATTERN_FAILED:'แพตเทิร์นตำแหน่งทำงานไม่สำเร็จ'};this.shadow.querySelector('.label').textContent=labels[status]||status;this.shadow.querySelector('.elapsed').textContent=new Date(elapsed*1000).toISOString().slice(14,19);this.status.style.display=status==='READY'?'none':'grid';}
    lock(){this.shield.style.display='block';this.state.running=true;}
    unlock(){this.shield.style.display='none';this.state.running=false;}
    start(step='WAIT_TARGET'){this.lock();this.state.checkpoint={step};this.setStatus('PROCESSING');}
    stop(){this.unlock();this.setStatus('STOPPED');}
  }
  window.AICCGenericController=AICCGenericController;
})();