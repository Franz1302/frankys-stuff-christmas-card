/* Regression: Santa's scheduler must survive dashboard view changes. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync('dist/frankys-christmas-card.js','utf8');
function browser(storage, fakeNow) {
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
    CustomEvent:class{},
    Date: fakeNow ? class FrozenDate extends Date {
      constructor(...args){if(args.length)super(...args);else super(fakeNow.getTime());}
      static now(){return fakeNow.getTime();}
    } : Date
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
// Fixed hourly mode fires at :00 (not after a random delay).
function expectHourly(hour,minute,start,end,expectedMinutes) {
  const store=new Map(),now=new Date(2026,9,26,hour,minute,0,0);
  const b=browser(store,now), c=new b.Card();
  c.setConfig({type:'custom:frankys-christmas-card',schedule_start:start,schedule_end:end});
  c._state.enabled=true;
  c._state.interval='hourly';
  c._save();
  c.isConnected=true;
  c.connectedCallback();
  assert.equal(b.timers.size,1,'Hourly mode schedules exactly one timeout');
  assert.equal([...b.timers.values()][0].ms,expectedMinutes*60000,'Next flight at the correct full hour');
  c.disconnectedCallback();
  assert.equal(b.timers.size,1,'Hourly schedule survives leaving card view');
  const refreshed=browser(store,now);
  assert.equal(refreshed.timers.size,1,'Hourly mode restored without opening the card');
  assert.equal([...refreshed.timers.values()][0].ms,expectedMinutes*60000,'Restored hourly clock alignment');
}
expectHourly(9,15,'09:00','22:00',45);
expectHourly(8,45,'09:00','22:00',15);
expectHourly(21,15,'09:00','22:00',705);
expectHourly(9,35,'10:15','11:05',85);
const narrow=browser(new Map(),new Date(2026,9,26,9,10));
const narrowCard=new narrow.Card();
narrowCard.setConfig({type:'custom:frankys-christmas-card',schedule_start:'09:05',schedule_end:'09:20'});
narrowCard._state.enabled=true;
narrowCard._state.interval='hourly';
narrowCard._save();
narrowCard.isConnected=true;
narrowCard.connectedCallback();
assert.equal(narrow.timers.size,0,'No full hour inside the configured window');
console.log('OK: Santa global scheduler, navigation, reload, visibility, no duplicate timers and fixed hourly flights');
