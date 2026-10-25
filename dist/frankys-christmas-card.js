/* Franky's Christmas Card v0.2.4 public beta — HACS default cinematic video + de/en strings — standalone Home Assistant Lovelace card
 * One monitor; no helpers, automations, Browser Mod, or cloud services required.
 * Bundled WebM/WebP and audio files are installed with HACS; individual asset URLs can be overridden.
 */
(function () {
'use strict';
if (customElements.get('frankys-christmas-card')) return;
/* HACS installs the bundled animation alongside the JS. Manual installs may override video. */
var HACS_VIDEO='/local/community/frankys-stuff-christmas-card/sleigh.webm';
var HACS_IOS_VIDEO='/local/community/frankys-stuff-christmas-card/sleigh-ipad.webp';
var HACS_SOUND='/local/community/frankys-stuff-christmas-card/santa.mp3';
var HACS_BELLS='/local/community/frankys-stuff-christmas-card/bells.mp3';


/* Bell bed v1: trim baked silences, overlap equal-power crossfades,
   and apply ONE flight-length envelope. Falls back to HTMLAudio when needed. */
var makeBellBed = window.__FrankysBellsCrossfadeV1 || (window.__FrankysBellsCrossfadeV1=function(url){
 var AC=window.AudioContext||window.webkitAudioContext;
 var ac=null,buffer=null,promise=null,active=[],master=null,fallbackAudio=null,frame=0,run=0,info='idle';
 function ensure(){
  if(buffer)return Promise.resolve(buffer);
  if(promise)return promise;
  if(!AC||!window.fetch)return Promise.reject(new Error('WebAudio unsupported'));
  if(!ac)ac=new AC();
  promise=fetch(url,{credentials:'same-origin'}).then(function(r){
   if(!r.ok)throw new Error('Bells HTTP '+r.status);
   return r.arrayBuffer();
  }).then(function(a){return ac.decodeAudioData(a);}).then(function(b){
   buffer=b;return b;
  }).catch(function(err){promise=null;throw err;});
  return promise;
 }
 function stop(){
  run++;
  if(frame){cancelAnimationFrame(frame);frame=0;}
  if(fallbackAudio){try{fallbackAudio.pause();fallbackAudio.currentTime=0;}catch(e){}fallbackAudio=null;}
  active.forEach(function(s){try{s.stop(0);}catch(e){}try{s.disconnect();}catch(e){}});
  active=[];
  if(master){try{master.disconnect();}catch(e){}master=null;}
 }
 function bounds(b){
  var samples=b.getChannelData(0),rate=b.sampleRate,size=Math.max(256,Math.floor(rate*.05)),rms=[],max=0;
  for(var pos=0;pos<samples.length;pos+=size){
   var end=Math.min(samples.length,pos+size),sum=0,count=0;
   for(var j=pos;j<end;j+=8){sum+=samples[j]*samples[j];count++;}
   var level=Math.sqrt(sum/Math.max(count,1));
   rms.push(level);if(level>max)max=level;
  }
  var first=0,last=rms.length-1,threshold=max*.48;
  while(first<rms.length-1&&rms[first]<threshold)first++;
  while(last>first&&rms[last]<threshold)last--;
  var from=Math.max(0,first*size/rate),to=Math.min(b.duration,(last+1)*size/rate);
  if(to-from<1.65){from=Math.min(.28,b.duration*.08);to=b.duration-from;}
  return [from,to];
 }
 function curve(param,t,d,up){
  var a=new Float32Array(48);
  for(var i=0;i<a.length;i++){
   var f=i/(a.length-1);
   a[i]=up?Math.sin(f*Math.PI/2):Math.cos(f*Math.PI/2);
  }
  param.setValueCurveAtTime(a,t,d);
 }
 function htmlFallback(seconds,volume,key,started){
  if(key!==run)return;
  var a=new Audio(url);a.loop=true;a.preload='auto';a.volume=.001;fallbackAudio=a;
  var p=a.play();
  if(p&&p.catch)p.catch(function(){info='autoplay-blocked';});
  info='html-fallback';
  function fade(){
   if(key!==run||!fallbackAudio)return;
   var elapsed=(performance.now()-started)/1000;
   if(elapsed>=seconds){a.pause();a.currentTime=0;fallbackAudio=null;return;}
   a.volume=Math.max(0,Math.min(1,elapsed/1.35,(seconds-elapsed)/2.1))*volume;
   frame=requestAnimationFrame(fade);
  }
  frame=requestAnimationFrame(fade);
 }
 function play(seconds,volume){
  stop();
  seconds=Math.max(3,Math.min(60,Number(seconds)||10));
  volume=Math.max(0,Math.min(1,Number(volume)||.95));
  var key=run,started=performance.now();
  ensure().then(function(b){
   if(key!==run)return;
   return Promise.resolve(ac.state==='suspended'?ac.resume():true).then(function(){
    if(key!==run)return;
    if(ac.state!=='running')throw new Error('AudioContext suspended');
    var remaining=seconds-(performance.now()-started)/1000;
    if(remaining<.35)return;
    var segment=bounds(b),from=segment[0],length=segment[1]-segment[0];
    var overlap=Math.max(.28,Math.min(.72,length*.22));
    var step=length-overlap;
    var t0=ac.currentTime+.025,tend=t0+remaining;
    master=ac.createGain();master.connect(ac.destination);
    var up=Math.min(1.4,remaining*.26),down=Math.min(2.1,remaining*.3);
    master.gain.setValueAtTime(0,t0);
    master.gain.linearRampToValueAtTime(volume,t0+up);
    master.gain.setValueAtTime(volume,tend-down);
    master.gain.linearRampToValueAtTime(0,tend);
    for(var n=0;n<18;n++){
     var when=t0+n*step;
     if(when>=tend)break;
     var source=ac.createBufferSource(),gain=ac.createGain();
     source.buffer=b;source.connect(gain);gain.connect(master);
     if(n===0){gain.gain.setValueAtTime(1,when);}
     else{gain.gain.setValueAtTime(0,when);curve(gain.gain,when,overlap,true);}
     if(when+length-overlap<tend)curve(gain.gain,when+length-overlap,overlap,false);
     source.start(when,from,length);
     source.stop(Math.min(when+length,tend+.025));
     active.push(source);
    }
    info='webaudio;trim='+from.toFixed(2)+'-'+segment[1].toFixed(2)+';xfade='+overlap.toFixed(2);
   });
  }).catch(function(){htmlFallback(seconds,volume,key,started);});
  return true;
 }
 function prepare(){ensure().catch(function(){});}
 return {play:play,stop:stop,prepare:prepare,status:function(){return info;}};
});
var FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240"><defs><linearGradient id="fc-red" x2="0" y2="1"><stop stop-color="#ff5a60"/><stop offset="1" stop-color="#9e1532"/></linearGradient><g id="fc-deer"><ellipse rx="38" ry="21" fill="#a5774e"/><path d="M20 1 34-34 51-32 45-4" fill="#a5774e"/><ellipse cx="49" cy="-34" rx="21" ry="12" fill="#c49361"/><circle cx="58" cy="-38" r="3" fill="#151c26"/><circle cx="70" cy="-31" r="5" fill="#d92a38"/><path d="M36-42 29-65 17-71M30-61 41-73M29-65 27-79M-24 12-43 40-22 47M-8 18 5 42 25 38M20 12 42 31 56 26" fill="none" stroke="#805237" stroke-width="7" stroke-linecap="round"/></g></defs><path d="M148 150Q290 178 527 109" fill="none" stroke="#e4be78" stroke-width="3"/><g transform="translate(350 127)"><use href="#fc-deer"/></g><g transform="translate(490 106)"><use href="#fc-deer"/></g><path d="M40 130Q18 108 23 94Q55 95 72 130L183 130Q204 130 210 101Q236 125 216 161Q151 191 62 166Z" fill="url(#fc-red)" stroke="#f8d988" stroke-width="5"/><path d="M69 170 62 193M190 171 199 193M32 192Q147 212 224 185Q243 177 235 166" fill="none" stroke="#ffd88a" stroke-width="6" stroke-linecap="round"/><ellipse cx="142" cy="108" rx="31" ry="36" fill="url(#fc-red)"/><circle cx="145" cy="65" r="23" fill="#f3c5a1"/><path d="M122 62Q111 99 144 103Q170 95 168 69L153 80 141 76 133 82Z" fill="#fff7e8"/><path d="M120 51Q132 10 161 28L179 49 159 43Z" fill="url(#fc-red)"/><path d="M120 52Q142 42 166 52" fill="none" stroke="#fff7e8" stroke-width="10" stroke-linecap="round"/><circle cx="180" cy="50" r="9" fill="#fff7e8"/><circle cx="145" cy="62" r="3" fill="#172332"/><path d="M165 106 191 90 207 101" fill="none" stroke="#d52e46" stroke-width="14" stroke-linecap="round"/><circle cx="208" cy="101" r="9" fill="#fff7e8"/></svg>';

function cleanUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  var url = value.trim();
  if (url.indexOf('//') === 0 || /^javascript:|^data:/i.test(url)) return '';
  return url;
}
/* Prefer pre-keyed animated WebP on Apple/Safari; older iOS may fall back to SVG. */
function prefersAppleWebP() {
  var ua=navigator.userAgent||'';
  return /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1) ||
    (/AppleWebKit/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua));
}
function parseTime(value,fallback){
  return typeof value==='string'&&/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)?value:fallback;
}
function timeMinutes(value){
  var p=value.split(':');return Number(p[0])*60+Number(p[1]);
}
function finite(n, fallback, min, max) {
  n=Number(n); return isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
}
/* One page-wide scheduler, independent of card lifecycle. */
var GLOBAL_CONFIG_KEY='frankys-christmas-v1-global-config';
var globalFlightController=null;
function getGlobalFlightController(){
 if(globalFlightController)return globalFlightController;
 globalFlightController=new FrankysChristmasCard();
 globalFlightController._isGlobalFlightController=true;
 document.addEventListener('visibilitychange',globalFlightController._onVisibility);
 return globalFlightController;
}
function activateGlobalFlightController(card){
 var ctrl=getGlobalFlightController();
 if(ctrl._config&&ctrl._state&&
    JSON.stringify(ctrl._config)===JSON.stringify(card._config)&&
    JSON.stringify(ctrl._state)===JSON.stringify(card._state))return ctrl;
 ctrl._config=Object.assign({},card._config);
 ctrl._state=Object.assign({},card._state);
 try{localStorage.setItem(GLOBAL_CONFIG_KEY,JSON.stringify(card._config));}catch(e){}
 ctrl._applySchedule();
 return ctrl;
}
function restoreGlobalFlightController(){
 var saved=null;
 try{saved=JSON.parse(localStorage.getItem(GLOBAL_CONFIG_KEY)||'null');}catch(e){}
 if(!saved||typeof saved!=='object')return;
 var ctrl=getGlobalFlightController();
 ctrl.setConfig(saved);
 ctrl._applySchedule();
}
var CSS = ':host{display:block}ha-card{padding:16px 18px;color:var(--primary-text-color,#eef6fc);background:var(--card-background-color,#141b2a);border-radius:16px;box-sizing:border-box}'+
'.top{display:flex;align-items:center;gap:11px}.mark{font-size:28px;line-height:1}.heading{flex:1;min-width:0}.title{font-size:16px;font-weight:700}.subtitle{font-size:12px;opacity:.72;margin-top:3px}.status{font-size:12px;white-space:nowrap;color:var(--secondary-text-color,#aab)}'+
'.dot{width:8px;height:8px;border-radius:50%;background:#8794a6;display:inline-block;margin-right:5px}.dot.on{background:#32c992;box-shadow:0 0 8px #32c992}'+
'.buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.buttons button{border:1px solid rgba(125,161,193,.45);border-radius:10px;background:rgba(50,103,142,.15);color:inherit;cursor:pointer;padding:10px 13px;font:inherit;font-size:13px;min-height:38px}.buttons button.active{background:#12678d;color:white;border-color:#27b7e9}.buttons button:focus-visible{outline:2px solid #22bee6;outline-offset:2px}'+
'.buttons a.kofi{display:inline-flex;align-items:center;text-decoration:none;background:#ff5e5b;color:#fff;font-weight:700;border:1px solid #ff5e5b;border-radius:10px;padding:10px 13px;font-size:13px;min-height:38px;box-sizing:border-box}.buttons a.kofi:focus-visible{outline:2px solid #22bee6;outline-offset:2px}'+
'.time-window{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px;font-size:12px}.time-window input{width:88px;border:1px solid #7c919e;border-radius:8px;padding:6px;background:var(--card-background-color,#141b2a);color:var(--primary-text-color,#eef6fc);color-scheme:dark;font:inherit}'+
'.detail{display:flex;align-items:center;gap:8px;font-size:12px;opacity:.85;margin-top:13px}.detail select{background:var(--card-background-color,#141b2a);color:inherit;border:1px solid #7c919e;border-radius:8px;padding:6px 7px;font:inherit}.note{font-size:11px;opacity:.65;margin-top:8px}'+
"\n/* Responsive card; HA section width changes independently of viewport width. */\nha-card{width:100%;min-width:0;max-width:100%;height:auto;container-type:inline-size;overflow:hidden}\n.top{flex-wrap:wrap;min-width:0}\n.heading{overflow-wrap:anywhere}\n.buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,124px),1fr));gap:8px}\n.buttons button,.buttons a.kofi{display:flex;justify-content:center;align-items:center;min-width:0;width:100%;min-height:44px;box-sizing:border-box;white-space:normal;text-align:center;line-height:1.25;padding:8px 10px;overflow-wrap:break-word}\n.detail{flex-wrap:wrap;min-width:0;gap:8px}\n.detail select{flex:1 1 138px;min-width:0;max-width:100%;min-height:44px}\n.time-window{gap:8px;min-width:0}\n.time-window strong{flex-basis:100%}\n.time-window label{white-space:nowrap}\n.time-window input{flex:1 1 88px;min-width:0;max-width:140px;min-height:44px;box-sizing:border-box}\n.note{line-height:1.45}\nha-card[data-layout=\"compact\"]{padding:10px 12px}\nha-card[data-layout=\"compact\"] .subtitle,ha-card[data-layout=\"compact\"] .note{display:none}\nha-card[data-layout=\"compact\"] .top{gap:6px}\nha-card[data-layout=\"compact\"] .mark{font-size:23px}\nha-card[data-layout=\"compact\"] .buttons{margin-top:10px}\nha-card[data-layout=\"compact\"] .detail{margin-top:9px}\nha-card[data-layout=\"compact\"] .time-window{margin-top:8px}\nha-card[data-layout=\"comfortable\"]{padding:22px 24px}\nha-card[data-layout=\"comfortable\"] .buttons{gap:12px}\n@container (min-width:226px) and (max-width:570px){\n .buttons{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@container (max-width:319px){\n .buttons{grid-template-columns:1fr 1fr;gap:6px}\n .buttons button,.buttons a.kofi{font-size:12px;padding:8px 5px;min-height:44px}\n .top .status{width:100%}\n .time-window input{max-width:100%;flex-basis:94px}\n .detail select{flex-basis:100%}\n ha-card[data-layout=\"comfortable\"]{padding:12px}\n}\n@container (max-width:225px){\n .buttons{grid-template-columns:1fr}\n .time-window input{flex-basis:100%}\n}\n";

