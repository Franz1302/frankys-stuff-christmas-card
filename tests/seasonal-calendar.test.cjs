const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');

const source=fs.readFileSync('dist/frankys-seasonal-card.js','utf8').replace(
 "await import('./seasonal-scenes.mjs?v=0.4.2')",
 "await Promise.resolve({getSceneURL:(scene,custom)=>custom||(scene==='st_martin'?'/assets/St_Martin_korrigiert.webp':scene==='nikolaus'?'/assets/Nikolaus_ohne_Wasserzeichen_transparent.webp':null),getSceneSoundURL:(scene,custom)=>custom||(scene==='nikolaus'?'/assets/Nikolaus_Mirelo_Ton_15s.mp3':scene==='st_martin'?'/assets/St_Martin_Mirelo_Ton_9s.mp3':null),webpDuration:()=>100})"
);
function webpBuffer(){
 const bytes=new Uint8Array(36),view=new DataView(bytes.buffer);
 bytes.set(Buffer.from('RIFF'),0);view.setUint32(4,28,true);bytes.set(Buffer.from('WEBP'),8);
 bytes.set(Buffer.from('ANMF'),12);view.setUint32(16,16,true);bytes[32]=5;
 return bytes.buffer;
}

function createController(config={},options={}){
 const storage=new Map(Object.entries(options.storage||{})),listeners={},timers=new Map(),overlays=[],requests=[];
 let now=new Date(options.now||'2026-11-11T12:00:00'),nextTimer=0,objectURL=0,revoked=0;
 const audios=[];
 const missing=options.missing===true;
 class FrozenDate extends Date {
  constructor(...args){super(...(args.length?args:[now]));}
  static now(){return now.getTime();}
 }
 const context={
  window:{customCards:[],dispatchEvent(){},addEventListener(){},removeEventListener(){}},
  document:{hidden:true,addEventListener:(name,fn)=>{listeners[name]=fn;},createElement(){
    const image={style:{},setAttribute(){},remove(){const i=overlays.indexOf(this);if(i>=0)overlays.splice(i,1);}};
    Object.defineProperty(image,'src',{set(){queueMicrotask(()=>image.onload?.());}});
    return image;
  },body:{appendChild(image){overlays.push(image);}}},
  navigator:{language:'en-US'},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key),key:index=>[...storage.keys()][index]||null,get length(){return storage.size;}},
  customElements:{get(){return null;},whenDefined(){return Promise.resolve();},define(){}},
  HTMLElement:class {},Event:class {},CustomEvent:class {},
  Audio:class {
    constructor(src){this.src=src;this.paused=false;this.played=false;audios.push(this);}
    play(){this.played=true;return Promise.resolve();}
    pause(){this.paused=true;}
  },
  setTimeout(callback,ms){const id=++nextTimer;timers.set(id,{callback,ms});return id;},
  clearTimeout(id){timers.delete(id);},
  URL:{createObjectURL(){return `blob:test-${++objectURL}`;},revokeObjectURL(){revoked++;}},
  Blob:class {},fetch:async url=>{requests.push(url);return {ok:!missing,status:missing?404:200,arrayBuffer:async()=>webpBuffer()};},
  queueMicrotask,Date:FrozenDate,console:{warn(){},error(){},info(){}},
 };
 vm.runInNewContext(source,context);
 const controller=context.window.__frankysSeasonalController;
 controller.configure({seasonal_calendar:{enabled:true,holidays:{...config}}});
 return {controller,storage,listeners,timers,overlays,requests,audios,document:context.document,setNow(value){now=new Date(value);},get revoked(){return revoked;}};
}

function holiday(enabled=true,start,end){
 return {enabled,start,end};
}

