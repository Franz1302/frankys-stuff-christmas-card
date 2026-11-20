/* Regression: hidden Seasonal Fun Card must preserve playback and edit access. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const script = fs.readFileSync('dist/frankys-seasonal-card.js', 'utf8');
const registry = {};
const storage = new Map();
class FakeElement {
  constructor(){this.hidden=false;this.events=[];}
  attachShadow(){
    const root={innerHTML:'',getElementById(){return null;}};
    this.shadowRoot=root;
    return root;
  }
  dispatchEvent(event){this.events.push(event.type);return true;}
}
class FakeEvent {
  constructor(type,options){this.type=type;Object.assign(this,options);}
}
const ctx={
  window:{customCards:[],addEventListener(){},removeEventListener(){},dispatchEvent(){}},
  document:{hidden:true,addEventListener(){},createElement:()=>new FakeElement()},
  navigator:{language:'en-GB'},
  localStorage:{
    getItem:key=>storage.get(key)??null,
    setItem:(key,value)=>storage.set(key,String(value)),
    removeItem:key=>storage.delete(key),
    key:i=>[...storage.keys()][i]??null,
    get length(){return storage.size}
  },
  customElements:{get:key=>registry[key],define:(key,value)=>{registry[key]=value;},whenDefined:()=>Promise.resolve()},
  HTMLElement:FakeElement,Event:FakeEvent,CustomEvent:FakeEvent,
  setTimeout:()=>1,clearTimeout(){},console:{info(){},warn(){},error(){}}
};
vm.runInNewContext(script,ctx,{filename:'frankys-seasonal-card.js'});
const Card=registry['frankys-seasonal-card'];
assert(Card,'Seasonal card must register');
const card=new Card();
assert.equal(card.connectedWhileHidden,true,'Hidden card must stay connected for scheduling');
card.config={display_mode:'hidden'};
card.syncDisplayMode();
assert.equal(card.hidden,true,'Normal dashboard should hide the card');
assert(card.events.includes('card-visibility-changed'),'Visibility change must notify hui-card');
card.preview=true;
assert.equal(card.hidden,false,'Dashboard edit preview must reveal the card');
assert.match(card.shadowRoot.innerHTML,/id="hide-placeholder"/,'Edit mode must show recoverable placeholder');
assert.match(card.shadowRoot.innerHTML,/Animations and schedules continue/);
card.render=()=>card.syncDisplayMode();
card.editMode=false;
assert.equal(card.hidden,true,'Leaving edit mode must hide the card again');
card.config={display_mode:'compact'};
card.syncDisplayMode();
assert.equal(card.hidden,false,'Compact mode must not hide card');
card.config={display_mode:'normal'};
card.syncDisplayMode();
assert.equal(card.hidden,false,'Normal mode must remain visible');
const ctrl=ctx.window.__frankysSeasonalController;
ctrl.configure({type:'custom:frankys-seasonal-card',display_mode:'unsupported'});
assert.equal(ctrl.config.display_mode,'normal','Unknown setting must preserve existing behavior');
assert(script.includes('compact > .season-picker')&&script.includes('compact > .buttons'),'Compact mode should hide full controls');
assert(script.includes("select('display_mode'"),'Visual editor must expose display mode');
console.log('OK: hide, edit-mode placeholder, compact and backwards-compatible defaults');
