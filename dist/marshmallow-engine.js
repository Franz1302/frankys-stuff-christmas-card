/* Franky's Marshmallow Pop – HA overlay v0.2.2
 * Original 9.97 s Meshy clip and pop effect retained from working standalone v1.
 * Deliberately independent of the existing Christmas Card.
 */
const VERSION = '0.2.2';
const STORAGE_KEY = 'frankys-seasonal-marshmallow/config/v1';
const STATE_KEY = 'frankys-seasonal-marshmallow/schedule/v2';
const PLAN_KEY = 'frankys-seasonal-marshmallow/daily-plan/v2';
const MODULE_URL = new URL(import.meta.url);
const MODEL_URL = new URL('./assets/marshmallow-animated.glb', MODULE_URL).href;
const AUDIO_URLS = Object.freeze({laugh:new URL('./assets/laugh.mp3?v=2',MODULE_URL).href, pop:new URL('./assets/balloon-pop.mp3',MODULE_URL).href, bubbles:new URL('./assets/bubble-pops.mp3',MODULE_URL).href});
const DEFAULTS = Object.freeze({
  type: 'custom:frankys-seasonal-marshmallow-internal',
  fps: 30,
  count: 40,
  sound: true,
  transparent: true,
  overlay: true,
  auto_play: false,
  interval_minutes: 60,
  direction: 'left',
  figure_size: 1,
  render_scale: 0.75,
  schedule_mode: 'daily',
  schedule_start: '09:00',
  schedule_end: '22:00',
  sound_volume: 0.85,
  laugh_volume: 1,
  pop_volume: 1,
  bubbles_volume: 1,
  laugh_url: '',
  pop_url: '',
  bubbles_url: '',
});
const CHOICES = {
  fps: [24,30,45,60], count: [24,40,60], direction: ['left','right'],
  render_scale: [0.5,0.75,1],
};
const SCHEDULE_MODES = ['daily','hourly','1-2','3-8','5-10','10-20','custom'];
const CLOCK_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const minutesOf = t => Number(t.slice(0,2))*60+Number(t.slice(3,5));
const clamp = (v,min,max,defaultValue) => Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):defaultValue;
const isGerman = () => /^de(?:-|$)/i.test((window.__frankysHassLang||navigator.language||'de'));
const tr = (de,en) => isGerman()?de:en;
function normalize(raw = {}) {
  const c = { ...DEFAULTS, ...raw };
  for(const k of Object.keys(CHOICES)) if(!CHOICES[k].includes(Number(c[k]) || c[k])) c[k] = DEFAULTS[k];
  for(const k of ['fps','count','render_scale']) c[k] = Number(c[k]);
  c.direction = c.direction === 'right' ? 'right' : 'left';
  c.figure_size = Math.max(0.6, Math.min(1.6, Number(c.figure_size) || 1));
  c.interval_minutes = clamp(c.interval_minutes,15,1440,60);
  c.schedule_mode = SCHEDULE_MODES.includes(c.schedule_mode)?c.schedule_mode:'daily';
  c.schedule_start = CLOCK_RE.test(c.schedule_start)?c.schedule_start:'09:00';
  c.schedule_end = CLOCK_RE.test(c.schedule_end)?c.schedule_end:'22:00';
  if(minutesOf(c.schedule_start)>=minutesOf(c.schedule_end)){c.schedule_start='09:00';c.schedule_end='22:00';}
  for(const key of ['sound_volume','laugh_volume','pop_volume','bubbles_volume']) c[key]=clamp(c[key],0,1,DEFAULTS[key]);
  for(const key of ['laugh_url','pop_url','bubbles_url']){
    if(typeof c[key]!=='string' || /^(?:data:|javascript:|\/\/)/i.test(c[key].trim())) c[key]='';
    else c[key]=c[key].trim();
  }
  for(const k of ['sound','transparent','overlay','auto_play']) c[k] = c[k] === true || c[k] === 'true';
  return c;
}
function loadSaved() {
  try {const v = localStorage.getItem(STORAGE_KEY); return v ? normalize(JSON.parse(v)) : normalize();}
  catch { return normalize(); }
}
function persist(settings) { try {localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));} catch {} }
const smooth = x => {const t=Math.max(0,Math.min(1,x));return t*t*(3-2*t);};


/* Built-in licensed-source sounds, normalized to approximately -19.5 LUFS.
 * Uses the browser's own Web Audio API; no Christmas files or libraries.
 * AudioContext is created during a real user gesture to respect autoplay rules.
 */