{
 const {controller}=createController({
  christmas:holiday(true,'12-20','01-05'),
 });
 assert.equal(controller.holidayForDate(new Date(2026,10,11)).season,'st_martin');
 assert.equal(controller.holidayForDate(new Date(2027,10,11)).season,'st_martin','Annual periods recur yearly');
 assert.equal(controller.holidayForDate(new Date(2027,0,2)).season,'christmas','Cross-year periods include January');
 assert.equal(controller.holidayForDate(new Date(2024,1,29)),null,'February 29 needs an enabled matching period');
 controller.configure({seasonal_calendar:{enabled:true,holidays:{christmas:holiday(true,'02-29','02-29')}}});
 assert.equal(controller.holidayForDate(new Date(2024,1,29)).season,'christmas','Leap-day dates match in leap years');
 assert.equal(controller.holidayForDate(new Date(2025,1,28)),null,'Leap-day dates do not shift in non-leap years');
}

{
 const {controller}=createController();
 controller.configure({seasonal_calendar:{enabled:false}});
 assert.equal(controller.config.seasonal_calendar.enabled,false,'Calendar defaults to disabled for older card configs');
 assert.deepEqual(JSON.parse(JSON.stringify(controller.config.seasonal_calendar.holidays)),{
  halloween:holiday(true,'10-25','10-31'),
  st_martin:holiday(true,'11-08','11-11'),
  nikolaus:holiday(true,'12-01','12-06'),
  christmas:holiday(true,'12-07','12-26'),
 },'Missing holiday settings receive backward-compatible annual defaults');
}

{
 const {controller}=createController({
  halloween:holiday(true,'10-25','11-11'),
  st_martin:holiday(true,'11-08','11-11'),
 });
 assert.equal(controller.holidayForDate(new Date(2026,10,11)).season,'halloween','Overlaps use the fixed holiday priority');
}

for(const id of ['halloween','st_martin','nikolaus','christmas']){
 const holidays={};
 for(const name of ['halloween','st_martin','nikolaus','christmas'])holidays[name]=holiday(true,'10-01','10-01');
 holidays[id]=holiday(false,'11-11','11-11');
 const {controller}=createController(holidays);
 assert.equal(controller.holidayForDate(new Date(2026,10,11)),null,`${id} can be individually disabled`);
}

{
 const {controller}=createController({st_martin:holiday(true,'11-11','11-11')});
 assert.equal(controller.state.season,'st_martin');
 controller.configure({seasonal_calendar:{enabled:false}});
 assert.equal(controller.state.season,'christmas','Disabling the calendar restores the saved manual season');
 assert.equal(controller.holidayForDate(new Date(2026,10,11)),null);
}

{
 const {controller,storage}=createController({
  st_martin:holiday(true,'11-11','11-11'),
  halloween:holiday(true,'11-12','11-12'),
 });
 controller.setState({season:'christmas'});
 controller.syncCalendar(new Date(2026,10,11));
 assert.equal(controller.state.season,'christmas','Manual choice overrides the calendar for that date');
 controller.syncCalendar(new Date(2026,10,12));
 assert.equal(controller.state.season,'halloween','The next date uses the calendar, not the previous manual choice');
 assert.equal(JSON.parse(storage.get('frankys-seasonal/controller/v1')).manual_season,'christmas');
 assert.equal(controller.config.seasonal_calendar.enabled,true,'Calendar configuration is not stored in controller state');
}

{
 const {controller,timers,setNow,document}=createController({st_martin:holiday(true,'11-11','11-11')},{now:'2026-11-10T23:59:00'});
 assert.equal(controller.state.season,'christmas');
 document.hidden=false;
 controller.schedule();
 const [midnight]=timers.values();
 setNow('2026-11-11T00:00:01');
 midnight.callback();
 assert.equal(controller.state.season,'st_martin');
}

{
 const previousState={enabled:true,sound:false,sound_christmas:false,sound_halloween:true,season:'halloween',manual_season:'halloween',mode:'hourly',start:'10:00',end:'20:00',interval_minutes:45};
 const previousPlan={day:'2026-11-11',start:'10:00',end:'20:00',times:[Date.parse('2026-11-11T12:00:00')]};
 const {controller,storage}=createController({st_martin:holiday(true,'11-11','11-11')},{storage:{
  'frankys-seasonal/controller/v1':JSON.stringify(previousState),
  'frankys-seasonal/daily-plan/v1':JSON.stringify(previousPlan),
 }});
 assert.equal(controller.state.enabled,true);
 assert.equal(controller.state.mode,'hourly');
 assert.equal(controller.state.start,'10:00');
 assert.equal(controller.state.end,'20:00');
 assert.equal(controller.state.interval_minutes,45);
 assert.equal(controller.state.sound_halloween,true);
 assert.equal(storage.get('frankys-seasonal/daily-plan/v1'),JSON.stringify(previousPlan),'Existing daily plan is preserved');
}

