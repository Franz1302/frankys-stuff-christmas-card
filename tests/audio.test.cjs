/* Regression: repeat scheduled Santa voice via reusable Howler, no delayed HTMLAudio. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('dist/frankys-christmas-card.js','utf8');
let nextId=0,unlocks=0,htmlAudioCount=0;
const howls=[],timers=new Map(),registry={},store=new Map();
class FakeNode {
 constructor(tag){this.tag=tag;this.style={};this.parentNode=null;this.isConnected=false;}
 attachShadow(){this.shadowRoot={innerHTML:''};return this.shadowRoot;}
 appendChild(child){child.parentNode=this;return child;}
 removeChild(child){child.parentNode=null;return child;}
 setAttribute(){}
 getContext(){return null;}
 play(){return Promise.resolve();}
 pause(){}
}
class FakeHowl {
 constructor(options){this.options=options;this.played=[];this.stopped=[];howls.push(this);}
 play(){const id=++nextId;this.played.push(id);return id;}
 volume(value,id){this.volumeValue=value;}
 stop(id){this.stopped.push(id);}
}
const doc={hidden:false,body:new FakeNode('body'),
 createElement:type=>new FakeNode(type),addEventListener(){}};
const win={customCards:[],Howl:FakeHowl,
 Howler:{ctx:{state:'suspended',resume(){unlocks++;this.state='running';return Promise.resolve();}},usingWebAudio:false},
 console:{warn(){}}};
const context={
 window:win,document:doc,HTMLElement:FakeNode,navigator:{language:'en-US',userAgent:'Chrome'},
 customElements:{get:key=>registry[key],define:(key,value)=>registry[key]=value},
 localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value),removeItem:key=>store.delete(key)},
 innerWidth:1200,innerHeight:800,performance:{now:()=>1000},
 setTimeout:(callback,ms)=>{const id=++nextId;timers.set(id,{callback,ms});return id;},
 clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},
 Audio:class{constructor(){htmlAudioCount++;throw Error('Do not use direct HTML Audio');}}
};
vm.runInNewContext(source,context);
const Card=registry['frankys-christmas-card'];
assert(Card,'Card registered');
Card.prototype._render=function(){};
const card=new Card();
card.setConfig({type:'custom:frankys-christmas-card',video:false,bells:false,duration:10,sound_volume:.3});
card._state.sound=true;
card._state.enabled=true;
card._applySchedule();
assert.equal(howls.length,1,'Enabled saved schedule preloads Santa before a user opens the card');
card._unlockAudio();
assert.equal(unlocks,1,'AudioContext resumes inside the user interaction');
assert.equal(howls.length,1,'Santa is preloaded once for subsequent flights');
assert.equal(howls[0].options.html5,false,'Prefer Howler Web Audio');
assert.equal(howls[0].options.preload,true);
assert.equal(card._play(),true);
const delayed=[...timers.values()].find(t=>t.ms===1400);
assert(delayed,'Santa voice keeps its cinematic offset');
delayed.callback();
assert.equal(howls[0].played.length,1,'First flight plays Santa');
assert.equal(howls[0].volumeValue,.3,'User volume is respected');
card._stop();
assert.equal(howls[0].stopped.length,1,'Stop cancels current Santa');
assert.equal(card._play(),true);
[...timers.values()].filter(t=>t.ms===1400).at(-1).callback();
assert.equal(howls.length,1,'No new HTML audio or Howl per flight');
assert.equal(howls[0].played.length,2,'Automatic replay uses the same ready audio engine');
assert.equal(htmlAudioCount,0,'No direct HTMLAudio path for Santa');
howls[0].options.onplayerror(123,'autoplay denied');
assert.match(win.__FrankysChristmasAudioV026.status(),/blocked/,'Playback errors are visible for diagnostics');
card._stop();
assert.equal(howls[0].stopped.length,2,'Repeat flight cleanup');
assert.match(source,/getBellPlayer\(c\.bells\)/,'Glöckchen crossfade player preserved');
assert.match(source,/window\.Howler\.usingWebAudio&&window\.Howler\.ctx/,'Bell graph shares Howler AudioContext');
console.log('OK: Howler init/unlock, reuse on scheduled flights, stop, volumes, diagnostics, bell crossfade and shared context');
