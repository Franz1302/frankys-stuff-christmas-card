/* Franky's Christmas Card v0.2.1 public beta — HACS default cinematic video + de/en strings — standalone Home Assistant Lovelace card
 * One monitor; no helpers, automations, Browser Mod, or cloud services required.
 * Media assets may be configured by the user; no externally sourced assets bundled.
 */
(function () {
'use strict';
if (customElements.get('frankys-christmas-card')) return;
/* HACS installs the bundled animation alongside the JS. Manual installs may override video. */
var HACS_VIDEO='/local/community/frankys-stuff-christmas-card/sleigh.webm';
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
function finite(n, fallback, min, max) {
  n=Number(n); return isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
}
var CSS = ':host{display:block}ha-card{padding:16px 18px;color:var(--primary-text-color,#eef6fc);background:var(--card-background-color,#141b2a);border-radius:16px;box-sizing:border-box}'+
'.top{display:flex;align-items:center;gap:11px}.mark{font-size:28px;line-height:1}.heading{flex:1;min-width:0}.title{font-size:16px;font-weight:700}.subtitle{font-size:12px;opacity:.72;margin-top:3px}.status{font-size:12px;white-space:nowrap;color:var(--secondary-text-color,#aab)}'+
'.dot{width:8px;height:8px;border-radius:50%;background:#8794a6;display:inline-block;margin-right:5px}.dot.on{background:#32c992;box-shadow:0 0 8px #32c992}'+
'.buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.buttons button{border:1px solid rgba(125,161,193,.45);border-radius:10px;background:rgba(50,103,142,.15);color:inherit;cursor:pointer;padding:10px 13px;font:inherit;font-size:13px;min-height:38px}.buttons button.active{background:#12678d;color:white;border-color:#27b7e9}.buttons button:focus-visible{outline:2px solid #22bee6;outline-offset:2px}'+
'.buttons a.kofi{display:inline-flex;align-items:center;text-decoration:none;background:#ff5e5b;color:#fff;font-weight:700;border:1px solid #ff5e5b;border-radius:10px;padding:10px 13px;font-size:13px;min-height:38px;box-sizing:border-box}.buttons a.kofi:focus-visible{outline:2px solid #22bee6;outline-offset:2px}'+
'.detail{display:flex;align-items:center;gap:8px;font-size:12px;opacity:.85;margin-top:13px}.detail select{background:var(--card-background-color,#141b2a);color:inherit;border:1px solid #7c919e;border-radius:8px;padding:6px 7px;font:inherit}.note{font-size:11px;opacity:.65;margin-top:8px}';

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
   var min=finite(raw.interval_min,3,1,120),max=finite(raw.interval_max,8,1,120);
   if(max<min)max=min;
   this._config={
     title:typeof raw.title==='string'?raw.title:"Franky's Christmas",
     video:raw.video===false||raw.video===null?'':(cleanUrl(raw.video)||HACS_VIDEO),
     sound:raw.sound===false||raw.sound===null?'':(cleanUrl(raw.sound)||HACS_SOUND),
     bells:raw.bells===false||raw.bells===null?'':(cleanUrl(raw.bells)||HACS_BELLS),
     fallback:cleanUrl(raw.fallback),
     interval_min:min, interval_max:max,
     sound_volume:finite(raw.sound_volume,.55,0,1),
     bells_volume:finite(raw.bells_volume,.78,0,1),
     width_percent:finite(raw.width_percent,60,20,95),
     duration:finite(raw.duration,10,4,30),
     storage_key:typeof raw.storage_key==='string'?raw.storage_key.replace(/[^a-z0-9_-]/gi,'').slice(0,48):'default'
   };
   if(this._config.storage_key==='')this._config.storage_key='default';
   this._readState();this._render();
   if(this.isConnected)this._applySchedule();
 }
 connectedCallback() {
   if(!this._config)return;
   document.addEventListener('visibilitychange',this._onVisibility);
   this._applySchedule();
 }
 disconnectedCallback() {
   document.removeEventListener('visibilitychange',this._onVisibility);
   this._clearSchedule();this._stop();
   if(window.__FrankysChristmasStandaloneOwner===this)window.__FrankysChristmasStandaloneOwner=null;
 }
 set hass(hass){
   var lang=(hass&&hass.locale&&hass.locale.language)||(hass&&hass.language)||navigator.language||'en';
   var next=/^de(?:-|$)/i.test(lang)?'de':'en';
   if(next!==this._lang){this._lang=next;if(this._config)this._render();}
 }
 _txt(id){
   var de={
     subtitle:'Weihnachtsflug · nur dieser Bildschirm',
     test:'🛷 Testflug',coffee:'☕ Danke für den Kaffee',interval:'Flugintervall',
     daily:'1–10 Flüge/Tag (Standard)',defaultHint:'Standard: zufällig 1–10 Flüge pro Tag, lokal für diesen Bildschirm. Minutenintervalle bleiben wählbar.',
     turnOn:'▶ Einschalten',turnOff:'⏸ Ausschalten',
     soundOn:'🔊 Ton an',soundOff:'🔇 Ton aus',
     active:'AKTIV',inactive:'AUS'
   };
   var en={
     subtitle:'Christmas flight · this screen only',
     test:'🛷 Test flight',coffee:'☕ Thanks for Coffee',interval:'Flight schedule',
     daily:'1–10 flights/day (default)',defaultHint:'Default: 1–10 random flights per day, locally on this screen. Minute intervals remain available.',
     turnOn:'▶ Enable',turnOff:'⏸ Disable',
     soundOn:'🔊 Sound on',soundOff:'🔇 Sound off',
     active:'ON',inactive:'OFF'
   };
   var dict=this._lang==='de'?de:en;
   return dict[id]||id;
 }
  getCardSize(){return 2;}
 static getStubConfig(){return {type:'custom:frankys-christmas-card',interval_min:3,interval_max:8};}
 _key(){return 'frankys-christmas-v1-'+this._config.storage_key;}
 _readState(){
   var data=null;try{data=JSON.parse(localStorage.getItem(this._key())||'null');}catch(e){}
   this._state={
     enabled:!!(data&&data.enabled),sound:!!(data&&data.sound),
     interval:(data&&['3-8','5-10','10-20','1-2'].indexOf(data.interval)!==-1)?data.interval:''
   };
 }
 _save(){try{localStorage.setItem(this._key(),JSON.stringify(this._state));}catch(e){}}
 _render(){
   if(!this.shadowRoot||!this._config)return;
   this.shadowRoot.innerHTML='<style>'+CSS+'</style><ha-card><div class="top"><span class="mark">🎅</span><div class="heading"><div class="title"></div><div class="subtitle">'+this._txt('subtitle')+'</div></div><div class="status"><span class="dot"></span><span class="status-text"></span></div></div><div class="buttons"><button id="toggle" type="button"></button><button id="sound" type="button"></button><button id="test" type="button">'+this._txt('test')+'</button><a class="kofi" href="https://ko-fi.com/Frankys_Stuff" target="_blank" rel="noopener noreferrer">'+this._txt('coffee')+'</a></div><div class="detail"><label for="times">'+this._txt('interval')+'</label><select id="times"><option value="default">'+this._txt('daily')+'</option><option value="1-2">1–2 Minuten</option><option value="3-8">3–8 Minuten</option><option value="5-10">5–10 Minuten</option><option value="10-20">10–20 Minuten</option></select></div><div class="note">'+this._txt('defaultHint')+'</div></ha-card>';
   this.shadowRoot.querySelector('.title').textContent=this._config.title;
   var self=this;
   this.shadowRoot.getElementById('toggle').onclick=function(){self._state.enabled=!self._state.enabled;self._save();self._update();if(!self._state.enabled)self._stop();self._applySchedule();};
   this.shadowRoot.getElementById('sound').onclick=function(){self._state.sound=!self._state.sound;self._save();self._update();};
   this.shadowRoot.getElementById('test').onclick=function(){self._play();};
   this.shadowRoot.getElementById('times').onchange=function(){self._state.interval=this.value==='default'?'':this.value;self._save();self._applySchedule();};
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
 }
 _clearSchedule(){if(this._timer)clearTimeout(this._timer);this._timer=0;}
 _onVisibility(){if(document.hidden){this._clearSchedule();this._stop();}else this._applySchedule();}
 _applySchedule(){
   this._clearSchedule();
   if(!this.isConnected||!this._state||!this._state.enabled||document.hidden){if(window.__FrankysChristmasStandaloneOwner===this)window.__FrankysChristmasStandaloneOwner=null;return;}
   if(window.__FrankysChristmasStandaloneOwner&&window.__FrankysChristmasStandaloneOwner!==this)return;
   window.__FrankysChristmasStandaloneOwner=this;
   var self=this;
   /* Default: choose 1–10 random visits per local calendar day, save them on
      this monitor so changing dashboard views does not regenerate the quota. */
   if(!this._state.interval){
     var now=new Date(),day=now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2)+'-'+('0'+now.getDate()).slice(-2);
     var planKey=this._key()+'-daily-plan',plan=null;
     try{plan=JSON.parse(localStorage.getItem(planKey)||'null');}catch(e){}
     if(!plan||plan.day!==day||!Array.isArray(plan.times)){
       var midnight=new Date(now);midnight.setHours(23,59,59,0);
       var low=now.getTime()+60000,high=midnight.getTime()-60000;
       var count=1+Math.floor(Math.random()*10),times=[];
       /* Near midnight: leave the remainder of today free rather than
          bunching numerous flights into its last few minutes. */
       if(high-low>180000){
         var slot=(high-low)/count;
         for(var i=0;i<count;i++){
           times.push(Math.round(low+(i+Math.random())*slot));
         }
       }
       plan={day:day,times:times};
       try{localStorage.setItem(planKey,JSON.stringify(plan));}catch(e){}
     }
     var instant=Date.now(),next=0;
     for(var j=0;j<plan.times.length;j++){
       if(plan.times[j]>instant+500){next=plan.times[j];break;}
     }
     if(next){
       this._timer=setTimeout(function(){
         self._timer=0;
         if(self._state.enabled&&!document.hidden)self._play();
         self._applySchedule();
       },Math.max(100,next-instant));
     }else{
       var tomorrow=new Date(now);tomorrow.setHours(24,0,3,0);
       this._timer=setTimeout(function(){self._timer=0;self._applySchedule();},Math.max(1000,tomorrow.getTime()-instant));
     }
     return;
   }
   /* Original minute intervals remain available via the selector. */
   var pair=this._state.interval.split('-').map(Number);
   var ms=(pair[0]+Math.random()*(pair[1]-pair[0]))*60000;
   this._timer=setTimeout(function(){self._timer=0;self._play();self._applySchedule();},ms);
 }
 _stop(){
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
   if(c.video){
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
customElements.define('frankys-christmas-card',FrankysChristmasCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(function(x){return x.type==='frankys-christmas-card';})){
 window.customCards.push({type:'frankys-christmas-card',name:"Franky's Christmas Card",description:'Standalone Christmas overlay for one dashboard display; local interval and media.'});
}
})();