class MarshmallowAudio {
  constructor(){this.ctx=null;this.buffers=new Map();this.inflight=new Map();this.voices=new Set();this.master=null;this.generation=0;this.laughVoice=null;}
  get active(){return !!this.ctx && this.ctx.state==='running';}
  prepare(){
    const Context=window.AudioContext||window.webkitAudioContext;
    if(!Context)return;
    if(!this.ctx){
      try{
        this.ctx=new Context();
        const limiter=this.ctx.createDynamicsCompressor();
        limiter.threshold.value=-9;limiter.knee.value=2;limiter.ratio.value=10;
        limiter.attack.value=.003;limiter.release.value=.12;
        this.master=this.ctx.createGain();this.master.gain.value=.85;
        this.master.connect(limiter);limiter.connect(this.ctx.destination);
      }catch(e){console.warn('[Marshmallow Audio] WebAudio unavailable',e);return;}
    }
    if(this.ctx.state!=='running') this.ctx.resume().catch(()=>{});
    this.preload();
  }
  sourceURL(key,config){return config[`${key}_url`]||AUDIO_URLS[key];}
  preload(config){
    config=config||engine.config;
    for(const key of ['laugh','pop','bubbles'])this.fetchBuffer(this.sourceURL(key,config));
  }
  fetchBuffer(url){
    if(this.buffers.has(url))return Promise.resolve(this.buffers.get(url));
    if(this.inflight.has(url))return this.inflight.get(url);
    if(!this.ctx)return Promise.resolve(null);
    const p=fetch(url).then(r=>{if(!r.ok)throw Error(`Audio ${r.status}: ${url}`);return r.arrayBuffer();})
      .then(bytes=>this.ctx.decodeAudioData(bytes))
      .then(buffer=>{this.buffers.set(url,buffer);return buffer;})
      .catch(e=>{console.warn('[Marshmallow Audio]',e);return null;})
      .finally(()=>this.inflight.delete(url));
    this.inflight.set(url,p);return p;
  }
  async play(key,config,delay=0){
    if(!this.ctx || !config.sound)return;
    const generation=this.generation;
    const url=this.sourceURL(key,config);
    const buffer=await this.fetchBuffer(url);
    if(generation!==this.generation || !buffer || !config.sound || this.ctx.state!=='running')return;
    const src=this.ctx.createBufferSource();src.buffer=buffer;
    const gain=this.ctx.createGain();
    const level=clamp(config[`${key}_volume`],0,1,1)*clamp(config.sound_volume,0,1,1);
    gain.gain.value=level;
    src.connect(gain);gain.connect(this.master);
    this.voices.add(src);
    if(key==='laugh')this.laughVoice={src,gain};
    src.onended=()=>{
      this.voices.delete(src);
      if(this.laughVoice?.src===src)this.laughVoice=null;
      try{src.disconnect();gain.disconnect();}catch(_){}
    };
    try{src.start(this.ctx.currentTime+Math.max(0,delay));}catch(e){console.warn('[Marshmallow Audio] Play failed',e);}
  }
  fadeLaugh(seconds=.16){
    const voice=this.laughVoice;
    if(!voice || !this.ctx)return;
    const now=this.ctx.currentTime;
    try{
      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);
      voice.gain.gain.linearRampToValueAtTime(0,now+seconds);
      voice.src.stop(now+seconds+.01);
    }catch(e){console.warn('[Marshmallow Audio] Laugh fade failed',e);}
    this.laughVoice=null;
  }
  stop(){this.generation++;for(const src of this.voices){try{src.stop();}catch(_){}}this.voices.clear();this.laughVoice=null;}
}
const marshmallowAudio=new MarshmallowAudio();

function readRuntime(config){
  let saved=null;try{saved=JSON.parse(localStorage.getItem(STATE_KEY)||'null');}catch(e){}
  if(!saved || typeof saved!=='object') saved={};
  const st={
    enabled: typeof saved.enabled==='boolean'?saved.enabled:!!config.auto_play,
    sound:typeof saved.sound==='boolean'?saved.sound:!!config.sound,
    mode:SCHEDULE_MODES.includes(saved.mode)?saved.mode:config.schedule_mode,
    start:CLOCK_RE.test(saved.start)?saved.start:config.schedule_start,
    end:CLOCK_RE.test(saved.end)?saved.end:config.schedule_end,
  };
  if(minutesOf(st.start)>=minutesOf(st.end)){st.start=config.schedule_start;st.end=config.schedule_end;}
  return st;
}
function saveRuntime(state){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}}
function isInWindow(time,start,end){const x=time.getHours()*60+time.getMinutes();return x>=minutesOf(start)&&x<minutesOf(end);}
function nextDailyPlan(now,mode,start,end,sceneSeconds=14){
  const day=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
  let plan=null;try{plan=JSON.parse(localStorage.getItem(PLAN_KEY)||'null');}catch(e){}
  if(!plan||plan.day!==day||plan.start!==start||plan.end!==end||!Array.isArray(plan.times)){
    const startDate=new Date(now);startDate.setHours(Number(start.slice(0,2)),Number(start.slice(3)),0,0);
    const endDate=new Date(now);endDate.setHours(Number(end.slice(0,2)),Number(end.slice(3)),0,0);
    const count=1+Math.floor(Math.random()*10);
    const from=startDate.getTime()+1000,to=endDate.getTime()-sceneSeconds*1000-2000;
    const times=[];
    if(to>from){const slot=(to-from)/count;for(let i=0;i<count;i++)times.push(Math.round(from+(i+Math.random())*slot));}
    plan={day,start,end,times};
    try{localStorage.setItem(PLAN_KEY,JSON.stringify(plan));}catch(e){}
  }
  return plan;
}
function nextScheduledTime(now,state,config){
  const nowMs=now.getTime(),mode=state.mode;
  const start=state.start,end=state.end;
  const [sh,sm]=start.split(':').map(Number),[eh,em]=end.split(':').map(Number);
  const startDate=new Date(now);startDate.setHours(sh,sm,0,0);
  const endDate=new Date(now);endDate.setHours(eh,em,0,0);
  const dur=14.3*1000;
  if(mode==='daily'){
    const plan=nextDailyPlan(now,mode,start,end,dur/1000);
    const next=plan.times.find(t=>t>nowMs+500);
    if(next)return next;
    const tomorrow=new Date(now);tomorrow.setHours(24,0,3,0);
    return tomorrow.getTime();
  }
  if(mode==='hourly'){
    const next=new Date(now);next.setMinutes(0,0,0);
    if(next.getTime()<=nowMs+500)next.setHours(next.getHours()+1);
    for(let i=0;i<48;i++){
      const checkEnd=new Date(next);checkEnd.setHours(eh,em,0,0);
      if(isInWindow(next,start,end) && next.getTime()+dur<=checkEnd.getTime())return next.getTime();
      next.setHours(next.getHours()+1);
    }
    return null;
  }
  const bounds=mode==='custom'?[config.interval_minutes,config.interval_minutes]:mode.split('-').map(Number);
  const wait=(bounds[0]+Math.random()*(bounds[1]-bounds[0]))*60000;
  let at;
  if(nowMs<startDate.getTime())at=startDate.getTime()+wait;
  else if(nowMs+wait+dur>=endDate.getTime()){
    const tomorrow=new Date(startDate);tomorrow.setDate(tomorrow.getDate()+1);
    at=tomorrow.getTime()+wait;
  }else at=nowMs+wait;
  const atDate=new Date(at),endAt=new Date(atDate);endAt.setHours(eh,em,0,0);
  if(at+dur>endAt.getTime()){
    const tomorrow=new Date(atDate);tomorrow.setDate(tomorrow.getDate()+1);tomorrow.setHours(sh,sm,0,0);
    at=tomorrow.getTime()+wait;
  }
  return at;
}

