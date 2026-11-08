#!/usr/bin/env node
'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');

const root=path.resolve(__dirname,'..');
const markerName='.seasonal-calendar-test-instance';
const markerValue='SEASONAL_CARD_TEST_INSTANCE';
const installName='seasonal-calendar-test';
const replacements=[
 ['frankys-seasonal-marshmallow-internal','frankys-seasonal-test-marshmallow-internal'],
 ['frankys-seasonal-card','frankys-seasonal-test-card'],
 ['frankys-christmas-renderer-editor','frankys-seasonal-test-christmas-renderer-editor'],
 ['frankys-christmas-renderer','frankys-seasonal-test-christmas-renderer'],
 ['frankys-christmas-card','frankys-seasonal-test-christmas-card'],
 ['frankys-marshmallow-editor','frankys-seasonal-test-marshmallow-editor'],
 ['frankys-seasonal-marshmallow/','frankys-seasonal-test-marshmallow/'],
 ['frankys-marshmallow-state','frankys-seasonal-test-marshmallow-state'],
 ['frankys-marshmallow-overlay','frankys-seasonal-test-marshmallow-overlay'],
 ['frankys-seasonal/controller/v1','frankys-seasonal-test/controller/v1'],
 ['frankys-seasonal/daily-plan/v1','frankys-seasonal-test/daily-plan/v1'],
 ['frankys-seasonal/calendar-config/v1','frankys-seasonal-test/calendar-config/v1'],
 ['frankys-seasonal/christmas-upgrade-note/v1','frankys-seasonal-test/christmas-upgrade-note/v1'],
 ['frankys-christmas-v1-','frankys-seasonal-test-christmas-v1-'],
 ['frankys-seasonal-changed','frankys-seasonal-test-changed'],
 ['__frankysSeasonalController','__frankysSeasonalTestController'],
 ['__frankysSeasonalMarshmallowEngine','__frankysSeasonalTestMarshmallowEngine'],
 ['__FRANKYS_SEASONAL_EMBEDDED__','__FRANKYS_SEASONAL_TEST_EMBEDDED__'],
 ['__FrankysChristmasAudioV026','__FrankysSeasonalTestChristmasAudioV026'],
 ['__FrankysBellsCrossfadeV1','__FrankysSeasonalTestBellsCrossfadeV1'],
 ['__FrankysChristmasStandaloneOwner','__FrankysSeasonalTestChristmasOwner'],
 ['__frankysHassLang','__frankysSeasonalTestHassLang'],
].sort((a,b)=>b[0].length-a[0].length);

function transformBundle(directory){
 for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
  const file=path.join(directory,entry.name);
  if(entry.isDirectory()){
   transformBundle(file);
   continue;
  }
  if(!/\.(?:m?js)$/.test(entry.name))continue;
  let source=fs.readFileSync(file,'utf8');
  for(const [from,to] of replacements)source=source.split(from).join(to);
  fs.writeFileSync(file,source,'utf8');
 }
 const entryFile=path.join(directory,'frankys-christmas-card.js');
 if(fs.existsSync(entryFile)){
  const entrySource=fs.readFileSync(entryFile,'utf8')
   .replace("import './frankys-seasonal-test-card.js';","import './frankys-seasonal-card.js';");
  fs.writeFileSync(entryFile,entrySource,'utf8');
 }
}

function prepareInstallation(configRoot){
 if(typeof configRoot!=='string'||!configRoot.trim())throw Error('Provide the isolated Home Assistant test configuration directory.');
 const absoluteConfig=path.resolve(configRoot);
 const configuration=path.join(absoluteConfig,'configuration.yaml');
 if(!fs.existsSync(configuration)||!fs.statSync(configuration).isFile())
  throw Error(`No configuration.yaml found in the target test configuration: ${absoluteConfig}`);
 const marker=path.join(absoluteConfig,markerName);
 if(!fs.existsSync(marker)||fs.readFileSync(marker,'utf8').trim()!==markerValue)
  throw Error(`Refusing to install without the ${markerName} marker set to ${markerValue}.`);

 const www=path.join(absoluteConfig,'www');
 fs.mkdirSync(www,{recursive:true});
 const destination=path.join(www,installName);
 if(fs.existsSync(destination))throw Error(`Test resource already exists; refusing to overwrite it: ${destination}`);
 const staging=path.join(www,`.${installName}-${process.pid}.tmp`);
 if(fs.existsSync(staging))throw Error(`Temporary build path already exists; refusing to overwrite it: ${staging}`);
 try{
  fs.cpSync(path.join(root,'dist'),staging,{recursive:true,errorOnExist:true});
  transformBundle(staging);
  const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  fs.writeFileSync(path.join(staging,'test-installation.json'),JSON.stringify({
   source_commit:commit,
   resource:'/local/seasonal-calendar-test/frankys-christmas-card.js',
   card_type:'custom:frankys-seasonal-test-card',
   isolation:'test-prefixed custom elements, globals, events, and browser storage',
  },null,2)+'\n','utf8');
  fs.renameSync(staging,destination);
 }catch(error){
  if(fs.existsSync(staging))fs.rmSync(staging,{recursive:true,force:true});
  throw error;
 }
 return destination;
}

if(require.main===module){
 try{
  const destination=prepareInstallation(process.argv[2]);
  console.log(`Prepared isolated Seasonal Fun Card test bundle at ${destination}`);
  console.log('Lovelace module resource: /local/seasonal-calendar-test/frankys-christmas-card.js');
  console.log('Card type: custom:frankys-seasonal-test-card');
 }catch(error){
  console.error(error.message);
  process.exitCode=1;
 }
}

module.exports={prepareInstallation,markerName,markerValue,installName};
