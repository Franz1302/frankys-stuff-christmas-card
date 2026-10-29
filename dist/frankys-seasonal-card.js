/* Franky's Seasonal Fun Card – isolated beta v0.3.0, 2026-10-29
 * One schedule, one selected season. Compatible bridge to the existing
 * installed Christmas Card (no changes to its published source).
 * Halloween reuses the original Marshmallow v0.2.2 animation and audio.
 */
const VERSION='0.4.0-rc';
const STORAGE='frankys-seasonal/controller/v1';
const PLAN='frankys-seasonal/daily-plan/v1';
const MIGRATION_NOTE='frankys-seasonal/christmas-upgrade-note/v1';
const SCHEDULE=['daily','hourly','1-2','3-8','5-10','10-20','custom'];
const SCENES=['christmas','halloween'];
const DEFAULT={
 type:'custom:frankys-seasonal-card',title:"Franky's Seasonal Fun Card",season:'christmas',
 schedule_mode:'daily',schedule_start:'09:00',schedule_end:'22:00',interval_minutes:60,
 christmas_duration:10,christmas_size:60,christmas_volume:.55,bells_volume:.78,
 christmas_video:'',christmas_sound:'',christmas_bells:'',christmas_ios_video:'',christmas_fallback:'',
 halloween_fps:30,halloween_particles:40,halloween_size:1,halloween_direction:'left',
 halloween_render_scale:.75,halloween_volume:.85,halloween_laugh_volume:1,
 halloween_pop_volume:1,halloween_bubbles_volume:1,
 halloween_transparent:true,halloween_overlay:true,
 halloween_laugh_url:'',halloween_pop_url:'',halloween_bubbles_url:'',
 // The shipped design uses Home Assistant's theme. Overrides are all optional.
 design_accent:'',design_background:'',design_text:'',design_border:'',
 design_opacity:100,design_radius:16,design_custom_css:'',
};
const clamp=(n,lo,hi,def)=>Number.isFinite(+n)?Math.max(lo,Math.min(hi,+n)):def;
const cleanClock=(s,def)=>typeof s==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(s)?s:def;
const mins=s=>Number(s.slice(0,2))*60+Number(s.slice(3));
const de=()=>/^de(?:-|$)/i.test((window.__frankysHassLang||navigator.language||'de'));
const tr=(g,e)=>de()?g:e;
function configOf(raw={}){
 const c={...DEFAULT,...raw};
 // Legacy Christmas config aliases stay valid when this becomes the HACS upgrade.
 const aliases={duration:'christmas_duration',width_percent:'christmas_size',sound_volume:'christmas_volume',
   video:'christmas_video',ios_video:'christmas_ios_video',bells:'christmas_bells',fallback:'christmas_fallback'};
 for(const [oldKey,newKey] of Object.entries(aliases)){
   if(Object.prototype.hasOwnProperty.call(raw,oldKey) && !Object.prototype.hasOwnProperty.call(raw,newKey)) c[newKey]=raw[oldKey];
 }
 if(typeof raw.sound==='string' && !Object.prototype.hasOwnProperty.call(raw,'christmas_sound'))c.christmas_sound=raw.sound;
 c.season=SCENES.includes(c.season)?c.season:'christmas';
 c.schedule_mode=SCHEDULE.includes(c.schedule_mode)?c.schedule_mode:'daily';
 c.schedule_start=cleanClock(c.schedule_start,'09:00');
 c.schedule_end=cleanClock(c.schedule_end,'22:00');
 if(mins(c.schedule_start)>=mins(c.schedule_end)){
   c.schedule_start='09:00';c.schedule_end='22:00';
 }
 const ranges={interval_minutes:[15,1440],christmas_duration:[4,30],christmas_size:[20,95],christmas_volume:[0,1],bells_volume:[0,1],halloween_fps:[24,60],halloween_particles:[24,60],halloween_size:[.6,1.6],halloween_render_scale:[.5,1],halloween_volume:[0,1],halloween_laugh_volume:[0,1],halloween_pop_volume:[0,1],halloween_bubbles_volume:[0,1]};
 for(const [k,[a,b]] of Object.entries(ranges))c[k]=clamp(c[k],a,b,DEFAULT[k]);
 c.halloween_fps=[24,30,45,60].includes(c.halloween_fps)?c.halloween_fps:30;
 c.halloween_particles=[24,40,60].includes(c.halloween_particles)?c.halloween_particles:40;
 c.halloween_render_scale=[.5,.75,1].includes(c.halloween_render_scale)?c.halloween_render_scale:.75;
 c.halloween_direction=c.halloween_direction==='right'?'right':'left';
 c.title=typeof c.title==='string'&&c.title.trim()?c.title:DEFAULT.title;
 c.design_radius=clamp(c.design_radius,0,40,DEFAULT.design_radius);
 c.design_opacity=clamp(c.design_opacity,0,100,DEFAULT.design_opacity);
 for(const k of ['design_accent','design_background','design_text','design_border']){
   c[k]=typeof c[k]==='string' && /^#[a-fA-F0-9]{6}$/.test(c[k])?c[k]:'';
 }
 c.design_custom_css=typeof c.design_custom_css==='string'?c.design_custom_css.slice(0,10000):'';
 for(const key of ['christmas_video','christmas_sound','christmas_bells','christmas_ios_video','christmas_fallback','halloween_laugh_url','halloween_pop_url','halloween_bubbles_url'])
   c[key]=typeof c[key]==='string'&&!/^(?:data:|javascript:|\/\/)/i.test(c[key].trim())?c[key].trim():'';
 c.halloween_overlay=c.halloween_overlay!==false && c.halloween_overlay!=='false';
 c.halloween_transparent=c.halloween_transparent!==false && c.halloween_transparent!=='false';
 return c;
}
function stored(){
 try {
   const current=JSON.parse(localStorage.getItem(STORAGE)||'null');
   if(current&&typeof current==='object')return current;
   // First run after upgrading from the existing Christmas Card.
   const old=JSON.parse(localStorage.getItem('frankys-christmas-v1-default')||'null');
   if(old && typeof old==='object')return {
     enabled:!!old.enabled,sound:!!old.sound,sound_christmas:!!old.sound,
     sound_halloween:true,season:'christmas',
     mode:SCHEDULE.includes(old.interval)&&old.interval?old.interval:'daily',
     start:cleanClock(old.start_time,'09:00'),end:cleanClock(old.end_time,'22:00')
   };
 }catch{}return {};
}
function legacyChristmasInstalledHere(){
 try {
  if(localStorage.getItem(MIGRATION_NOTE)==='dismissed')return false;
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(typeof key==='string'&&/^frankys-christmas-v1-[a-zA-Z0-9_-]+$/.test(key)&&key!=='frankys-christmas-v1-global-config'){
    const v=JSON.parse(localStorage.getItem(key)||'null');
    if(v&&typeof v==='object'&&typeof v.enabled==='boolean')return true;
   }
  }
  const saved=JSON.parse(localStorage.getItem('frankys-christmas-v1-global-config')||'null');
  return !!(saved&&typeof saved==='object'&&(saved.type==='custom:frankys-christmas-card'||saved.schedule_start));
 }catch(e){return false;}
}
function dismissMigrationNotice(){try{localStorage.setItem(MIGRATION_NOTE,'dismissed')}catch(e){}}
function save(st){try{localStorage.setItem(STORAGE,JSON.stringify(st))}catch{}}
function dayKey(date){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
function scheduled(now,s,c){
 const nowMs=now.getTime(),[sh,sm]=s.start.split(':').map(Number),[eh,em]=s.end.split(':').map(Number);
 const low=new Date(now);low.setHours(sh,sm,0,0);
 const high=new Date(now);high.setHours(eh,em,0,0);
 const duration=Math.max(15,c.christmas_duration+2)*1000;
 if(s.mode==='daily'){
   const key=dayKey(now);let p=null;try{p=JSON.parse(localStorage.getItem(PLAN)||'null')}catch{}
   if(!p||p.day!==key||p.start!==s.start||p.end!==s.end||!Array.isArray(p.times)){
     const a=low.getTime()+1000,b=high.getTime()-duration-2000;
     const n=1+Math.floor(Math.random()*10),times=[];
     if(b>a){const slot=(b-a)/n;for(let i=0;i<n;i++)times.push(Math.round(a+(i+Math.random())*slot));}
     p={day:key,start:s.start,end:s.end,times};try{localStorage.setItem(PLAN,JSON.stringify(p))}catch{}
   }
   const next=p.times.find(t=>t>nowMs+500);
   if(next)return next;
   const tomorrow=new Date(now);tomorrow.setHours(24,0,3,0);
   return tomorrow.getTime();
 }
 if(s.mode==='hourly'){
   const at=new Date(now);at.setMinutes(0,0,0);
   if(at.getTime()<=nowMs+500)at.setHours(at.getHours()+1);
   for(let i=0;i<48;i++){
     const clock=at.getHours()*60;
     const endTime=new Date(at);endTime.setHours(eh,em,0,0);
     if(clock>=mins(s.start)&&clock<mins(s.end)&&at.getTime()+duration<=endTime.getTime())return at.getTime();
     at.setHours(at.getHours()+1);
   }
   return null;
 }
 const [min,max]=s.mode==='custom'?[s.interval_minutes,s.interval_minutes]:s.mode.split('-').map(Number);
 const wait=(min+Math.random()*(max-min))*60000;
 let when=nowMs<low.getTime()?low.getTime()+wait:nowMs+wait;
 if(when+duration>high.getTime()){
   const tomorrow=new Date(low);tomorrow.setDate(tomorrow.getDate()+1);
   when=tomorrow.getTime()+wait;
 }
 return when;
}
class SeasonalController{
 constructor(){
   this.config=configOf();
   const old=stored();
   this.state={enabled:old.enabled===true,sound:old.sound!==false,
     sound_christmas:typeof old.sound_christmas==='boolean'?old.sound_christmas:old.sound!==false,
     sound_halloween:typeof old.sound_halloween==='boolean'?old.sound_halloween:old.sound!==false,
     season:SCENES.includes(old.season)?old.season:'christmas',
     mode:SCHEDULE.includes(old.mode)?old.mode:'daily',
     start:cleanClock(old.start,'09:00'),end:cleanClock(old.end,'22:00'),
     interval_minutes:clamp(old.interval_minutes,15,1440,this.config.interval_minutes)};
   this.timer=null;this.busy=false;this.xmas=null;this.marsh=null;this.marshPromise=null;
   this.generation=0;this.previewHost=null;
   this.wired=false;
   this.onVisible=()=>{if(document.hidden)this.stop();this.schedule();};
   document.addEventListener('visibilitychange',this.onVisible);
   // Like the former Christmas Card, resume the saved schedule on any view,
   // even when its control card is not currently displayed.
   if(this.state.enabled)this.schedule();
 }
 changed(){window.dispatchEvent(new Event('frankys-seasonal-changed'));}
 configure(raw){
   const prev=this.config;this.config=configOf(raw);
   if(!this.wired){
     const old=stored();
     if(!SCENES.includes(old.season))this.state.season=this.config.season;
     this.state.sound=this.state.season==='christmas'?this.state.sound_christmas:this.state.sound_halloween;
     if(!SCHEDULE.includes(old.mode))this.state.mode=this.config.schedule_mode;
     if(!customElements.get('frankys-christmas-renderer')){
       customElements.whenDefined('frankys-christmas-renderer').then(()=>this.silenceLegacyChristmas());
     }
     if(!old.start)this.state.start=this.config.schedule_start;
     if(!old.end)this.state.end=this.config.schedule_end;
     if(!Number.isFinite(Number(old.interval_minutes)))this.state.interval_minutes=this.config.interval_minutes;
   }else{
     if(prev.season!==this.config.season)this.state.season=this.config.season;
     if(prev.schedule_mode!==this.config.schedule_mode)this.state.mode=this.config.schedule_mode;
     if(prev.schedule_start!==this.config.schedule_start)this.state.start=this.config.schedule_start;
     if(prev.schedule_end!==this.config.schedule_end)this.state.end=this.config.schedule_end;
     if(prev.interval_minutes!==this.config.interval_minutes)this.state.interval_minutes=this.config.interval_minutes;
   }
   if(mins(this.state.start)>=mins(this.state.end)){
     this.state.start=this.config.schedule_start;this.state.end=this.config.schedule_end;
   }
   this.wired=true;save(this.state);
   this.silenceLegacyChristmas();this.schedule();this.changed();
   if(this.state.season==='halloween')void this.ensureMarshmallow().catch(e=>console.warn('[Seasonal] preload',e));
 }
 setState(values){
   const next={...this.state,...values};
   if(!SCENES.includes(next.season)||!SCHEDULE.includes(next.mode))return false;
   if(mins(next.start)>=mins(next.end))return false;
   const prev=this.state;
   if(values.season && values.season!==prev.season){
     next.sound=next.season==='christmas'?next.sound_christmas:next.sound_halloween;
   }
   if(Object.prototype.hasOwnProperty.call(values,'sound')){
     next['sound_'+next.season]=!!next.sound;
   }
   this.state=next;save(next);
   if(prev.start!==next.start||prev.end!==next.end){try{localStorage.removeItem(PLAN)}catch{}}
   if(prev.season!==next.season || (prev.enabled&&!next.enabled))this.stop();
   this.silenceLegacyChristmas();this.schedule();this.changed();
   if(prev.season!==next.season && next.season==='halloween')void this.ensureMarshmallow().catch(e=>console.warn('[Seasonal] preload',e));
   return true;
 }
  setIntervalMinutes(value){
   if(!Number.isFinite(Number(value)))return false;
   const minutes=clamp(value,15,1440,this.state.interval_minutes);
   if(minutes===this.state.interval_minutes)return true;
   this.state={...this.state,interval_minutes:minutes};
   save(this.state);this.schedule();this.changed();
   return true;
  }
  // Retain the published Christmas renderer, sound mixing and particle effects.
 // This detached bridge takes over its old standalone timer with enabled=false.
 silenceLegacyChristmas(){
   if(!customElements.get('frankys-christmas-renderer'))return;
   try{
     if(!this.xmas)this.xmas=document.createElement('frankys-christmas-renderer');
     const c={type:'custom:frankys-christmas-card',duration:this.config.christmas_duration,width_percent:this.config.christmas_size,
       sound_volume:this.config.christmas_volume,bells_volume:this.config.bells_volume,
       schedule_start:this.state.start,schedule_end:this.state.end};
     for(const [from,to] of [['christmas_video','video'],['christmas_sound','sound'],['christmas_bells','bells'],['christmas_ios_video','ios_video'],['christmas_fallback','fallback']])
       if(this.config[from])c[to]=this.config[from];
     this.xmas.setConfig(c);
     this.xmas._state={...this.xmas._state,enabled:false,sound:this.state.sound};
     this.xmas._applySchedule();
   }catch(e){console.warn('[Seasonal] Christmas bridge failed',e);}
 }
 async ensureMarshmallow(){
   if(this.marsh)return this.marsh;
   if(!this.marshPromise){
     window.__FRANKYS_SEASONAL_EMBEDDED__=true;
     this.marshPromise=import('./marshmallow-engine.js?v=033-offline').then(()=>{
       const engine=window.__frankysSeasonalMarshmallowEngine;
       if(!engine)throw Error('Marshmallow engine not registered');
       this.marsh=engine;
       this.marshConfig();
       return engine;
     }).catch(e=>{this.marshPromise=null;throw e;});
   }
   return this.marshPromise;
 }
  attachPreview(host){
    this.previewHost=host||null;
    if(this.marsh)this.marsh.setHost(this.previewHost);
  }
  marshConfig(){
   if(!this.marsh)return;
   this.marsh.setConfig({type:'custom:frankys-seasonal-marshmallow-internal',
     fps:this.config.halloween_fps,count:this.config.halloween_particles,figure_size:this.config.halloween_size,
     direction:this.config.halloween_direction,render_scale:this.config.halloween_render_scale,
     sound:this.state.sound,sound_volume:this.config.halloween_volume,
     laugh_volume:this.config.halloween_laugh_volume,pop_volume:this.config.halloween_pop_volume,
     bubbles_volume:this.config.halloween_bubbles_volume,
     laugh_url:this.config.halloween_laugh_url,pop_url:this.config.halloween_pop_url,
     bubbles_url:this.config.halloween_bubbles_url,
     transparent:this.config.halloween_transparent,overlay:this.config.halloween_overlay,auto_play:false});
   this.marsh.setHost(this.previewHost);
   this.marsh.setRuntime({enabled:false,sound:this.state.sound});
 }
 async play(){
   if(this.busy)return;
   if(document.hidden)return;
   this.stop();const token=this.generation;this.busy=true;this.changed();
   try{
     if(this.state.season==='christmas'){
       if(!customElements.get('frankys-christmas-renderer'))throw Error('Christmas renderer is missing');
       this.silenceLegacyChristmas();
       this.xmas._state.sound=this.state.sound;
       this.xmas._unlockAudio?.();
       const ok=this.xmas._play();
       if(ok===false)throw Error('Christmas playback could not start');
       this.finish=setTimeout(()=>{this.busy=false;this.changed();},(this.config.christmas_duration+.7)*1000);
     }else{
       const m=await this.ensureMarshmallow();
       if(this.generation!==token||this.state.season!=='halloween')return;
       this.marshConfig();
       await m.play(false);
       if(this.generation!==token){m.stop();return;}
       this.finish=setTimeout(()=>{this.busy=false;this.changed();},15500);
     }
   }catch(e){this.busy=false;console.error('[Seasonal]',e);this.error=String(e.message||e);this.changed();}
 }
  stop(){
   this.generation++;
   if(this.finish)clearTimeout(this.finish);
   if(this.xmas?. _stop)this.xmas._stop();
   if(this.marsh?.stop)this.marsh.stop();
   this.busy=false;this.changed();
 }
 schedule(){
   if(this.timer!==null)clearTimeout(this.timer);
   this.timer=null;
   if(!this.state.enabled||document.hidden || (this.state.season==='halloween'&&!this.config.halloween_overlay))return;
   const now=new Date(),when=scheduled(now,this.state,this.config);
   if(when===null)return;
   this.timer=setTimeout(()=>{
     this.timer=null;
     const dt=new Date();
     if(this.state.enabled&&!document.hidden && mins(`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`)>=mins(this.state.start)
       && mins(`${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`)<mins(this.state.end))void this.play();
     this.schedule();
   },Math.min(2147483647,Math.max(100,when-now.getTime())));
 }
}
const ctrl=window.__frankysSeasonalController || (window.__frankysSeasonalController=new SeasonalController());
const style=`
:host{
 display:block;color:var(--fs-seasonal-text,var(--primary-text-color,#edf6ff));font:inherit;
 --fs-seasonal-accent:var(--primary-color,#08c9f0);
 --fs-seasonal-background:var(--ha-card-background,var(--card-background-color,#1b2836));
 --fs-seasonal-border:var(--divider-color,#80909e);
 --fs-seasonal-radius:16px;
 --fs-seasonal-opacity:1;
}
ha-card{
 display:block;padding:16px;min-width:0;border-radius:var(--fs-seasonal-radius);overflow:hidden;
 container-type:inline-size;position:relative;isolation:isolate;
 color:var(--fs-seasonal-text,var(--primary-text-color,#edf6ff));
 background:transparent!important;
}
ha-card::before{
 content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
 border-radius:inherit;background:var(--fs-seasonal-background);opacity:var(--fs-seasonal-opacity);
}
ha-card > :not(style){position:relative;z-index:1}
.migration-note{margin:12px 0 6px;padding:12px;border:1px solid var(--fs-seasonal-accent);border-radius:10px;background:color-mix(in srgb,var(--fs-seasonal-accent) 12%,transparent);font-size:13px;line-height:1.5}
.migration-note[hidden]{display:none}.migration-note strong{display:block;margin-bottom:4px}
.migration-note button{margin-top:8px;min-height:40px;padding:6px 12px;font-weight:600}
.heading{display:flex;gap:10px;align-items:center}.name{flex:1;min-width:0;font-weight:700;font-size:16px}.status{font-size:12px;opacity:.75}
button,select,input{box-sizing:border-box;min-width:0;font:inherit;color:inherit;border:1px solid var(--fs-seasonal-border);border-radius:9px;background:var(--fs-seasonal-background)}
button{min-height:44px;cursor:pointer;padding:7px 10px}button[aria-pressed="true"]{border-color:var(--fs-seasonal-accent);background:color-mix(in srgb,var(--fs-seasonal-accent) 20%,transparent)}
button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--fs-seasonal-accent);outline-offset:2px}
.season-picker{margin-top:14px}.season-trigger{width:100%;display:flex;align-items:center;gap:10px;justify-content:space-between;text-align:left;background:color-mix(in srgb,var(--fs-seasonal-accent) 13%,transparent);font-weight:650}
.season-trigger .season-name{margin-left:auto;font-weight:650;color:var(--fs-seasonal-accent)}.season-trigger .caret{font-size:18px;line-height:1}
.menu[hidden]{display:none}.menu{display:grid;gap:6px;margin-top:6px;padding:7px;border:1px solid var(--fs-seasonal-border);border-radius:10px;background:var(--fs-seasonal-background)}
.menu button{width:100%;text-align:left;min-height:44px}.menu button[aria-current="true"]{border-color:var(--fs-seasonal-accent);background:color-mix(in srgb,var(--fs-seasonal-accent) 16%,transparent)}
.buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0 12px}
.line{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px;font-size:12px}.line select{flex:1 1 140px;min-height:44px;padding:5px}.line input{min-width:0;max-width:125px;min-height:44px;padding:5px}
.line[hidden]{display:none}.custom-line input{width:92px;max-width:120px}.note{font-size:12px;opacity:.75;margin-top:10px}.error{color:var(--error-color,#ff8080)}
@container (min-width:480px){.buttons{grid-template-columns:repeat(4,minmax(0,1fr))}}

.options-trigger{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;min-height:42px;font-weight:600;background:transparent}
.options-trigger .caret{font-size:16px;transition:transform .15s ease}
.options-trigger[aria-expanded="true"] .caret{transform:rotate(180deg)}
.options-panel{padding:2px 0 0}
.options-panel[hidden]{display:none}
.options-trigger[aria-expanded="true"]{border-color:var(--fs-seasonal-accent)}
`;
class FrankysSeasonalCard extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this._listener=()=>this.update();this._language='';}
 set hass(h){
   const lang=h?.locale?.language||h?.language||navigator.language;
   window.__frankysHassLang=lang;
   const changed=this._language!==lang;
   this._language=lang;
   this.render(!!changed);
 }
 setConfig(raw){this.config=configOf(raw);ctrl.configure(this.config);this.render(true);}
 connectedCallback(){window.addEventListener('frankys-seasonal-changed',this._listener);this.render();}
 disconnectedCallback(){window.removeEventListener('frankys-seasonal-changed',this._listener);}
 getCardSize(){return 3;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 static getStubConfig(){return {type:'custom:frankys-seasonal-card'};}
 static getConfigElement(){return document.createElement('frankys-seasonal-card-editor');}
 render(force=false){
   if(!this.config)return;
   if(!force && this.shadowRoot.getElementById('season')){this.update();return;}
   const preview=this.stateNeedsPreview();
   const optionsOpen=this.shadowRoot.getElementById('options')?.getAttribute('aria-expanded')==='true';
   this.shadowRoot.innerHTML=`<style>${style}</style><style id="seasonal-custom-style"></style><ha-card>
     <div class="heading"><div class="name"></div><span class="status"></span></div>
     <div id="migration-note" class="migration-note" hidden role="status">
      <strong>${tr("Franky's Christmas Card heißt jetzt Franky's Seasonal Fun Card!","Franky's Christmas Card is now Franky's Seasonal Fun Card!")}</strong>
      <span>${tr('Dein Weihnachtsauftritt bleibt erhalten. Neu ist die Season-Auswahl zwischen Christmas und Halloween. Deine bisherigen Einstellungen werden übernommen.','Your Christmas animation stays. The Season button now lets you choose Christmas or Halloween. Your existing settings are carried over.')}</span>
      <div><button id="migration-dismiss" type="button">${tr('Verstanden','Got it')}</button></div>
     </div>
     <div class="season-picker"><button type="button" id="season" class="season-trigger" aria-expanded="false" aria-controls="menu"><span>Season</span><strong class="season-name"></strong><span class="caret" aria-hidden="true">⌄</span></button>
       <div id="menu" class="menu" role="group" aria-label="Season" hidden>
         <button type="button" data-season="christmas">${tr('Weihnachten','Christmas')}</button>
         <button type="button" data-season="halloween">Halloween</button>
       </div>
     </div>
     <div class="buttons"><button type="button" id="toggle"></button><button type="button" id="sound"></button><button type="button" id="test"></button><button type="button" id="stop"></button></div>
     <button type="button" id="options" class="options-trigger" aria-expanded="${optionsOpen}" aria-controls="options-panel"><span>${tr('Optionen','Options')}</span><span class="caret" aria-hidden="true">⌄</span></button>
     <div id="options-panel" class="options-panel" ${optionsOpen?'':'hidden'}>
     <div class="line"><label for="mode">${tr('Auftrittszeiten','Appearance schedule')}</label><select id="mode">
       <option value="daily">${tr('1–10× täglich (Zufall)','1–10 times daily')}</option>
       <option value="hourly">${tr('Jede volle Stunde','Every full hour')}</option>
       <option value="1-2">1–2 ${tr('Minuten','minutes')}</option><option value="3-8">3–8 ${tr('Minuten','minutes')}</option>
       <option value="5-10">5–10 ${tr('Minuten','minutes')}</option><option value="10-20">10–20 ${tr('Minuten','minutes')}</option>
       <option value="custom">${tr('Eigenes Intervall','Custom interval')}</option></select>
     </div>
     <div id="custom-line" class="line custom-line" hidden><label for="custom_minutes">${tr('Eigenes Intervall','Custom interval')}</label><input type="number" id="custom_minutes" min="15" max="1440" step="1" inputmode="numeric"><span>${tr('Minuten','minutes')}</span></div>
     <div class="line"><label for="from">${tr('Von','From')}</label><input id="from" type="time"><label for="to">${tr('Bis','To')}</label><input id="to" type="time"></div>
     ${preview?'<div id="preview" style="position:relative;width:100%;height:250px;min-height:200px;overflow:hidden;background:#111c28;border-radius:12px;margin-top:10px"></div>':''}
     <div class="note"></div>
     </div>
   </ha-card>`;
   const $=id=>this.shadowRoot.getElementById(id);
   $('migration-dismiss').onclick=()=>{
    dismissMigrationNotice();
    $('migration-note').hidden=true;
   };
   $('toggle').onclick=()=>ctrl.setState({enabled:!ctrl.state.enabled});
   $('sound').onclick=()=>ctrl.setState({sound:!ctrl.state.sound});
   $('test').onclick=()=>void ctrl.play();
   $('stop').onclick=()=>ctrl.stop();
   $('options').onclick=()=>{
     const panel=$('options-panel'),open=panel.hidden;
     panel.hidden=!open;
     $('options').setAttribute('aria-expanded',String(open));
   };
   $('options').onkeydown=e=>{
     if(e.key==='Escape'){e.preventDefault();$('options-panel').hidden=true;$('options').setAttribute('aria-expanded','false');}
   };
   $('season').onclick=()=>{
     const menu=$('menu');const open=menu.hidden;
     menu.hidden=!open;
     $('season').setAttribute('aria-expanded',String(open));
   };
   $('season').onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();$('menu').hidden=true;$('season').setAttribute('aria-expanded','false');}};
   this.shadowRoot.querySelectorAll('[data-season]').forEach(b=>b.onclick=()=>{
     $('menu').hidden=true;$('season').setAttribute('aria-expanded','false');
     ctrl.setState({season:b.dataset.season});
   });
   $('mode').onchange=()=>ctrl.setState({mode:$('mode').value});
   $('custom_minutes').onchange=()=>{
     if(!ctrl.setIntervalMinutes($('custom_minutes').value))$('custom_minutes').value=ctrl.state.interval_minutes;
   };
   function clock(){if(!ctrl.setState({start:$('from').value,end:$('to').value})){
     $('from').value=ctrl.state.start;$('to').value=ctrl.state.end;
   }}
   $('from').onchange=clock;$('to').onchange=clock;
   ctrl.attachPreview($('preview'));
   // Set design variables only on this card; other Lovelace cards are untouched.
   this.applyDesign();
   this.update();
 }
 applyDesign(){
   const card=this.shadowRoot.querySelector('ha-card');
   if(!card || !this.config)return;
   const mapped={design_accent:'--fs-seasonal-accent',design_background:'--fs-seasonal-background',
     design_text:'--fs-seasonal-text',design_border:'--fs-seasonal-border'};
   for(const [key,variable] of Object.entries(mapped)){
     if(this.config[key])card.style.setProperty(variable,this.config[key]);
     else card.style.removeProperty(variable);
   }
   card.style.setProperty('--fs-seasonal-radius',`${this.config.design_radius}px`);
   card.style.setProperty('--fs-seasonal-opacity',String(this.config.design_opacity/100));
   const extra=this.shadowRoot.getElementById('seasonal-custom-style');
   if(extra)extra.textContent=this.config.design_custom_css||'';
 }
 stateNeedsPreview(){return ctrl.state.season==='halloween'&&!this.config.halloween_overlay;}
 update(){
   if(!this.config)return;
   const $=id=>this.shadowRoot.getElementById(id);
   if(!$('season')){this.render(true);return;}
   const s=ctrl.state,scene=s.season==='christmas'?tr('Weihnachten','Christmas'):'Halloween';
   // Do not destroy buttons or open menus during repeated HA hass updates.
   const currentPreview=!!$('preview');
   if(currentPreview!==this.stateNeedsPreview()){this.render(true);return;}
   this.applyDesign();
   const migration=this.shadowRoot.getElementById('migration-note');
   if(migration)migration.hidden=!(legacyChristmasInstalledHere()||this.config.type==='custom:frankys-christmas-card') || (()=>{try{return localStorage.getItem(MIGRATION_NOTE)==='dismissed'}catch(e){return false}})();
   this.shadowRoot.querySelector('.name').textContent=this.config.title;
   this.shadowRoot.querySelector('.season-name').textContent=scene;
   this.shadowRoot.querySelector('.status').textContent=ctrl.busy?tr('LÄUFT','PLAYING'):s.enabled?tr('AKTIV','ON'):tr('AUS','OFF');
   $('toggle').textContent=s.enabled?tr('Ausschalten','Disable'):tr('Einschalten','Enable');
   $('sound').textContent=s.sound?tr('Ton an','Sound on'):tr('Ton aus','Sound off');
   $('test').textContent=tr('Testauftritt','Test appearance');
   $('stop').textContent=tr('Stoppen','Stop');
   $('toggle').setAttribute('aria-pressed',String(s.enabled));
   $('sound').setAttribute('aria-pressed',String(s.sound));
   for(const b of this.shadowRoot.querySelectorAll('[data-season]'))b.setAttribute('aria-current',String(b.dataset.season===s.season));
   if(this.shadowRoot.activeElement!==$('mode'))$('mode').value=s.mode;
   if(this.shadowRoot.activeElement!==$('from'))$('from').value=s.start;
   if(this.shadowRoot.activeElement!==$('to'))$('to').value=s.end;
   $('custom-line').hidden=s.mode!=='custom';
   if(this.shadowRoot.activeElement!==$('custom_minutes'))$('custom_minutes').value=String(s.interval_minutes);
   const n=this.shadowRoot.querySelector('.note');
   n.textContent=ctrl.error||tr('Nur die gewählte Season wird automatisch gestartet. Die Einstellungen bleiben pro Saison erhalten.','Only the selected season is scheduled. Settings for both are retained.');
   n.classList.toggle('error',!!ctrl.error);
 }
}
class FrankysSeasonalEditor extends HTMLElement{
 constructor(){super();this.attachShadow({mode:'open'});this.config=null;}
 set hass(h){
   const language=h?.locale?.language||h?.language||navigator.language;
   const previous=window.__frankysHassLang;
   window.__frankysHassLang=language;
   if(previous!==language || !this.shadowRoot.querySelector('[data-key]'))this.render();
 }
 setConfig(c){this.config=configOf(c);this.render();}
 render(){
   if(!this.config)return;
   const c=this.config,html=[];
   const expanded=[...this.shadowRoot.querySelectorAll('details')].flatMap((node,i)=>node.open?[i]:[]);
   const choiceLabel=(key,value)=>{
     if(key==='season')return value==='christmas'?tr('Weihnachten','Christmas'):'Halloween';
     if(key==='schedule_mode')return ({daily:tr('1–10× täglich','1–10 times daily'),hourly:tr('Jede volle Stunde','Every full hour'),'1-2':tr('1–2 Minuten','1–2 minutes'),'3-8':tr('3–8 Minuten','3–8 minutes'),'5-10':tr('5–10 Minuten','5–10 minutes'),'10-20':tr('10–20 Minuten','10–20 minutes'),custom:tr('Eigenes Intervall','Custom interval')})[value]||String(value);
     if(key==='halloween_direction')return value==='left'?tr('Links → rechts','Left → right'):tr('Rechts → links','Right → left');
     if(key==='halloween_overlay'||key==='halloween_transparent')return String(value)==='true'?tr('Ja','Yes'):tr('Nein','No');
     if(key==='halloween_render_scale')return `${Math.round(Number(value)*100)} %`;
     return String(value);
   };
   const select=(key,label,values)=>{html.push(`<label>${label}<select data-key="${key}">${values.map(v=>`<option value="${v}" ${String(c[key])===String(v)?'selected':''}>${choiceLabel(key,v)}</option>`).join('')}</select></label>`)};
   const num=(key,label,min,max,step)=>{html.push(`<label>${label}<input data-key="${key}" type="number" min="${min}" max="${max}" step="${step}" value="${c[key]}"></label>`)};
   const str=(key,label)=>{html.push(`<label>${label}<input data-key="${key}" type="text" value="${String(c[key]||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}"></label>`)};
   html.push(`<h3>${tr('Allgemein','General')}</h3>`);
   str('title',tr('Titel','Title'));
   select('season','Season',['christmas','halloween']);
   select('schedule_mode',tr('Zeitplan','Schedule'),SCHEDULE);
   str('schedule_start',tr('Von (HH:MM)','From (HH:MM)'));str('schedule_end',tr('Bis (HH:MM)','Until (HH:MM)'));
   num('interval_minutes',tr('Eigenes Intervall (Minuten)','Custom interval (minutes)'),15,1440,1);
   html.push(`<details><summary>${tr('Kartendesign anpassen','Customize card design')}</summary>`);
   html.push(`<small>${tr('Ohne Änderungen wird das bisherige Grunddesign mit Home-Assistant-Farben verwendet. Leere Farbfelder übernehmen das HA-Theme.','Defaults use the current look and Home Assistant colors. Empty color fields inherit the HA theme.')}</small>`);
   const color=(key,label)=>{
     html.push(`<label>${label}<span class="color-row"><input data-key="${key}" type="color" value="${c[key]||'#1b2836'}"><button type="button" data-reset="${key}">${tr('Theme-Farbe','Theme color')}</button></span></label>`);
   };
   color('design_accent',tr('Akzentfarbe','Accent color'));
   color('design_background',tr('Hintergrundfarbe','Background color'));
   color('design_text',tr('Textfarbe','Text color'));
   color('design_border',tr('Rahmenfarbe','Border color'));
   num('design_opacity',tr('Hintergrund-Deckkraft (%)','Background opacity (%)'),0,100,5);
   num('design_radius',tr('Eckenradius (px)','Corner radius (px)'),0,40,1);
   html.push(`<details><summary>${tr('Erweitert: Eigenes CSS','Advanced: custom CSS')}</summary><small>${tr('Wirkt nur innerhalb dieser Karte. CSS-Klassen und Variablen stehen in der README.','Scoped to this card. CSS classes and variables are documented in README.')}</small><textarea data-key="design_custom_css" rows="7" spellcheck="false"></textarea></details></details>`);
   html.push(`<h3>${tr('Weihnachten','Christmas')}</h3>`);
   num('christmas_duration',tr('Flugdauer (Sekunden)','Flight seconds'),4,30,1);
   num('christmas_size',tr('Schlittengröße (%)','Sleigh size (%)'),20,95,5);
   num('christmas_volume',tr('Santa-Lautstärke','Santa volume'),0,1,.05);
   num('bells_volume',tr('Glöckchen-Lautstärke','Bells volume'),0,1,.05);
   html.push('<details><summary>'+tr('Eigene Weihnachtsmedien','Custom Christmas media')+'</summary>');
   str('christmas_video','WebM URL');str('christmas_ios_video','iPad WebP URL');   str('christmas_sound','Santa MP3 URL');str('christmas_bells',tr('Glocken MP3 URL','Bells MP3 URL'));str('christmas_fallback',tr('Ersatzbild-URL','Fallback image URL'));html.push('</details>');
   html.push(`<h3>Halloween</h3>`);
   select('halloween_fps','FPS',[24,30,45,60]);
   select('halloween_particles',tr('Marshmallow-Stücke','Marshmallow pieces'),[24,40,60]);
   select('halloween_direction',tr('Laufrichtung','Walking direction'),['left','right']);
   select('halloween_render_scale',tr('Renderauflösung','Render resolution'),[.5,.75,1]);
   num('halloween_size',tr('Figurgröße','Figure size'),.6,1.6,.1);
   num('halloween_volume',tr('Gesamtlautstärke','Master volume'),0,1,.05);
   num('halloween_laugh_volume',tr('Lachen','Laugh volume'),0,1,.05);
   num('halloween_pop_volume',tr('Plopp','Pop volume'),0,1,.05);
   num('halloween_bubbles_volume',tr('Blasen','Bubble volume'),0,1,.05);
   select('halloween_transparent',tr('Transparenter Hintergrund','Transparent background'),[true,false]);
   select('halloween_overlay',tr('Vollbild-Overlay','Fullscreen overlay'),[true,false]);
   html.push('<details><summary>'+tr('Eigene Halloween-Töne','Custom Halloween audio')+'</summary>');
   str('halloween_laugh_url',tr('Lachen MP3 URL','Laugh MP3 URL'));str('halloween_pop_url',tr('Plopp MP3 URL','Pop MP3 URL'));str('halloween_bubbles_url',tr('Blasen MP3 URL','Bubbles MP3 URL'));html.push('</details>');
   this.shadowRoot.innerHTML=`<style>:host{display:block;color:var(--primary-text-color,#eee);font-size:14px}h3{margin:14px 0 6px}label{display:flex;flex-direction:column;gap:4px;margin:9px 0}input,select,textarea{padding:9px;border:1px solid var(--divider-color,#777);border-radius:9px;color:inherit;background:var(--card-background-color,#1b2635);font:inherit}textarea{width:100%;box-sizing:border-box;resize:vertical}details{margin:12px 0}summary{cursor:pointer;min-height:36px}small{display:block;opacity:.72;margin:6px 0;line-height:1.4}.color-row{display:flex;gap:9px;align-items:center}.color-row input{flex:0 0 60px;height:42px;padding:2px}.color-row button{flex:1;padding:8px;border:1px solid var(--divider-color,#777);border-radius:9px;color:inherit;background:var(--card-background-color,#1b2635);cursor:pointer}</style>${html.join('')}`;
   [...this.shadowRoot.querySelectorAll('details')].forEach((node,i)=>node.open=expanded.includes(i));
   this.shadowRoot.querySelector('textarea[data-key="design_custom_css"]').value=c.design_custom_css;
   this.shadowRoot.querySelectorAll('[data-reset]').forEach(button=>button.onclick=()=>{
     const key=button.dataset.reset,next=configOf({...this.config,[key]:''});
     this.config=next;this.render();
     this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
   });
   this.shadowRoot.querySelectorAll('[data-key]').forEach(el=>{el.onchange=()=>{
     const key=el.dataset.key,next={...this.config};
     next[key]=el.type==='number'?Number(el.value):(['halloween_overlay','halloween_transparent'].includes(key)?el.value==='true':el.value);
     const clean=configOf(next);
     if(key==='schedule_start'||key==='schedule_end'){
       if(mins(clean.schedule_start)>=mins(clean.schedule_end) || clean[key]!==next[key]){this.render();return;}
     }
     this.config=clean;
     this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:clean},bubbles:true,composed:true}));
   }});
 }
}
class FrankysSeasonalLegacyCard extends FrankysSeasonalCard {
 static getStubConfig(){return {type:'custom:frankys-christmas-card'};}
}
if(!customElements.get('frankys-christmas-card'))customElements.define('frankys-christmas-card',FrankysSeasonalLegacyCard);
if(!customElements.get('frankys-seasonal-card-editor'))customElements.define('frankys-seasonal-card-editor',FrankysSeasonalEditor);
if(!customElements.get('frankys-seasonal-card'))customElements.define('frankys-seasonal-card',FrankysSeasonalCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(x=>x.type==='frankys-seasonal-card'))window.customCards.push({type:'frankys-seasonal-card',name:"Franky's Seasonal Fun Card",description:'Christmas / Halloween overlay with one scheduler and season selection',preview:false});
console.info('[Frankys Seasonal Fun] release candidate',VERSION);