class MarshmallowPopEngine {
  constructor() {
    this.config = loadSaved();
    this.runtime=readRuntime(this.config);
    this._configuredOnce=false;
    this.nextEvent=null;
    this.initialized = false;
    this.loading = null;
    this.phase = 'idle';
    this.elapsed = 0;
    this.lastFrame = 0;
    this.lastDraw = 0;
    this.raf = 0;
    this.timer = null;
    this.host = null;
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize, {passive:true});
    document.addEventListener('visibilitychange', () => {
      if(document.hidden){
        if(this.phase === 'playing') this.pause();
        this.schedule();
      }else{this.schedule();}
    });
    this.schedule();
  }
  notify(phase, detail = '') {
    window.dispatchEvent(new CustomEvent('frankys-marshmallow-state', {detail:{phase,detail}}));
  }
  setConfig(raw) {
    const old=this.config;
    this.config = normalize(raw);
    persist(this.config);
    // Explicit visual-editor changes should update the live scheduler too.
    // View switching with unchanged YAML must NOT overwrite card-button state.
    if(!this._configuredOnce){
      this.runtime=readRuntime(this.config);
    }else{
      if(old.auto_play!==this.config.auto_play)this.runtime.enabled=this.config.auto_play;
      if(old.sound!==this.config.sound)this.runtime.sound=this.config.sound;
      if(old.schedule_mode!==this.config.schedule_mode)this.runtime.mode=this.config.schedule_mode;
      if(old.schedule_start!==this.config.schedule_start)this.runtime.start=this.config.schedule_start;
      if(old.schedule_end!==this.config.schedule_end)this.runtime.end=this.config.schedule_end;
      if(minutesOf(this.runtime.start)>=minutesOf(this.runtime.end)){
        this.runtime.start=this.config.schedule_start;this.runtime.end=this.config.schedule_end;
      }
      saveRuntime(this.runtime);
      if(old.schedule_start!==this.config.schedule_start || old.schedule_end!==this.config.schedule_end){
        try{localStorage.removeItem(PLAN_KEY);}catch(e){}
      }
    }
    this._configuredOnce=true;
    if(this.runtime.sound)marshmallowAudio.preload(this.config);
    this.schedule();this.attachStage();this.resize();this.notify('config',tr('Einstellungen aktualisiert','Settings updated'));
  }
  setRuntime(partial){
    const previous={...this.runtime};
    const next={...this.runtime,...partial};
    next.mode=SCHEDULE_MODES.includes(next.mode)?next.mode:'daily';
    next.start=CLOCK_RE.test(next.start)?next.start:previous.start;
    next.end=CLOCK_RE.test(next.end)?next.end:previous.end;
    if(minutesOf(next.start)>=minutesOf(next.end))return false;
    this.runtime=next;saveRuntime(next);
    if(previous.start!==next.start||previous.end!==next.end){
      try{localStorage.removeItem(PLAN_KEY);}catch(e){}
    }
    if(next.sound && !previous.sound)marshmallowAudio.prepare();
    if(!next.sound && previous.sound)marshmallowAudio.stop();
    if(!next.enabled && previous.enabled && this.phase!=='idle')this.stop();
    this.schedule();this.notify('config',tr('Zeitsteuerung aktualisiert','Schedule updated'));return true;
  }
  setHost(host) {
    this.host = host || null;
    // Leaving a card-local preview should stop GPU work, not render offscreen.
    if(!this.host && !this.config.overlay && (this.phase==='playing' || this.phase==='paused')) this.stop();
    this.attachStage();
  }
  schedule() {
    if(this.timer!==null){clearTimeout(this.timer);this.timer=null;}
    this.nextEvent=null;
    // The Seasonal Card owns the only timer. Never schedule a second internal appearance.
    if(window.__FRANKYS_SEASONAL_EMBEDDED__)return;
    if(!this.runtime.enabled || !this.config.overlay || document.hidden)return;
    const now=new Date(),next=nextScheduledTime(now,this.runtime,this.config);
    if(!next)return;
    this.nextEvent=next;
    // setTimeout is capped at 2^31-1 ms to avoid immediate firing.
    this.timer=setTimeout(()=>{
      this.timer=null;this.nextEvent=null;
      if(this.runtime.enabled&&!document.hidden&&isInWindow(new Date(),this.runtime.start,this.runtime.end) &&
        this.phase!=='playing'&&this.phase!=='paused')this.play();
      this.schedule();
    },Math.min(2147483647,Math.max(100,next-now.getTime())));
  }
  async ensureReady() {
    if(this.initialized) return;
    if(this.loading) return this.loading;
    this.notify('loading',tr('Lade 3D-Modell …','Loading 3D model …'));
    this.loading = this.load();
    try { await this.loading; } finally { this.loading = null; }
  }
  async load() {
    // Loaded lazily so idle HA dashboards don't import the 3D engine or touch the GPU.
    const [THREE, loaderModule] = await Promise.all([
      import('./vendor/three.module.js'),
      import('./vendor/GLTFLoader.js'),
    ]);
    this.THREE = THREE;
    this.stage = document.createElement('div');
    this.stage.id = 'frankys-marshmallow-overlay';
    this.stage.style.cssText = 'position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:1100;display:none;';
    this.canvasWrap = this.stage;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36,16/9,.1,100);
    this.camera.position.set(0,0,7.6);
    this.camera.lookAt(0,0,0);
    this.renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
    this.renderer.setClearColor(0,0);
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
    this.stage.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xffffff,0x778ba3,2));
    const key=new THREE.DirectionalLight(0xffeddd,3.3);key.position.set(-3,6,5);this.scene.add(key);
    const fill=new THREE.DirectionalLight(0x95d5ff,1.9);fill.position.set(5,3,2);this.scene.add(fill);
    const back=new THREE.DirectionalLight(0xf9faff,1.15);back.position.set(1,2,-5);this.scene.add(back);
    this.actor = new THREE.Group();this.actor.position.y=-1.48;this.scene.add(this.actor);
    this.orientation = new THREE.Group();this.actor.add(this.orientation);
    this.dummy = new THREE.Object3D();
    const gltf = await new loaderModule.GLTFLoader().loadAsync(MODEL_URL);
    this.model = gltf.scene;
    this.model.traverse(obj => {if(obj.isMesh)obj.frustumCulled=false;});
    this.orientation.add(this.model);
    this.hip = this.model.getObjectByName('mixamorig:Hips') || this.model;
    this.clip = [...gltf.animations].sort((a,b)=>b.duration-a.duration)[0];
    if(!this.clip || this.clip.duration < 8) throw new Error(tr('Die 10-Sekunden-Meshy-Animation fehlt.','The 10-second Meshy animation is missing.'));
    this.initialHip = this.sampleHipPosition(0);
    this.finalHip = this.sampleHipPosition(this.clip.duration);
    this.mixer = new THREE.AnimationMixer(this.model);
    this.action = this.mixer.clipAction(this.clip);
    this.action.setLoop(THREE.LoopOnce, 1);
    this.action.clampWhenFinished = true;
    this.initialized = true;
    this.attachStage();
    this.resize();
    this.notify('ready',`Originalclip: ${this.clip.duration.toFixed(2)} s`);
  }
  sampleTrack(suffix, time) {
    const track = this.clip.tracks.find(t => t.name.endsWith(suffix));
    if(!track) return null;
    const times=track.times,values=track.values;
    const tt=Math.max(times[0],Math.min(time,times[times.length-1]));
    let lo=0,hi=times.length-1;
    while(hi-lo>1){const m=(lo+hi)>>1;if(times[m]<=tt)lo=m;else hi=m;}
    const blend=times[hi]===times[lo]?0:(tt-times[lo])/(times[hi]-times[lo]);
    const stride=suffix.endsWith('quaternion')?4:3;
    return [values.slice(lo*stride,lo*stride+stride), values.slice(hi*stride,hi*stride+stride),blend];
  }
  sampleHipPosition(t) {
    const tr=this.sampleTrack('Hips.position',t);
    if(!tr)return new this.THREE.Vector3();
    const [a,b,k]=tr;
    return new this.THREE.Vector3(...a).lerp(new this.THREE.Vector3(...b),k);
  }
  sampleHipYaw(t) {
    const tr=this.sampleTrack('Hips.quaternion',t);
    if(!tr)return 0;
    const [a,b,k]=tr;
    return new this.THREE.Euler().setFromQuaternion(new this.THREE.Quaternion(...a).slerp(new this.THREE.Quaternion(...b),k),'YXZ').y;
  }
  attachStage() {
    if(!this.stage)return;
    // Global layer is independent of the HA view lifecycle. Card mode is optional preview.
    const parent = this.config.overlay ? document.body : (this.host || null);
    if(!parent){this.stage.style.display='none';return;}
    if(this.stage.parentNode!==parent) parent.appendChild(this.stage);
    this.stage.style.position = this.config.overlay ? 'fixed' : 'absolute';
    this.stage.style.zIndex = this.config.overlay ? '1100' : '2';
    this.stage.style.background = this.config.transparent ? 'transparent' : 'rgba(7,15,28,.78)';
    this.stage.style.display = (this.phase==='playing' || this.phase==='paused')?'block':'none';
  }
  resize() {
    if(!this.initialized || !this.stage) return;
    const r = this.config.overlay ? {width:window.innerWidth, height:window.innerHeight} : (this.host || this.stage).getBoundingClientRect();
    if(!r.width || !r.height) return;
    const scale=this.config.render_scale;
    this.renderer.setSize(Math.max(1,Math.round(r.width*scale)),Math.max(1,Math.round(r.height*scale)),false);
    this.camera.aspect = r.width/r.height;
    this.camera.updateProjectionMatrix();
  }
  widthWorld() {return 2*this.camera.position.z*Math.tan(this.THREE.MathUtils.degToRad(this.camera.fov)/2)*this.camera.aspect;}
  reset() {
    this.stopClock();
    this.clearFX();
    this.elapsed = 0;
    this.lastFrame = 0;
    this.lastDraw = 0;
    this.actor.position.set(0,-1.48,0);
    this.orientation.visible=true;
    this.orientation.scale.setScalar(1.55*this.config.figure_size);
    this.orientation.rotation.y = this.config.direction==='right' ? -Math.PI/2 : Math.PI/2;
    this.action.stop();this.action.reset();this.action.setLoop(this.THREE.LoopOnce,1);
    this.action.clampWhenFinished=true;this.action.play();this.mixer.setTime(0);
    this.resize();
    const radius=1.55*this.config.figure_size*.76;
    const width=this.widthWorld();
    this.startX= this.config.direction==='right' ? width/2+radius+.25 : -width/2-radius-.25;
    const move=(this.finalHip.z-this.initialHip.z)*(1.55*this.config.figure_size);
    const sign=this.config.direction==='right'?-1:1;
    this.extraTravel=-this.startX-sign*move;
    this.actor.position.x=this.startX;
  }
  async play(onlyPop=false) {
    // Unlock sound immediately in the direct click handler. After awaiting
    // network/model loading, the browser may have lost user activation.
    this.unlockAudio();
    marshmallowAudio.stop();
    // Decode the full-length laugh in parallel with the 3D model. Both must be ready
    // before we start the visible scene, so its opening sound is not delayed
    // by a first-run fetch/decode on slow kiosk devices.
    const laughConfig={...this.config,sound:true};
    const laughReady=(!onlyPop && this.runtime.sound)
      ? marshmallowAudio.fetchBuffer(marshmallowAudio.sourceURL('laugh',laughConfig))
      : Promise.resolve();
    try {
      await Promise.all([this.ensureReady(),laughReady]);
      if(!this.config.overlay && !this.host){this.notify('error',tr('Für die Karten-Vorschau muss die Karte geöffnet sein.','Open the card to use its preview.'));return;}
      this.phase='playing';
        this.attachStage();
      this.reset();
      if(onlyPop) {
        this.elapsed=this.clip.duration+1.05+.65+.016;
        this.updateFace(1.05);this.startFX();
      } else if(this.runtime.sound) {
        // Start with the first visible movement, not near the end of the walk.
        // The existing laugh/master volume controls remain unchanged.
        void marshmallowAudio.play('laugh',laughConfig);
      }
      this.notify('playing',onlyPop?tr('Explosion','Explosion'):tr('Auftritt','Appearance'));
      this.startClock();
    } catch(e) {
      console.error('[Frankys Marshmallow]',e);
      this.phase='error';this.attachStage();this.notify('error',e.message || String(e));
    }
  }
  stopClock(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.lastFrame=0;this.lastDraw=0;}
  startClock(){this.stopClock();this.raf=requestAnimationFrame(ts=>this.tick(ts));}
  pause(){
    if(this.phase==='playing') {this.phase='paused';marshmallowAudio.stop();this.stopClock();this.notify('paused',tr('Pausiert','Paused'));}
    else if(this.phase==='paused'){this.phase='playing';this.notify('playing',tr('Fortgesetzt','Resumed'));this.startClock();}
  }
  stop(){this.stopClock();marshmallowAudio.stop();this.phase='idle';this.clearFX();if(this.stage)this.stage.style.display='none';this.notify('idle',tr('Gestoppt','Stopped'));}
  updateWalk(t){
    this.mixer.setTime(Math.min(t,this.clip.duration-.00001));
    const p=smooth(t/7.3);
    this.orientation.rotation.y=this.config.direction==='right'?-Math.PI/2:Math.PI/2;
    this.actor.position.set(this.startX+this.extraTravel*p,-1.48,0);
  }
  hipOffset(yaw){return this.finalHip.clone().multiplyScalar(1.55*this.config.figure_size).applyAxisAngle(new this.THREE.Vector3(0,1,0),yaw);}
  updateFace(t){
    this.mixer.setTime(this.clip.duration-.00001);
    const startYaw=this.config.direction==='right'?-Math.PI/2:Math.PI/2;
    const targetAngle=-this.sampleHipYaw(this.clip.duration);
    const targetYaw=startYaw+this.THREE.MathUtils.euclideanModulo(targetAngle-startYaw+Math.PI,2*Math.PI)-Math.PI;
    const yaw=this.THREE.MathUtils.lerp(startYaw,targetYaw,smooth(t/1.05));
    this.orientation.rotation.y=yaw;
    const before=this.hipOffset(startYaw), after=this.hipOffset(yaw);
    this.actor.position.set(this.startX+this.extraTravel+before.x-after.x,-1.48,before.z-after.z);
  }
  marshmallowGeometry(){
    const p=[[0,-.17],[.085,-.17],[.14,-.158],[.175,-.125],[.187,-.085],[.187,.085],[.175,.125],[.14,.158],[.085,.17],[0,.17]];
    return new this.THREE.LatheGeometry(p.map(v=>new this.THREE.Vector2(v[0],v[1])),14);
  }
  clearFX(){
    if(this.debris){this.scene.remove(this.debris);this.debris.geometry.dispose();this.debris.material.dispose();this.debris=null;}
    if(this.ring){this.scene.remove(this.ring);this.ring.geometry.dispose();this.ring.material.dispose();this.ring=null;}
    this.particles=[];
  }
  startFX(){
    this.clearFX();
    this.scene.updateMatrixWorld(true);
    const center=this.hip.getWorldPosition(new this.THREE.Vector3()); center.y+=.25;
    this.orientation.visible=false;
    const count=this.config.count;
    const mat=new this.THREE.MeshStandardMaterial({color:0xffffff,roughness:.82,metalness:0,transparent:true,opacity:1});
    this.debris=new this.THREE.InstancedMesh(this.marshmallowGeometry(),mat,count);
    this.debris.frustumCulled=false;this.debris.instanceMatrix.setUsage(this.THREE.DynamicDrawUsage);
    this.particles=[];
    const palette=[0xfff5ee,0xffffff,0xffeee8,0xfff1f1,0xfde6e9,0xf6f7ff,0xfff6e4];
    for(let i=0;i<count;i++){
      const a=Math.random()*Math.PI*2,v=1+Math.random()*2.65;
      this.particles.push({
        position:center.clone().add(new this.THREE.Vector3((Math.random()-.5)*.8,(Math.random()-.5)*.9,(Math.random()-.5)*.5)),
        velocity:new this.THREE.Vector3(Math.cos(a)*v,1.7+Math.random()*2.8,Math.sin(a)*v*.72),
        angle:new this.THREE.Euler(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI),
        spin:new this.THREE.Vector3((Math.random()-.5)*11,(Math.random()-.5)*10,(Math.random()-.5)*11),
        scale:.42+Math.random()*.78,restitution:.28+Math.random()*.09,bounces:0,lastT:0,
      });
      this.debris.setColorAt(i,new this.THREE.Color(palette[i%palette.length]));
    }
    this.debris.instanceColor.needsUpdate=true;
    this.scene.add(this.debris);
    // The laugh continues through the walk and turn; fade only as the character bursts.
    marshmallowAudio.fadeLaugh(.16);
    this.ring=new this.THREE.Mesh(new this.THREE.RingGeometry(.66,.84,42),new this.THREE.MeshBasicMaterial({color:0xffe9c5,transparent:true,opacity:.72,depthWrite:false,side:this.THREE.DoubleSide}));
    this.ring.position.copy(center);this.scene.add(this.ring);
    this.playPop();
  }
  updateFX(t){
    for(let i=0;i<this.particles.length;i++){
      const p=this.particles[i];let remaining=Math.max(0,t-p.lastT),steps=0;
      while(remaining>.0001 && steps++<120){
        const dt=Math.min(.016,remaining);remaining-=dt;
        p.velocity.y-=9.4*dt;p.position.addScaledVector(p.velocity,dt);
        const ground=-1.48+.055+p.scale*.16;
        if(p.position.y<ground){
          p.position.y=ground;
          if(p.bounces<3&&Math.abs(p.velocity.y)>.55){p.velocity.y=-p.velocity.y*p.restitution;p.velocity.x*=.73;p.velocity.z*=.73;p.bounces++;}
          else{p.velocity.y=0;p.velocity.x*=Math.exp(-5*dt);p.velocity.z*=Math.exp(-5*dt);}
        }
        p.angle.x+=p.spin.x*dt;p.angle.y+=p.spin.y*dt;p.angle.z+=p.spin.z*dt;
      }
      p.lastT=t;
      this.dummy.position.copy(p.position);this.dummy.rotation.copy(p.angle);
      this.dummy.scale.setScalar(p.scale*(t>1.9?Math.max(.02,1-(t-1.9)/.62):1));this.dummy.updateMatrix();
      this.debris.setMatrixAt(i,this.dummy.matrix);
    }
    this.debris.instanceMatrix.needsUpdate=true;
    this.debris.material.opacity=1-smooth((t-2.05)/.48);
    if(this.ring){this.ring.scale.setScalar(1+4*smooth(t/.42));this.ring.material.opacity=.65*(1-smooth(t/.48));this.ring.visible=t<.55;}
  }
  unlockAudio(){
    if(!this.runtime.sound)return;
    marshmallowAudio.prepare();
  }
  playPop(){
    if(!this.runtime.sound)return;
    const c={...this.config,sound:true};
    marshmallowAudio.play('pop',c);
    marshmallowAudio.play('bubbles',c,.12);
  }
  tick(ts){
    if(this.phase!=='playing')return;
    const minMs=1000/this.config.fps;
    if(this.lastDraw && ts-this.lastDraw<minMs-1){this.raf=requestAnimationFrame(t=>this.tick(t));return;}
    if(!this.lastFrame)this.lastFrame=ts-minMs;
    const delta=Math.min(.14,(ts-this.lastFrame)/1000);
    this.lastFrame=ts;this.lastDraw=ts;this.elapsed+=delta;
    const faceTime=1.05,holdTime=.65,fxTime=2.55;
    const walkEnd=this.clip.duration,faceEnd=walkEnd+faceTime,holdEnd=faceEnd+holdTime;
    if(this.elapsed<walkEnd){this.updateWalk(this.elapsed);}
    else if(this.elapsed<faceEnd){this.updateFace(this.elapsed-walkEnd);}
    else if(this.elapsed<holdEnd){this.updateFace(faceTime);}
    else{
      this.updateFace(faceTime);
      if(!this.debris)this.startFX();
      this.updateFX(this.elapsed-holdEnd);
    }
    this.renderer.render(this.scene,this.camera);
    if(this.elapsed>=holdEnd+fxTime){
      this.stopClock();this.phase='idle';this.stage.style.display='none';
      this.clearFX();this.notify('finished',tr('Auftritt abgeschlossen','Appearance finished'));
      return;
    }
    this.raf=requestAnimationFrame(t=>this.tick(t));
  }
}

