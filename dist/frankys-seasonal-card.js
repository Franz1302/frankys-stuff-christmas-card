/* Franky's Seasonal Fun Card – isolated beta v0.3.0, 2026-10-29
 * One schedule, one selected season. Compatible bridge to the existing
 * installed Christmas Card (no changes to its published source).
 * Halloween reuses the original Marshmallow v0.2.2 animation and audio.
 */
const VERSION='0.5.4';
const STORAGE='frankys-seasonal/controller/v1';
const PLAN='frankys-seasonal/daily-plan/v1';
const CONFIG_CACHE='frankys-seasonal/calendar-config/v1';
const CALENDAR_OVERRIDE='frankys-seasonal/calendar-override/v1';
const MIGRATION_NOTE='frankys-seasonal/christmas-upgrade-note/v1';
const FIGURE_CHOICE_KEY='frankys-seasonal/figure-choice/v1';
const FIGURE_MODES=['santa','christkind','both'];
function storedFigureChoice(){
 try{const choice=localStorage.getItem(FIGURE_CHOICE_KEY);return FIGURE_MODES.includes(choice)?choice:null;}
 catch(e){return null;}
}
const SCHEDULE=['daily','hourly','1-2','3-8','5-10','10-20','custom'];
const SCENES=['christmas','halloween','st_martin','nikolaus'];
const HOLIDAY_ORDER=['halloween','st_martin','nikolaus','christmas'];
const DEFAULT_HOLIDAYS={
 halloween:{enabled:true,start:'10-25',end:'10-31'},
 st_martin:{enabled:true,start:'11-08',end:'11-11'},
 nikolaus:{enabled:true,start:'12-01',end:'12-06'},
 christmas:{enabled:true,start:'12-07',end:'12-26'},
};
const DEFAULT={
 type:'custom:frankys-seasonal-card',title:"Franky's Seasonal Fun Card",season:'christmas',
 schedule_mode:'daily',schedule_start:'09:00',schedule_end:'22:00',interval_minutes:60,
 seasonal_calendar:{enabled:false,holidays:DEFAULT_HOLIDAYS},
 st_martin_url:'',st_martin_sound_url:'',st_martin_volume:.8,nikolaus_url:'',nikolaus_sound_url:'',nikolaus_volume:.8,
 christmas_duration:10,christmas_size:60,christmas_volume:.55,bells_volume:.78,
 christmas_video:'',christmas_sound:'',christmas_bells:'',christmas_ios_video:'',christmas_fallback:'',
 controls_locked:false,display_mode:'normal',
 // Empty Santa schedule fields inherit the existing card schedule, preserving saved settings.
 santa_enabled:true,santa_sound_enabled:true,santa_schedule_mode:'',santa_schedule_start:'',santa_schedule_end:'',santa_interval_minutes:0,
 christkind_enabled:false,christkind_sound_enabled:true,christkind_schedule_mode:'daily',christkind_schedule_start:'09:00',christkind_schedule_end:'22:00',christkind_interval_minutes:60,
 christkind_duration:15,christkind_size:100,christkind_volume:.8,
 christkind_video:'/hacsfiles/frankys-stuff-christmas-card/assets/christkind_lipsync_transparent.webm',christkind_ios_video:'/hacsfiles/frankys-stuff-christmas-card/assets/christkind_lipsync_safari.webp',christkind_ios_audio:'/hacsfiles/frankys-stuff-christmas-card/assets/christkind_lipsync_safari.mp3',
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
const cleanAnnualDate=(s,def)=>{
 if(typeof s!=='string'||! /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(s))return def;
 const [month,day]=s.split('-').map(Number),date=new Date(2000,month-1,day);
 return date.getMonth()===month-1&&date.getDate()===day?s:def;
};
const bool=(v,def=false)=>v===true||v==='true'?true:v===false||v==='false'?false:def;
function normalizeHolidays(value){
 const source=value&&typeof value==='object'?value:{},holidays={};
 for(const id of HOLIDAY_ORDER){
   const raw=source[id]&&typeof source[id]==='object'?source[id]:{},fallback=DEFAULT_HOLIDAYS[id];
   holidays[id]={enabled:bool(raw.enabled,fallback.enabled),
     start:cleanAnnualDate(raw.start,fallback.start),end:cleanAnnualDate(raw.end,fallback.end)};
 }
 return holidays;
}
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
 c.display_mode=['normal','compact','hidden'].includes(c.display_mode)?c.display_mode:'normal';
 c.schedule_mode=SCHEDULE.includes(c.schedule_mode)?c.schedule_mode:'daily';
 c.schedule_start=cleanClock(c.schedule_start,'09:00');
 c.schedule_end=cleanClock(c.schedule_end,'22:00');
 if(mins(c.schedule_start)>=mins(c.schedule_end)){
   c.schedule_start='09:00';c.schedule_end='22:00';
 }
 const ranges={interval_minutes:[15,1440],christmas_duration:[4,30],christmas_size:[20,95],christmas_volume:[0,1],bells_volume:[0,1],christkind_interval_minutes:[15,1440],christkind_duration:[8,30],christkind_size:[40,140],christkind_volume:[0,1],st_martin_volume:[0,1],nikolaus_volume:[0,1],halloween_fps:[24,60],halloween_particles:[24,60],halloween_size:[.6,1.6],halloween_render_scale:[.5,1],halloween_volume:[0,1],halloween_laugh_volume:[0,1],halloween_pop_volume:[0,1],halloween_bubbles_volume:[0,1]};
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
 const calendar=c.seasonal_calendar&&typeof c.seasonal_calendar==='object'?c.seasonal_calendar:{};
 c.seasonal_calendar={enabled:bool(calendar.enabled,false),holidays:normalizeHolidays(calendar.holidays)};
 for(const key of ['christmas_video','christmas_sound','christmas_bells','christmas_ios_video','christmas_fallback','christkind_video','christkind_ios_video','christkind_ios_audio','halloween_laugh_url','halloween_pop_url','halloween_bubbles_url','st_martin_url','st_martin_sound_url','nikolaus_url','nikolaus_sound_url'])
   c[key]=typeof c[key]==='string'&&!/^(?:data:|javascript:|\/\/)/i.test(c[key].trim())?c[key].trim():'';
 for(const k of ['controls_locked','santa_enabled','santa_sound_enabled','christkind_enabled','christkind_sound_enabled'])c[k]=bool(c[k],DEFAULT[k]);
 c.santa_schedule_mode=SCHEDULE.includes(c.santa_schedule_mode)?c.santa_schedule_mode:'';
 c.santa_schedule_start=c.santa_schedule_start?cleanClock(c.santa_schedule_start,''):'';
 c.santa_schedule_end=c.santa_schedule_end?cleanClock(c.santa_schedule_end,''):'';
 c.santa_interval_minutes=Number(c.santa_interval_minutes)>0?clamp(c.santa_interval_minutes,15,1440,60):0;
 c.christkind_schedule_mode=SCHEDULE.includes(c.christkind_schedule_mode)?c.christkind_schedule_mode:'daily';
 c.christkind_schedule_start=cleanClock(c.christkind_schedule_start,'09:00');
 c.christkind_schedule_end=cleanClock(c.christkind_schedule_end,'22:00');
 if(mins(c.christkind_schedule_start)>=mins(c.christkind_schedule_end)){
   c.christkind_schedule_start='09:00';c.christkind_schedule_end='22:00';
 }
 c.halloween_overlay=c.halloween_overlay!==false && c.halloween_overlay!=='false';
 c.halloween_transparent=c.halloween_transparent!==false && c.halloween_transparent!=='false';
 return c;
}
function savedCardCalendar(){
 try{
   const value=JSON.parse(localStorage.getItem(CALENDAR_OVERRIDE)||'null');
   if(value && typeof value==='object' && typeof value.enabled==='boolean' &&
       value.holidays && typeof value.holidays==='object')
     return {enabled:value.enabled,holidays:normalizeHolidays(value.holidays)};
 }catch(e){console.warn('[Seasonal] Calendar settings unavailable',e);}
 return null;
}
function withCardCalendar(raw={}){
 const value=savedCardCalendar();
 return configOf(value?{...raw,seasonal_calendar:value}:raw);
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
function annualDay(date){return (date.getMonth()+1)*100+date.getDate()}
function inAnnualRange(date,start,end){
 const current=annualDay(date),from=Number(start.slice(0,2))*100+Number(start.slice(3)),to=Number(end.slice(0,2))*100+Number(end.slice(3));
 return from<=to?current>=from&&current<=to:current>=from||current<=to;
}
function scheduled(now,s,c,planKey=PLAN,durationSeconds=c.christmas_duration){
 const nowMs=now.getTime(),[sh,sm]=s.start.split(':').map(Number),[eh,em]=s.end.split(':').map(Number);
 const low=new Date(now);low.setHours(sh,sm,0,0);
 const high=new Date(now);high.setHours(eh,em,0,0);
 const duration=Math.max(15,durationSeconds+2)*1000;
 if(s.mode==='daily'){
   const key=dayKey(now);let p=null;try{p=JSON.parse(localStorage.getItem(planKey)||'null')}catch{}
   if(!p||p.day!==key||p.start!==s.start||p.end!==s.end||!Array.isArray(p.times)){
     const a=low.getTime()+1000,b=high.getTime()-duration-2000;
     const n=1+Math.floor(Math.random()*10),times=[];
     if(b>a){const slot=(b-a)/n;for(let i=0;i<n;i++)times.push(Math.round(a+(i+Math.random())*slot));}
     p={day:key,start:s.start,end:s.end,times};try{localStorage.setItem(planKey,JSON.stringify(p))}catch{}
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
   let cached={};
   try{cached=JSON.parse(localStorage.getItem(CONFIG_CACHE)||'{}');}
   catch(e){console.warn('[Seasonal] Could not restore cached configuration',e);}
   this.config=withCardCalendar(cached||{});
   const old=stored();
   this.state={enabled:old.enabled===true,sound:old.sound!==false,
     sound_christmas:typeof old.sound_christmas==='boolean'?old.sound_christmas:old.sound!==false,
     sound_halloween:typeof old.sound_halloween==='boolean'?old.sound_halloween:old.sound!==false,
     season:SCENES.includes(old.season)?old.season:'christmas',
     manual_season:SCENES.includes(old.manual_season)?old.manual_season:(SCENES.includes(old.season)?old.season:'christmas'),
     manual_date:typeof old.manual_date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(old.manual_date)?old.manual_date:'',
     mode:SCHEDULE.includes(old.mode)?old.mode:'daily',
     start:cleanClock(old.start,'09:00'),end:cleanClock(old.end,'22:00'),
     interval_minutes:clamp(old.interval_minutes,15,1440,this.config.interval_minutes)};
   this.timer=null;this.busy=false;this.xmas=null;this.marsh=null;this.marshPromise=null;this.imageScene=null;this.imageResolve=null;this.sceneAudio=null;
   this.generation=0;this.previewHost=null;this.imageURL=null;
 this.figureScheduleAt={santa:null,christkind:null};this.figureScheduleSignature={};this.pendingFigures=new Set();this.lastFigure=null;this.activeFigure=null;
 this.christkindStage=null;this.christkindMedia=null;this.christkindAudio=null;this.christkindRaf=0;
   this.wired=false;
   this.onVisible=()=>{if(document.hidden)this.stop();else this.syncCalendar();this.schedule();};
   document.addEventListener('visibilitychange',this.onVisible);
   // Like the former Christmas Card, resume the saved schedule on any view,
   // even when its control card is not currently displayed.
   this.syncCalendar();
   if(this.state.enabled||this.config.seasonal_calendar.enabled)this.schedule();
 }
 changed(){window.dispatchEvent(new Event('frankys-seasonal-changed'));}
 configure(raw){
   const prev=this.config;this.config=configOf(raw);
   if(!this.wired){
     const old=stored();
     if(!SCENES.includes(old.season)){
       this.state.season=this.config.season;
       if(!SCENES.includes(old.manual_season))this.state.manual_season=this.config.season;
     }
     this.state.sound=this.state.season==='halloween'?this.state.sound_halloween:this.state.sound_christmas;
     if(!SCHEDULE.includes(old.mode))this.state.mode=this.config.schedule_mode;
     if(!customElements.get('frankys-christmas-renderer')){
       customElements.whenDefined('frankys-christmas-renderer').then(()=>this.silenceLegacyChristmas());
     }
     if(!old.start)this.state.start=this.config.schedule_start;
     if(!old.end)this.state.end=this.config.schedule_end;
     if(!Number.isFinite(Number(old.interval_minutes)))this.state.interval_minutes=this.config.interval_minutes;
   }else{
     if(prev.season!==this.config.season){
       this.state.season=this.config.season;
       this.state.manual_season=this.config.season;
     }
     if(prev.schedule_mode!==this.config.schedule_mode)this.state.mode=this.config.schedule_mode;
     if(prev.schedule_start!==this.config.schedule_start)this.state.start=this.config.schedule_start;
     if(prev.schedule_end!==this.config.schedule_end)this.state.end=this.config.schedule_end;
     if(prev.interval_minutes!==this.config.interval_minutes)this.state.interval_minutes=this.config.interval_minutes;
   }
   if(mins(this.state.start)>=mins(this.state.end)){
     this.state.start=this.config.schedule_start;this.state.end=this.config.schedule_end;
   }
   this.wired=true;this.syncCalendar();save(this.state);
   try{localStorage.setItem(CONFIG_CACHE,JSON.stringify(this.config));}
   catch(e){console.warn('[Seasonal] Could not cache configuration',e);}
   this.silenceLegacyChristmas();this.schedule();this.changed();
   if(this.state.season==='halloween')void this.ensureMarshmallow().catch(e=>console.warn('[Seasonal] preload',e));
 }
 setState(values){
   const next={...this.state,...values};
   if(!SCENES.includes(next.season)||!SCHEDULE.includes(next.mode))return false;
   if(mins(next.start)>=mins(next.end))return false;
   const prev=this.state;
   if(values.season){
     next.sound=next.season==='halloween'?next.sound_halloween:next.sound_christmas;
     next.manual_season=next.season;next.manual_date=dayKey(new Date());
   }
   if(Object.prototype.hasOwnProperty.call(values,'sound')){
     next[next.season==='halloween'?'sound_halloween':'sound_christmas']=!!next.sound;
   }
   this.state=next;save(next);
   if(prev.start!==next.start||prev.end!==next.end){try{localStorage.removeItem(PLAN)}catch{}}
   if(prev.season!==next.season || (prev.enabled&&!next.enabled))this.stop();
   this.silenceLegacyChristmas();this.schedule();this.changed();
   if(prev.season!==next.season && next.season==='halloween')void this.ensureMarshmallow().catch(e=>console.warn('[Seasonal] preload',e));
   return true;
 }
 holidayForDate(date=new Date()){
   if(!this.config.seasonal_calendar.enabled)return null;
   for(const id of HOLIDAY_ORDER){
     const holiday=this.config.seasonal_calendar.holidays[id];
     if(holiday.enabled&&inAnnualRange(date,holiday.start,holiday.end))return {id,season:id};
   }
   return null;
 }
 syncCalendar(date=new Date()){
   if(!this.config.seasonal_calendar.enabled){
     if(this.state.season===this.state.manual_season)return false;
     const previous=this.state.season,season=this.state.manual_season;
     this.state={...this.state,season,sound:season==='halloween'?this.state.sound_halloween:this.state.sound_christmas};
     save(this.state);
     if(this.busy)this.stop();
     this.silenceLegacyChristmas();this.changed();
     if(previous!=='halloween'&&season==='halloween')void this.ensureMarshmallow().catch(e=>console.warn('[Seasonal] preload',e));
     return true;
   }
   const manualToday=this.state.manual_date===dayKey(date);
   const match=manualToday?null:this.holidayForDate(date);
   const season=manualToday?this.state.season:(match?match.season:this.state.manual_season);
   if(season===this.state.season)return false;
   const previous=this.state.season;
   this.state={...this.state,season,sound:season==='halloween'?this.state.sound_halloween:this.state.sound_christmas};
   save(this.state);
   if(this.busy)this.stop();
   this.silenceLegacyChristmas();this.changed();
   if(previous!=='halloween'&&season==='halloween')void this.ensureMarshmallow().catch(e=>console.warn('[Seasonal] preload',e));
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
 figureChoice(){
   const saved=storedFigureChoice();
   if(saved)return saved;
   if(this.config.santa_enabled&&this.config.christkind_enabled)return 'both';
   if(this.config.santa_enabled)return 'santa';
   if(this.config.christkind_enabled)return 'christkind';
   return 'none';
 }
 setFigureChoice(choice){
   if(this.config.controls_locked||!FIGURE_MODES.includes(choice))return false;
   if(storedFigureChoice()===choice)return true;
   try{localStorage.setItem(FIGURE_CHOICE_KEY,choice);}catch(e){
     this.error=tr('Auswahl konnte nicht gespeichert werden.','Could not save selection.');this.changed();return false;
   }
   this.figureScheduleAt={santa:null,christkind:null};
   this.pendingFigures.clear();
   if(this.activeFigure&&choice!=='both'&&this.activeFigure!==choice)this.stop();
   this.schedule();this.changed();return true;
 }
 figureConfig(id){
   const c=this.config,santa=id==='santa',choice=this.figureChoice();
   return santa?{
     enabled:choice==='santa'||choice==='both',mode:c.santa_schedule_mode||this.state.mode,
     start:c.santa_schedule_start||this.state.start,end:c.santa_schedule_end||this.state.end,
     interval_minutes:c.santa_interval_minutes||this.state.interval_minutes,
     duration:c.christmas_duration
   }:{
     enabled:choice==='christkind'||choice==='both',mode:c.christkind_schedule_mode,
     start:c.christkind_schedule_start,end:c.christkind_schedule_end,
     interval_minutes:c.christkind_interval_minutes,duration:c.christkind_duration
   };
 }
 calendarAllowsChristmas(date=new Date()){
   if(!this.config.seasonal_calendar.enabled)return true;
   if(this.state.manual_date===dayKey(date))return true;
   return this.holidayForDate(date)?.season==='christmas';
 }
 runPendingFigures(){
   if(this.busy||document.hidden||!this.state.enabled||this.state.season!=='christmas')return;
   const due=['santa','christkind'].filter(id=>this.pendingFigures.has(id) && this.figureConfig(id).enabled);
   if(!due.length){this.pendingFigures.clear();return;}
   const preferred=this.lastFigure==='santa'?'christkind':'santa';
   const next=due.includes(preferred)?preferred:due[0];
   this.pendingFigures.delete(next);
   const cfg=this.figureConfig(next),clock=new Date(),minute=clock.getHours()*60+clock.getMinutes();
   if(minute<mins(cfg.start)||minute>=mins(cfg.end)||!this.calendarAllowsChristmas(clock)){
     this.runPendingFigures();return;
   }
   void this.play(next);
 }
 finishFigure(token){
   if(token!==this.generation)return;
   if(this.finish)clearTimeout(this.finish);
   this.finish=null;
   this.stopChristkind();
   if(this.activeFigure==='santa'&&this.xmas?._stop)this.xmas._stop();
   this.busy=false;this.activeFigure=null;this.changed();
   this.runPendingFigures();
 }
 stopChristkind(){
   if(this.christkindRaf)cancelAnimationFrame(this.christkindRaf);
   this.christkindRaf=0;
   if(this.christkindAudio){this.christkindAudio.pause();this.christkindAudio=null;}
   if(this.christkindMedia?.tagName==='VIDEO'){this.christkindMedia.onended=null;this.christkindMedia.onerror=null;this.christkindMedia.pause();}
   this.christkindMedia=null;
   if(this.christkindStage){this.christkindStage.remove();this.christkindStage=null;}
 }
 async playChristkind(token){
   const c=this.config,ua=navigator.userAgent||'';
   const appleMobile=/iPad|iPhone|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
   const safariDesktop=/Safari/.test(ua)&&!/Chrome|Chromium|Edg|OPR|CriOS/.test(ua);
   const useImage=!!c.christkind_ios_video&&(appleMobile||safariDesktop);
   const stage=document.createElement('div');
   stage.id='frankys-christkind-flight';
   stage.style.cssText='position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:2147483000';
   const media=document.createElement(useImage?'img':'video');
   media.style.cssText='position:absolute;top:0;left:0;width:100%;height:auto;max-width:none;pointer-events:none;will-change:transform';
   media.setAttribute('aria-hidden','true');
   this.christkindStage=stage;this.christkindMedia=media;
   stage.appendChild(media);
   document.body.appendChild(stage);
   const duration=c.christkind_duration;
   const started=performance.now();
   const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
   const render=()=>{
     if(token!==this.generation||this.christkindMedia!==media)return;
     const aspect=(media.videoWidth&&media.videoHeight?media.videoWidth/media.videoHeight:
       media.naturalWidth&&media.naturalHeight?media.naturalWidth/media.naturalHeight:16/9);
     const width=Math.min(innerWidth,innerHeight*aspect)*c.christkind_size/100;
     const t=useImage?(performance.now()-started)/1000:media.currentTime||0;
     const start=-width*.328,center=(innerWidth-width)/2,end=innerWidth-width;
     const shift=start+(center-start)*ease((t-5.15)/1.1)+(end-center)*ease((t-13.4)/1.3);
     media.style.width=width+'px';media.style.transform='translateX('+shift+'px)';
     this.christkindRaf=requestAnimationFrame(render);
   };
   render();
   if(useImage){
     media.src=c.christkind_ios_video;
     media.onerror=()=>{if(token===this.generation){this.error='Christkind iPad WebP konnte nicht geladen werden';this.stop();this.changed();}};
     if(this.state.sound&&c.christkind_sound_enabled&&c.christkind_ios_audio){
       const audio=new Audio(c.christkind_ios_audio);audio.volume=c.christkind_volume;this.christkindAudio=audio;
       try{await audio.play();}catch(error){console.warn('[Seasonal] Christkind iPad audio blocked',error);}
     }
   }else{
     media.playsInline=true;media.setAttribute('playsinline','');
     media.preload='auto';media.loop=false;
     media.muted=!(this.state.sound&&c.christkind_sound_enabled);
     media.volume=c.christkind_volume;
     media.src=c.christkind_video;
     media.onended=()=>this.finishFigure(token);
     media.onerror=()=>{if(token===this.generation){this.error='Christkind WebM konnte nicht abgespielt werden';this.stop();this.changed();}};
     try{await media.play();}
     catch(error){
       if(error.name!=='NotAllowedError'||media.muted)throw error;
       console.warn('[Seasonal] Autoplay with sound blocked; retry muted',error);
       media.muted=true;await media.play();
     }
   }
   if(token!==this.generation)return;
   this.finish=setTimeout(()=>this.finishFigure(token),(duration+1.2)*1000);
 }
 async ensureMarshmallow(){
   if(this.marsh)return this.marsh;
   if(!this.marshPromise){
     window.__FRANKYS_SEASONAL_EMBEDDED__=true;
     this.marshPromise=import('./marshmallow-engine.js?v=0.4.2').then(()=>{
       const engine=window.__frankysSeasonalMarshmallowEngine;
       if(!engine)throw Error('Marshmallow engine not registered');
       this.marsh=engine;
       this.marshConfig();
       return engine;
     }).catch(e=>{this.marshPromise=null;throw e;});
   }
   return this.marshPromise;
 }
 async playImageScene(scene,token){
   const scenes=await import('./seasonal-scenes.mjs?v=0.5.4');
   const url=scenes.getSceneURL(scene,this.config[scene+'_url']);
   if(!url)throw Error(`Scene asset is not available: ${scene}`);
   const response=await fetch(url);
   if(!response.ok)throw Error(`Scene asset unavailable (${response.status}): ${url}`);
   const buffer=await response.arrayBuffer();
   const duration=scenes.webpDuration(buffer);
   if(this.generation!==token)return null;
   const image=document.createElement('img');
   image.alt='';image.setAttribute('aria-hidden','true');
   image.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;z-index:1100;';
   this.imageScene=image;
   this.imageURL=URL.createObjectURL(new Blob([buffer],{type:'image/webp'}));
   const loaded=new Promise((resolve,reject)=>{
     this.imageResolve=resolve;
     image.onload=()=>{this.imageResolve=null;resolve();};
     image.onerror=()=>{this.imageResolve=null;reject(Error(`Could not load seasonal scene: ${url}`));};
   });
   document.body.appendChild(image);
   image.src=this.imageURL;
   await loaded;
   if(this.generation!==token)return null;
   if(this.state.sound && (scene==='st_martin'||scene==='nikolaus')){
     const customSound=scene==='st_martin'?this.config.st_martin_sound_url:this.config.nikolaus_sound_url;
     const soundURL=scenes.getSceneSoundURL(scene,customSound);
     if(soundURL && typeof Audio!=='undefined'){
       const audio=new Audio(soundURL);
       audio.preload='auto';
       audio.volume=scene==='st_martin'?this.config.st_martin_volume:this.config.nikolaus_volume;
       this.sceneAudio=audio;
       try{
         const started=audio.play();
         if(started && typeof started.catch==='function')
           started.catch(error=>console.warn('[Seasonal] Nikolaus audio blocked:',error));
       }catch(error){console.warn('[Seasonal] Nikolaus audio unavailable:',error);}
     }
   }
   return duration;
 }
 stopImageScene(){
   if(this.sceneAudio){this.sceneAudio.pause();this.sceneAudio=null;}
   if(this.imageResolve){this.imageResolve();this.imageResolve=null;}
   if(this.imageScene){this.imageScene.onload=null;this.imageScene.onerror=null;this.imageScene.remove();this.imageScene=null;}
   if(this.imageURL){URL.revokeObjectURL(this.imageURL);this.imageURL=null;}
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
 async play(requestedFigure=null){
   if(this.busy||document.hidden)return false;
   let figure=null;
   if(this.state.season==='christmas'){
     if(requestedFigure==='santa'||requestedFigure==='christkind')figure=requestedFigure;
     else{
       const enabled=['santa','christkind'].filter(id=>this.figureConfig(id).enabled);
       const preferred=this.lastFigure==='santa'?'christkind':'santa';
       figure=enabled.includes(preferred)?preferred:enabled[0];
     }
     if(!figure){
       this.error=tr('Weihnachtsmann und Christkind sind beide deaktiviert.','Both Christmas figures are disabled.');
       this.changed();return false;
     }
   }
   this.generation++;
   if(this.finish)clearTimeout(this.finish);
   this.finish=null;
   this.stopImageScene();this.stopChristkind();
   if(this.xmas?._stop)this.xmas._stop();
   if(this.marsh?.stop)this.marsh.stop();
   const token=this.generation;
   this.busy=true;this.activeFigure=figure;this.error='';
   if(figure)this.lastFigure=figure;
   this.changed();
   try{
     if(this.state.season==='christmas'){
       if(figure==='santa'){
         if(!customElements.get('frankys-christmas-renderer'))throw Error('Christmas renderer is missing');
         this.silenceLegacyChristmas();
         this.xmas._state.sound=this.state.sound&&this.config.santa_sound_enabled;
         this.xmas._unlockAudio?.();
         if(this.xmas._play()===false)throw Error('Christmas playback could not start');
         this.finish=setTimeout(()=>this.finishFigure(token),(this.config.christmas_duration+.7)*1000);
       }else await this.playChristkind(token);
     }else if(this.state.season==='st_martin'||this.state.season==='nikolaus'){
       const duration=await this.playImageScene(this.state.season,token);
       if(this.generation!==token)return;
       this.finish=setTimeout(()=>{this.stopImageScene();this.busy=false;this.changed();},duration);
     }else{
       const m=await this.ensureMarshmallow();
       if(this.generation!==token||this.state.season!=='halloween')return;
       this.marshConfig();
       await m.play(false);
       if(this.generation!==token){m.stop();return;}
       this.finish=setTimeout(()=>{this.busy=false;this.changed();},15500);
     }
     return true;
   }catch(e){
     if(this.generation!==token)return false;
     this.stopChristkind();this.stopImageScene();this.busy=false;this.activeFigure=null;
     console.error('[Seasonal]',e);
     this.error=tr('Animationsdatei konnte nicht abgespielt werden: ','Animation could not be played: ')+String(e.message||e);
     this.changed();this.runPendingFigures();return false;
   }
 }
 stop(){
   this.generation++;
   if(this.finish)clearTimeout(this.finish);
   this.finish=null;
   this.pendingFigures.clear();
   this.stopChristkind();
   this.stopImageScene();
   if(this.xmas?._stop)this.xmas._stop();
   if(this.marsh?.stop)this.marsh.stop();
   this.busy=false;this.activeFigure=null;this.changed();
 }
 schedule(){
   if(this.timer!==null)clearTimeout(this.timer);
   this.timer=null;
   if(document.hidden)return;
   const now=new Date(),nowMs=now.getTime();
   const calendarAt=this.config.seasonal_calendar.enabled?
     new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1,0).getTime():null;
   let appearanceAt=null;
   const figureTimes=[];
   if(this.state.season==='christmas'){
     for(const id of ['santa','christkind']){
       const settings=this.figureConfig(id);
       const active=this.state.enabled&&settings.enabled&&this.calendarAllowsChristmas(now);
       if(!active){this.figureScheduleAt[id]=null;continue;}
       const signature=JSON.stringify(settings),key=PLAN+'/'+id;
       if(this.figureScheduleSignature[id]!==signature){
         this.figureScheduleSignature[id]=signature;
         this.figureScheduleAt[id]=null;
         try{localStorage.removeItem(key);}catch(e){}
       }
       if(this.figureScheduleAt[id]===null||this.figureScheduleAt[id]<nowMs-500){
         this.figureScheduleAt[id]=scheduled(now,settings,this.config,key,settings.duration);
       }
       if(this.figureScheduleAt[id]!==null)figureTimes.push(this.figureScheduleAt[id]);
     }
   }else{
     this.pendingFigures.clear();
     if(this.state.enabled&&!(this.state.season==='halloween'&&!this.config.halloween_overlay))
       appearanceAt=scheduled(now,this.state,this.config);
   }
   const candidates=[appearanceAt,calendarAt,...figureTimes].filter(x=>x!==null&&Number.isFinite(x));
   if(!candidates.length)return;
   const when=Math.min(...candidates);
   this.timer=setTimeout(()=>{
     this.timer=null;
     const dt=new Date(),dtMs=dt.getTime();
     if(this.config.seasonal_calendar.enabled)this.syncCalendar(dt);
     if(this.state.season==='christmas'){
       for(const id of ['santa','christkind']){
         const due=this.figureScheduleAt[id];
         if(due===null||dtMs+100<due)continue;
         this.figureScheduleAt[id]=null;
         const settings=this.figureConfig(id),minute=dt.getHours()*60+dt.getMinutes();
         if(this.state.enabled&&settings.enabled&&this.calendarAllowsChristmas(dt)&&
            minute>=mins(settings.start)&&minute<mins(settings.end))
           this.pendingFigures.add(id);
       }
     }else{
       const clock=String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0');
       if(appearanceAt!==null&&dtMs>=appearanceAt&&this.state.enabled&&!document.hidden&&
          mins(clock)>=mins(this.state.start)&&mins(clock)<mins(this.state.end)&&
          (!this.config.seasonal_calendar.enabled||this.holidayForDate(dt))&&
          !(this.state.season==='halloween'&&!this.config.halloween_overlay))void this.play();
     }
     this.schedule();
     this.runPendingFigures();
   },Math.min(2147483647,Math.max(100,when-nowMs)));
 }

}
const ctrl=window.__frankysSeasonalController || (window.__frankysSeasonalController=new SeasonalController());
const style=`
:host([hidden]){display:none!important}
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

.compact > .season-picker,.compact > .buttons{display:none}
.options-trigger{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;margin-top:2px;min-height:42px;font-weight:600;background:transparent}
.options-trigger .caret{font-size:16px;transition:transform .15s ease}
.options-trigger[aria-expanded="true"] .caret{transform:rotate(180deg)}
.options-panel{padding:2px 0 0}
.options-panel[hidden]{display:none}
.options-trigger[aria-expanded="true"]{border-color:var(--fs-seasonal-accent)}
.calendar-details{margin:12px 0;border:1px solid var(--fs-seasonal-border,#80909e);border-radius:10px;padding:10px}
.calendar-details summary{cursor:pointer;font-weight:600;min-height:28px;list-style-position:inside}
.calendar-master{display:flex;align-items:center;gap:10px;min-height:44px;padding:8px 0}
.calendar-master input,.calendar-holiday-title input{width:19px;height:19px;accent-color:var(--fs-seasonal-accent)}
.calendar-holidays{display:grid;gap:10px}
.calendar-holiday{border:1px solid var(--fs-seasonal-border,#80909e);border-radius:10px;padding:10px}
.calendar-holiday-title{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-weight:600}
.calendar-dates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.calendar-dates label{display:grid;gap:4px;font-size:12px}
.calendar-dates input{box-sizing:border-box;width:100%;min-width:0;min-height:42px;padding:8px;color:inherit;background:var(--fs-seasonal-background,#1b2836);border:1px solid var(--fs-seasonal-border,#80909e);border-radius:8px;font:inherit}
.calendar-dates input[aria-invalid="true"]{border-color:var(--error-color,#ff8080)}
.calendar-message{font-size:12px;opacity:.8;margin-top:10px}
.figure-tests{padding:10px 0 4px;border-top:1px solid var(--fs-seasonal-border);margin-top:12px}
.figure-tests[hidden]{display:none}
.figure-buttons{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:8px}
.figure-tests .figure-hint{font-size:12px;opacity:.78}
.figure-picker{margin:10px 0 2px;padding:9px;border:1px solid var(--fs-seasonal-border);border-radius:10px}
.figure-picker[hidden]{display:none}
.figure-picker-title{font-size:12px;font-weight:650;margin:0 0 7px}
.figure-picker-buttons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.figure-picker-buttons button{font-size:12px;line-height:1.25;min-width:0;white-space:normal;overflow-wrap:break-word;padding:8px 4px;min-height:50px}
.figure-picker-buttons button[aria-pressed="true"]{border:2px solid var(--fs-seasonal-accent);font-weight:700;box-shadow:inset 0 0 0 1px var(--fs-seasonal-accent)}
.figure-picker-note{font-size:11px;opacity:.7;margin:6px 0 0}
`;
class FrankysSeasonalCard extends HTMLElement{
 get preview(){return this._preview;}
 set preview(value){
   const next=Boolean(value);
   if(this._preview===next)return;
   this._preview=next;
   if(this.config)this.render(true);
 }
 set editMode(value){this.preview=value;}
 syncDisplayMode(){
   if(!this.config)return;
   const hide=this.config.display_mode==='hidden'&&!this._preview;
   if(Boolean(this.hidden)===hide)return;
   this.hidden=hide;
   if(typeof this.dispatchEvent==='function')this.dispatchEvent(new Event('card-visibility-changed',{bubbles:true,composed:true}));
 }
 constructor(){super();this.attachShadow({mode:'open'});this._listener=()=>this.update();this._language='';this.connectedWhileHidden=true;this._preview=false;}
 set hass(h){
   const lang=h?.locale?.language||h?.language||navigator.language;
   window.__frankysHassLang=lang;
   const changed=this._language!==lang;
   this._language=lang;
   this.render(!!changed);
 }
 setConfig(raw){this.config=withCardCalendar(raw);ctrl.configure(this.config);this.render(true);}
 connectedCallback(){window.addEventListener('frankys-seasonal-changed',this._listener);this.render();}
 disconnectedCallback(){window.removeEventListener('frankys-seasonal-changed',this._listener);}
 getCardSize(){return 3;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 static getStubConfig(){return {type:'custom:frankys-seasonal-card'};}
 static getConfigElement(){return document.createElement('frankys-seasonal-card-editor');}
 render(force=false){
   if(!this.config)return;
   this.syncDisplayMode();
   if(this.config.display_mode==='hidden'&&this._preview){
     this.shadowRoot.innerHTML=`<style>:host{display:block;color:var(--primary-text-color,#edf6ff)}ha-card{display:block;padding:16px;border:2px dashed var(--primary-color,#08c9f0);border-radius:12px;background:var(--ha-card-background,var(--card-background-color,#1b2836))}strong{display:block;margin-bottom:6px}</style><ha-card id="hide-placeholder"><strong>${tr('Frankys Seasonal Fun Card – versteckt','Franky’s Seasonal Fun Card – hidden')}</strong><div>${tr('Nur beim Bearbeiten sichtbar. Die Animationen und Zeitpläne laufen weiter.','Visible while editing only. Animations and schedules continue.')}</div></ha-card>`;
     return;
   }
   if(!force && this.shadowRoot.getElementById('season')){this.update();return;}
   const preview=this.stateNeedsPreview();
   const optionsOpen=this.shadowRoot.getElementById('options')?.getAttribute('aria-expanded')==='true';
   const calendarOpen=this.shadowRoot.getElementById('calendar-details')?.open===true;
   const calendarLabels={halloween:'Halloween',st_martin:'St. Martin',nikolaus:tr('Nikolaus','St. Nicholas'),christmas:tr('Weihnachten','Christmas')};
   const calendarRows=HOLIDAY_ORDER.map(id=>{
     const holiday=this.config.seasonal_calendar.holidays[id];
     const format=value=>value.slice(3)+'.'+value.slice(0,2);
     return `<section class="calendar-holiday">
       <label class="calendar-holiday-title"><input type="checkbox" data-calendar-holiday="${id}" data-field="enabled" ${holiday.enabled?'checked':''}><span>${calendarLabels[id]}</span></label>
       <div class="calendar-dates">
         <label>${tr('Von (TT.MM)','From (DD.MM)')}<input type="text" maxlength="5" inputmode="numeric" placeholder="TT.MM" data-calendar-holiday="${id}" data-field="start" value="${format(holiday.start)}"></label>
         <label>${tr('Bis (TT.MM)','Until (DD.MM)')}<input type="text" maxlength="5" inputmode="numeric" placeholder="TT.MM" data-calendar-holiday="${id}" data-field="end" value="${format(holiday.end)}"></label>
       </div></section>`;
   }).join('');
   this.shadowRoot.innerHTML=`<style>${style}</style><style id="seasonal-custom-style"></style><ha-card class="${this.config.display_mode==='compact'?'compact':''}">
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
         <button type="button" data-season="st_martin">St. Martin</button>
         <button type="button" data-season="nikolaus">${tr('Nikolaus','St. Nicholas')}</button>
       </div>
     </div>
     <div class="buttons"><button type="button" id="toggle"></button><button type="button" id="sound"></button><button type="button" id="test"></button><button type="button" id="stop"></button></div>
     <button type="button" id="options" class="options-trigger" aria-expanded="${optionsOpen}" aria-controls="options-panel"><span>${tr('Optionen','Options')}</span><span class="caret" aria-hidden="true">⌄</span></button>
     <div id="options-panel" class="options-panel" ${optionsOpen?'':'hidden'}>
     <div id="figure-picker" class="figure-picker" hidden><div class="figure-picker-title">${tr('Wer soll auftreten?','Who should appear?')}</div><div class="figure-picker-buttons" role="group" aria-label="${tr('Weihnachtsfiguren auswählen','Choose Christmas characters')}"><button type="button" data-figure-choice="santa">🎅 ${tr('Weihnachtsmann','Santa')}</button><button type="button" data-figure-choice="christkind">👼 ${tr('Christkind','Christ Child')}</button><button type="button" data-figure-choice="both">🔀 ${tr('Beide','Both')}</button></div><div class="figure-picker-note">${tr('Gilt in diesem Browser; bei „Beide“ abwechselnd.','Saved in this browser; Both alternates.')}</div></div>
     <div id="figure-controls" class="figure-tests" hidden><strong>${tr('Weihnachtsauftritte','Christmas appearances')}</strong><div id="figure-hint" class="figure-hint"></div><div class="figure-buttons"><button type="button" id="test-santa">🎅 ${tr('Weihnachtsmann testen','Test Santa')}</button><button type="button" id="test-christkind">👼 ${tr('Christkind testen','Test Christ Child')}</button></div></div>
     <div class="line"><label for="mode">${tr('Auftrittszeiten','Appearance schedule')}</label><select id="mode">
       <option value="daily">${tr('1–10× täglich (Zufall)','1–10 times daily')}</option>
       <option value="hourly">${tr('Jede volle Stunde','Every full hour')}</option>
       <option value="1-2">1–2 ${tr('Minuten','minutes')}</option><option value="3-8">3–8 ${tr('Minuten','minutes')}</option>
       <option value="5-10">5–10 ${tr('Minuten','minutes')}</option><option value="10-20">10–20 ${tr('Minuten','minutes')}</option>
       <option value="custom">${tr('Eigenes Intervall','Custom interval')}</option></select>
     </div>
     <div id="custom-line" class="line custom-line" hidden><label for="custom_minutes">${tr('Eigenes Intervall','Custom interval')}</label><input type="number" id="custom_minutes" min="15" max="1440" step="1" inputmode="numeric"><span>${tr('Minuten','minutes')}</span></div>
     <div class="line"><label for="from">${tr('Von','From')}</label><input id="from" type="time"><label for="to">${tr('Bis','To')}</label><input id="to" type="time"></div>
     <details id="calendar-details" class="calendar-details" ${calendarOpen?'open':''}>
       <summary>${tr('Jahreskalender','Annual calendar')}</summary>
       <label class="calendar-master"><input type="checkbox" id="calendar-enabled" ${this.config.seasonal_calendar.enabled?'checked':''}><span>${tr('Automatische Feiertagsauswahl','Automatic holiday selection')}</span></label>
       <div class="calendar-holidays">${calendarRows}</div>
       <div id="calendar-message" class="calendar-message">${tr('Änderungen werden in diesem Browser gespeichert.','Changes are saved in this browser.')}</div>
     </details>
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
   this.shadowRoot.querySelectorAll('[data-figure-choice]').forEach(button=>button.onclick=()=>ctrl.setFigureChoice(button.dataset.figureChoice));
   $('test-santa').onclick=()=>void ctrl.play('santa');
   $('test-christkind').onclick=()=>void ctrl.play('christkind');
   $('stop').onclick=()=>ctrl.stop();
   $('options').onclick=()=>{
     const panel=$('options-panel'),open=panel.hidden;
     panel.hidden=!open;
     $('options').setAttribute('aria-expanded',String(open));
   };
   const updateCalendar=element=>{
     const current=ctrl.config.seasonal_calendar;
     let next;
     if(element.id==='calendar-enabled')next={...current,enabled:element.checked};
     else{
       const {calendarHoliday:id,field}=element.dataset;
       if(!HOLIDAY_ORDER.includes(id)||!['enabled','start','end'].includes(field))return;
       let value=element.checked;
       if(field!=='enabled'){
         const raw=element.value.trim();
         const iso=/^\d{2}\.\d{2}$/.test(raw)?raw.slice(3)+'-'+raw.slice(0,2):'';
         if(!iso||cleanAnnualDate(iso,'invalid')!==iso){
           element.setAttribute('aria-invalid','true');
           $('calendar-message').textContent=tr('Ungültiges Datum (TT.MM).','Invalid date (DD.MM).');
           return;
         }
         element.removeAttribute('aria-invalid');
         value=iso;
       }
       next={...current,holidays:{...current.holidays,[id]:{...current.holidays[id],[field]:value}}};
     }
     const saved=this.saveCalendarFromCard(next);
     $('calendar-message').textContent=saved
       ?tr('Im Browser gespeichert.','Saved in this browser.')
       :tr('Speichern fehlgeschlagen.','Could not save.');
   };
   $('calendar-enabled').onchange=e=>updateCalendar(e.currentTarget);
   this.shadowRoot.querySelectorAll('[data-calendar-holiday]').forEach(el=>el.onchange=e=>updateCalendar(e.currentTarget));
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
 saveCalendarFromCard(calendar){
   if(this.config?.controls_locked)return false;
   const cleaned={enabled:bool(calendar.enabled,false),holidays:normalizeHolidays(calendar.holidays)};
   try{localStorage.setItem(CALENDAR_OVERRIDE,JSON.stringify(cleaned));}
   catch(e){console.warn('[Seasonal] Could not persist annual calendar',e);return false;}
   this.config=configOf({...this.config,seasonal_calendar:cleaned});
   ctrl.configure(this.config);
   return true;
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
   const s=ctrl.state,scene=({christmas:tr('Weihnachten','Christmas'),halloween:'Halloween',st_martin:'St. Martin',nikolaus:tr('Nikolaus','St. Nicholas')})[s.season];
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
   $('figure-controls').hidden=s.season!=='christmas';
   $('figure-picker').hidden=s.season!=='christmas';
   const choice=ctrl.figureChoice();
   this.shadowRoot.querySelectorAll('[data-figure-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.figureChoice===choice)));
   $('figure-hint').textContent=(ctrl.figureConfig('santa').enabled?tr('Weihnachtsmann aktiv','Santa enabled'):tr('Weihnachtsmann aus','Santa disabled'))+' · '+(ctrl.figureConfig('christkind').enabled?tr('Christkind aktiv','Christ Child enabled'):tr('Christkind aus','Christ Child disabled'));
   $('sound').setAttribute('aria-pressed',String(s.sound));
   for(const b of this.shadowRoot.querySelectorAll('[data-season]'))b.setAttribute('aria-current',String(b.dataset.season===s.season));
   if(this.shadowRoot.activeElement!==$('mode'))$('mode').value=s.mode;
   if(this.shadowRoot.activeElement!==$('from'))$('from').value=s.start;
   if(this.shadowRoot.activeElement!==$('to'))$('to').value=s.end;
   $('custom-line').hidden=s.mode!=='custom';
   if(this.shadowRoot.activeElement!==$('custom_minutes'))$('custom_minutes').value=String(s.interval_minutes);
   const calendar=ctrl.config.seasonal_calendar;
   if($('calendar-enabled'))$('calendar-enabled').checked=calendar.enabled;
   for(const field of this.shadowRoot.querySelectorAll('[data-calendar-holiday]')){
     if(field===this.shadowRoot.activeElement)continue;
     const entry=calendar.holidays[field.dataset.calendarHoliday];
     if(!entry)continue;
     field[field.type==='checkbox'?'checked':'value']=field.type==='checkbox'
       ?entry.enabled:entry[field.dataset.field].slice(3)+'.'+entry[field.dataset.field].slice(0,2);
   }
   const locked=!!this.config.controls_locked;
   this.shadowRoot.querySelectorAll('button,input,select').forEach(el=>{el.disabled=locked&&el.id!=='options';});
   if(!locked){$('test-santa').disabled=ctrl.busy;$('test-christkind').disabled=ctrl.busy;}
   const n=this.shadowRoot.querySelector('.note');
   n.textContent=ctrl.error||(locked?tr('Kindersicherung aktiv – Bedienung gesperrt. Kalender und Automatik laufen weiter.','Child lock active – controls disabled, calendar and schedule continue.'):tr('Die manuelle Auswahl bleibt bis zum nächsten Kalendertag bestehen. Der Jahreskalender ist direkt unter Optionen einstellbar.','Manual selection remains until the next calendar day. The annual calendar can be configured under Options.'));
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
   const c={...this.config,santa_schedule_mode:this.config.santa_schedule_mode||ctrl.state.mode,santa_schedule_start:this.config.santa_schedule_start||ctrl.state.start,santa_schedule_end:this.config.santa_schedule_end||ctrl.state.end,santa_interval_minutes:this.config.santa_interval_minutes||ctrl.state.interval_minutes},html=[];
   const expanded=[...this.shadowRoot.querySelectorAll('details')].flatMap((node,i)=>node.open?[i]:[]);
   const choiceLabel=(key,value)=>{
     if(key==='display_mode')return ({normal:tr('Normal – gesamte Karte','Normal – full card'),compact:tr('Kompakt – Status und Optionen','Compact – status and options'),hidden:tr('Versteckt – nur Animationen','Hidden – animations only')})[value]||String(value);
     if(key==='season')return ({christmas:tr('Weihnachten','Christmas'),halloween:'Halloween',st_martin:'St. Martin',nikolaus:tr('Nikolaus','St. Nicholas')})[value]||String(value);
     if(key==='schedule_mode'||key==='santa_schedule_mode'||key==='christkind_schedule_mode')return ({daily:tr('1–10× täglich','1–10 times daily'),hourly:tr('Jede volle Stunde','Every full hour'),'1-2':tr('1–2 Minuten','1–2 minutes'),'3-8':tr('3–8 Minuten','3–8 minutes'),'5-10':tr('5–10 Minuten','5–10 minutes'),'10-20':tr('10–20 Minuten','10–20 minutes'),custom:tr('Eigenes Intervall','Custom interval')})[value]||String(value);
     if(['controls_locked','santa_enabled','santa_sound_enabled','christkind_enabled','christkind_sound_enabled'].includes(key))return String(value)==='true'?tr('Ein','On'):tr('Aus','Off');
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
   select('controls_locked',tr('Kindersicherung (Kartenbedienung sperren)','Child lock (disable card controls)'),[false,true]);
   select('display_mode',tr('Darstellung der Karte','Card display mode'),['normal','compact','hidden']);
   html.push(`<small>${tr('Im Modus „Versteckt“ belegt die Karte keinen Platz im Dashboard. Beim Bearbeiten erscheint ein Platzhalter, damit sie weiterhin konfiguriert werden kann.','Hidden mode uses no dashboard space. A placeholder appears when editing so the card remains configurable.')}</small>`);
   select('season',tr('Saison','Season'),SCENES);
   select('schedule_mode',tr('Zeitplan','Schedule'),SCHEDULE);
   str('schedule_start',tr('Von (HH:MM)','From (HH:MM)'));str('schedule_end',tr('Bis (HH:MM)','Until (HH:MM)'));
   num('interval_minutes',tr('Eigenes Intervall (Minuten)','Custom interval (minutes)'),15,1440,1);
   html.push(`<details><summary>${tr('Optionaler Jahreskalender','Optional annual calendar')}</summary>`);
   html.push(`<small>${tr('Die Konfiguration wird mit der HA-Karte gespeichert. Bei überlappenden Bereichen gilt die Reihenfolge Halloween, St. Martin, Nikolaus, Weihnachten. Jahresbereiche können über den Jahreswechsel laufen.','This configuration is saved with the HA card. For overlapping ranges the order is Halloween, St. Martin, St. Nicholas, Christmas. Annual ranges may cross New Year.')}</small>`);
   html.push(`<label>${tr('Automatische Feiertagsauswahl','Automatic holiday selection')}<select data-key="seasonal_calendar_enabled"><option value="true" ${c.seasonal_calendar.enabled?'selected':''}>${tr('Ein','On')}</option><option value="false" ${!c.seasonal_calendar.enabled?'selected':''}>${tr('Aus','Off')}</option></select></label>`);
   const holidayLabels={halloween:'Halloween',st_martin:'St. Martin',nikolaus:tr('Nikolaus','St. Nicholas'),christmas:tr('Weihnachten','Christmas')};
   for(const id of HOLIDAY_ORDER){
     const holiday=c.seasonal_calendar.holidays[id];
     const safe=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
     html.push(`<fieldset><legend>${holidayLabels[id]}</legend><label>${tr('Aktiv','Enabled')}<input data-holiday="${id}" data-field="enabled" type="checkbox" ${holiday.enabled?'checked':''}></label>`);
     const display=value=>value.slice(3)+'.'+value.slice(0,2);
     html.push(`<label>${tr('Von (TT.MM)','From (DD.MM)')}<input data-holiday="${id}" data-field="start" type="text" inputmode="numeric" placeholder="TT.MM" value="${safe(display(holiday.start))}"></label>`);
     html.push(`<label>${tr('Bis (TT.MM)','Until (DD.MM)')}<input data-holiday="${id}" data-field="end" type="text" inputmode="numeric" placeholder="TT.MM" value="${safe(display(holiday.end))}"></label></fieldset>`);
   }
   html.push('</details>');
   str('st_martin_url',tr('St.-Martin-WebP-Pfad (optional)','St. Martin WebP path (optional)'));
   str('st_martin_sound_url',tr('St.-Martin-Tonspur (optional)','St. Martin soundtrack (optional)'));
   num('st_martin_volume',tr('St.-Martin-Lautstärke (0–1)','St. Martin volume (0–1)'),0,1,.05);
   str('nikolaus_url',tr('Nikolaus-WebP-Pfad (optional)','St. Nicholas WebP path (optional)'));
   str('nikolaus_sound_url',tr('Nikolaus-Tonspur (optional)','St. Nicholas soundtrack (optional)'));
   num('nikolaus_volume',tr('Nikolaus-Lautstärke (0–1)','St. Nicholas volume (0–1)'),0,1,.05);
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
   html.push('<h3>'+tr('Weihnachten – getrennte Figuren','Christmas – independent figures')+'</h3>');
   html.push('<small>'+tr('Beide Figuren können aktiv sein. Ihre Auftritte werden unabhängig geplant und niemals gleichzeitig abgespielt. Der Basiszeitplan wird für den Weihnachtsmann übernommen, bis eigene Werte gespeichert werden.','Both figures may be active, but they never play simultaneously. Santa inherits the legacy schedule until separate settings are saved.')+'</small>');
   html.push('<details><summary>'+tr('🎅 Weihnachtsmann','🎅 Santa')+'</summary>');
   select('santa_enabled',tr('Weihnachtsmann aktiv','Enable Santa'),[true,false]);
   select('santa_sound_enabled',tr('Ton für Weihnachtsmann','Santa sound'),[true,false]);
   select('santa_schedule_mode',tr('Häufigkeit','Frequency'),SCHEDULE);
   str('santa_schedule_start',tr('Von (HH:MM)','From (HH:MM)'));
   str('santa_schedule_end',tr('Bis (HH:MM)','Until (HH:MM)'));
   num('santa_interval_minutes',tr('Eigenes Intervall (Minuten)','Custom interval (minutes)'),15,1440,1);
   num('christmas_duration',tr('Flugdauer (Sekunden)','Flight seconds'),4,30,1);
   num('christmas_size',tr('Schlittengröße (%)','Sleigh size (%)'),20,95,5);
   num('christmas_volume',tr('Santa-Lautstärke','Santa volume'),0,1,.05);
   num('bells_volume',tr('Glöckchen-Lautstärke','Bells volume'),0,1,.05);
   html.push('<details><summary>'+tr('Eigene Weihnachtsmedien','Custom Christmas media')+'</summary>');
   str('christmas_video','WebM URL');str('christmas_ios_video','iPad WebP URL');
   str('christmas_sound','Santa MP3 URL');str('christmas_bells',tr('Glocken MP3 URL','Bells MP3 URL'));
   str('christmas_fallback',tr('Ersatzbild-URL','Fallback image URL'));
   html.push('</details></details>');
   html.push('<details><summary>'+tr('👼 Christkind','👼 Christ Child')+'</summary>');
   select('christkind_enabled',tr('Christkind aktiv','Enable Christ Child'),[false,true]);
   select('christkind_sound_enabled',tr('Ton für Christkind','Christ Child sound'),[true,false]);
   select('christkind_schedule_mode',tr('Häufigkeit','Frequency'),SCHEDULE);
   str('christkind_schedule_start',tr('Von (HH:MM)','From (HH:MM)'));
   str('christkind_schedule_end',tr('Bis (HH:MM)','Until (HH:MM)'));
   num('christkind_interval_minutes',tr('Eigenes Intervall (Minuten)','Custom interval (minutes)'),15,1440,1);
   num('christkind_duration',tr('Auftrittsdauer (Sekunden)','Appearance seconds'),8,30,.5);
   num('christkind_size',tr('Animationsgröße (%)','Animation size (%)'),40,140,5);
   num('christkind_volume',tr('Lautstärke','Volume'),0,1,.05);
   str('christkind_video',tr('Transparentes WebM','Transparent WebM'));
   html.push('<details><summary>'+tr('iPad/Safari-Ersatzmedien (optional)','iPad/Safari fallback (optional)')+'</summary>');
   str('christkind_ios_video',tr('Transparentes animiertes WebP','Transparent animated WebP'));
   str('christkind_ios_audio',tr('Passende Tonspur (MP3)','Matching soundtrack (MP3)'));
   html.push('</details></details>');
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
     if(key==='seasonal_calendar_enabled')next.seasonal_calendar={...this.config.seasonal_calendar,enabled:el.value==='true'};
     else next[key]=el.type==='number'?Number(el.value):(['halloween_overlay','halloween_transparent','controls_locked','santa_enabled','santa_sound_enabled','christkind_enabled','christkind_sound_enabled'].includes(key)?el.value==='true':el.value);
     const clean=configOf(next);
     if(['schedule_start','schedule_end','santa_schedule_start','santa_schedule_end','christkind_schedule_start','christkind_schedule_end'].includes(key)){
       const prefix=key.startsWith('santa_')?'santa_':key.startsWith('christkind_')?'christkind_':'';
       const start=prefix==='santa_'?(clean.santa_schedule_start||ctrl.state.start):clean[prefix+'schedule_start'];
       const end=prefix==='santa_'?(clean.santa_schedule_end||ctrl.state.end):clean[prefix+'schedule_end'];
       if(mins(start)>=mins(end)||clean[key]!==next[key]){this.render();return;}
     }
     this.config=clean;
     this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:clean},bubbles:true,composed:true}));
   }});
   this.shadowRoot.querySelectorAll('[data-holiday]').forEach(el=>{el.onchange=()=>{
     const {holiday,field}=el.dataset,entry=this.config.seasonal_calendar.holidays[holiday];
     const value=field==='enabled'?el.checked:/^\d{2}\.\d{2}$/.test(el.value)?el.value.slice(3)+'-'+el.value.slice(0,2):el.value;
     const next={...this.config,seasonal_calendar:{...this.config.seasonal_calendar,holidays:{
       ...this.config.seasonal_calendar.holidays,[holiday]:{...entry,[field]:value}
     }}};
     const clean=configOf(next);
     if(field!=='enabled'&&clean.seasonal_calendar.holidays[holiday][field]!==value){this.render();return;}
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