{
 const {controller,timers,setNow,document}=createController({
  halloween:holiday(false,'11-11','11-11'),
  st_martin:holiday(false,'11-11','11-11'),
  nikolaus:holiday(false,'11-11','11-11'),
  christmas:holiday(false,'11-11','11-11'),
 });
 let plays=0;
 document.hidden=false;
 controller.state.interval_minutes=15;
 const play=controller.play.bind(controller);
 controller.play=()=>{plays++;return play();};
 controller.state.enabled=true;
 controller.state.mode='custom';
 controller.schedule();
 const [timer]=timers.values();
 assert(timer,'Enabled scheduler should wait for its next configured appearance');
 setNow('2026-11-11T12:15:00');
 timer.callback();
 assert.equal(plays,0,'No automatic appearance is played outside enabled holiday periods');
}

async function playbackTests(){
 const playable=createController({st_martin:holiday(false,'11-11','11-11')});
 playable.document.hidden=false;
 playable.controller.setState({season:'st_martin'});
 await playable.controller.play();
 assert.equal(playable.controller.busy,true,'Manual test playback works when calendar entry is disabled');
 assert.equal(playable.requests[0],'/assets/St_Martin_korrigiert.webp','St. Martin loads its default HACS asset path');
 assert.equal(playable.overlays.length,1);
 assert.equal(playable.audios.length,1,'St. Martin Mirelo soundtrack starts with the animation');
 assert.equal(playable.audios[0].src,'/assets/St_Martin_Mirelo_Ton_9s.mp3');
 assert.equal(playable.audios[0].played,true);
 assert.match(playable.overlays[0].style.cssText,/position:fixed.*object-fit:contain/);
 playable.controller.stop();
 assert.equal(playable.audios[0].paused,true,'St. Martin soundtrack stops when animation stops');
 assert.equal(playable.overlays.length,0,'Stop removes the scene overlay');
 assert.equal(playable.revoked,1,'Stop revokes the temporary animation URL');
 await playable.controller.play();
 const [finishId,finish]=[...playable.timers.entries()].at(-1);
 playable.timers.delete(finishId);
 finish.callback();
 assert.equal(playable.controller.busy,false,'Animation completion ends playback');
 assert.equal(playable.overlays.length,0,'Animation completion removes the overlay');
 assert.equal(playable.revoked,2,'Completed playback revokes every temporary URL');
}