const engine = window.__frankysSeasonalMarshmallowEngine || (window.__frankysSeasonalMarshmallowEngine = new MarshmallowPopEngine());

const MODE_LABELS={daily:'Zufällig 1–10× pro Tag',hourly:'Jede volle Stunde','1-2':'Zufällig alle 1–2 Minuten','3-8':'Zufällig alle 3–8 Minuten','5-10':'Zufällig alle 5–10 Minuten','10-20':'Zufällig alle 10–20 Minuten',custom:'Fester Minutenabstand'};
const MODE_LABELS_EN={daily:'Random 1–10× per day',hourly:'Every full hour','1-2':'Random every 1–2 minutes','3-8':'Random every 3–8 minutes','5-10':'Random every 5–10 minutes','10-20':'Random every 10–20 minutes',custom:'Custom minute interval'};
const EDIT_LABELS_EN={
  fps:'FPS',count:'Marshmallow pieces',sound:'Sound during appearance',
  sound_volume:'Master volume',laugh_volume:'Laugh volume',pop_volume:'Main pop volume',bubbles_volume:'Bubble pops volume',
  laugh_url:'Custom laugh URL',pop_url:'Custom pop URL',bubbles_url:'Custom bubble sounds URL',
  transparent:'Transparent background',overlay:'Overlay over entire dashboard',auto_play:'Enable automatic appearances',
  schedule_mode:'Schedule',schedule_start:'Appearances from (HH:MM)',schedule_end:'Appearances until (HH:MM)',
  interval_minutes:'Minutes between appearances',direction:'Walking direction',figure_size:'Character size',render_scale:'Render resolution'
};
const OPTIONS = [
  ['fps','FPS','select',[24,30,45,60]],
  ['count','Marshmallow-Stücke','select',[24,40,60]],
  ['sound','Ton beim Auftritt','checkbox'],
  ['sound_volume','Gesamtlautstärke','range',0,1,.05],
  ['laugh_volume','Lachen – Lautstärke','range',0,1,.05],
  ['pop_volume','Haupt-Plopp – Lautstärke','range',0,1,.05],
  ['bubbles_volume','Kleine Plopps – Lautstärke','range',0,1,.05],
  ['laugh_url','Eigener Lachton (URL)','text'],
  ['pop_url','Eigener Plopp-Ton (URL)','text'],
  ['bubbles_url','Eigene kleine Plopps (URL)','text'],
  ['transparent','Transparenter Hintergrund','checkbox'],
  ['overlay','Über dem ganzen Dashboard anzeigen','checkbox'],
  ['auto_play','Automatische Auftritte aktivieren','checkbox'],
  ['schedule_mode','Zeitsteuerung','select',['daily','hourly','1-2','3-8','5-10','10-20','custom']],
  ['schedule_start','Auftritte von (HH:MM)','time'],
  ['schedule_end','Auftritte bis (HH:MM)','time'],
  ['interval_minutes','Minuten zwischen Auftritten','number',15,1440,15],
  ['direction','Laufrichtung','select',['left','right']],
  ['figure_size','Größe der Figur','number',.6,1.6,.1],
  ['render_scale','Renderauflösung','select',[.5,.75,1]],
];
const EDIT_STYLE = `
:host{display:block;color:var(--primary-text-color,inherit)}
.wrap{display:grid;gap:12px;padding:12px 0;font-family:var(--paper-font-body1_-_font-family,inherit)}
.field{display:grid;gap:5px;font-size:13px}
.field input:not([type=checkbox]),.field select{box-sizing:border-box;width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--divider-color,#777);background:var(--card-background-color,#17212e);color:var(--primary-text-color,inherit);font:inherit}
.field.checkbox{display:flex;align-items:center;gap:10px}.field.checkbox input{width:17px;height:17px}.field input[type=range]{padding:0;accent-color:var(--primary-color,#03a9f4);min-height:32px}
.note{color:var(--secondary-text-color,#aaa);font-size:12px;line-height:1.4}
`;

class FrankysMarshmallowEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:'open'});this._config=normalize();}
  setConfig(c){this._config=normalize(c);this.render();}
  render(){
    this.shadowRoot.replaceChildren();
    const style=document.createElement('style');style.textContent=EDIT_STYLE;
    const wrap=document.createElement('div');wrap.className='wrap';
    for(const [key,label,kind,a,b,step] of OPTIONS){
      const holder=document.createElement('label');holder.className='field'+(kind==='checkbox'?' checkbox':'');
      const text=document.createElement('span');text.textContent=isGerman()?label:(EDIT_LABELS_EN[key]||label);
      let input;
      if(kind==='select'){
        input=document.createElement('select');
        for(const val of a){const opt=document.createElement('option');opt.value=String(val);opt.textContent=
          key==='direction'?(val==='left'?tr('Links → rechts','Left → right'):tr('Rechts → links','Right → left')):
          key==='render_scale'?`${Math.round(Number(val)*100)} %`:
          key==='schedule_mode'?(isGerman()?MODE_LABELS[val]:MODE_LABELS_EN[val]):String(val);
          input.appendChild(opt);}
        input.value=String(this._config[key]);
      }else{
        input=document.createElement('input');input.type=kind;
        if(kind==='checkbox')input.checked=!!this._config[key];
        else {if(kind==='number'||kind==='range'){input.min=a;input.max=b;input.step=step;}input.value=this._config[key];}
      }
      if(kind==='checkbox'){holder.append(input,text);}else{holder.append(text,input);}
      input.addEventListener(kind==='number'?'change':'change',()=>{
        const numericSelect=['fps','count','render_scale'].includes(key);
        const value=kind==='checkbox'?input.checked:(kind==='number'||kind==='range'||numericSelect)?Number(input.value):input.value;
        this._config=normalize({...this._config,[key]:value});
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this._config}},bubbles:true,composed:true}));
      });
      wrap.appendChild(holder);
    }
    const note=document.createElement('p');note.className='note';note.textContent=tr('Der tägliche Zufallsmodus plant 1–10 Auftritte zwischen den gewählten Uhrzeiten. Einschalten, Ton und Zeitmodus lassen sich zusätzlich direkt auf der Karte ändern. Automatischer Ton benötigt möglicherweise eine vorherige Browser-Interaktion.','The daily random schedule plans 1–10 appearances within your selected hours. Enable, sound, and schedule can also be changed on the card. Automatic sound may require a user interaction first.');
    wrap.appendChild(note);this.shadowRoot.append(style,wrap);
  }
}
if(!customElements.get('frankys-marshmallow-editor'))customElements.define('frankys-marshmallow-editor',FrankysMarshmallowEditor);

