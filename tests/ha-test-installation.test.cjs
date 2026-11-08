const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const assert=require('node:assert/strict');
const {prepareInstallation,markerName,markerValue,installName}=require('../scripts/prepare-ha-test-installation.cjs');

const configRoot=fs.mkdtempSync(path.join(os.tmpdir(),'seasonal-card-ha-test-'));
try{
 fs.writeFileSync(path.join(configRoot,'configuration.yaml'),'homeassistant:\n  name: Isolated card test\n');
 fs.writeFileSync(path.join(configRoot,markerName),markerValue);
 const destination=prepareInstallation(configRoot);
 assert.equal(path.basename(destination),installName);
 for(const file of ['frankys-christmas-card.js','legacy-christmas-engine.js','frankys-seasonal-card.js','marshmallow-engine.js','seasonal-scenes.mjs','assets/St_Martin_korrigiert.webp'])
  assert(fs.existsSync(path.join(destination,file)),`${file} is included in the test bundle`);
 const seasonal=fs.readFileSync(path.join(destination,'frankys-seasonal-card.js'),'utf8');
 const entry=fs.readFileSync(path.join(destination,'frankys-christmas-card.js'),'utf8');
 const legacy=fs.readFileSync(path.join(destination,'legacy-christmas-engine.js'),'utf8');
 const marshmallow=fs.readFileSync(path.join(destination,'marshmallow-engine.js'),'utf8');
 assert.match(seasonal,/custom:frankys-seasonal-test-card/);
 assert.match(seasonal,/frankys-seasonal-test-card-editor/);
 assert.match(seasonal,/__frankysSeasonalTestController/);
 assert.match(seasonal,/frankys-seasonal-test\/calendar-config\/v1/);
 assert.match(entry,/import '\.\/frankys-seasonal-card\.js\?v=0\.4\.2'/,'isolated entry preserves its relative module filename and version');
 assert.match(legacy,/frankys-seasonal-test-christmas-renderer/);
 assert.match(legacy,/__FrankysSeasonalTestChristmasAudioV026/);
 assert.match(marshmallow,/frankys-seasonal-test-marshmallow-internal/);
 assert.match(marshmallow,/frankys-seasonal-test-marshmallow\/config\/v1/);
 assert.match(marshmallow,/frankys-seasonal-test-marshmallow\/schedule\/v2/);
 assert.match(marshmallow,/frankys-seasonal-test-marshmallow\/daily-plan\/v2/);
 assert.match(marshmallow,/frankys-seasonal-test-marshmallow-state/);
 assert.match(marshmallow,/frankys-seasonal-test-marshmallow-overlay/);
 assert.doesNotMatch(marshmallow,/frankys-seasonal-marshmallow\/(?:config|schedule|daily-plan)\//);
 assert.doesNotMatch(marshmallow,/frankys-marshmallow-(?:state|overlay)/);
 assert.doesNotMatch(seasonal,/custom:frankys-seasonal-card/);
 assert.doesNotMatch(legacy,/customElements\.define\('frankys-christmas-renderer'/);
 const manifest=JSON.parse(fs.readFileSync(path.join(destination,'test-installation.json'),'utf8'));
 assert.equal(manifest.card_type,'custom:frankys-seasonal-test-card');
 assert.throws(()=>prepareInstallation(configRoot),/refusing to overwrite/i);

 const unmarked=fs.mkdtempSync(path.join(os.tmpdir(),'seasonal-card-ha-unmarked-'));
 try{
  fs.writeFileSync(path.join(unmarked,'configuration.yaml'),'homeassistant:\n');
  assert.throws(()=>prepareInstallation(unmarked),/Refusing to install without/);
  assert.equal(fs.existsSync(path.join(unmarked,'www')),false,'Refusal does not create test files');
 }finally{
  fs.rmSync(unmarked,{recursive:true,force:true});
 }
 console.log('OK: test installer creates isolated resources and refuses unmarked or existing targets');
}finally{
 fs.rmSync(configRoot,{recursive:true,force:true});
}
