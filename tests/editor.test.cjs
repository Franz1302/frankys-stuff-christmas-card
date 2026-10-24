/* Smoke tests for card layout, editor and config-changed contract. No npm deps. */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const registered={};
class FakeElement {
  attachShadow(){
    this.shadowRoot={innerHTML:'',querySelectorAll:()=>[],getElementById:()=>({textContent:'',value:''})};
    return this.shadowRoot;
  }
  dispatchEvent(event){this.lastEvent=event;return true;}
}
class FakeEvent {
  constructor(name,options){this.type=name;Object.assign(this,options);}
}
const document={createElement:(type)=>({type})};
const context={
  window:{customCards:[]},document,
  customElements:{get:(key)=>registered[key],define:(key,cls)=>{registered[key]=cls;}},
  navigator:{language:'de-AT'},
  HTMLElement:FakeElement,CustomEvent:FakeEvent
};
vm.runInNewContext(fs.readFileSync('dist/frankys-christmas-card.js','utf8'),context);
const Card=registered['frankys-christmas-card'],Editor=registered['frankys-christmas-card-editor'];
assert(Card&&Editor,'Both custom elements must be registered');
assert.deepEqual(JSON.parse(JSON.stringify(Card.prototype.getGridOptions())),{columns:12,min_columns:6,rows:'auto'});
assert.equal(Card.prototype.getCardSize.call({_config:{layout_mode:'compact'}}),4);
assert.equal(Card.getConfigElement().type,'frankys-christmas-card-editor');
const editor=new Editor();
editor.setConfig({type:'custom:frankys-christmas-card',schedule_start:'09:00',schedule_end:'22:00'});
editor._changed({getAttribute:()=> 'layout_mode',value:'compact'});
assert.equal(editor.lastEvent.type,'config-changed');
assert.equal(editor.lastEvent.bubbles,true);
assert.equal(editor.lastEvent.composed,true);
assert.equal(editor.lastEvent.detail.config.layout_mode,'compact');
editor._changed({getAttribute:()=> 'schedule_end',value:'20:00'});
assert.equal(editor.lastEvent.detail.config.schedule_end,'20:00');
editor._changed({getAttribute:()=> 'duration',value:'12'});
assert.equal(editor.lastEvent.detail.config.duration,12);
const previous=editor.lastEvent;
editor._changed({getAttribute:()=> 'schedule_start',value:'23:00'});
assert.equal(editor.lastEvent,previous,'Invalid inverted time window must not emit event');
const code=fs.readFileSync('dist/frankys-christmas-card.js','utf8');
assert.match(code,/min-height:44px/);
assert.match(code,/container-type:inline-size/);
console.log('OK: config editor, valid and invalid times, layout controls, grid sizing, responsive CSS');