class FrankysMarshmallowCard extends HTMLElement {
  constructor(){
    super();this.attachShadow({mode:'open'});
    this._config=loadSaved();
    this._onState=e=>this.setStatus(e.detail);
  }
  static getStubConfig(){const {type,...rest}=DEFAULTS;return {...rest};}
  static getConfigElement(){return document.createElement('frankys-marshmallow-editor');}
  getCardSize(){return this._config.overlay?3:5;}
  getGridOptions(){return {columns:6,rows:this._config.overlay?3:6,min_columns:3};}
  setConfig(config){
    this._config=normalize(config);
    engine.setConfig(this._config);
    this.render();
  }
  set hass(value){
    this._hass=value;
    window.__frankysHassLang=(value?.locale?.language||value?.language||navigator.language);
  }
  connectedCallback(){window.addEventListener('frankys-marshmallow-state',this._onState);this.render();}
  disconnectedCallback(){window.removeEventListener('frankys-marshmallow-state',this._onState);if(engine.host===this.preview)engine.setHost(null);}
  setStatus(st){
    if(!this.shadowRoot)return;
    const text=this.shadowRoot.querySelector('.state');
    if(text)text.textContent=st.detail?`${st.phase}: ${st.detail}`:st.phase;
    const pause=this.shadowRoot.querySelector('[data-action="pause"]');
    if(pause)pause.textContent=st.phase==='paused'?tr('Fortsetzen','Resume'):tr('Pause','Pause');
  }
  render(){
    if(!this.isConnected)return;
    this.shadowRoot.replaceChildren();
    const style=document.createElement('style');style.textContent=`
:host{display:block}ha-card{padding:14px;background:var(--ha-card-background,var(--card-background-color,#15283b));color:var(--primary-text-color,#eef)}
header{display:flex;justify-content:space-between;gap:9px;align-items:center;margin-bottom:10px}b{font-size:16px}.tag{font-size:11px;color:var(--secondary-text-color,#aaa)}
.buttons{display:flex;flex-wrap:wrap;gap:6px}.buttons button{flex:1;min-width:90px;padding:9px;border-radius:9px;background:var(--secondary-background-color,#29394b);border:1px solid var(--divider-color,#667);color:var(--primary-text-color,inherit);cursor:pointer;font:inherit;font-size:12px}
.buttons button:first-child{background:var(--primary-color,#168aac);color:white;border-color:transparent}
.state{font-size:12px;margin-top:10px;color:var(--secondary-text-color,#aaa);line-height:1.4}
.schedule{margin-top:10px;border-top:1px solid var(--divider-color,#667);padding-top:10px}
.schedule-grid{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px;font-size:12px}
.schedule-title{flex-basis:100%;font-weight:600}
.schedule-grid select,.schedule-grid input{box-sizing:border-box;min-height:38px;border-radius:8px;border:1px solid var(--divider-color,#667);background:var(--card-background-color,#15283b);color:var(--primary-text-color,inherit);padding:7px;max-width:100%}
.schedule-grid select{flex:1 1 200px;min-width:0}
.schedule-grid label{display:flex;gap:6px;align-items:center;flex:1 1 118px;min-width:0}
.schedule-grid input{width:100%;min-width:0;font:inherit}
.preview{display:${this._config.overlay?'none':'block'};position:relative;height:230px;margin-top:10px;overflow:hidden;border-radius:8px;background:#081422}
`;
    const card=document.createElement('ha-card');
    const header=document.createElement('header');
    const name=document.createElement('b');name.textContent='Franky’s Marshmallow Pop';
    const tag=document.createElement('span');tag.className='tag';tag.textContent='3D · '+this._config.fps+' FPS';
    header.append(name,tag);card.appendChild(header);
    const buttons=document.createElement('div');buttons.className='buttons';
    for(const [label,act,handler] of [
      [tr('Auftritt starten','Start appearance'),'play',()=>engine.play()],
      [tr('Explosion testen','Test explosion'),'pop',()=>engine.play(true)],
      [tr('Pause','Pause'),'pause',()=>engine.pause()],
      [tr('Stoppen','Stop'),'stop',()=>engine.stop()],
    ]){
      const btn=document.createElement('button');btn.type='button';btn.dataset.action=act;btn.textContent=label;
      btn.addEventListener('click',handler);buttons.appendChild(btn);
    }
    card.appendChild(buttons);
    this.preview=document.createElement('div');this.preview.className='preview';card.appendChild(this.preview);
    const scheduling=document.createElement('div');scheduling.className='schedule';
    const row=document.createElement('div');row.className='buttons';
    const power=document.createElement('button');power.type='button';power.dataset.action='power';
    const toggleSound=document.createElement('button');toggleSound.type='button';toggleSound.dataset.action='sound';
    function refreshButtons(){
      power.textContent=engine.runtime.enabled?tr('Automatik ausschalten','Disable automatic'):tr('Automatik einschalten','Enable automatic');
      toggleSound.textContent=engine.runtime.sound?tr('Ton ausschalten','Mute sound'):tr('Ton einschalten','Enable sound');
    }
    power.addEventListener('click',()=>{engine.setRuntime({enabled:!engine.runtime.enabled});refreshButtons();});
    toggleSound.addEventListener('click',()=>{engine.setRuntime({sound:!engine.runtime.sound});refreshButtons();});
    refreshButtons();row.append(power,toggleSound);scheduling.append(row);
    const timing=document.createElement('div');timing.className='schedule-grid';
    const select=document.createElement('select');select.setAttribute('aria-label',tr('Auftrittsintervall','Appearance interval'));
    for(const [value,label] of Object.entries(MODE_LABELS)){
      const opt=document.createElement('option');opt.value=value;opt.textContent=isGerman()?label:MODE_LABELS_EN[value];select.appendChild(opt);
    }
    select.value=engine.runtime.mode;
    select.addEventListener('change',()=>engine.setRuntime({mode:select.value}));
    const from=document.createElement('input');from.type='time';from.value=engine.runtime.start;from.setAttribute('aria-label',tr('Auftritte von','Appearances from'));
    const to=document.createElement('input');to.type='time';to.value=engine.runtime.end;to.setAttribute('aria-label',tr('Auftritte bis','Appearances until'));
    const title=document.createElement('span');title.textContent=tr('Automatische Auftritte','Automatic appearances');
    title.className='schedule-title';timing.append(title,select);
    const fromLabel=document.createElement('label');fromLabel.textContent=tr('Von','From');fromLabel.append(from);
    const toLabel=document.createElement('label');toLabel.textContent=tr('Bis','Until');toLabel.append(to);
    const commit=()=>{
      if(!engine.setRuntime({start:from.value,end:to.value})){
        from.value=engine.runtime.start;to.value=engine.runtime.end;
      }
    };
    from.addEventListener('change',commit);to.addEventListener('change',commit);
    timing.append(fromLabel,toLabel);scheduling.append(timing);card.appendChild(scheduling);
    const state=document.createElement('div');state.className='state';
    state.textContent=this._config.overlay?tr('Transparenter Bildschirmauftritt · 1–10 zufällige Auftritte/Tag als Standard.','Transparent overlay · 1–10 random appearances/day by default.'):tr('Karten-Vorschau aktiviert.','Card preview enabled.');
    card.appendChild(state);
    const note=document.createElement('div');note.className='state';
    note.textContent=tr('Weitere Einstellungen im visuellen Karteneditor: 24–60 FPS, Figurgröße, Richtung, Partikel, Renderauflösung und getrennte Tonlautstärken.','More options in the visual editor: FPS, figure size, direction, particles, render resolution and independent audio volumes.');card.appendChild(note);
    this.shadowRoot.append(style,card);
    engine.setHost(this.preview);
  }
}
if(!customElements.get('frankys-seasonal-marshmallow-internal'))customElements.define('frankys-seasonal-marshmallow-internal',FrankysMarshmallowCard);
window.customCards = window.customCards || [];
if(!window.customCards.some(c=>c.type==='frankys-seasonal-marshmallow-internal')){
  window.customCards.push({type:'frankys-seasonal-marshmallow-internal',name:'Franky’s Marshmallow Pop',description:'3D-Marshmallowmann als transparentes Dashboard-Overlay',preview:false,documentationURL:'https://github.com/Franz1302'});
}
console.info(`[Franky's Marshmallow Pop] Dashboard resource ${VERSION} loaded`);