class FrankysChristmasCard extends HTMLElement {
 constructor() {
   super();
   this.attachShadow({mode:'open'});
   this._config=null;this._state=null;this._timer=0;this._stage=null;this._video=null;
   this._sound=null;this._bells=null;this._soundTimer=0;this._raf=0;this._ctx=null;this._canvas=null;
   this._particles=[];this._particleTime=0;this._startTime=0;this._alive=false;this._durationTimer=0;
   this._onVisibility=this._onVisibility.bind(this);
   this._lang=/^de(?:-|$)/i.test(navigator.language||'')?'de':'en';
 }
 setConfig(raw) {
   if(!raw||typeof raw!=='object')throw new Error('Frankys Christmas: card configuration missing');
   var previousConfig=this._config;
   var min=finite(raw.interval_min,3,1,120),max=finite(raw.interval_max,8,1,120);
   if(max<min)max=min;
   this._config={
     title:typeof raw.title==='string'?raw.title:"Franky's Christmas",
     layout_mode:['auto','compact','comfortable'].indexOf(raw.layout_mode)!==-1?raw.layout_mode:'auto',
     video:raw.video===false||raw.video===null?'':(cleanUrl(raw.video)||HACS_VIDEO),
     ios_video:raw.ios_video===false||raw.ios_video===null?'':(cleanUrl(raw.ios_video)||((typeof raw.video==='string'&&cleanUrl(raw.video))?'':HACS_IOS_VIDEO)),
     sound:raw.sound===false||raw.sound===null?'':(cleanUrl(raw.sound)||HACS_SOUND),
     bells:raw.bells===false||raw.bells===null?'':(cleanUrl(raw.bells)||HACS_BELLS),
     fallback:cleanUrl(raw.fallback),
     interval_min:min, interval_max:max,
     schedule_start:parseTime(raw.schedule_start,'09:00'),
     schedule_end:parseTime(raw.schedule_end,'22:00'),
     sound_volume:finite(raw.sound_volume,.55,0,1),
     bells_volume:finite(raw.bells_volume,.78,0,1),
     width_percent:finite(raw.width_percent,60,20,95),
     duration:finite(raw.duration,10,4,30),
     storage_key:typeof raw.storage_key==='string'?raw.storage_key.replace(/[^a-z0-9_-]/gi,'').slice(0,48):'default'
   };
   if(this._config.storage_key==='')this._config.storage_key='default';
   if(timeMinutes(this._config.schedule_start)>=timeMinutes(this._config.schedule_end)){
     this._config.schedule_start='09:00';this._config.schedule_end='22:00';
   }
   this._readState();
   /* A visual-editor time change must take precedence over a previously saved
      local time-window, while preserving user settings on ordinary refreshes. */
   if(previousConfig && (previousConfig.schedule_start!==this._config.schedule_start ||
      previousConfig.schedule_end!==this._config.schedule_end)){
     this._state.start_time=this._config.schedule_start;
     this._state.end_time=this._config.schedule_end;
     this._save();
     try{localStorage.removeItem(this._key()+'-daily-plan');}catch(ignore){}
   }
   if(!this._isGlobalFlightController)this._render();
   if(this.isConnected)this._applySchedule();
 }
 connectedCallback() {
   if(this._config)this._applySchedule();
 }
 disconnectedCallback() {
   /* The shared scheduler keeps running when Lovelace removes the card. */
 }
 set hass(hass){
   var lang=(hass&&hass.locale&&hass.locale.language)||(hass&&hass.language)||navigator.language||'en';
   var next=/^de(?:-|$)/i.test(lang)?'de':'en';
   if(next!==this._lang){this._lang=next;if(this._config)this._render();}
 }
 _txt(id){
   var de={
     subtitle:'Weihnachtsflug · alle Dashboard-Ansichten',
     test:'🛷 Testflug',coffee:'☕ Danke für den Kaffee',interval:'Flugintervall',
     daily:'1–10 Flüge/Tag (Standard)',hourly:'Jede volle Stunde',hours:'Flugzeiten',from:'Von',to:'Bis',defaultHint:'Automatisch nur innerhalb der eingestellten Uhrzeiten; Testflug jederzeit möglich.',
     turnOn:'▶ Einschalten',turnOff:'⏸ Ausschalten',
     soundOn:'🔊 Ton an',soundOff:'🔇 Ton aus',
     active:'AKTIV',inactive:'AUS'
   };
   var en={
     subtitle:'Christmas flight · all dashboard views',
     test:'🛷 Test flight',coffee:'☕ Thanks for Coffee',interval:'Flight schedule',
     daily:'1–10 flights/day (default)',hourly:'Every full hour',hours:'Flight hours',from:'From',to:'Until',defaultHint:'Automatic flights only during your chosen hours; manual test flight works anytime.',
     turnOn:'▶ Enable',turnOff:'⏸ Disable',
     soundOn:'🔊 Sound on',soundOff:'🔇 Sound off',
     active:'ON',inactive:'OFF'
   };
   var dict=this._lang==='de'?de:en;
   return dict[id]||id;
 }
  getCardSize(){return this._config&&this._config.layout_mode==='compact'?4:6;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 static getConfigElement(){return document.createElement('frankys-christmas-card-editor');}
 static getStubConfig(){return {type:'custom:frankys-christmas-card',interval_min:3,interval_max:8};}
 _key(){return 'frankys-christmas-v1-'+this._config.storage_key;}
 _readState(){
   var data=null;try{data=JSON.parse(localStorage.getItem(this._key())||'null');}catch(e){}
   this._state={
     enabled:!!(data&&data.enabled),sound:!!(data&&data.sound),
     interval:(data&&['3-8','5-10','10-20','1-2','hourly'].indexOf(data.interval)!==-1)?data.interval:'',
     start_time:parseTime(data&&data.start_time,this._config.schedule_start),
     end_time:parseTime(data&&data.end_time,this._config.schedule_end)
   };
   if(timeMinutes(this._state.start_time)>=timeMinutes(this._state.end_time)){
     this._state.start_time=this._config.schedule_start;
     this._state.end_time=this._config.schedule_end;
   }
 }
 _save(){try{localStorage.setItem(this._key(),JSON.stringify(this._state));}catch(e){}}
 _render(){
   if(!this.shadowRoot||!this._config)return;
   this.shadowRoot.innerHTML='<style>'+CSS+'</style><ha-card data-layout="'+this._config.layout_mode+'"><div class="top"><span class="mark">🎅</span><div class="heading"><div class="title"></div><div class="subtitle">'+this._txt('subtitle')+'</div></div><div class="status"><span class="dot"></span><span class="status-text"></span></div></div><div class="buttons"><button id="toggle" type="button"></button><button id="sound" type="button"></button><button id="test" type="button">'+this._txt('test')+'</button><a class="kofi" href="https://ko-fi.com/Frankys_Stuff" target="_blank" rel="noopener noreferrer">'+this._txt('coffee')+'</a></div><div class="detail"><label for="times">'+this._txt('interval')+'</label><select id="times"><option value="default">'+this._txt('daily')+'</option><option value="hourly">'+this._txt('hourly')+'</option><option value="1-2">1–2 Minuten</option><option value="3-8">3–8 Minuten</option><option value="5-10">5–10 Minuten</option><option value="10-20">10–20 Minuten</option></select></div><div class="time-window"><strong>'+this._txt('hours')+'</strong><label for="from">'+this._txt('from')+'</label><input id="from" type="time"><label for="to">'+this._txt('to')+'</label><input id="to" type="time"></div><div class="note">'+this._txt('defaultHint')+'</div></ha-card>';
   this.shadowRoot.querySelector('.title').textContent=this._config.title;
   var self=this;
   this.shadowRoot.getElementById('toggle').onclick=function(){self._state.enabled=!self._state.enabled;self._save();self._update();if(!self._state.enabled)self._stop();self._applySchedule();};
   this.shadowRoot.getElementById('sound').onclick=function(){self._state.sound=!self._state.sound;self._save();self._update();self._applySchedule();};
   this.shadowRoot.getElementById('test').onclick=function(){self._play();};
   this.shadowRoot.getElementById('times').onchange=function(){self._state.interval=this.value==='default'?'':this.value;self._save();self._applySchedule();};
   function onHoursChange(){
     var from=self.shadowRoot.getElementById('from'),to=self.shadowRoot.getElementById('to');
     var start=parseTime(from.value,self._state.start_time);
     var end=parseTime(to.value,self._state.end_time);
     if(timeMinutes(start)>=timeMinutes(end)){
       from.value=self._state.start_time;to.value=self._state.end_time;return;
     }
     if(start===self._state.start_time&&end===self._state.end_time)return;
     self._state.start_time=start;self._state.end_time=end;self._save();
     try{localStorage.removeItem(self._key()+'-daily-plan');}catch(ignore){}
     self._applySchedule();
   }
   this.shadowRoot.getElementById('from').onchange=onHoursChange;
   this.shadowRoot.getElementById('to').onchange=onHoursChange;
   this._update();
 }
 _update(){
   if(!this._config||!this.shadowRoot.querySelector('#toggle'))return;
   var on=this._state.enabled, snd=this._state.sound;
   this.shadowRoot.getElementById('toggle').textContent=on?this._txt('turnOff'):this._txt('turnOn');
   this.shadowRoot.getElementById('toggle').className=on?'active':'';
   this.shadowRoot.getElementById('sound').textContent=snd?this._txt('soundOn'):this._txt('soundOff');
   this.shadowRoot.getElementById('sound').className=snd?'active':'';
   this.shadowRoot.querySelector('.dot').className=on?'dot on':'dot';
   this.shadowRoot.querySelector('.status-text').textContent=on?this._txt('active'):this._txt('inactive');
   this.shadowRoot.getElementById('times').value=this._state.interval||'default';
   this.shadowRoot.getElementById('from').value=this._state.start_time;
   this.shadowRoot.getElementById('to').value=this._state.end_time;
 }
 _clearSchedule(){if(this._timer)clearTimeout(this._timer);this._timer=0;}
 _onVisibility(){if(document.hidden){this._clearSchedule();this._stop();}else this._applySchedule();}
 _withinWindow(d){
   var now=d||new Date();
   var minute=now.getHours()*60+now.getMinutes();
   return minute>=timeMinutes(this._state.start_time)&&minute<timeMinutes(this._state.end_time);
 }
 _applySchedule(){
   if(!this._isGlobalFlightController){
     if(this._config&&this._state)activateGlobalFlightController(this);
     return;
   }
   this._clearSchedule();
   if(!this._state||!this._state.enabled||document.hidden)return;
   var self=this,now=new Date(),nowMs=now.getTime();
   var start=new Date(now),end=new Date(now);
   var a=this._state.start_time.split(':').map(Number),b=this._state.end_time.split(':').map(Number);
   start.setHours(a[0],a[1],0,0);end.setHours(b[0],b[1],0,0);
   var startMs=start.getTime(),endMs=end.getTime();
   if(!this._state.interval){
     /* Randomize the complete daily window and persist it on this browser.
        Never compress all today's flights into the remaining late-evening time. */
     var day=now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2)+'-'+('0'+now.getDate()).slice(-2);
     var key=this._key()+'-daily-plan',plan=null;
     try{plan=JSON.parse(localStorage.getItem(key)||'null');}catch(ignore){}
     if(!plan||plan.day!==day||plan.start!==this._state.start_time||plan.end!==this._state.end_time||!Array.isArray(plan.times)){
       var count=1+Math.floor(Math.random()*10),times=[];
       var low=startMs+1000,high=endMs-this._config.duration*1000-2000;
       if(high>low){
         var slot=(high-low)/count;
         for(var i=0;i<count;i++)times.push(Math.round(low+(i+Math.random())*slot));
       }
       plan={day:day,start:this._state.start_time,end:this._state.end_time,times:times};
       try{localStorage.setItem(key,JSON.stringify(plan));}catch(ignore){}
     }
     var next=0;
     for(var j=0;j<plan.times.length;j++)if(plan.times[j]>nowMs+500){next=plan.times[j];break;}
     if(next){
       this._timer=setTimeout(function(){
         self._timer=0;
         if(self._state.enabled&&!document.hidden&&self._withinWindow())self._play();
         self._applySchedule();
       },Math.max(100,next-nowMs));
     }else{
       var tomorrow=new Date(now);tomorrow.setHours(24,0,3,0);
       this._timer=setTimeout(function(){self._timer=0;self._applySchedule();},Math.max(1000,tomorrow.getTime()-nowMs));
     }
     return;
   }
   /* Fixed hourly mode: one flight at the next full clock hour, never catch up. */
   if(this._state.interval==='hourly'){
     var nextHour=new Date(now);
     nextHour.setMinutes(0,0,0);
     if(nextHour.getTime()<=nowMs+500)nextHour.setHours(nextHour.getHours()+1);
     for(var hourTry=0;hourTry<48;hourTry++){
       var clockMinute=nextHour.getHours()*60;
       var windowEnd=new Date(nextHour);
       windowEnd.setHours(b[0],b[1],0,0);
       if(clockMinute>=timeMinutes(this._state.start_time)&&
          clockMinute<timeMinutes(this._state.end_time)&&
          nextHour.getTime()+this._config.duration*1000<=windowEnd.getTime())break;
       nextHour.setHours(nextHour.getHours()+1);
     }
     /* Narrow time windows may contain no full hour. */
     if(hourTry===48)return;
     this._timer=setTimeout(function(){
       self._timer=0;
       if(self._state.enabled&&!document.hidden&&self._withinWindow())self._play();
       self._applySchedule();
     },Math.max(100,nextHour.getTime()-nowMs));
     return;
   }
   /* Minute modes also respect the active-time window. */
   var pair=this._state.interval.split('-').map(Number);
   var ms=(pair[0]+Math.random()*(pair[1]-pair[0]))*60000;
   var when;
   if(nowMs<startMs)when=startMs+ms;
   else if(nowMs+ms+this._config.duration*1000>=endMs){
     var tomorrowStart=new Date(start);tomorrowStart.setDate(tomorrowStart.getDate()+1);
     when=tomorrowStart.getTime()+ms;
   }else when=nowMs+ms;
   this._timer=setTimeout(function(){
     self._timer=0;
     if(self._state.enabled&&!document.hidden&&self._withinWindow())self._play();
     self._applySchedule();
   },Math.max(100,when-nowMs));
 }
 _stop(){
   if(!this._isGlobalFlightController){
     if(globalFlightController)globalFlightController._stop();
     return;
   }
   this._alive=false;
   if(this._durationTimer)clearTimeout(this._durationTimer);this._durationTimer=0;
   if(this._soundTimer)clearTimeout(this._soundTimer);this._soundTimer=0;
   if(this._raf)cancelAnimationFrame(this._raf);this._raf=0;
   if(this._sound){try{this._sound.pause();this._sound.currentTime=0;}catch(e){}this._sound=null;}
   if(this._bellsPlayer){this._bellsPlayer.stop();this._bellsPlayer=null;}
   if(this._video){try{this._video.pause();}catch(e){}this._video=null;}
   if(this._stage&&this._stage.parentNode)this._stage.parentNode.removeChild(this._stage);
   this._stage=null;this._ctx=null;this._canvas=null;this._particles=[];
 }
 _play(){
   if(!this._isGlobalFlightController){
     if(!this._config||!this._state)return false;
     return activateGlobalFlightController(this)._play();
   }
   if(document.hidden||!document.body)return false;
   this._stop();
   var self=this, c=this._config;
   var stage=document.createElement('div');stage.id='frankys-christmas-flight';
   stage.style.cssText='position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:2147483000';
   var sheet=document.createElement('style');
   sheet.textContent='@keyframes fc-flight{from{transform:translateX(-110%)}to{transform:translateX(110vw)}}';
   var vehicle=document.createElement('div');vehicle.style.cssText='position:absolute;left:0;top:34%;pointer-events:none;animation:fc-flight '+c.duration+'s linear forwards;width:'+Math.round(Math.min(850,innerWidth*c.width_percent/100))+'px;';
   var img=document.createElement('img');img.alt='';img.style.cssText='display:block;width:100%;height:auto';
   img.src=c.fallback||'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(FALLBACK_SVG);
   if(c.video && prefersAppleWebP() && c.ios_video){
     /* The WebM alpha channel is ignored in some Safari builds; use our
        pre-matted animated WebP rather than a live green-screen filter. */
     var appleFrame=document.createElement('img');
     appleFrame.alt='';
     appleFrame.setAttribute('aria-hidden','true');
     appleFrame.style.cssText='display:none;width:100%;height:auto;pointer-events:none';
     appleFrame.onload=function(){
       if(self._stage===stage || !self._stage) {img.style.display='none';appleFrame.style.display='block';}
     };
     appleFrame.onerror=function(){appleFrame.style.display='none';img.style.display='block';};
     appleFrame.src=c.ios_video;
     vehicle.appendChild(appleFrame);
   } else if(c.video){
     var vid=document.createElement('video');
     vid.autoplay=false;vid.muted=true;vid.loop=true;vid.playsInline=true;
     vid.setAttribute('muted','');vid.setAttribute('playsinline','');
     vid.preload='auto';vid.src=c.video;
     vid.style.cssText='display:block;width:100%;height:auto';
     img.style.display='none';
     function fallback(){vid.style.display='none';img.style.display='block';}
     vid.onerror=fallback;
     vehicle.appendChild(vid);this._video=vid;
   }
   vehicle.appendChild(img);
   var canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;
   canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
   stage.appendChild(sheet);stage.appendChild(canvas);stage.appendChild(vehicle);document.body.appendChild(stage);
   this._stage=stage;this._canvas=canvas;this._ctx=canvas.getContext('2d');
   this._particles=[];this._particleTime=0;this._startTime=performance.now();this._alive=true;
   if(this._video){try{var p=this._video.play();if(p&&p.catch)p.catch(function(){self._video&&self._video.pause();img.style.display='block';if(self._video)self._video.style.display='none';});}catch(e){img.style.display='block';}}
   if(this._ctx)this._raf=requestAnimationFrame(function(t){self._dust(t,vehicle);});
   if(this._state.sound&&c.bells) {
     try {
       this._bellsPlayer=makeBellBed(c.bells);
       this._bellsPlayer.play(c.duration,c.bells_volume);
     }catch(e){}
   }
   if(this._state.sound&&c.sound){
     this._soundTimer=setTimeout(function(){
       if(!self._alive)return;
       try{
         var sound=new Audio(c.sound);sound.volume=c.sound_volume;self._sound=sound;
         var p=sound.play();if(p&&p.catch)p.catch(function(){});
       }catch(e){}
     },Math.min(1400,c.duration*200));
   }
   this._durationTimer=setTimeout(function(){self._stop();},c.duration*1000+450);
   return true;
 }
 _dust(now,vehicle){
   if(!this._alive||!this._ctx||!this._canvas)return;
   if(now-this._particleTime<35){var self=this;this._raf=requestAnimationFrame(function(t){self._dust(t,vehicle);});return;}
   this._particleTime=now;
   var ctx=this._ctx,c=this._canvas,rect=vehicle.getBoundingClientRect();
   ctx.clearRect(0,0,c.width,c.height);
   if(rect.right>0&&rect.left<c.width&&this._particles.length<110){
     for(var n=0;n<3;n++)this._particles.push({x:rect.left+12+Math.random()*16,y:rect.top+rect.height*.76+(Math.random()-.5)*22,vx:-1-Math.random()*2,vy:(Math.random()-.5),age:0,life:22+Math.random()*36,size:.8+Math.random()*2});
   }
   for(var i=this._particles.length-1;i>=0;i--){
     var p=this._particles[i];p.x+=p.vx;p.y+=p.vy;p.age++;
     if(p.age>=p.life){this._particles.splice(i,1);continue;}
     ctx.globalAlpha=1-p.age/p.life;
     ctx.fillStyle=i%3?'#ffd77b':'#fff6ca';ctx.shadowColor='#ffc04b';ctx.shadowBlur=7;
     ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;ctx.shadowBlur=0;
   var self=this;this._raf=requestAnimationFrame(function(t){self._dust(t,vehicle);});
 }
}

/* HA graphical editor: no extra frontend dependencies, works in the card picker. */
class FrankysChristmasCardEditor extends HTMLElement {
 constructor(){
   super();
   this.attachShadow({mode:'open'});
   this._config=null;
   this._lang=/^de(?:-|$)/i.test(navigator.language||'')?'de':'en';
 }
 set hass(hass){
   var language=(hass&&hass.locale&&hass.locale.language)||(hass&&hass.language)||navigator.language||'en';
   this._hass=hass;
   var newLang=/^de(?:-|$)/i.test(language)?'de':'en';
   if(newLang!==this._lang){this._lang=newLang;if(this._config)this._render();}
 }
 setConfig(config){
   if(!config)return;
   this._config=Object.assign({},config);
   this._lang=/^de(?:-|$)/i.test((this._hass&&((this._hass.locale&&this._hass.locale.language)||this._hass.language))||navigator.language||'en')?'de':'en';
   this._render();
 }
 _render(){
   var de=this._lang==='de';
   var tr=(g,e)=>de?g:e;
   var esc=(s)=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
   var c=this._config||{};
   this.shadowRoot.innerHTML=
    '<style>:host{display:block;color:var(--primary-text-color);font-size:14px}fieldset{border:1px solid var(--divider-color,#63748a);border-radius:10px;margin:0 0 12px;padding:12px}legend{font-weight:700;padding:0 7px}.field{display:flex;flex-direction:column;gap:5px;margin:9px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pair .field{min-width:0}label{font-size:13px;font-weight:600}input,select{font:inherit;padding:9px 10px;min-width:0;max-width:100%;width:100%;box-sizing:border-box;border:1px solid var(--divider-color,#798896);background:var(--card-background-color,#19232f);color:var(--primary-text-color,#fff);border-radius:8px;color-scheme:light dark;min-height:42px}input[type=range]{padding:0;min-height:35px;accent-color:var(--primary-color,#03a9f4)}small{display:block;opacity:.75;line-height:1.5}details{margin-top:10px}summary{cursor:pointer;font-weight:600;padding:9px 0}.invalid{color:var(--error-color,#f86d6d);min-height:1em;font-size:12px;margin-top:6px}@media(max-width:350px){.pair{grid-template-columns:1fr}}</style>'+
    '<fieldset><legend>'+tr('Darstellung','Appearance')+'</legend>'+
    '<div class="field"><label for="title">'+tr('Kartentitel','Card title')+'</label><input id="title" data-field="title" type="text" value="'+esc(c.title||"Franky's Christmas")+'"></div>'+
    '<div class="field"><label for="layout_mode">'+tr('Layout','Layout')+'</label><select id="layout_mode" data-field="layout_mode">'+
    ['auto','compact','comfortable'].map((value)=>'<option value="'+value+'"'+((c.layout_mode||'auto')===value?' selected':'')+'>'+({auto:tr('Automatisch (empfohlen)','Auto (recommended)'),compact:tr('Kompakt','Compact'),comfortable:tr('Großzügig','Comfortable')}[value])+'</option>').join('')+'</select></div>'+
    '<small>'+tr('Im Abschnitt-Dashboard kannst du die Karte zusätzlich über die Größensteuerung ziehen. Buttons bleiben mindestens 44 px hoch.','In a Sections dashboard you can also resize the card. Buttons stay at least 44 px high.')+'</small></fieldset>'+
    '<fieldset><legend>'+tr('Flugzeiten','Flight hours')+'</legend><div class="pair">'+
    '<div class="field"><label for="schedule_start">'+tr('Von','From')+'</label><input id="schedule_start" data-field="schedule_start" type="time" value="'+esc(c.schedule_start||'09:00')+'"></div>'+
    '<div class="field"><label for="schedule_end">'+tr('Bis','Until')+'</label><input id="schedule_end" data-field="schedule_end" type="time" value="'+esc(c.schedule_end||'22:00')+'"></div></div>'+
    '<small>'+tr('Gilt für beide Automatikmodi. Manuelle Testflüge sind jederzeit möglich.','Applies to both automatic modes. Manual test flights work at any hour.')+'</small><div id="warning" class="invalid" role="status"></div></fieldset>'+
    '<fieldset><legend>'+tr('Animation und Lautstärke','Animation and volume')+'</legend>'+
    '<div class="field"><label for="duration">'+tr('Flugdauer (Sekunden)','Flight duration (seconds)')+': <output id="duration-value">'+esc(c.duration==null?10:c.duration)+'</output></label><input id="duration" data-field="duration" type="range" min="4" max="30" step="1" value="'+esc(c.duration==null?10:c.duration)+'"></div>'+
    '<div class="field"><label for="width_percent">'+tr('Schlittengröße (% der Bildschirmbreite)','Sleigh size (% of screen width)')+': <output id="width_percent-value">'+esc(c.width_percent==null?60:c.width_percent)+'</output></label><input id="width_percent" data-field="width_percent" type="range" min="20" max="95" step="5" value="'+esc(c.width_percent==null?60:c.width_percent)+'"></div>'+
    '<div class="pair"><div class="field"><label for="sound_volume">'+tr('Santa-Lautstärke','Santa volume')+'</label><input id="sound_volume" data-field="sound_volume" type="range" min="0" max="1" step="0.05" value="'+esc(c.sound_volume==null?.55:c.sound_volume)+'"></div>'+
    '<div class="field"><label for="bells_volume">'+tr('Glöckchen-Lautstärke','Bells volume')+'</label><input id="bells_volume" data-field="bells_volume" type="range" min="0" max="1" step="0.05" value="'+esc(c.bells_volume==null?.78:c.bells_volume)+'"></div></div></fieldset>'+
    '<details><summary>'+tr('Erweitert: eigene Mediendateien','Advanced: custom media files')+'</summary>'+
    [['video',tr('WebM-Video','WebM video')],['ios_video',tr('iPad-Animation (WebP)','iPad animation (WebP)')],['sound',tr('Santa-Ton','Santa audio')],['bells',tr('Glöckchen','Bells')],['fallback',tr('Ersatzbild','Fallback image')]].map((p)=>'<div class="field"><label for="'+p[0]+'">'+p[1]+'</label><input type="text" data-field="'+p[0]+'" id="'+p[0]+'" placeholder="'+tr('Mitgelieferte Datei verwenden','Use bundled asset')+'" value="'+esc(typeof c[p[0]]==='string'?c[p[0]]:'')+'"></div>').join('')+
    '</details>';
   var self=this;
   this.shadowRoot.querySelectorAll('[data-field]').forEach(function(el){
     if(el.type==='range'){
       el.oninput=function(){var out=self.shadowRoot.getElementById(el.id+'-value');if(out)out.textContent=el.value;};
     }
     el.onchange=function(){self._changed(el);};
   });
 }
 _changed(el){
   var key=el.getAttribute('data-field'),value=el.value;
   var warning=this.shadowRoot.getElementById('warning');
   if(warning)warning.textContent='';
   if(key==='schedule_start'||key==='schedule_end'){
     var st=key==='schedule_start'?value:(this._config.schedule_start||'09:00');
     var en=key==='schedule_end'?value:(this._config.schedule_end||'22:00');
     if(!/^\d{2}:\d{2}$/.test(value)||timeMinutes(st)>=timeMinutes(en)){
       if(warning)warning.textContent=this._lang==='de'?'Beginn muss vor dem Ende liegen.':'Start must be before end.';
       el.value=key==='schedule_start'?(this._config.schedule_start||'09:00'):(this._config.schedule_end||'22:00');
       return;
     }
   }
   var next=Object.assign({},this._config);
   if(['duration','width_percent','sound_volume','bells_volume'].indexOf(key)!==-1)value=Number(value);
   if(key==='title'&&!value.trim())value="Franky's Christmas";
   if(['video','ios_video','sound','bells','fallback'].indexOf(key)!==-1&&!value.trim())delete next[key];
   else if(key==='layout_mode'&&['auto','compact','comfortable'].indexOf(value)===-1)next[key]='auto';
   else next[key]=value;
   if(next[key]===this._config[key])return;
   this._config=next;
   this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
 }
}

customElements.define('frankys-christmas-card-editor',FrankysChristmasCardEditor);
customElements.define('frankys-christmas-card',FrankysChristmasCard);
restoreGlobalFlightController();
window.customCards=window.customCards||[];
if(!window.customCards.some(function(x){return x.type==='frankys-christmas-card';})){
 window.customCards.push({type:'frankys-christmas-card',name:"Franky's Christmas Card",description:'Responsive Christmas overlay with a visual editor, local schedules and bundled media.'});
}
})();
