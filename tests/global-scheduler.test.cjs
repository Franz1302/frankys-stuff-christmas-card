/* Regression: Santa's scheduler must survive dashboard view changes. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync('dist/frankys-christmas-card.js','utf8');
function browser(storage) {
  const registry={}, timers=new Map(), listeners={};
  let timerId=0;
  class FakeElement {
    constructor(){this.isConnected=false;}
    attachShadow(){this.shadowRoot={innerHTML:''};return this.shadowRoot;}
  }
  const document={
    hidden:false,body:{},
    createElement:type=>({type}),
    addEventListener:(event,cb)=>{listeners[event]=cb;}
  };
  const localStorage={
    getItem:key=>storage.get(key)||null,
    setItem:(key,value)=>storage.set(key,value),
    removeItem:key=>storage.delete(key)
  };
  const context={
    document,localStorage,window:{customCards:[]},
    navigator:{language:'en-US'},
    HTMLElement:FakeElement,
    customElements:{get:key=>registry[key],define:(key,value)=>{registry[key]=value;}},
    setTimeout:(callback,ms)=>{timers.set(++timerId,{callback,ms});return timerId;},
    clearTimeout:id=>{timers.delete(id);},
    CustomEvent:class{}
  };
  vm.runInNewContext(code,context);
  const Card=registry['frankys-christmas-card'];
  assert(Card,'Christmas Card was not registered');
  Card.prototype._render=function(){}; // The test checks lifecycle, not DOM markup.
  return {Card,document,timers,listeners};
}
const storage=new Map();
const first=browser(storage);
assert.equal(first.timers.size,0,'No scheduler before configuration');
const card=new first.Card();
card.setConfig({type:'custom:frankys-christmas-card'});
card.isConnected=true;
card.connectedCallback();
assert.equal(first.timers.size,0,'New installation must start disabled');
card._state.enabled=true;
card._save();
card._applySchedule();
assert.equal(first.timers.size,1,'Exactly one timer after enabling');
assert(storage.has('frankys-christmas-v1-global-config'),'Settings must survive reload');
card.disconnectedCallback();
assert.equal(first.timers.size,1,'Leaving the dashboard view must not stop flights');
const again=new first.Card();
again.setConfig({type:'custom:frankys-christmas-card'});
again.isConnected=true;
again.connectedCallback();
assert.equal(first.timers.size,1,'Reopening control card must not duplicate schedules');
const reloaded=browser(storage);
assert.equal(reloaded.timers.size,1,'A fresh dashboard view without a card must resume flights');
reloaded.document.hidden=true;
reloaded.listeners.visibilitychange();
assert.equal(reloaded.timers.size,0,'Hidden browser must pause scheduler');
reloaded.document.hidden=false;
reloaded.listeners.visibilitychange();
assert.equal(reloaded.timers.size,1,'Visible browser must resume scheduler');
console.log('OK: Santa global scheduler, navigation, cold reload, visibility and no duplicate timers');
