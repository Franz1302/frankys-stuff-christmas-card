/* Headless Chromium integration: real Howler/MP3 loading, user-gesture audio
   unlock, and multiple timed Santa flights with no fresh gesture. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright-core');
const folder=path.resolve('dist');
const pageHtml=`<!DOCTYPE html><html><head><meta charset="utf-8">
<script src="/dist/frankys-christmas-card.js"></script></head><body>
<script>
  var card=document.createElement('frankys-christmas-card');
  card.setConfig({type:'custom:frankys-christmas-card',video:false,bells:false,duration:5});
  document.body.appendChild(card);
  window.testCard=card;
</script></body></html>`;
const types={'.js':'application/javascript','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/'){res.writeHead(200,{'Content-Type':'text/html'});return res.end(pageHtml);}
  let name='';
  if(pathname==='/dist/frankys-christmas-card.js')name='frankys-christmas-card.js';
  if(pathname==='/local/community/frankys-stuff-christmas-card/santa.mp3')name='santa.mp3';
  if(!name){res.writeHead(404);return res.end('not found');}
  const file=path.join(folder,name);
  res.writeHead(200,{'Content-Type':types[path.extname(file)]});
  fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const port=server.address().port;
 let browser;
 try{
  browser=await chromium.launch({channel:'chrome',headless:true,args:['--no-sandbox','--autoplay-policy=user-gesture-required']});
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:{width:mobile?768:1280,height:mobile?1024:800},isMobile:mobile,hasTouch:mobile});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+port+'/');
   await page.locator('frankys-christmas-card').locator('#sound').click();
   await page.locator('frankys-christmas-card').locator('#toggle').click();
   await page.waitForFunction(()=>window.Howler&&window.Howler._howls.some(x=>x._state==='loaded'),undefined,{timeout:15000});
   await page.waitForFunction(()=>window.Howler.ctx&&window.Howler.ctx.state==='running',undefined,{timeout:15000});
   await page.evaluate(()=>{
    window.__santaPlays=0;window.__santaErrors=0;
    const santa=window.Howler._howls.find(x=>x._state==='loaded');
    santa.on('play',()=>window.__santaPlays++);
    santa.on('playerror',()=>window.__santaErrors++);
    // No user gesture: simulate an automatic scheduled flight.
    window.__FrankysChristmasStandaloneOwner._play();
   });
   await page.waitForFunction(()=>window.__santaPlays>=1,undefined,{timeout:9000});
   await page.evaluate(()=>{
     window.__FrankysChristmasStandaloneOwner._stop();
     window.__FrankysChristmasStandaloneOwner._play();
   });
   await page.waitForFunction(()=>window.__santaPlays>=2,undefined,{timeout:9000});
   const r=await page.evaluate(()=>({plays:window.__santaPlays,errors:window.__santaErrors,
     howlCount:window.Howler._howls.length,contextState:window.Howler.ctx.state}));
   assert.equal(r.errors,0,'Automatic Santa audio must not be blocked');
   assert.equal(r.howlCount,1,'Reuse the sound instance across flights');
   assert.equal(errors.length,0,'No page JavaScript exceptions: '+errors.join('; '));
   console.log('OK: '+(mobile?'Chromium tablet':'Chromium desktop')+' automatic voice twice, audio context running');
   await context.close();
  }
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
