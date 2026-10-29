/* Seasonal Fun Card v0.4 regression tests: migration, aliases, offline assets and playback. */
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'dist', name), 'utf8');
const entry = read('frankys-christmas-card.js');
const seasonal = read('frankys-seasonal-card.js');
const christmas = read('legacy-christmas-engine.js');
const halloween = read('marshmallow-engine.js');
assert.match(entry, /import '\.\/legacy-christmas-engine\.js'/);
assert.match(entry, /import '\.\/frankys-seasonal-card\.js'/);
assert.match(christmas, /define\('frankys-christmas-renderer',FrankysChristmasCard\)/);
assert.doesNotMatch(christmas, /restoreGlobalFlightController\(\);/);
assert.match(seasonal, /define\('frankys-christmas-card',FrankysSeasonalLegacyCard\)/);
assert.match(seasonal, /document\.createElement\('frankys-christmas-renderer'\)/);
assert.match(seasonal, /Franky's Christmas Card is now Franky's Seasonal Fun Card!/);
assert.match(seasonal, /custom:frankys-seasonal-card/);
assert.match(halloween, /import\('\.\/vendor\/three\.module\.js'\)/);
assert.match(halloween, /import\('\.\/vendor\/GLTFLoader\.js'\)/);
assert.doesNotMatch(halloween, /import\(['"]https?:/);
for (const [file, minimum] of [
 ['assets/marshmallow-animated.glb', 10000000],
 ['assets/laugh.mp3', 100000],
 ['assets/balloon-pop.mp3', 8000],
 ['assets/bubble-pops.mp3', 8000],
 ['vendor/three.core.js', 1000000],
 ['vendor/three.module.js', 500000],
 ['vendor/GLTFLoader.js', 100000],
 ['vendor/BufferGeometryUtils.js', 30000],
 ['vendor/THREE_LICENSE.txt', 500]
]) {
 const stat = fs.statSync(path.join(root,'dist',file));
 assert(stat.size >= minimum, file + ' missing or truncated');
}
assert.match(read('vendor/GLTFLoader.js'), /from '\.\/three\.module\.js'/);
assert.match(read('vendor/GLTFLoader.js'), /from '\.\/BufferGeometryUtils\.js'/);
assert.match(read('vendor/BufferGeometryUtils.js'), /from '\.\/three\.module\.js'/);

const store = new Map([
 ['frankys-christmas-v1-default', JSON.stringify({enabled:true,sound:true,interval:'hourly',start_time:'10:00',end_time:'20:00'})]
]);
const registry = {};
const calls = {play:0,stop:0,configured:0};
class Element { attachShadow(){this.shadowRoot={innerHTML:''};return this.shadowRoot;} }
class ChristmasRenderer extends Element {
 constructor(){super();this._state={enabled:false,sound:true};}
 setConfig(config){this._config=config;calls.configured++;}
 _applySchedule(){}
 _play(){calls.play++;return true;}
 _stop(){calls.stop++;}
 _unlockAudio(){}
}
registry['frankys-christmas-renderer'] = ChristmasRenderer;
let nextId=0;
const ctx = {
 window:{customCards:[],dispatchEvent(){},addEventListener(){}},
 document:{hidden:true,addEventListener(){},createElement:type=>{
  const Cls=registry[type];return Cls ? new Cls() : new Element();
 }},
 navigator:{language:'de-AT'},
 customElements:{get:name=>registry[name],define:(name,Cls)=>{if(registry[name])throw Error('duplicate '+name);registry[name]=Cls;},whenDefined:()=>Promise.resolve()},
 HTMLElement:Element,
 localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k),key:i=>Array.from(store.keys())[i]||null,get length(){return store.size;}},
 setTimeout:()=>++nextId,clearTimeout(){},CustomEvent:class {},Event:class {},
 console:{info(){},warn(){},error(e){throw e;}}
};
vm.runInNewContext(seasonal,ctx);
assert(registry['frankys-christmas-card'],'Old YAML type must still resolve');
assert(registry['frankys-seasonal-card'],'New YAML type must resolve');
const ctrl=ctx.window.__frankysSeasonalController;
assert(ctrl,'Shared scheduler must exist');
assert.equal(ctrl.state.season,'christmas');
assert.equal(ctrl.state.mode,'hourly');
assert.equal(ctrl.state.start,'10:00');
assert.equal(ctrl.state.end,'20:00');
ctrl.configure({type:'custom:frankys-christmas-card'});
assert.equal(ctrl.xmas instanceof ChristmasRenderer,true,'Christmas playback must bridge to original renderer');
assert(calls.configured > 0);
ctrl.setState({enabled:false});
ctx.document.hidden=false;
(async()=>{
 await ctrl.play();
 assert.equal(calls.play,1,'Test appearance must invoke actual Christmas animation');
 ctrl.stop();
 assert(calls.stop >= 1,'Stop button must stop original Christmas renderer');
 assert.equal(registry['frankys-christmas-card'].getStubConfig().type,'custom:frankys-christmas-card');
 console.log('OK: HACS entry, media assets, local Three.js, legacy YAML, migration and Christmas playback');
})().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
