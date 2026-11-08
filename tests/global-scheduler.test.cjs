/* Regression: the shared scheduler survives card removal, reload and visibility changes. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const code=fs.readFileSync('dist/frankys-seasonal-card.js','utf8');

function browser(storage,now=new Date(2026,9,26,9,15)){
 const timers=new Map(),listeners={};let timerId=0;
 class FrozenDate extends Date{
  constructor(...args){if(args.length)super(...args);else super(now.getTime());}
  static now(){return now.getTime();}
 }
 const document={hidden:false,body:{},addEventListener:(name,fn)=>{listeners[name]=fn;},createElement:()=>({})};
 const context={
  document,localStorage:{
   getItem:key=>storage.get(key)||null,
   setItem:(key,value)=>storage.set(key,String(value)),
   removeItem:key=>storage.delete(key),
   key:index=>[...storage.keys()][index]||null,
   get length(){return storage.size;},
  },
  window:{customCards:[],dispatchEvent(){},addEventListener(){},removeEventListener(){}},
  navigator:{language:'en-US'},HTMLElement:class{},Event:class{},
  CustomEvent:class{},Date:FrozenDate,
  customElements:{get(){return null;},define(){},whenDefined(){return Promise.resolve();}},
  setTimeout:(callback,ms)=>{const id=++timerId;timers.set(id,{callback,ms});return id;},
  clearTimeout:id=>timers.delete(id),
  console:{warn(){},error(){},info(){}},
 };
 vm.runInNewContext(code,context);
 return {controller:context.window.__frankysSeasonalController,document,timers,listeners};
}

const storage=new Map();
const first=browser(storage);
const config={schedule_mode:'daily',schedule_start:'09:00',schedule_end:'22:00'};
first.controller.configure(config);
assert.equal(first.timers.size,0,'New installation must start disabled');
first.controller.setState({enabled:true});
assert.equal(first.timers.size,1,'Enabling creates one scheduler timeout');
assert(storage.has('frankys-seasonal/controller/v1'),'Settings survive reload');
assert(storage.has('frankys-seasonal/calendar-config/v1'),'Scheduler config is recoverable without an open card');
first.controller.schedule();
assert.equal(first.timers.size,1,'Repeated updates must not duplicate scheduler timers');
first.controller.schedule();
assert.equal(first.timers.size,1,'Repeated card updates still use one timer');
first.document.hidden=true;
first.listeners.visibilitychange();
assert.equal(first.timers.size,0,'Hidden browser pauses the scheduler');
first.document.hidden=false;
first.listeners.visibilitychange();
assert.equal(first.timers.size,1,'Visible browser resumes the scheduler');

const reloaded=browser(storage);
assert.equal(reloaded.controller.state.enabled,true,'A reload restores the saved enable state');
assert.equal(reloaded.timers.size,1,'A reload resumes the schedule without opening a card');

function expectHourly(hour,minute,start,end,expectedMinutes){
 const store=new Map(),now=new Date(2026,9,26,hour,minute,0,0),b=browser(store,now);
 b.controller.configure({schedule_mode:'hourly',schedule_start:start,schedule_end:end});
 b.controller.setState({enabled:true,mode:'hourly'});
 assert.equal(b.timers.size,1,'Hourly mode schedules exactly one timeout');
 assert.equal([...b.timers.values()][0].ms,expectedMinutes*60000,'Next flight aligns with a valid full hour');
}
expectHourly(9,15,'09:00','22:00',45);
expectHourly(8,45,'09:00','22:00',15);
expectHourly(21,15,'09:00','22:00',705);
expectHourly(9,35,'10:15','11:05',85);
const narrow=browser(new Map(),new Date(2026,9,26,9,10));
narrow.controller.configure({schedule_mode:'hourly',schedule_start:'09:05',schedule_end:'09:20'});
narrow.controller.setState({enabled:true,mode:'hourly'});
assert.equal(narrow.timers.size,0,'No full hour inside the configured window means no timeout');
console.log('OK: shared schedule, reload, visibility, duplicate prevention and hourly alignment');
