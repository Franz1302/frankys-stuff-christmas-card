const SCENES=Object.freeze({
 st_martin:new URL('./assets/St_Martin_korrigiert.webp',import.meta.url).href,
 nikolaus:new URL('./assets/Nikolaus_ohne_Wasserzeichen_transparent.webp',import.meta.url).href,
});

const SOUNDS=Object.freeze({
 nikolaus:new URL('./assets/Nikolaus_Mirelo_Ton_15s.mp3',import.meta.url).href,
});

export function getSceneURL(scene,customURL){
 return customURL||SCENES[scene]||null;
}

export function getSceneSoundURL(scene,customURL){
 return customURL||SOUNDS[scene]||null;
}

export function webpDuration(buffer){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 const tag=(at,text)=>[...text].every((letter,i)=>bytes[at+i]===letter.charCodeAt(0));
 if(bytes.length<12||!tag(0,'RIFF')||!tag(8,'WEBP')||view.getUint32(4,true)+8!==bytes.length)
   throw Error('Invalid WebP file');
 let duration=0,frames=0;
 for(let offset=12;offset+8<=bytes.length;){
   const size=view.getUint32(offset+4,true),end=offset+8+size;
   if(end>bytes.length)throw Error('Invalid WebP chunk');
   if(tag(offset,'ANMF')){
     if(size<16)throw Error('Invalid WebP animation frame');
     duration+=bytes[offset+20]+bytes[offset+21]*256+bytes[offset+22]*65536;
     frames++;
   }
   offset=end+(size%2);
   if(offset>bytes.length)throw Error('Invalid WebP padding');
 }
 if(!frames||!duration)throw Error('WebP has no playable animation');
 return duration;
}
