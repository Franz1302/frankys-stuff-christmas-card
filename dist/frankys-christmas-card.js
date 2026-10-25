/* Howler.js v2.2.4 (MIT, James Simpson / GoldFire Studios).
 * See THIRD_PARTY_LICENSES.md. Bundled to work offline as one HACS resource. */
if(typeof window!=='undefined'&&(!window.Howler||!window.Howl)){
/*! howler.js v2.2.4 | (c) 2013-2020, James Simpson of GoldFire Studios | MIT License | howlerjs.com */
!function(){"use strict";var e=function(){this.init()};e.prototype={init:function(){var e=this||n;return e._counter=1e3,e._html5AudioPool=[],e.html5PoolSize=10,e._codecs={},e._howls=[],e._muted=!1,e._volume=1,e._canPlayEvent="canplaythrough",e._navigator="undefined"!=typeof window&&window.navigator?window.navigator:null,e.masterGain=null,e.noAudio=!1,e.usingWebAudio=!0,e.autoSuspend=!0,e.ctx=null,e.autoUnlock=!0,e._setup(),e},volume:function(e){var o=this||n;if(e=parseFloat(e),o.ctx||_(),void 0!==e&&e>=0&&e<=1){if(o._volume=e,o._muted)return o;o.usingWebAudio&&o.masterGain.gain.setValueAtTime(e,n.ctx.currentTime);for(var t=0;t<o._howls.length;t++)if(!o._howls[t]._webAudio)for(var r=o._howls[t]._getSoundIds(),a=0;a<r.length;a++){var u=o._howls[t]._soundById(r[a]);u&&u._node&&(u._node.volume=u._volume*e)}return o}return o._volume},mute:function(e){var o=this||n;o.ctx||_(),o._muted=e,o.usingWebAudio&&o.masterGain.gain.setValueAtTime(e?0:o._volume,n.ctx.currentTime);for(var t=0;t<o._howls.length;t++)if(!o._howls[t]._webAudio)for(var r=o._howls[t]._getSoundIds(),a=0;a<r.length;a++){var u=o._howls[t]._soundById(r[a]);u&&u._node&&(u._node.muted=!!e||u._muted)}return o},stop:function(){for(var e=this||n,o=0;o<e._howls.length;o++)e._howls[o].stop();return e},unload:function(){for(var e=this||n,o=e._howls.length-1;o>=0;o--)e._howls[o].unload();return e.usingWebAudio&&e.ctx&&void 0!==e.ctx.close&&(e.ctx.close(),e.ctx=null,_()),e},codecs:function(e){return(this||n)._codecs[e.replace(/^x-/,"")]},_setup:function(){var e=this||n;if(e.state=e.ctx?e.ctx.state||"suspended":"suspended",e._autoSuspend(),!e.usingWebAudio)if("undefined"!=typeof Audio)try{var o=new Audio;void 0===o.oncanplaythrough&&(e._canPlayEvent="canplay")}catch(n){e.noAudio=!0}else e.noAudio=!0;try{var o=new Audio;o.muted&&(e.noAudio=!0)}catch(e){}return e.noAudio||e._setupCodecs(),e},_setupCodecs:function(){var e=this||n,o=null;try{o="undefined"!=typeof Audio?new Audio:null}catch(n){return e}if(!o||"function"!=typeof o.canPlayType)return e;var t=o.canPlayType("audio/mpeg;").replace(/^no$/,""),r=e._navigator?e._navigator.userAgent:"",a=r.match(/OPR\/(\d+)/g),u=a&&parseInt(a[0].split("/")[1],10)<33,d=-1!==r.indexOf("Safari")&&-1===r.indexOf("Chrome"),i=r.match(/Version\/(.*?) /),_=d&&i&&parseInt(i[1],10)<15;return e._codecs={mp3:!(u||!t&&!o.canPlayType("audio/mp3;").replace(/^no$/,"")),mpeg:!!t,opus:!!o.canPlayType('audio/ogg; codecs="opus"').replace(/^no$/,""),ogg:!!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),oga:!!o.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),wav:!!(o.canPlayType('audio/wav; codecs="1"')||o.canPlayType("audio/wav")).replace(/^no$/,""),aac:!!o.canPlayType("audio/aac;").replace(/^no$/,""),caf:!!o.canPlayType("audio/x-caf;").replace(/^no$/,""),m4a:!!(o.canPlayType("audio/x-m4a;")||o.canPlayType("audio/m4a;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),m4b:!!(o.canPlayType("audio/x-m4b;")||o.canPlayType("audio/m4b;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),mp4:!!(o.canPlayType("audio/x-mp4;")||o.canPlayType("audio/mp4;")||o.canPlayType("audio/aac;")).replace(/^no$/,""),weba:!(_||!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),webm:!(_||!o.canPlayType('audio/webm; codecs="vorbis"').replace(/^no$/,"")),dolby:!!o.canPlayType('audio/mp4; codecs="ec-3"').replace(/^no$/,""),flac:!!(o.canPlayType("audio/x-flac;")||o.canPlayType("audio/flac;")).replace(/^no$/,"")},e},_unlockAudio:function(){var e=this||n;if(!e._audioUnlocked&&e.ctx){e._audioUnlocked=!1,e.autoUnlock=!1,e._mobileUnloaded||44100===e.ctx.sampleRate||(e._mobileUnloaded=!0,e.unload()),e._scratchBuffer=e.ctx.createBuffer(1,1,22050);var o=function(n){for(;e._html5AudioPool.length<e.html5PoolSize;)try{var t=new Audio;t._unlocked=!0,e._releaseHtml5Audio(t)}catch(n){e.noAudio=!0;break}for(var r=0;r<e._howls.length;r++)if(!e._howls[r]._webAudio)for(var a=e._howls[r]._getSoundIds(),u=0;u<a.length;u++){var d=e._howls[r]._soundById(a[u]);d&&d._node&&!d._node._unlocked&&(d._node._unlocked=!0,d._node.load())}e._autoResume();var i=e.ctx.createBufferSource();i.buffer=e._scratchBuffer,i.connect(e.ctx.destination),void 0===i.start?i.noteOn(0):i.start(0),"function"==typeof e.ctx.resume&&e.ctx.resume(),i.onended=function(){i.disconnect(0),e._audioUnlocked=!0,document.removeEventListener("touchstart",o,!0),document.removeEventListener("touchend",o,!0),document.removeEventListener("click",o,!0),document.removeEventListener("keydown",o,!0);for(var n=0;n<e._howls.length;n++)e._howls[n]._emit("unlock")}};return document.addEventListener("touchstart",o,!0),document.addEventListener("touchend",o,!0),document.addEventListener("click",o,!0),document.addEventListener("keydown",o,!0),e}},_obtainHtml5Audio:function(){var e=this||n;if(e._html5AudioPool.length)return e._html5AudioPool.pop();var o=(new Audio).play();return o&&"undefined"!=typeof Promise&&(o instanceof Promise||"function"==typeof o.then)&&o.catch(function(){console.warn("HTML5 Audio pool exhausted, returning potentially locked audio object.")}),new Audio},_releaseHtml5Audio:function(e){var o=this||n;return e._unlocked&&o._html5AudioPool.push(e),o},_autoSuspend:function(){var e=this;if(e.autoSuspend&&e.ctx&&void 0!==e.ctx.suspend&&n.usingWebAudio){for(var o=0;o<e._howls.length;o++)if(e._howls[o]._webAudio)for(var t=0;t<e._howls[o]._sounds.length;t++)if(!e._howls[o]._sounds[t]._paused)return e;return e._suspendTimer&&clearTimeout(e._suspendTimer),e._suspendTimer=setTimeout(function(){if(e.autoSuspend){e._suspendTimer=null,e.state="suspending";var n=function(){e.state="suspended",e._resumeAfterSuspend&&(delete e._resumeAfterSuspend,e._autoResume())};e.ctx.suspend().then(n,n)}},3e4),e}},_autoResume:function(){var e=this;if(e.ctx&&void 0!==e.ctx.resume&&n.usingWebAudio)return"running"===e.state&&"interrupted"!==e.ctx.state&&e._suspendTimer?(clearTimeout(e._suspendTimer),e._suspendTimer=null):"suspended"===e.state||"running"===e.state&&"interrupted"===e.ctx.state?(e.ctx.resume().then(function(){e.state="running";for(var n=0;n<e._howls.length;n++)e._howls[n]._emit("resume")}),e._suspendTimer&&(clearTimeout(e._suspendTimer),e._suspendTimer=null)):"suspending"===e.state&&(e._resumeAfterSuspend=!0),e}};var n=new e,o=function(e){var n=this;if(!e.src||0===e.src.length)return void console.error("An array of source files must be passed with any new Howl.");n.init(e)};o.prototype={init:function(e){var o=this;return n.ctx||_(),o._autoplay=e.autoplay||!1,o._format="string"!=typeof e.format?e.format:[e.format],o._html5=e.html5||!1,o._muted=e.mute||!1,o._loop=e.loop||!1,o._pool=e.pool||5,o._preload="boolean"!=typeof e.preload&&"metadata"!==e.preload||e.preload,o._rate=e.rate||1,o._sprite=e.sprite||{},o._src="string"!=typeof e.src?e.src:[e.src],o._volume=void 0!==e.volume?e.volume:1,o._xhr={method:e.xhr&&e.xhr.method?e.xhr.method:"GET",headers:e.xhr&&e.xhr.headers?e.xhr.headers:null,withCredentials:!(!e.xhr||!e.xhr.withCredentials)&&e.xhr.withCredentials},o._duration=0,o._state="unloaded",o._sounds=[],o._endTimers={},o._queue=[],o._playLock=!1,o._onend=e.onend?[{fn:e.onend}]:[],o._onfade=e.onfade?[{fn:e.onfade}]:[],o._onload=e.onload?[{fn:e.onload}]:[],o._onloaderror=e.onloaderror?[{fn:e.onloaderror}]:[],o._onplayerror=e.onplayerror?[{fn:e.onplayerror}]:[],o._onpause=e.onpause?[{fn:e.onpause}]:[],o._onplay=e.onplay?[{fn:e.onplay}]:[],o._onstop=e.onstop?[{fn:e.onstop}]:[],o._onmute=e.onmute?[{fn:e.onmute}]:[],o._onvolume=e.onvolume?[{fn:e.onvolume}]:[],o._onrate=e.onrate?[{fn:e.onrate}]:[],o._onseek=e.onseek?[{fn:e.onseek}]:[],o._onunlock=e.onunlock?[{fn:e.onunlock}]:[],o._onresume=[],o._webAudio=n.usingWebAudio&&!o._html5,void 0!==n.ctx&&n.ctx&&n.autoUnlock&&n._unlockAudio(),n._howls.push(o),o._autoplay&&o._queue.push({event:"play",action:function(){o.play()}}),o._preload&&"none"!==o._preload&&o.load(),o},load:function(){var e=this,o=null;if(n.noAudio)return void e._emit("loaderror",null,"No audio support.");"string"==typeof e._src&&(e._src=[e._src]);for(var r=0;r<e._src.length;r++){var u,d;if(e._format&&e._format[r])u=e._format[r];else{if("string"!=typeof(d=e._src[r])){e._emit("loaderror",null,"Non-string found in selected audio sources - ignoring.");continue}u=/^data:audio\/([^;,]+);/i.exec(d),u||(u=/\.([^.]+)$/.exec(d.split("?",1)[0])),u&&(u=u[1].toLowerCase())}if(u||console.warn('No file extension was found. Consider using the "format" property or specify an extension.'),u&&n.codecs(u)){o=e._src[r];break}}return o?(e._src=o,e._state="loading","https:"===window.location.protocol&&"http:"===o.slice(0,5)&&(e._html5=!0,e._webAudio=!1),new t(e),e._webAudio&&a(e),e):void e._emit("loaderror",null,"No codec support for selected audio sources.")},play:function(e,o){var t=this,r=null;if("number"==typeof e)r=e,e=null;else{if("string"==typeof e&&"loaded"===t._state&&!t._sprite[e])return null;if(void 0===e&&(e="__default",!t._playLock)){for(var a=0,u=0;u<t._sounds.length;u++)t._sounds[u]._paused&&!t._sounds[u]._ended&&(a++,r=t._sounds[u]._id);1===a?e=null:r=null}}var d=r?t._soundById(r):t._inactiveSound();if(!d)return null;if(r&&!e&&(e=d._sprite||"__default"),"loaded"!==t._state){d._sprite=e,d._ended=!1;var i=d._id;return t._queue.push({event:"play",action:function(){t.play(i)}}),i}if(r&&!d._paused)return o||t._loadQueue("play"),d._id;t._webAudio&&n._autoResume();var _=Math.max(0,d._seek>0?d._seek:t._sprite[e][0]/1e3),s=Math.max(0,(t._sprite[e][0]+t._sprite[e][1])/1e3-_),l=1e3*s/Math.abs(d._rate),c=t._sprite[e][0]/1e3,f=(t._sprite[e][0]+t._sprite[e][1])/1e3;d._sprite=e,d._ended=!1;var p=function(){d._paused=!1,d._seek=_,d._start=c,d._stop=f,d._loop=!(!d._loop&&!t._sprite[e][2])};if(_>=f)return void t._ended(d);var m=d._node;if(t._webAudio){var v=function(){t._playLock=!1,p(),t._refreshBuffer(d);var e=d._muted||t._muted?0:d._volume;m.gain.setValueAtTime(e,n.ctx.currentTime),d._playStart=n.ctx.currentTime,void 0===m.bufferSource.start?d._loop?m.bufferSource.noteGrainOn(0,_,86400):m.bufferSource.noteGrainOn(0,_,s):d._loop?m.bufferSource.start(0,_,86400):m.bufferSource.start(0,_,s),l!==1/0&&(t._endTimers[d._id]=setTimeout(t._ended.bind(t,d),l)),o||setTimeout(function(){t._emit("play",d._id),t._loadQueue()},0)};"running"===n.state&&"interrupted"!==n.ctx.state?v():(t._playLock=!0,t.once("resume",v),t._clearTimer(d._id))}else{var h=function(){m.currentTime=_,m.muted=d._muted||t._muted||n._muted||m.muted,m.volume=d._volume*n.volume(),m.playbackRate=d._rate;try{var r=m.play();if(r&&"undefined"!=typeof Promise&&(r instanceof Promise||"function"==typeof r.then)?(t._playLock=!0,p(),r.then(function(){t._playLock=!1,m._unlocked=!0,o?t._loadQueue():t._emit("play",d._id)}).catch(function(){t._playLock=!1,t._emit("playerror",d._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction."),d._ended=!0,d._paused=!0})):o||(t._playLock=!1,p(),t._emit("play",d._id)),m.playbackRate=d._rate,m.paused)return void t._emit("playerror",d._id,"Playback was unable to start. This is most commonly an issue on mobile devices and Chrome where playback was not within a user interaction.");"__default"!==e||d._loop?t._endTimers[d._id]=setTimeout(t._ended.bind(t,d),l):(t._endTimers[d._id]=function(){t._ended(d),m.removeEventListener("ended",t._endTimers[d._id],!1)},m.addEventListener("ended",t._endTimers[d._id],!1))}catch(e){t._emit("playerror",d._id,e)}};"data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA"===m.src&&(m.src=t._src,m.load());var y=window&&window.ejecta||!m.readyState&&n._navigator.isCocoonJS;if(m.readyState>=3||y)h();else{t._playLock=!0,t._state="loading";var g=function(){t._state="loaded",h(),m.removeEventListener(n._canPlayEvent,g,!1)};m.addEventListener(n._canPlayEvent,g,!1),t._clearTimer(d._id)}}return d._id},pause:function(e){var n=this;if("loaded"!==n._state||n._playLock)return n._queue.push({event:"pause",action:function(){n.pause(e)}}),n;for(var o=n._getSoundIds(e),t=0;t<o.length;t++){n._clearTimer(o[t]);var r=n._soundById(o[t]);if(r&&!r._paused&&(r._seek=n.seek(o[t]),r._rateSeek=0,r._paused=!0,n._stopFade(o[t]),r._node))if(n._webAudio){if(!r._node.bufferSource)continue;void 0===r._node.bufferSource.stop?r._node.bufferSource.noteOff(0):r._node.bufferSource.stop(0),n._cleanBuffer(r._node)}else isNaN(r._node.duration)&&r._node.duration!==1/0||r._node.pause();arguments[1]||n._emit("pause",r?r._id:null)}return n},stop:function(e,n){var o=this;if("loaded"!==o._state||o._playLock)return o._queue.push({event:"stop",action:function(){o.stop(e)}}),o;for(var t=o._getSoundIds(e),r=0;r<t.length;r++){o._clearTimer(t[r]);var a=o._soundById(t[r]);a&&(a._seek=a._start||0,a._rateSeek=0,a._paused=!0,a._ended=!0,o._stopFade(t[r]),a._node&&(o._webAudio?a._node.bufferSource&&(void 0===a._node.bufferSource.stop?a._node.bufferSource.noteOff(0):a._node.bufferSource.stop(0),o._cleanBuffer(a._node)):isNaN(a._node.duration)&&a._node.duration!==1/0||(a._node.currentTime=a._start||0,a._node.pause(),a._node.duration===1/0&&o._clearSound(a._node))),n||o._emit("stop",a._id))}return o},mute:function(e,o){var t=this;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"mute",action:function(){t.mute(e,o)}}),t;if(void 0===o){if("boolean"!=typeof e)return t._muted;t._muted=e}for(var r=t._getSoundIds(o),a=0;a<r.length;a++){var u=t._soundById(r[a]);u&&(u._muted=e,u._interval&&t._stopFade(u._id),t._webAudio&&u._node?u._node.gain.setValueAtTime(e?0:u._volume,n.ctx.currentTime):u._node&&(u._node.muted=!!n._muted||e),t._emit("mute",u._id))}return t},volume:function(){var e,o,t=this,r=arguments;if(0===r.length)return t._volume;if(1===r.length||2===r.length&&void 0===r[1]){t._getSoundIds().indexOf(r[0])>=0?o=parseInt(r[0],10):e=parseFloat(r[0])}else r.length>=2&&(e=parseFloat(r[0]),o=parseInt(r[1],10));var a;if(!(void 0!==e&&e>=0&&e<=1))return a=o?t._soundById(o):t._sounds[0],a?a._volume:0;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"volume",action:function(){t.volume.apply(t,r)}}),t;void 0===o&&(t._volume=e),o=t._getSoundIds(o);for(var u=0;u<o.length;u++)(a=t._soundById(o[u]))&&(a._volume=e,r[2]||t._stopFade(o[u]),t._webAudio&&a._node&&!a._muted?a._node.gain.setValueAtTime(e,n.ctx.currentTime):a._node&&!a._muted&&(a._node.volume=e*n.volume()),t._emit("volume",a._id));return t},fade:function(e,o,t,r){var a=this;if("loaded"!==a._state||a._playLock)return a._queue.push({event:"fade",action:function(){a.fade(e,o,t,r)}}),a;e=Math.min(Math.max(0,parseFloat(e)),1),o=Math.min(Math.max(0,parseFloat(o)),1),t=parseFloat(t),a.volume(e,r);for(var u=a._getSoundIds(r),d=0;d<u.length;d++){var i=a._soundById(u[d]);if(i){if(r||a._stopFade(u[d]),a._webAudio&&!i._muted){var _=n.ctx.currentTime,s=_+t/1e3;i._volume=e,i._node.gain.setValueAtTime(e,_),i._node.gain.linearRampToValueAtTime(o,s)}a._startFadeInterval(i,e,o,t,u[d],void 0===r)}}return a},_startFadeInterval:function(e,n,o,t,r,a){var u=this,d=n,i=o-n,_=Math.abs(i/.01),s=Math.max(4,_>0?t/_:t),l=Date.now();e._fadeTo=o,e._interval=setInterval(function(){var r=(Date.now()-l)/t;l=Date.now(),d+=i*r,d=Math.round(100*d)/100,d=i<0?Math.max(o,d):Math.min(o,d),u._webAudio?e._volume=d:u.volume(d,e._id,!0),a&&(u._volume=d),(o<n&&d<=o||o>n&&d>=o)&&(clearInterval(e._interval),e._interval=null,e._fadeTo=null,u.volume(o,e._id),u._emit("fade",e._id))},s)},_stopFade:function(e){var o=this,t=o._soundById(e);return t&&t._interval&&(o._webAudio&&t._node.gain.cancelScheduledValues(n.ctx.currentTime),clearInterval(t._interval),t._interval=null,o.volume(t._fadeTo,e),t._fadeTo=null,o._emit("fade",e)),o},loop:function(){var e,n,o,t=this,r=arguments;if(0===r.length)return t._loop;if(1===r.length){if("boolean"!=typeof r[0])return!!(o=t._soundById(parseInt(r[0],10)))&&o._loop;e=r[0],t._loop=e}else 2===r.length&&(e=r[0],n=parseInt(r[1],10));for(var a=t._getSoundIds(n),u=0;u<a.length;u++)(o=t._soundById(a[u]))&&(o._loop=e,t._webAudio&&o._node&&o._node.bufferSource&&(o._node.bufferSource.loop=e,e&&(o._node.bufferSource.loopStart=o._start||0,o._node.bufferSource.loopEnd=o._stop,t.playing(a[u])&&(t.pause(a[u],!0),t.play(a[u],!0)))));return t},rate:function(){var e,o,t=this,r=arguments;if(0===r.length)o=t._sounds[0]._id;else if(1===r.length){var a=t._getSoundIds(),u=a.indexOf(r[0]);u>=0?o=parseInt(r[0],10):e=parseFloat(r[0])}else 2===r.length&&(e=parseFloat(r[0]),o=parseInt(r[1],10));var d;if("number"!=typeof e)return d=t._soundById(o),d?d._rate:t._rate;if("loaded"!==t._state||t._playLock)return t._queue.push({event:"rate",action:function(){t.rate.apply(t,r)}}),t;void 0===o&&(t._rate=e),o=t._getSoundIds(o);for(var i=0;i<o.length;i++)if(d=t._soundById(o[i])){t.playing(o[i])&&(d._rateSeek=t.seek(o[i]),d._playStart=t._webAudio?n.ctx.currentTime:d._playStart),d._rate=e,t._webAudio&&d._node&&d._node.bufferSource?d._node.bufferSource.playbackRate.setValueAtTime(e,n.ctx.currentTime):d._node&&(d._node.playbackRate=e);var _=t.seek(o[i]),s=(t._sprite[d._sprite][0]+t._sprite[d._sprite][1])/1e3-_,l=1e3*s/Math.abs(d._rate);!t._endTimers[o[i]]&&d._paused||(t._clearTimer(o[i]),t._endTimers[o[i]]=setTimeout(t._ended.bind(t,d),l)),t._emit("rate",d._id)}return t},seek:function(){var e,o,t=this,r=arguments;if(0===r.length)t._sounds.length&&(o=t._sounds[0]._id);else if(1===r.length){var a=t._getSoundIds(),u=a.indexOf(r[0]);u>=0?o=parseInt(r[0],10):t._sounds.length&&(o=t._sounds[0]._id,e=parseFloat(r[0]))}else 2===r.length&&(e=parseFloat(r[0]),o=parseInt(r[1],10));if(void 0===o)return 0;if("number"==typeof e&&("loaded"!==t._state||t._playLock))return t._queue.push({event:"seek",action:function(){t.seek.apply(t,r)}}),t;var d=t._soundById(o);if(d){if(!("number"==typeof e&&e>=0)){if(t._webAudio){var i=t.playing(o)?n.ctx.currentTime-d._playStart:0,_=d._rateSeek?d._rateSeek-d._seek:0;return d._seek+(_+i*Math.abs(d._rate))}return d._node.currentTime}var s=t.playing(o);s&&t.pause(o,!0),d._seek=e,d._ended=!1,t._clearTimer(o),t._webAudio||!d._node||isNaN(d._node.duration)||(d._node.currentTime=e);var l=function(){s&&t.play(o,!0),t._emit("seek",o)};if(s&&!t._webAudio){var c=function(){t._playLock?setTimeout(c,0):l()};setTimeout(c,0)}else l()}return t},playing:function(e){var n=this;if("number"==typeof e){var o=n._soundById(e);return!!o&&!o._paused}for(var t=0;t<n._sounds.length;t++)if(!n._sounds[t]._paused)return!0;return!1},duration:function(e){var n=this,o=n._duration,t=n._soundById(e);return t&&(o=n._sprite[t._sprite][1]/1e3),o},state:function(){return this._state},unload:function(){for(var e=this,o=e._sounds,t=0;t<o.length;t++)o[t]._paused||e.stop(o[t]._id),e._webAudio||(e._clearSound(o[t]._node),o[t]._node.removeEventListener("error",o[t]._errorFn,!1),o[t]._node.removeEventListener(n._canPlayEvent,o[t]._loadFn,!1),o[t]._node.removeEventListener("ended",o[t]._endFn,!1),n._releaseHtml5Audio(o[t]._node)),delete o[t]._node,e._clearTimer(o[t]._id);var a=n._howls.indexOf(e);a>=0&&n._howls.splice(a,1);var u=!0;for(t=0;t<n._howls.length;t++)if(n._howls[t]._src===e._src||e._src.indexOf(n._howls[t]._src)>=0){u=!1;break}return r&&u&&delete r[e._src],n.noAudio=!1,e._state="unloaded",e._sounds=[],e=null,null},on:function(e,n,o,t){var r=this,a=r["_on"+e];return"function"==typeof n&&a.push(t?{id:o,fn:n,once:t}:{id:o,fn:n}),r},off:function(e,n,o){var t=this,r=t["_on"+e],a=0;if("number"==typeof n&&(o=n,n=null),n||o)for(a=0;a<r.length;a++){var u=o===r[a].id;if(n===r[a].fn&&u||!n&&u){r.splice(a,1);break}}else if(e)t["_on"+e]=[];else{var d=Object.keys(t);for(a=0;a<d.length;a++)0===d[a].indexOf("_on")&&Array.isArray(t[d[a]])&&(t[d[a]]=[])}return t},once:function(e,n,o){var t=this;return t.on(e,n,o,1),t},_emit:function(e,n,o){for(var t=this,r=t["_on"+e],a=r.length-1;a>=0;a--)r[a].id&&r[a].id!==n&&"load"!==e||(setTimeout(function(e){e.call(this,n,o)}.bind(t,r[a].fn),0),r[a].once&&t.off(e,r[a].fn,r[a].id));return t._loadQueue(e),t},_loadQueue:function(e){var n=this;if(n._queue.length>0){var o=n._queue[0];o.event===e&&(n._queue.shift(),n._loadQueue()),e||o.action()}return n},_ended:function(e){var o=this,t=e._sprite;if(!o._webAudio&&e._node&&!e._node.paused&&!e._node.ended&&e._node.currentTime<e._stop)return setTimeout(o._ended.bind(o,e),100),o;var r=!(!e._loop&&!o._sprite[t][2]);if(o._emit("end",e._id),!o._webAudio&&r&&o.stop(e._id,!0).play(e._id),o._webAudio&&r){o._emit("play",e._id),e._seek=e._start||0,e._rateSeek=0,e._playStart=n.ctx.currentTime;var a=1e3*(e._stop-e._start)/Math.abs(e._rate);o._endTimers[e._id]=setTimeout(o._ended.bind(o,e),a)}return o._webAudio&&!r&&(e._paused=!0,e._ended=!0,e._seek=e._start||0,e._rateSeek=0,o._clearTimer(e._id),o._cleanBuffer(e._node),n._autoSuspend()),o._webAudio||r||o.stop(e._id,!0),o},_clearTimer:function(e){var n=this;if(n._endTimers[e]){if("function"!=typeof n._endTimers[e])clearTimeout(n._endTimers[e]);else{var o=n._soundById(e);o&&o._node&&o._node.removeEventListener("ended",n._endTimers[e],!1)}delete n._endTimers[e]}return n},_soundById:function(e){for(var n=this,o=0;o<n._sounds.length;o++)if(e===n._sounds[o]._id)return n._sounds[o];return null},_inactiveSound:function(){var e=this;e._drain();for(var n=0;n<e._sounds.length;n++)if(e._sounds[n]._ended)return e._sounds[n].reset();return new t(e)},_drain:function(){var e=this,n=e._pool,o=0,t=0;if(!(e._sounds.length<n)){for(t=0;t<e._sounds.length;t++)e._sounds[t]._ended&&o++;for(t=e._sounds.length-1;t>=0;t--){if(o<=n)return;e._sounds[t]._ended&&(e._webAudio&&e._sounds[t]._node&&e._sounds[t]._node.disconnect(0),e._sounds.splice(t,1),o--)}}},_getSoundIds:function(e){var n=this;if(void 0===e){for(var o=[],t=0;t<n._sounds.length;t++)o.push(n._sounds[t]._id);return o}return[e]},_refreshBuffer:function(e){var o=this;return e._node.bufferSource=n.ctx.createBufferSource(),e._node.bufferSource.buffer=r[o._src],e._panner?e._node.bufferSource.connect(e._panner):e._node.bufferSource.connect(e._node),e._node.bufferSource.loop=e._loop,e._loop&&(e._node.bufferSource.loopStart=e._start||0,e._node.bufferSource.loopEnd=e._stop||0),e._node.bufferSource.playbackRate.setValueAtTime(e._rate,n.ctx.currentTime),o},_cleanBuffer:function(e){var o=this,t=n._navigator&&n._navigator.vendor.indexOf("Apple")>=0;if(!e.bufferSource)return o;if(n._scratchBuffer&&e.bufferSource&&(e.bufferSource.onended=null,e.bufferSource.disconnect(0),t))try{e.bufferSource.buffer=n._scratchBuffer}catch(e){}return e.bufferSource=null,o},_clearSound:function(e){/MSIE |Trident\//.test(n._navigator&&n._navigator.userAgent)||(e.src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA")}};var t=function(e){this._parent=e,this.init()};t.prototype={init:function(){var e=this,o=e._parent;return e._muted=o._muted,e._loop=o._loop,e._volume=o._volume,e._rate=o._rate,e._seek=0,e._paused=!0,e._ended=!0,e._sprite="__default",e._id=++n._counter,o._sounds.push(e),e.create(),e},create:function(){var e=this,o=e._parent,t=n._muted||e._muted||e._parent._muted?0:e._volume;return o._webAudio?(e._node=void 0===n.ctx.createGain?n.ctx.createGainNode():n.ctx.createGain(),e._node.gain.setValueAtTime(t,n.ctx.currentTime),e._node.paused=!0,e._node.connect(n.masterGain)):n.noAudio||(e._node=n._obtainHtml5Audio(),e._errorFn=e._errorListener.bind(e),e._node.addEventListener("error",e._errorFn,!1),e._loadFn=e._loadListener.bind(e),e._node.addEventListener(n._canPlayEvent,e._loadFn,!1),e._endFn=e._endListener.bind(e),e._node.addEventListener("ended",e._endFn,!1),e._node.src=o._src,e._node.preload=!0===o._preload?"auto":o._preload,e._node.volume=t*n.volume(),e._node.load()),e},reset:function(){var e=this,o=e._parent;return e._muted=o._muted,e._loop=o._loop,e._volume=o._volume,e._rate=o._rate,e._seek=0,e._rateSeek=0,e._paused=!0,e._ended=!0,e._sprite="__default",e._id=++n._counter,e},_errorListener:function(){var e=this;e._parent._emit("loaderror",e._id,e._node.error?e._node.error.code:0),e._node.removeEventListener("error",e._errorFn,!1)},_loadListener:function(){var e=this,o=e._parent;o._duration=Math.ceil(10*e._node.duration)/10,0===Object.keys(o._sprite).length&&(o._sprite={__default:[0,1e3*o._duration]}),"loaded"!==o._state&&(o._state="loaded",o._emit("load"),o._loadQueue()),e._node.removeEventListener(n._canPlayEvent,e._loadFn,!1)},_endListener:function(){var e=this,n=e._parent;n._duration===1/0&&(n._duration=Math.ceil(10*e._node.duration)/10,n._sprite.__default[1]===1/0&&(n._sprite.__default[1]=1e3*n._duration),n._ended(e)),e._node.removeEventListener("ended",e._endFn,!1)}};var r={},a=function(e){var n=e._src;if(r[n])return e._duration=r[n].duration,void i(e);if(/^data:[^;]+;base64,/.test(n)){for(var o=atob(n.split(",")[1]),t=new Uint8Array(o.length),a=0;a<o.length;++a)t[a]=o.charCodeAt(a);d(t.buffer,e)}else{var _=new XMLHttpRequest;_.open(e._xhr.method,n,!0),_.withCredentials=e._xhr.withCredentials,_.responseType="arraybuffer",e._xhr.headers&&Object.keys(e._xhr.headers).forEach(function(n){_.setRequestHeader(n,e._xhr.headers[n])}),_.onload=function(){var n=(_.status+"")[0];if("0"!==n&&"2"!==n&&"3"!==n)return void e._emit("loaderror",null,"Failed loading audio file with status: "+_.status+".");d(_.response,e)},_.onerror=function(){e._webAudio&&(e._html5=!0,e._webAudio=!1,e._sounds=[],delete r[n],e.load())},u(_)}},u=function(e){try{e.send()}catch(n){e.onerror()}},d=function(e,o){var t=function(){o._emit("loaderror",null,"Decoding audio data failed.")},a=function(e){e&&o._sounds.length>0?(r[o._src]=e,i(o,e)):t()};"undefined"!=typeof Promise&&1===n.ctx.decodeAudioData.length?n.ctx.decodeAudioData(e).then(a).catch(t):n.ctx.decodeAudioData(e,a,t)},i=function(e,n){n&&!e._duration&&(e._duration=n.duration),0===Object.keys(e._sprite).length&&(e._sprite={__default:[0,1e3*e._duration]}),"loaded"!==e._state&&(e._state="loaded",e._emit("load"),e._loadQueue())},_=function(){if(n.usingWebAudio){try{"undefined"!=typeof AudioContext?n.ctx=new AudioContext:"undefined"!=typeof webkitAudioContext?n.ctx=new webkitAudioContext:n.usingWebAudio=!1}catch(e){n.usingWebAudio=!1}n.ctx||(n.usingWebAudio=!1);var e=/iP(hone|od|ad)/.test(n._navigator&&n._navigator.platform),o=n._navigator&&n._navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/),t=o?parseInt(o[1],10):null;if(e&&t&&t<9){var r=/safari/.test(n._navigator&&n._navigator.userAgent.toLowerCase());n._navigator&&!r&&(n.usingWebAudio=!1)}n.usingWebAudio&&(n.masterGain=void 0===n.ctx.createGain?n.ctx.createGainNode():n.ctx.createGain(),n.masterGain.gain.setValueAtTime(n._muted?0:n._volume,n.ctx.currentTime),n.masterGain.connect(n.ctx.destination)),n._setup()}};"function"==typeof define&&define.amd&&define([],function(){return{Howler:n,Howl:o}}),"undefined"!=typeof exports&&(exports.Howler=n,exports.Howl=o),"undefined"!=typeof global?(global.HowlerGlobal=e,global.Howler=n,global.Howl=o,global.Sound=t):"undefined"!=typeof window&&(window.HowlerGlobal=e,window.Howler=n,window.Howl=o,window.Sound=t)}();
}
/* Franky's Christmas Card v0.2.6 — HACS default cinematic video + de/en strings — standalone Home Assistant Lovelace card
 * One monitor; no helpers, automations, Browser Mod, or cloud services required.
 * Bundled WebM/WebP and audio files are installed with HACS; individual asset URLs can be overridden.
 */
(function () {
'use strict';
if (customElements.get('frankys-christmas-card')) return;
/* HACS installs the bundled animation alongside the JS. Manual installs may override video. */
var HACS_VIDEO='/local/community/frankys-stuff-christmas-card/sleigh.webm';
var HACS_IOS_VIDEO='/local/community/frankys-stuff-christmas-card/sleigh-ipad.webp';
var HACS_SOUND='/local/community/frankys-stuff-christmas-card/santa.mp3';
var HACS_BELLS='/local/community/frankys-stuff-christmas-card/bells.mp3';

/* Shared Howler engine: voice and HTML5 bell fallback use the same unlock pool. */
var ChristmasAudio=window.__FrankysChristmasAudioV026||(window.__FrankysChristmasAudioV026=(function(){
 var voices=Object.create(null),lastError='';
 function report(kind,error){lastError=kind+': '+String(error||'unknown');if(window.console&&window.console.warn)window.console.warn("[Franky's Christmas] "+lastError);}
 function prepare(url,options){
  if(!url||!window.Howl)return null;
  var mode=options&&options.html5?'html5':'webaudio',loop=!!(options&&options.loop),key=mode+':'+(loop?'loop:':'once:')+url;
  if(voices[key])return voices[key];
  var params={src:[url],preload:true,html5:mode==='html5',loop:loop,
   onloaderror:function(id,error){report('Audio load error ('+mode+')',error);},
   onplayerror:function(id,error){report('Audio playback blocked ('+mode+')',error);}
  };
  var extension=/\.([a-z0-9]+)(?:[?#]|$)/i.exec(url);if(extension)params.format=[extension[1]];
  try{voices[key]=new window.Howl(params);return voices[key];}
  catch(error){report('Audio initialization error',error);return null;}
 }
 function unlock(url){
  prepare(url);var ctx=window.Howler&&window.Howler.ctx;
  if(ctx&&ctx.state==='suspended'){
   try{var result=ctx.resume();if(result&&result.catch)result.catch(function(error){report('Audio unlock denied',error);});}
   catch(error){report('Audio unlock denied',error);}
  }
 }
 function play(url,volume,options){
  var howl=prepare(url,options);if(!howl){report('Audio unavailable',url);return null;}
  try{
   howl.volume(Math.max(0,Math.min(1,Number(volume)||0)));
   var id=howl.play();
   return {
    stop:function(){try{howl.stop(id);}catch(error){report('Audio stop error',error);}},
    volume:function(value){try{howl.volume(Math.max(0,Math.min(1,value)),id);}catch(error){report('Audio volume error',error);}}
   };
  }catch(error){report('Audio play error',error);return null;}
 }
 return {prepare:prepare,unlock:unlock,play:play,status:function(){return lastError;}};
})());
var bellPlayers=Object.create(null);
function getBellPlayer(url){return bellPlayers[url]||(bellPlayers[url]=makeBellBed(url));}

/* Bell bed v1: trim baked silences, overlap equal-power crossfades,
   and apply ONE flight-length envelope. Falls back to HTMLAudio when needed. */
var makeBellBed = window.__FrankysBellsCrossfadeV1 || (window.__FrankysBellsCrossfadeV1=function(url){
 var AC=window.AudioContext||window.webkitAudioContext;
 var ac=null,buffer=null,promise=null,active=[],master=null,fallbackAudio=null,frame=0,run=0,info='idle';
 function ensure(){
  if(buffer)return Promise.resolve(buffer);
  if(promise)return promise;
  if(!AC||!window.fetch)return Promise.reject(new Error('WebAudio unsupported'));
  if(!ac)ac=(window.Howler&&window.Howler.usingWebAudio&&window.Howler.ctx)||new AC();
  promise=fetch(url,{credentials:'same-origin'}).then(function(r){
   if(!r.ok)throw new Error('Bells HTTP '+r.status);
   return r.arrayBuffer();
  }).then(function(a){return ac.decodeAudioData(a);}).then(function(b){
   buffer=b;return b;
  }).catch(function(err){promise=null;throw err;});
  return promise;
 }
 function stop(){
  run++;
  if(frame){cancelAnimationFrame(frame);frame=0;}
  if(fallbackAudio){fallbackAudio.stop();fallbackAudio=null;}
  active.forEach(function(s){try{s.stop(0);}catch(e){}try{s.disconnect();}catch(e){}});
  active=[];
  if(master){try{master.disconnect();}catch(e){}master=null;}
 }
 function bounds(b){
  var samples=b.getChannelData(0),rate=b.sampleRate,size=Math.max(256,Math.floor(rate*.05)),rms=[],max=0;
  for(var pos=0;pos<samples.length;pos+=size){
   var end=Math.min(samples.length,pos+size),sum=0,count=0;
   for(var j=pos;j<end;j+=8){sum+=samples[j]*samples[j];count++;}
   var level=Math.sqrt(sum/Math.max(count,1));
   rms.push(level);if(level>max)max=level;
  }
  var first=0,last=rms.length-1,threshold=max*.48;
  while(first<rms.length-1&&rms[first]<threshold)first++;
  while(last>first&&rms[last]<threshold)last--;
  var from=Math.max(0,first*size/rate),to=Math.min(b.duration,(last+1)*size/rate);
  if(to-from<1.65){from=Math.min(.28,b.duration*.08);to=b.duration-from;}
  return [from,to];
 }
 function curve(param,t,d,up){
  var a=new Float32Array(48);
  for(var i=0;i<a.length;i++){
   var f=i/(a.length-1);
   a[i]=up?Math.sin(f*Math.PI/2):Math.cos(f*Math.PI/2);
  }
  param.setValueCurveAtTime(a,t,d);
 }
 function htmlFallback(seconds,volume,key,started){
  if(key!==run)return;
  var a=ChristmasAudio.play(url,.001,{loop:true,html5:true});
  if(!a){info='html-fallback-failed';return;}
  fallbackAudio=a;info='howler-html5-fallback';
  function fade(){
   if(key!==run||!fallbackAudio)return;
   var elapsed=(performance.now()-started)/1000;
   if(elapsed>=seconds){a.stop();fallbackAudio=null;return;}
   a.volume(Math.max(0,Math.min(1,elapsed/1.35,(seconds-elapsed)/2.1))*volume);
   frame=requestAnimationFrame(fade);
  }
  frame=requestAnimationFrame(fade);
 }
 function play(seconds,volume){
  stop();
  seconds=Math.max(3,Math.min(60,Number(seconds)||10));
  volume=Math.max(0,Math.min(1,Number(volume)||.95));
  var key=run,started=performance.now();
  ensure().then(function(b){
   if(key!==run)return;
   return Promise.resolve(ac.state==='suspended'?ac.resume():true).then(function(){
    if(key!==run)return;
    if(ac.state!=='running')throw new Error('AudioContext suspended');
    var remaining=seconds-(performance.now()-started)/1000;
    if(remaining<.35)return;
    var segment=bounds(b),from=segment[0],length=segment[1]-segment[0];
    var overlap=Math.max(.28,Math.min(.72,length*.22));
    var step=length-overlap;
    var t0=ac.currentTime+.025,tend=t0+remaining;
    master=ac.createGain();master.connect(ac.destination);
    var up=Math.min(1.4,remaining*.26),down=Math.min(2.1,remaining*.3);
    master.gain.setValueAtTime(0,t0);
    master.gain.linearRampToValueAtTime(volume,t0+up);
    master.gain.setValueAtTime(volume,tend-down);
    master.gain.linearRampToValueAtTime(0,tend);
    for(var n=0;n<18;n++){
     var when=t0+n*step;
     if(when>=tend)break;
     var source=ac.createBufferSource(),gain=ac.createGain();
     source.buffer=b;source.connect(gain);gain.connect(master);
     if(n===0){gain.gain.setValueAtTime(1,when);}
     else{gain.gain.setValueAtTime(0,when);curve(gain.gain,when,overlap,true);}
     if(when+length-overlap<tend)curve(gain.gain,when+length-overlap,overlap,false);
     source.start(when,from,length);
     source.stop(Math.min(when+length,tend+.025));
     active.push(source);
    }
    info='webaudio;trim='+from.toFixed(2)+'-'+segment[1].toFixed(2)+';xfade='+overlap.toFixed(2);
   });
  }).catch(function(error){
   if(window.console&&window.console.warn)window.console.warn("[Franky's Christmas] Bell WebAudio fallback:",error);
   htmlFallback(seconds,volume,key,started);
  });
  return true;
 }
 function prepare(){ensure().catch(function(){});}
 return {play:play,stop:stop,prepare:prepare,status:function(){return info;}};
});
var FALLBACK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240"><defs><linearGradient id="fc-red" x2="0" y2="1"><stop stop-color="#ff5a60"/><stop offset="1" stop-color="#9e1532"/></linearGradient><g id="fc-deer"><ellipse rx="38" ry="21" fill="#a5774e"/><path d="M20 1 34-34 51-32 45-4" fill="#a5774e"/><ellipse cx="49" cy="-34" rx="21" ry="12" fill="#c49361"/><circle cx="58" cy="-38" r="3" fill="#151c26"/><circle cx="70" cy="-31" r="5" fill="#d92a38"/><path d="M36-42 29-65 17-71M30-61 41-73M29-65 27-79M-24 12-43 40-22 47M-8 18 5 42 25 38M20 12 42 31 56 26" fill="none" stroke="#805237" stroke-width="7" stroke-linecap="round"/></g></defs><path d="M148 150Q290 178 527 109" fill="none" stroke="#e4be78" stroke-width="3"/><g transform="translate(350 127)"><use href="#fc-deer"/></g><g transform="translate(490 106)"><use href="#fc-deer"/></g><path d="M40 130Q18 108 23 94Q55 95 72 130L183 130Q204 130 210 101Q236 125 216 161Q151 191 62 166Z" fill="url(#fc-red)" stroke="#f8d988" stroke-width="5"/><path d="M69 170 62 193M190 171 199 193M32 192Q147 212 224 185Q243 177 235 166" fill="none" stroke="#ffd88a" stroke-width="6" stroke-linecap="round"/><ellipse cx="142" cy="108" rx="31" ry="36" fill="url(#fc-red)"/><circle cx="145" cy="65" r="23" fill="#f3c5a1"/><path d="M122 62Q111 99 144 103Q170 95 168 69L153 80 141 76 133 82Z" fill="#fff7e8"/><path d="M120 51Q132 10 161 28L179 49 159 43Z" fill="url(#fc-red)"/><path d="M120 52Q142 42 166 52" fill="none" stroke="#fff7e8" stroke-width="10" stroke-linecap="round"/><circle cx="180" cy="50" r="9" fill="#fff7e8"/><circle cx="145" cy="62" r="3" fill="#172332"/><path d="M165 106 191 90 207 101" fill="none" stroke="#d52e46" stroke-width="14" stroke-linecap="round"/><circle cx="208" cy="101" r="9" fill="#fff7e8"/></svg>';

function cleanUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  var url = value.trim();
  if (url.indexOf('//') === 0 || /^javascript:|^data:/i.test(url)) return '';
  return url;
}
/* Prefer pre-keyed animated WebP on Apple/Safari; older iOS may fall back to SVG. */
function prefersAppleWebP() {
  var ua=navigator.userAgent||'';
  return /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1) ||
    (/AppleWebKit/i.test(ua) && /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR/i.test(ua));
}
function parseTime(value,fallback){
  return typeof value==='string'&&/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)?value:fallback;
}
function timeMinutes(value){
  var p=value.split(':');return Number(p[0])*60+Number(p[1]);
}
function finite(n, fallback, min, max) {
  n=Number(n); return isFinite(n) ? Math.max(min,Math.min(max,n)) : fallback;
}
/* One page-wide scheduler, independent of card lifecycle. */
var GLOBAL_CONFIG_KEY='frankys-christmas-v1-global-config';
var globalFlightController=null;
function getGlobalFlightController(){
 if(globalFlightController)return globalFlightController;
 globalFlightController=new FrankysChristmasCard();
 globalFlightController._isGlobalFlightController=true;
 document.addEventListener('visibilitychange',globalFlightController._onVisibility);
 return globalFlightController;
}
function activateGlobalFlightController(card){
 var ctrl=getGlobalFlightController();
 if(ctrl._config&&ctrl._state&&
    JSON.stringify(ctrl._config)===JSON.stringify(card._config)&&
    JSON.stringify(ctrl._state)===JSON.stringify(card._state))return ctrl;
 ctrl._config=Object.assign({},card._config);
 ctrl._state=Object.assign({},card._state);
 try{localStorage.setItem(GLOBAL_CONFIG_KEY,JSON.stringify(card._config));}catch(e){}
 ctrl._applySchedule();
 return ctrl;
}
function restoreGlobalFlightController(){
 var saved=null;
 try{saved=JSON.parse(localStorage.getItem(GLOBAL_CONFIG_KEY)||'null');}catch(e){}
 if(!saved||typeof saved!=='object')return;
 var ctrl=getGlobalFlightController();
 ctrl.setConfig(saved);
 ctrl._applySchedule();
}
var CSS = ':host{display:block}ha-card{padding:16px 18px;color:var(--primary-text-color,#eef6fc);background:var(--card-background-color,#141b2a);border-radius:16px;box-sizing:border-box}'+
'.top{display:flex;align-items:center;gap:11px}.mark{font-size:28px;line-height:1}.heading{flex:1;min-width:0}.title{font-size:16px;font-weight:700}.subtitle{font-size:12px;opacity:.72;margin-top:3px}.status{font-size:12px;white-space:nowrap;color:var(--secondary-text-color,#aab)}'+
'.dot{width:8px;height:8px;border-radius:50%;background:#8794a6;display:inline-block;margin-right:5px}.dot.on{background:#32c992;box-shadow:0 0 8px #32c992}'+
'.buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}.buttons button{border:1px solid rgba(125,161,193,.45);border-radius:10px;background:rgba(50,103,142,.15);color:inherit;cursor:pointer;padding:10px 13px;font:inherit;font-size:13px;min-height:38px}.buttons button.active{background:#12678d;color:white;border-color:#27b7e9}.buttons button:focus-visible{outline:2px solid #22bee6;outline-offset:2px}'+
'.buttons a.kofi{display:inline-flex;align-items:center;text-decoration:none;background:#ff5e5b;color:#fff;font-weight:700;border:1px solid #ff5e5b;border-radius:10px;padding:10px 13px;font-size:13px;min-height:38px;box-sizing:border-box}.buttons a.kofi:focus-visible{outline:2px solid #22bee6;outline-offset:2px}'+
'.time-window{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin-top:12px;font-size:12px}.time-window input{width:88px;border:1px solid #7c919e;border-radius:8px;padding:6px;background:var(--card-background-color,#141b2a);color:var(--primary-text-color,#eef6fc);color-scheme:dark;font:inherit}'+
'.detail{display:flex;align-items:center;gap:8px;font-size:12px;opacity:.85;margin-top:13px}.detail select{background:var(--card-background-color,#141b2a);color:inherit;border:1px solid #7c919e;border-radius:8px;padding:6px 7px;font:inherit}.note{font-size:11px;opacity:.65;margin-top:8px}'+
"\n/* Responsive card; HA section width changes independently of viewport width. */\nha-card{width:100%;min-width:0;max-width:100%;height:auto;container-type:inline-size;overflow:hidden}\n.top{flex-wrap:wrap;min-width:0}\n.heading{overflow-wrap:anywhere}\n.buttons{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,124px),1fr));gap:8px}\n.buttons button,.buttons a.kofi{display:flex;justify-content:center;align-items:center;min-width:0;width:100%;min-height:44px;box-sizing:border-box;white-space:normal;text-align:center;line-height:1.25;padding:8px 10px;overflow-wrap:break-word}\n.detail{flex-wrap:wrap;min-width:0;gap:8px}\n.detail select{flex:1 1 138px;min-width:0;max-width:100%;min-height:44px}\n.time-window{gap:8px;min-width:0}\n.time-window strong{flex-basis:100%}\n.time-window label{white-space:nowrap}\n.time-window input{flex:1 1 88px;min-width:0;max-width:140px;min-height:44px;box-sizing:border-box}\n.note{line-height:1.45}\nha-card[data-layout=\"compact\"]{padding:10px 12px}\nha-card[data-layout=\"compact\"] .subtitle,ha-card[data-layout=\"compact\"] .note{display:none}\nha-card[data-layout=\"compact\"] .top{gap:6px}\nha-card[data-layout=\"compact\"] .mark{font-size:23px}\nha-card[data-layout=\"compact\"] .buttons{margin-top:10px}\nha-card[data-layout=\"compact\"] .detail{margin-top:9px}\nha-card[data-layout=\"compact\"] .time-window{margin-top:8px}\nha-card[data-layout=\"comfortable\"]{padding:22px 24px}\nha-card[data-layout=\"comfortable\"] .buttons{gap:12px}\n@container (min-width:226px) and (max-width:570px){\n .buttons{grid-template-columns:repeat(2,minmax(0,1fr))}\n}\n@container (max-width:319px){\n .buttons{grid-template-columns:1fr 1fr;gap:6px}\n .buttons button,.buttons a.kofi{font-size:12px;padding:8px 5px;min-height:44px}\n .top .status{width:100%}\n .time-window input{max-width:100%;flex-basis:94px}\n .detail select{flex-basis:100%}\n ha-card[data-layout=\"comfortable\"]{padding:12px}\n}\n@container (max-width:225px){\n .buttons{grid-template-columns:1fr}\n .time-window input{flex-basis:100%}\n}\n";

class FrankysChristmasCard extends HTMLElement {
 constructor() {
   super();
   this.attachShadow({mode:'open'});
   this._config=null;this._state=null;this._timer=0;this._stage=null;this._video=null;
   this._sound=null;this._bells=null;this._soundTimer=0;this._raf=0;this._ctx=null;this._canvas=null;
   this._particles=[];this._particleTime=0;this._startTime=0;this._alive=false;this._durationTimer=0;
   this._onVisibility=this._onVisibility.bind(this);
   this._lang=/^de(?:-|$)/i.test(navigator.language||'')?'de':'en';
 }
 setConfig(raw) {
   if(!raw||typeof raw!=='object')throw new Error('Frankys Christmas: card configuration missing');
   var previousConfig=this._config;
   var min=finite(raw.interval_min,3,1,120),max=finite(raw.interval_max,8,1,120);
   if(max<min)max=min;
   this._config={
     title:typeof raw.title==='string'?raw.title:"Franky's Christmas",
     layout_mode:['auto','compact','comfortable'].indexOf(raw.layout_mode)!==-1?raw.layout_mode:'auto',
     video:raw.video===false||raw.video===null?'':(cleanUrl(raw.video)||HACS_VIDEO),
     ios_video:raw.ios_video===false||raw.ios_video===null?'':(cleanUrl(raw.ios_video)||((typeof raw.video==='string'&&cleanUrl(raw.video))?'':HACS_IOS_VIDEO)),
     sound:raw.sound===false||raw.sound===null?'':(cleanUrl(raw.sound)||HACS_SOUND),
     bells:raw.bells===false||raw.bells===null?'':(cleanUrl(raw.bells)||HACS_BELLS),
     fallback:cleanUrl(raw.fallback),
     interval_min:min, interval_max:max,
     schedule_start:parseTime(raw.schedule_start,'09:00'),
     schedule_end:parseTime(raw.schedule_end,'22:00'),
     sound_volume:finite(raw.sound_volume,.55,0,1),
     bells_volume:finite(raw.bells_volume,.78,0,1),
     width_percent:finite(raw.width_percent,60,20,95),
     duration:finite(raw.duration,10,4,30),
     storage_key:typeof raw.storage_key==='string'?raw.storage_key.replace(/[^a-z0-9_-]/gi,'').slice(0,48):'default'
   };
   if(this._config.storage_key==='')this._config.storage_key='default';
   if(timeMinutes(this._config.schedule_start)>=timeMinutes(this._config.schedule_end)){
     this._config.schedule_start='09:00';this._config.schedule_end='22:00';
   }
   this._readState();
   /* A visual-editor time change must take precedence over a previously saved
      local time-window, while preserving user settings on ordinary refreshes. */
   if(previousConfig && (previousConfig.schedule_start!==this._config.schedule_start ||
      previousConfig.schedule_end!==this._config.schedule_end)){
     this._state.start_time=this._config.schedule_start;
     this._state.end_time=this._config.schedule_end;
     this._save();
     try{localStorage.removeItem(this._key()+'-daily-plan');}catch(ignore){}
   }
   if(!this._isGlobalFlightController)this._render();
   if(this.isConnected)this._applySchedule();
 }
 connectedCallback() {
   if(this._config)this._applySchedule();
 }
 disconnectedCallback() {
   /* The shared scheduler keeps running when Lovelace removes the card. */
 }
 set hass(hass){
   var lang=(hass&&hass.locale&&hass.locale.language)||(hass&&hass.language)||navigator.language||'en';
   var next=/^de(?:-|$)/i.test(lang)?'de':'en';
   if(next!==this._lang){this._lang=next;if(this._config)this._render();}
 }
 _txt(id){
   var de={
     subtitle:'Weihnachtsflug · alle Dashboard-Ansichten',
     test:'🛷 Testflug',coffee:'☕ Danke für den Kaffee',interval:'Flugintervall',
     daily:'1–10 Flüge/Tag (Standard)',hourly:'Jede volle Stunde',hours:'Flugzeiten',from:'Von',to:'Bis',defaultHint:'Automatisch nur innerhalb der eingestellten Uhrzeiten; Testflug jederzeit möglich.',
     turnOn:'▶ Einschalten',turnOff:'⏸ Ausschalten',
     soundOn:'🔊 Ton an',soundOff:'🔇 Ton aus',
     active:'AKTIV',inactive:'AUS'
   };
   var en={
     subtitle:'Christmas flight · all dashboard views',
     test:'🛷 Test flight',coffee:'☕ Thanks for Coffee',interval:'Flight schedule',
     daily:'1–10 flights/day (default)',hourly:'Every full hour',hours:'Flight hours',from:'From',to:'Until',defaultHint:'Automatic flights only during your chosen hours; manual test flight works anytime.',
     turnOn:'▶ Enable',turnOff:'⏸ Disable',
     soundOn:'🔊 Sound on',soundOff:'🔇 Sound off',
     active:'ON',inactive:'OFF'
   };
   var dict=this._lang==='de'?de:en;
   return dict[id]||id;
 }
  getCardSize(){return this._config&&this._config.layout_mode==='compact'?4:6;}
 getGridOptions(){return {columns:12,min_columns:6,rows:'auto'};}
 static getConfigElement(){return document.createElement('frankys-christmas-card-editor');}
 static getStubConfig(){return {type:'custom:frankys-christmas-card',interval_min:3,interval_max:8};}
 _key(){return 'frankys-christmas-v1-'+this._config.storage_key;}
 _readState(){
   var data=null;try{data=JSON.parse(localStorage.getItem(this._key())||'null');}catch(e){}
   this._state={
     enabled:!!(data&&data.enabled),sound:!!(data&&data.sound),
     interval:(data&&['3-8','5-10','10-20','1-2','hourly'].indexOf(data.interval)!==-1)?data.interval:'',
     start_time:parseTime(data&&data.start_time,this._config.schedule_start),
     end_time:parseTime(data&&data.end_time,this._config.schedule_end)
   };
   if(timeMinutes(this._state.start_time)>=timeMinutes(this._state.end_time)){
     this._state.start_time=this._config.schedule_start;
     this._state.end_time=this._config.schedule_end;
   }
 }
 _save(){try{localStorage.setItem(this._key(),JSON.stringify(this._state));}catch(e){}}
 _render(){
   if(!this.shadowRoot||!this._config)return;
   this.shadowRoot.innerHTML='<style>'+CSS+'</style><ha-card data-layout="'+this._config.layout_mode+'"><div class="top"><span class="mark">🎅</span><div class="heading"><div class="title"></div><div class="subtitle">'+this._txt('subtitle')+'</div></div><div class="status"><span class="dot"></span><span class="status-text"></span></div></div><div class="buttons"><button id="toggle" type="button"></button><button id="sound" type="button"></button><button id="test" type="button">'+this._txt('test')+'</button><a class="kofi" href="https://ko-fi.com/Frankys_Stuff" target="_blank" rel="noopener noreferrer">'+this._txt('coffee')+'</a></div><div class="detail"><label for="times">'+this._txt('interval')+'</label><select id="times"><option value="default">'+this._txt('daily')+'</option><option value="hourly">'+this._txt('hourly')+'</option><option value="1-2">1–2 Minuten</option><option value="3-8">3–8 Minuten</option><option value="5-10">5–10 Minuten</option><option value="10-20">10–20 Minuten</option></select></div><div class="time-window"><strong>'+this._txt('hours')+'</strong><label for="from">'+this._txt('from')+'</label><input id="from" type="time"><label for="to">'+this._txt('to')+'</label><input id="to" type="time"></div><div class="note">'+this._txt('defaultHint')+'</div></ha-card>';
   this.shadowRoot.querySelector('.title').textContent=this._config.title;
   var self=this;
   this.shadowRoot.getElementById('toggle').onclick=function(){self._state.enabled=!self._state.enabled;self._unlockAudio();self._save();self._update();if(!self._state.enabled)self._stop();self._applySchedule();};
   this.shadowRoot.getElementById('sound').onclick=function(){self._state.sound=!self._state.sound;self._unlockAudio();self._save();self._update();self._applySchedule();};
   this.shadowRoot.getElementById('test').onclick=function(){self._unlockAudio();self._play();};
   this.shadowRoot.getElementById('times').onchange=function(){self._state.interval=this.value==='default'?'':this.value;self._save();self._applySchedule();};
   function onHoursChange(){
     var from=self.shadowRoot.getElementById('from'),to=self.shadowRoot.getElementById('to');
     var start=parseTime(from.value,self._state.start_time);
     var end=parseTime(to.value,self._state.end_time);
     if(timeMinutes(start)>=timeMinutes(end)){
       from.value=self._state.start_time;to.value=self._state.end_time;return;
     }
     if(start===self._state.start_time&&end===self._state.end_time)return;
     self._state.start_time=start;self._state.end_time=end;self._save();
     try{localStorage.removeItem(self._key()+'-daily-plan');}catch(ignore){}
     self._applySchedule();
   }
   this.shadowRoot.getElementById('from').onchange=onHoursChange;
   this.shadowRoot.getElementById('to').onchange=onHoursChange;
   this._update();
 }
 _update(){
   if(!this._config||!this.shadowRoot.querySelector('#toggle'))return;
   var on=this._state.enabled, snd=this._state.sound;
   this.shadowRoot.getElementById('toggle').textContent=on?this._txt('turnOff'):this._txt('turnOn');
   this.shadowRoot.getElementById('toggle').className=on?'active':'';
   this.shadowRoot.getElementById('sound').textContent=snd?this._txt('soundOn'):this._txt('soundOff');
   this.shadowRoot.getElementById('sound').className=snd?'active':'';
   this.shadowRoot.querySelector('.dot').className=on?'dot on':'dot';
   this.shadowRoot.querySelector('.status-text').textContent=on?this._txt('active'):this._txt('inactive');
   this.shadowRoot.getElementById('times').value=this._state.interval||'default';
   this.shadowRoot.getElementById('from').value=this._state.start_time;
   this.shadowRoot.getElementById('to').value=this._state.end_time;
 }
 _unlockAudio(){
  if(!this._config||!this._state||!this._state.sound)return;
  if(this._config.sound)ChristmasAudio.unlock(this._config.sound);
  if(this._config.bells)getBellPlayer(this._config.bells).prepare();
 }
 _clearSchedule(){if(this._timer)clearTimeout(this._timer);this._timer=0;}
 _onVisibility(){if(document.hidden){this._clearSchedule();this._stop();}else this._applySchedule();}
 _withinWindow(d){
   var now=d||new Date();
   var minute=now.getHours()*60+now.getMinutes();
   return minute>=timeMinutes(this._state.start_time)&&minute<timeMinutes(this._state.end_time);
 }
 _applySchedule(){
   if(!this._isGlobalFlightController){
     if(this._config&&this._state)activateGlobalFlightController(this);
     return;
   }
   this._clearSchedule();
   /* Respect the legacy global JARVIS event listener on this display:
      do not render two Santas if standalone mode is enabled. */
   if(!this._state||!this._state.enabled){
     if(window.__FrankysChristmasStandaloneOwner===this)window.__FrankysChristmasStandaloneOwner=null;
     return;
   }
   window.__FrankysChristmasStandaloneOwner=this;
   if(document.hidden)return;
   /* Initialize audio when the persisted scheduler wakes up, not only on the
      first timed flight: Howler can then receive later user gestures anywhere
      in the dashboard, even when the control card is on another view. */
   if(this._state.sound && typeof Audio!=='undefined'){
     if(this._config.sound)ChristmasAudio.prepare(this._config.sound);
     if(this._config.bells)getBellPlayer(this._config.bells).prepare();
   }
   var self=this,now=new Date(),nowMs=now.getTime();
   var start=new Date(now),end=new Date(now);
   var a=this._state.start_time.split(':').map(Number),b=this._state.end_time.split(':').map(Number);
   start.setHours(a[0],a[1],0,0);end.setHours(b[0],b[1],0,0);
   var startMs=start.getTime(),endMs=end.getTime();
   if(!this._state.interval){
     /* Randomize the complete daily window and persist it on this browser.
        Never compress all today's flights into the remaining late-evening time. */
     var day=now.getFullYear()+'-'+('0'+(now.getMonth()+1)).slice(-2)+'-'+('0'+now.getDate()).slice(-2);
     var key=this._key()+'-daily-plan',plan=null;
     try{plan=JSON.parse(localStorage.getItem(key)||'null');}catch(ignore){}
     if(!plan||plan.day!==day||plan.start!==this._state.start_time||plan.end!==this._state.end_time||!Array.isArray(plan.times)){
       var count=1+Math.floor(Math.random()*10),times=[];
       var low=startMs+1000,high=endMs-this._config.duration*1000-2000;
       if(high>low){
         var slot=(high-low)/count;
         for(var i=0;i<count;i++)times.push(Math.round(low+(i+Math.random())*slot));
       }
       plan={day:day,start:this._state.start_time,end:this._state.end_time,times:times};
       try{localStorage.setItem(key,JSON.stringify(plan));}catch(ignore){}
     }
     var next=0;
     for(var j=0;j<plan.times.length;j++)if(plan.times[j]>nowMs+500){next=plan.times[j];break;}
     if(next){
       this._timer=setTimeout(function(){
         self._timer=0;
         if(self._state.enabled&&!document.hidden&&self._withinWindow())self._play();
         self._applySchedule();
       },Math.max(100,next-nowMs));
     }else{
       var tomorrow=new Date(now);tomorrow.setHours(24,0,3,0);
       this._timer=setTimeout(function(){self._timer=0;self._applySchedule();},Math.max(1000,tomorrow.getTime()-nowMs));
     }
     return;
   }
   /* Fixed hourly mode: one flight at the next full clock hour, never catch up. */
   if(this._state.interval==='hourly'){
     var nextHour=new Date(now);
     nextHour.setMinutes(0,0,0);
     if(nextHour.getTime()<=nowMs+500)nextHour.setHours(nextHour.getHours()+1);
     for(var hourTry=0;hourTry<48;hourTry++){
       var clockMinute=nextHour.getHours()*60;
       var windowEnd=new Date(nextHour);
       windowEnd.setHours(b[0],b[1],0,0);
       if(clockMinute>=timeMinutes(this._state.start_time)&&
          clockMinute<timeMinutes(this._state.end_time)&&
          nextHour.getTime()+this._config.duration*1000<=windowEnd.getTime())break;
       nextHour.setHours(nextHour.getHours()+1);
     }
     /* Narrow time windows may contain no full hour. */
     if(hourTry===48)return;
     this._timer=setTimeout(function(){
       self._timer=0;
       if(self._state.enabled&&!document.hidden&&self._withinWindow())self._play();
       self._applySchedule();
     },Math.max(100,nextHour.getTime()-nowMs));
     return;
   }
   /* Minute modes also respect the active-time window. */
   var pair=this._state.interval.split('-').map(Number);
   var ms=(pair[0]+Math.random()*(pair[1]-pair[0]))*60000;
   var when;
   if(nowMs<startMs)when=startMs+ms;
   else if(nowMs+ms+this._config.duration*1000>=endMs){
     var tomorrowStart=new Date(start);tomorrowStart.setDate(tomorrowStart.getDate()+1);
     when=tomorrowStart.getTime()+ms;
   }else when=nowMs+ms;
   this._timer=setTimeout(function(){
     self._timer=0;
     if(self._state.enabled&&!document.hidden&&self._withinWindow())self._play();
     self._applySchedule();
   },Math.max(100,when-nowMs));
 }
 _stop(){
   if(!this._isGlobalFlightController){
     if(globalFlightController)globalFlightController._stop();
     return;
   }
   this._alive=false;
   if(this._durationTimer)clearTimeout(this._durationTimer);this._durationTimer=0;
   if(this._soundTimer)clearTimeout(this._soundTimer);this._soundTimer=0;
   if(this._raf)cancelAnimationFrame(this._raf);this._raf=0;
   if(this._sound){this._sound.stop();this._sound=null;}
   if(this._bellsPlayer){this._bellsPlayer.stop();this._bellsPlayer=null;}
   if(this._video){try{this._video.pause();}catch(e){}this._video=null;}
   if(this._stage&&this._stage.parentNode)this._stage.parentNode.removeChild(this._stage);
   this._stage=null;this._ctx=null;this._canvas=null;this._particles=[];
 }
 _play(){
   if(!this._isGlobalFlightController){
     if(!this._config||!this._state)return false;
     return activateGlobalFlightController(this)._play();
   }
   if(document.hidden||!document.body)return false;
   this._stop();
   var self=this, c=this._config;
   var stage=document.createElement('div');stage.id='frankys-christmas-flight';
   stage.style.cssText='position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:2147483000';
   var sheet=document.createElement('style');
   sheet.textContent='@keyframes fc-flight{from{transform:translateX(-110%)}to{transform:translateX(110vw)}}';
   var vehicle=document.createElement('div');vehicle.style.cssText='position:absolute;left:0;top:34%;pointer-events:none;animation:fc-flight '+c.duration+'s linear forwards;width:'+Math.round(Math.min(850,innerWidth*c.width_percent/100))+'px;';
   var img=document.createElement('img');img.alt='';img.style.cssText='display:block;width:100%;height:auto';
   img.src=c.fallback||'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(FALLBACK_SVG);
   if(c.video && prefersAppleWebP() && c.ios_video){
     /* The WebM alpha channel is ignored in some Safari builds; use our
        pre-matted animated WebP rather than a live green-screen filter. */
     var appleFrame=document.createElement('img');
     appleFrame.alt='';
     appleFrame.setAttribute('aria-hidden','true');
     appleFrame.style.cssText='display:none;width:100%;height:auto;pointer-events:none';
     appleFrame.onload=function(){
       if(self._stage===stage || !self._stage) {img.style.display='none';appleFrame.style.display='block';}
     };
     appleFrame.onerror=function(){appleFrame.style.display='none';img.style.display='block';};
     appleFrame.src=c.ios_video;
     vehicle.appendChild(appleFrame);
   } else if(c.video){
     var vid=document.createElement('video');
     vid.autoplay=false;vid.muted=true;vid.loop=true;vid.playsInline=true;
     vid.setAttribute('muted','');vid.setAttribute('playsinline','');
     vid.preload='auto';vid.src=c.video;
     vid.style.cssText='display:block;width:100%;height:auto';
     img.style.display='none';
     function fallback(){vid.style.display='none';img.style.display='block';}
     vid.onerror=fallback;
     vehicle.appendChild(vid);this._video=vid;
   }
   vehicle.appendChild(img);
   var canvas=document.createElement('canvas');canvas.width=innerWidth;canvas.height=innerHeight;
   canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
   stage.appendChild(sheet);stage.appendChild(canvas);stage.appendChild(vehicle);document.body.appendChild(stage);
   this._stage=stage;this._canvas=canvas;this._ctx=canvas.getContext('2d');
   this._particles=[];this._particleTime=0;this._startTime=performance.now();this._alive=true;
   if(this._video){try{var p=this._video.play();if(p&&p.catch)p.catch(function(){self._video&&self._video.pause();img.style.display='block';if(self._video)self._video.style.display='none';});}catch(e){img.style.display='block';}}
   if(this._ctx)this._raf=requestAnimationFrame(function(t){self._dust(t,vehicle);});
   if(this._state.sound&&c.bells) {
     try {
       this._bellsPlayer=getBellPlayer(c.bells);
       this._bellsPlayer.play(c.duration,c.bells_volume);
     }catch(e){}
   }
   if(this._state.sound&&c.sound){
     this._soundTimer=setTimeout(function(){
       if(!self._alive)return;
       self._sound=ChristmasAudio.play(c.sound,c.sound_volume);
     },Math.min(1400,c.duration*200));
   }
   this._durationTimer=setTimeout(function(){self._stop();},c.duration*1000+450);
   return true;
 }
 _dust(now,vehicle){
   if(!this._alive||!this._ctx||!this._canvas)return;
   if(now-this._particleTime<35){var self=this;this._raf=requestAnimationFrame(function(t){self._dust(t,vehicle);});return;}
   this._particleTime=now;
   var ctx=this._ctx,c=this._canvas,rect=vehicle.getBoundingClientRect();
   ctx.clearRect(0,0,c.width,c.height);
   if(rect.right>0&&rect.left<c.width&&this._particles.length<110){
     for(var n=0;n<3;n++)this._particles.push({x:rect.left+12+Math.random()*16,y:rect.top+rect.height*.76+(Math.random()-.5)*22,vx:-1-Math.random()*2,vy:(Math.random()-.5),age:0,life:22+Math.random()*36,size:.8+Math.random()*2});
   }
   for(var i=this._particles.length-1;i>=0;i--){
     var p=this._particles[i];p.x+=p.vx;p.y+=p.vy;p.age++;
     if(p.age>=p.life){this._particles.splice(i,1);continue;}
     ctx.globalAlpha=1-p.age/p.life;
     ctx.fillStyle=i%3?'#ffd77b':'#fff6ca';ctx.shadowColor='#ffc04b';ctx.shadowBlur=7;
     ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=1;ctx.shadowBlur=0;
   var self=this;this._raf=requestAnimationFrame(function(t){self._dust(t,vehicle);});
 }
}

/* HA graphical editor: no extra frontend dependencies, works in the card picker. */
class FrankysChristmasCardEditor extends HTMLElement {
 constructor(){
   super();
   this.attachShadow({mode:'open'});
   this._config=null;
   this._lang=/^de(?:-|$)/i.test(navigator.language||'')?'de':'en';
 }
 set hass(hass){
   var language=(hass&&hass.locale&&hass.locale.language)||(hass&&hass.language)||navigator.language||'en';
   this._hass=hass;
   var newLang=/^de(?:-|$)/i.test(language)?'de':'en';
   if(newLang!==this._lang){this._lang=newLang;if(this._config)this._render();}
 }
 setConfig(config){
   if(!config)return;
   this._config=Object.assign({},config);
   this._lang=/^de(?:-|$)/i.test((this._hass&&((this._hass.locale&&this._hass.locale.language)||this._hass.language))||navigator.language||'en')?'de':'en';
   this._render();
 }
 _render(){
   var de=this._lang==='de';
   var tr=(g,e)=>de?g:e;
   var esc=(s)=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
   var c=this._config||{};
   this.shadowRoot.innerHTML=
    '<style>:host{display:block;color:var(--primary-text-color);font-size:14px}fieldset{border:1px solid var(--divider-color,#63748a);border-radius:10px;margin:0 0 12px;padding:12px}legend{font-weight:700;padding:0 7px}.field{display:flex;flex-direction:column;gap:5px;margin:9px 0}.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.pair .field{min-width:0}label{font-size:13px;font-weight:600}input,select{font:inherit;padding:9px 10px;min-width:0;max-width:100%;width:100%;box-sizing:border-box;border:1px solid var(--divider-color,#798896);background:var(--card-background-color,#19232f);color:var(--primary-text-color,#fff);border-radius:8px;color-scheme:light dark;min-height:42px}input[type=range]{padding:0;min-height:35px;accent-color:var(--primary-color,#03a9f4)}small{display:block;opacity:.75;line-height:1.5}details{margin-top:10px}summary{cursor:pointer;font-weight:600;padding:9px 0}.invalid{color:var(--error-color,#f86d6d);min-height:1em;font-size:12px;margin-top:6px}@media(max-width:350px){.pair{grid-template-columns:1fr}}</style>'+
    '<fieldset><legend>'+tr('Darstellung','Appearance')+'</legend>'+
    '<div class="field"><label for="title">'+tr('Kartentitel','Card title')+'</label><input id="title" data-field="title" type="text" value="'+esc(c.title||"Franky's Christmas")+'"></div>'+
    '<div class="field"><label for="layout_mode">'+tr('Layout','Layout')+'</label><select id="layout_mode" data-field="layout_mode">'+
    ['auto','compact','comfortable'].map((value)=>'<option value="'+value+'"'+((c.layout_mode||'auto')===value?' selected':'')+'>'+({auto:tr('Automatisch (empfohlen)','Auto (recommended)'),compact:tr('Kompakt','Compact'),comfortable:tr('Großzügig','Comfortable')}[value])+'</option>').join('')+'</select></div>'+
    '<small>'+tr('Im Abschnitt-Dashboard kannst du die Karte zusätzlich über die Größensteuerung ziehen. Buttons bleiben mindestens 44 px hoch.','In a Sections dashboard you can also resize the card. Buttons stay at least 44 px high.')+'</small></fieldset>'+
    '<fieldset><legend>'+tr('Flugzeiten','Flight hours')+'</legend><div class="pair">'+
    '<div class="field"><label for="schedule_start">'+tr('Von','From')+'</label><input id="schedule_start" data-field="schedule_start" type="time" value="'+esc(c.schedule_start||'09:00')+'"></div>'+
    '<div class="field"><label for="schedule_end">'+tr('Bis','Until')+'</label><input id="schedule_end" data-field="schedule_end" type="time" value="'+esc(c.schedule_end||'22:00')+'"></div></div>'+
    '<small>'+tr('Gilt für beide Automatikmodi. Manuelle Testflüge sind jederzeit möglich.','Applies to both automatic modes. Manual test flights work at any hour.')+'</small><div id="warning" class="invalid" role="status"></div></fieldset>'+
    '<fieldset><legend>'+tr('Animation und Lautstärke','Animation and volume')+'</legend>'+
    '<div class="field"><label for="duration">'+tr('Flugdauer (Sekunden)','Flight duration (seconds)')+': <output id="duration-value">'+esc(c.duration==null?10:c.duration)+'</output></label><input id="duration" data-field="duration" type="range" min="4" max="30" step="1" value="'+esc(c.duration==null?10:c.duration)+'"></div>'+
    '<div class="field"><label for="width_percent">'+tr('Schlittengröße (% der Bildschirmbreite)','Sleigh size (% of screen width)')+': <output id="width_percent-value">'+esc(c.width_percent==null?60:c.width_percent)+'</output></label><input id="width_percent" data-field="width_percent" type="range" min="20" max="95" step="5" value="'+esc(c.width_percent==null?60:c.width_percent)+'"></div>'+
    '<div class="pair"><div class="field"><label for="sound_volume">'+tr('Santa-Lautstärke','Santa volume')+'</label><input id="sound_volume" data-field="sound_volume" type="range" min="0" max="1" step="0.05" value="'+esc(c.sound_volume==null?.55:c.sound_volume)+'"></div>'+
    '<div class="field"><label for="bells_volume">'+tr('Glöckchen-Lautstärke','Bells volume')+'</label><input id="bells_volume" data-field="bells_volume" type="range" min="0" max="1" step="0.05" value="'+esc(c.bells_volume==null?.78:c.bells_volume)+'"></div></div></fieldset>'+
    '<details><summary>'+tr('Erweitert: eigene Mediendateien','Advanced: custom media files')+'</summary>'+
    [['video',tr('WebM-Video','WebM video')],['ios_video',tr('iPad-Animation (WebP)','iPad animation (WebP)')],['sound',tr('Santa-Ton','Santa audio')],['bells',tr('Glöckchen','Bells')],['fallback',tr('Ersatzbild','Fallback image')]].map((p)=>'<div class="field"><label for="'+p[0]+'">'+p[1]+'</label><input type="text" data-field="'+p[0]+'" id="'+p[0]+'" placeholder="'+tr('Mitgelieferte Datei verwenden','Use bundled asset')+'" value="'+esc(typeof c[p[0]]==='string'?c[p[0]]:'')+'"></div>').join('')+
    '</details>';
   var self=this;
   this.shadowRoot.querySelectorAll('[data-field]').forEach(function(el){
     if(el.type==='range'){
       el.oninput=function(){var out=self.shadowRoot.getElementById(el.id+'-value');if(out)out.textContent=el.value;};
     }
     el.onchange=function(){self._changed(el);};
   });
 }
 _changed(el){
   var key=el.getAttribute('data-field'),value=el.value;
   var warning=this.shadowRoot.getElementById('warning');
   if(warning)warning.textContent='';
   if(key==='schedule_start'||key==='schedule_end'){
     var st=key==='schedule_start'?value:(this._config.schedule_start||'09:00');
     var en=key==='schedule_end'?value:(this._config.schedule_end||'22:00');
     if(!/^\d{2}:\d{2}$/.test(value)||timeMinutes(st)>=timeMinutes(en)){
       if(warning)warning.textContent=this._lang==='de'?'Beginn muss vor dem Ende liegen.':'Start must be before end.';
       el.value=key==='schedule_start'?(this._config.schedule_start||'09:00'):(this._config.schedule_end||'22:00');
       return;
     }
   }
   var next=Object.assign({},this._config);
   if(['duration','width_percent','sound_volume','bells_volume'].indexOf(key)!==-1)value=Number(value);
   if(key==='title'&&!value.trim())value="Franky's Christmas";
   if(['video','ios_video','sound','bells','fallback'].indexOf(key)!==-1&&!value.trim())delete next[key];
   else if(key==='layout_mode'&&['auto','compact','comfortable'].indexOf(value)===-1)next[key]='auto';
   else next[key]=value;
   if(next[key]===this._config[key])return;
   this._config=next;
   this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
 }
}

customElements.define('frankys-christmas-card-editor',FrankysChristmasCardEditor);
customElements.define('frankys-christmas-card',FrankysChristmasCard);
restoreGlobalFlightController();
window.customCards=window.customCards||[];
if(!window.customCards.some(function(x){return x.type==='frankys-christmas-card';})){
 window.customCards.push({type:'frankys-christmas-card',name:"Franky's Christmas Card",description:'Responsive Christmas overlay with a visual editor, local schedules and bundled media.'});
}
})();
