/* Headless Chromium integration: local asset loading and repeat Santa audio. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const os=require('node:os');
const {chromium}=require('playwright');
const {prepareInstallation,markerName,markerValue}=require('../scripts/prepare-ha-test-installation.cjs');
const root=path.resolve(__dirname,'..');
const testConfig=fs.mkdtempSync(path.join(os.tmpdir(),'seasonal-card-browser-test-'));
fs.writeFileSync(path.join(testConfig,'configuration.yaml'),'homeassistant:\n  name: Browser integration test\n');
fs.writeFileSync(path.join(testConfig,markerName),markerValue);
const testBundle=prepareInstallation(testConfig);
const pageHtml=`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<script type="module">
 import '/dist/frankys-christmas-card.js';
 import '/seasonal-calendar-test/frankys-christmas-card.js';
 await Promise.all([
  customElements.whenDefined('frankys-seasonal-card'),
  customElements.whenDefined('frankys-seasonal-test-card'),
 ]);
 const card=document.createElement('frankys-seasonal-card');
 card.setConfig({type:'custom:frankys-seasonal-card',christmas_video:false,christmas_bells:false});
 document.body.appendChild(card);
 const testCard=document.createElement('frankys-seasonal-test-card');
 testCard.setConfig({type:'custom:frankys-seasonal-test-card',christmas_video:false,christmas_bells:false});
 document.body.appendChild(testCard);
 window.testCard=card;
 window.isolatedTestCard=testCard;
 window.testReady=true;
</script></body></html>`;
const types={'.js':'application/javascript','.mjs':'application/javascript','.mp3':'audio/mpeg','.webm':'video/webm','.webp':'image/webp','.glb':'model/gltf-binary'};
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(pageHtml);}
 let base=root,name=pathname;
 if(pathname.startsWith('/seasonal-calendar-test/')){
  base=testBundle;
  name=pathname.slice('/seasonal-calendar-test'.length);
 }
 const prefix='/local/community/frankys-stuff-christmas-card/';
 if(pathname.startsWith(prefix))name='/dist/'+pathname.slice(prefix.length);
 const file=path.resolve(base,'.'+decodeURIComponent(name));
 if(!file.startsWith(base+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end('not found');}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});

(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,args:['--no-sandbox','--autoplay-policy=user-gesture-required']});
  const profiles=[
   {name:'desktop',width:1280,height:800,isMobile:false},
   {name:'tablet',width:768,height:1024,isMobile:true},
   {name:'Echo Show 15 viewport',width:1920,height:1080,isMobile:false},
  ];
  for(const profile of profiles){
   const context=await browser.newContext({
    viewport:{width:profile.width,height:profile.height},
    isMobile:profile.isMobile,hasTouch:profile.isMobile,
   });
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
   page.on('requestfailed',request=>{
    const failure=request.failure()?.errorText;
    if(failure!=='net::ERR_ABORTED')errors.push(request.url()+': '+failure);
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/');
   await page.waitForFunction(()=>window.testReady===true);
   await page.locator('frankys-seasonal-card').locator('#test').click();
   await page.waitForFunction(()=>window.Howler&&window.Howler._howls.some(x=>x._state==='loaded'),undefined,{timeout:15000});
   await page.waitForFunction(()=>window.Howler.ctx&&window.Howler.ctx.state==='running',undefined,{timeout:15000});
   await page.evaluate(()=>{
    window.__santaPlays=0;window.__santaErrors=0;
    const santa=window.Howler._howls.find(x=>x._state==='loaded');
    santa.on('play',()=>window.__santaPlays++);
    santa.on('playerror',()=>window.__santaErrors++);
    const renderer=window.__frankysSeasonalController.xmas;
    renderer._stop();
    renderer._play();
   });
   await page.waitForFunction(()=>window.__santaPlays>=1,undefined,{timeout:9000});
   await page.evaluate(()=>{
    const renderer=window.__frankysSeasonalController.xmas;
    renderer._stop();
    renderer._play();
   });
   await page.waitForFunction(()=>window.__santaPlays>=2,undefined,{timeout:9000});
   const result=await page.evaluate(()=>({plays:window.__santaPlays,errors:window.__santaErrors,
    howls:window.Howler._howls.length,contextState:window.Howler.ctx.state}));
   assert.equal(result.errors,0,'Automatic Santa audio must not be blocked');
   assert.equal(result.howls,1,'Reuse the sound instance across flights');
   assert.equal(errors.length,0,'No page JavaScript exceptions: '+errors.join('; '));
   const stMartin=await page.evaluate(async()=>{
    const ctrl=window.__frankysSeasonalController;
    const before={width:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight};
    ctrl.setState({season:'st_martin'});
    await ctrl.play();
    const image=ctrl.imageScene;
    const result={playing:ctrl.busy,imageLoaded:image.complete&&image.naturalWidth>0,
     fitsViewport:getComputedStyle(image).objectFit==='contain',
     widthUnchanged:document.documentElement.scrollWidth===before.width,
     heightUnchanged:document.documentElement.scrollHeight===before.height};
    ctrl.stop();
    result.cleaned=!ctrl.imageScene&&!document.querySelector('body > img[aria-hidden="true"]');
    return result;
   });
   assert.equal(stMartin.playing,true,'Bundled St. Martin scene starts');
   assert.equal(stMartin.imageLoaded,true,'Bundled animated WebP loads in Chromium');
   assert.equal(stMartin.fitsViewport,true,'St. Martin image scales to the viewport');
   assert(stMartin.widthUnchanged&&stMartin.heightUnchanged,'St. Martin overlay adds no scrollbars');
   assert.equal(stMartin.cleaned,true,'Stop removes St. Martin overlay');
   assert.equal(errors.length,0,'St. Martin playback has no browser errors: '+errors.join('; '));
   const parallel=await page.evaluate(async()=>{
    const regular=window.__frankysSeasonalController,test=window.__frankysSeasonalTestController;
    const card=window.isolatedTestCard;
    test.setState({season:'st_martin'});
    await test.play();
    const image=test.imageScene;
    const result={regularTag:document.querySelector('frankys-seasonal-card')?.localName,
     isolatedTag:card.localName,distinctControllers:regular!==test,
     distinctStorage:regular.config.seasonal_calendar!==test.config.seasonal_calendar,
     imageLoaded:image.complete&&image.naturalWidth>0,
     registeredBoth:customElements.get('frankys-seasonal-card')!==customElements.get('frankys-seasonal-test-card')};
    test.stop();
    result.cleaned=!test.imageScene;
    return result;
   });
   assert.equal(parallel.regularTag,'frankys-seasonal-card');
   assert.equal(parallel.isolatedTag,'frankys-seasonal-test-card');
   assert.equal(parallel.distinctControllers,true,'Parallel bundles use distinct runtime controllers');
   assert.equal(parallel.distinctStorage,true);
   assert.equal(parallel.registeredBoth,true,'Parallel bundles register distinct custom elements');
   assert.equal(parallel.imageLoaded,true,'Isolated resource loads its copied St. Martin animation');
   assert.equal(parallel.cleaned,true);
   assert.equal(errors.length,0,'Parallel test bundle has no browser errors: '+errors.join('; '));
   const seasonalCard=page.locator('frankys-seasonal-card');
   await seasonalCard.locator('#options').click();
   await seasonalCard.locator('#calendar-details summary').click();
   assert.equal(await seasonalCard.locator('#calendar-details').evaluate(el=>el.open),true,'Calendar opens inside existing Options');
   assert.equal(await seasonalCard.locator('#options-panel').isVisible(),true,'Existing Options popup remains expanded');
   await seasonalCard.locator('#calendar-enabled').check();
   const start=seasonalCard.locator('[data-calendar-holiday="st_martin"][data-field="start"]');
   await start.fill('09.11');
   await start.press('Tab');
   const saved=await page.evaluate(()=>({
     calendar:window.__frankysSeasonalController.config.seasonal_calendar,
     override:localStorage.getItem('frankys-seasonal/calendar-override/v1'),
     isolated:localStorage.getItem('frankys-seasonal-test/calendar-override/v1')
   }));
   assert.equal(saved.calendar.enabled,true,'In-card setting enables annual calendar');
   assert.equal(saved.calendar.holidays.st_martin.start,'11-09','Date field accepts DD.MM');
   assert(saved.override,'Calendar changes are saved to browser storage');
   assert.equal(saved.isolated,null,'Regular calendar does not overwrite test calendar');
   await seasonalCard.locator('#calendar-details summary').click();
   assert.equal(await seasonalCard.locator('#calendar-details').evaluate(el=>el.open),false,'Calendar closes normally');
   assert.equal(await seasonalCard.locator('#options-panel').isVisible(),true,'Closing calendar preserves Options');
   await page.reload();
   await page.waitForFunction(()=>window.testReady===true);
   const restored=await page.evaluate(()=>window.__frankysSeasonalController.config.seasonal_calendar);
   assert.equal(restored.enabled,true,'Calendar survives browser reload');
   assert.equal(restored.holidays.st_martin.start,'11-09','Saved date survives browser reload');
   console.log('OK: '+profile.name+' Chromium profile, Christmas audio and parallel isolated St. Martin bundle');
   await context.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
   fs.rmSync(testConfig,{recursive:true,force:true});
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