(async()=>{
 const scenes=await import('../dist/seasonal-scenes.mjs');
 const asset=fs.readFileSync('dist/assets/St_Martin_korrigiert.webp');
 const assetView=new DataView(asset.buffer,asset.byteOffset,asset.byteLength);
 assert.equal(asset.toString('ascii',0,4),'RIFF','Supplied St. Martin media is a WebP file');
 assert.equal(asset.toString('ascii',8,12),'WEBP');
 assert.equal(assetView.getUint32(4,true)+8,asset.length,'Bundled WebP has a complete RIFF payload');
 let alpha=false;
 for(let offset=12;offset+8<=asset.length;){
  const type=asset.toString('ascii',offset,offset+4),size=assetView.getUint32(offset+4,true);
  if(type==='VP8X')alpha=!!(asset[offset+8]&0x10);
  offset+=8+size+(size%2);
 }
 assert.equal(alpha,true,'Bundled St. Martin animation includes transparency');
 assert.equal(scenes.webpDuration(asset.buffer.slice(asset.byteOffset,asset.byteOffset+asset.byteLength)),9250,'Bundled animation frame duration is parsed');
 assert.doesNotMatch(fs.readFileSync('dist/seasonal-scenes.mjs','utf8'),/three|GLTFLoader/i,'Image scenes do not load a 3D model');
 assert.match(source,/object-fit:contain/,'Scene overlay scales without forcing scrollbars');
 assert.match(source,/data-holiday="\$\{id\}"/,'Calendar holiday controls are rendered in the visual editor');
 assert.match(source,/new CustomEvent\('config-changed'/,'Calendar edits persist through Lovelace config-changed events');
 assert.match(scenes.getSceneURL('st_martin'),/assets\/St_Martin_korrigiert\.webp$/);
 assert.match(scenes.getSceneURL('nikolaus'),/assets\/Nikolaus_ohne_Wasserzeichen_transparent\.webp$/,'Nikolaus has a bundled scene URL');
 assert.match(scenes.getSceneSoundURL('nikolaus'),/assets\/Nikolaus_Mirelo_Ton_15s\.mp3$/,'Nikolaus has a bundled Mirelo track');
 assert.match(scenes.getSceneSoundURL('st_martin'),/assets\/St_Martin_Mirelo_Ton_9s\.mp3$/,'St. Martin has a bundled Mirelo soundtrack');
 assert.equal(scenes.getSceneURL('nikolaus','/local/nikolaus.webp'),'/local/nikolaus.webp','St. Nicholas path is configurable');
 assert.equal(scenes.webpDuration(webpBuffer()),5,'Animated WebP duration is derived from its frame timings');
 assert.throws(()=>scenes.webpDuration(new ArrayBuffer(4)),/Invalid WebP/);

 for(const [scene,url] of [['st_martin',''],['nikolaus','/local/missing.webp']]){
  const missing=createController({st_martin:holiday(false,'11-11','11-11')},{missing:true});
  missing.document.hidden=false;
  missing.controller.state.season=scene;
  missing.controller.config[scene+'_url']=url;
  await missing.controller.play();
  assert.equal(missing.controller.busy,false,'A missing scene asset fails safely');
  assert.match(missing.controller.error,/Animation could not be played/);
  assert.equal(missing.overlays.length,0,'Missing media creates no overlay');
 }
 await playbackTests();
 const silentMartin=createController({st_martin:holiday(false,'11-11','11-11')});
 silentMartin.document.hidden=false;
 silentMartin.controller.setState({season:'st_martin'});
 silentMartin.controller.setState({sound:false});
 await silentMartin.controller.play();
 assert.equal(silentMartin.audios.length,0,'St. Martin respects global sound toggle');
 silentMartin.controller.stop();
 const nikolaus=createController({nikolaus:holiday(false,'12-06','12-06')});
 nikolaus.document.hidden=false;
 nikolaus.controller.setState({season:'nikolaus'});
 await nikolaus.controller.play();
 assert.equal(nikolaus.requests[0],'/assets/Nikolaus_ohne_Wasserzeichen_transparent.webp');
 assert.equal(nikolaus.audios.length,1,'Nikolaus sound is started with the animation');
 assert.equal(nikolaus.audios[0].src,'/assets/Nikolaus_Mirelo_Ton_15s.mp3');
 assert.equal(nikolaus.audios[0].volume,.8);
 assert.equal(nikolaus.audios[0].played,true);
 nikolaus.controller.stop();
 assert.equal(nikolaus.audios[0].paused,true,'Stopping the animation also stops the sound');
 nikolaus.controller.setState({sound:false});
 await nikolaus.controller.play();
 assert.equal(nikolaus.audios.length,1,'Sound toggle disables Nikolaus audio');
 nikolaus.controller.stop();
 nikolaus.controller.setState({sound:true});
 nikolaus.controller.configure({nikolaus_sound_url:'/local/alternative.mp3',nikolaus_volume:.35});
 await nikolaus.controller.play();
 assert.equal(nikolaus.audios[1].src,'/local/alternative.mp3','Custom sound overrides bundled media');
 assert.equal(nikolaus.audios[1].volume,.35);
 nikolaus.controller.stop();
 console.log('OK: calendar toggles, annual/cross-year/leap-day dates, midnight rollover, priority, manual preview and WebP playback lifecycle');
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
