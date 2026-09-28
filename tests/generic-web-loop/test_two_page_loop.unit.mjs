import fs from 'node:fs';

const src=fs.readFileSync(new URL('./aicc-two-page-loop.js', import.meta.url),'utf8');
const sandbox={window:{}};
Function('window',src)(sandbox.window);

const Loop=sandbox.window.AICCTwoPageClipboardLoop;
const clipboard={value:'',async write(v){this.value=v},async read(){return this.value}};

function page(name){
  let response='',ready=false,seq=0,input='';
  return {
    pageId:name,
    api:{
      async paste(v){input=v},
      async submit(){seq++;response=name+' processed: '+input+' | chunk 3';ready=true},
      async isReadyToCopy(){return ready},
      async nativeCopy(){if(!ready)throw new Error('not ready');ready=false;return response},
      async snapshot(){return {name,response,seq}}
    }
  };
}

const A=page('A');
const B=page('B');
const activations=[];
const loop=new Loop({
  activate:async pageId=>activations.push(pageId),
  clipboard,
  rounds:10
});

const result=await loop.run(A,B,'SEED');

if(!result.ok||result.rounds!==10||result.history.length!==10) {
  throw new Error('10-round loop assertion failed');
}
for(let i=0;i<10;i++){
  const r=result.history[i];
  if(r.round!==i+1) throw new Error('round order failed');
  if(!r.a.copied||r.a.pasted!==r.a.copied) throw new Error('A copy/paste failed');
  if(!r.b.copied||r.b.pasted!==r.b.copied) throw new Error('B copy/paste failed');
}
if(activations.length!==30) throw new Error('tab activation count failed');

console.log('PASS: deterministic 10-round A -> B -> A copy/paste loop');
console.log(JSON.stringify({
  rounds:result.rounds,
  tabActivations:activations.length,
  copyActions:20,
  pasteActions:30,
  finalRound:result.history.at(-1)
},null,2));
