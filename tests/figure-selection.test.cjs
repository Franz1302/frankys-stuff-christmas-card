/* Regression: select Christmas performers directly on the card. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const code=fs.readFileSync('dist/frankys-seasonal-card.js','utf8');
const storage=new Map();
const listeners={};
const elements={};
const context={
 document:{hidden:true,addEventListener:(key,fn)=>{listeners[key]=fn;},body:{}},
 window:{customCards:[],addEventListener(){},removeEventListener(){},dispatchEvent(){}},
 localStorage:{
  getItem:key=>storage.get(key)??null,
  setItem:(key,value)=>storage.set(key,String(value)),
  removeItem:key=>storage.delete(key),
  key:i=>[...storage.keys()][i]??null,
  get length(){return storage.size}
 },
 navigator:{language:'de-AT'},
 customElements:{get:key=>elements[key],define:(key,cls)=>{elements[key]=cls},whenDefined:()=>Promise.resolve()},
 HTMLElement:class{},Event:class{},CustomEvent:class{},
 console:{warn(){},error(){},info(){}},
 setTimeout:()=>1,clearTimeout(){}
};
vm.runInNewContext(code,context,{filename:'frankys-seasonal-card.js'});
const ctrl=context.window.__frankysSeasonalController;
assert(ctrl,'controller registered');
ctrl.configure({type:'custom:frankys-seasonal-card',season:'christmas'});
assert.equal(ctrl.figureChoice(),'santa','previous Santa-only settings remain the default');
assert.equal(ctrl.figureConfig('santa').enabled,true);
assert.equal(ctrl.figureConfig('christkind').enabled,false);

assert.equal(ctrl.setFigureChoice('christkind'),true);
assert.equal(ctrl.figureChoice(),'christkind');
assert.equal(ctrl.figureConfig('santa').enabled,false);
assert.equal(ctrl.figureConfig('christkind').enabled,true);
assert.equal(storage.get('frankys-seasonal/figure-choice/v1'),'christkind');

assert.equal(ctrl.setFigureChoice('both'),true);
assert.equal(ctrl.figureConfig('santa').enabled,true);
assert.equal(ctrl.figureConfig('christkind').enabled,true);
assert.equal(ctrl.setFigureChoice('invalid'),false);
assert.equal(ctrl.figureChoice(),'both');

ctrl.configure({type:'custom:frankys-seasonal-card',controls_locked:true});
assert.equal(ctrl.setFigureChoice('santa'),false,'child lock prevents changing the selection');
assert.equal(ctrl.figureChoice(),'both','child lock does not change the selected figure');
assert.equal(storage.get('frankys-seasonal/figure-choice/v1'),'both');

assert(code.indexOf('id="options-panel"')<code.indexOf('id="figure-picker"'),'figure picker is inside Options');
assert(code.indexOf('id="figure-picker"')<code.indexOf('id="figure-controls"'),'picker is above the individual tests');
assert(code.includes('if(this.busy||document.hidden||!this.state.enabled'),'shared controller prevents overlapping playback');
console.log('OK: persistent on-card figure selector, per-figure enable rules, child lock and placement');
