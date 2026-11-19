/* Prevent stale nested ES modules after a HACS version upgrade. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=path=>fs.readFileSync(path,'utf8');
const card=read('dist/frankys-seasonal-card.js');
const version=card.match(/^const VERSION='([^']+)';/m)?.[1];
assert(version,'Seasonal card must declare a release version');
assert(/^\d+\.\d+\.\d+$/.test(version),'Release version must be stable semver');
const expected=[
 ['dist/frankys-christmas-card.js',`import './legacy-christmas-engine.js?v=0.4.2';`],
 ['dist/frankys-christmas-card.js',`import './frankys-seasonal-card.js?v=${version}';`],
 ['dist/frankys-seasonal-card.js',`import('./marshmallow-engine.js?v=0.4.2')`],
 ['dist/frankys-seasonal-card.js',`import('./seasonal-scenes.mjs?v=${version}')`],
 ['dist/marshmallow-engine.js',`import('./vendor/three.module.js?v=0.4.2')`],
 ['dist/marshmallow-engine.js',`import('./vendor/GLTFLoader.js?v=0.4.2')`],
 ['dist/vendor/GLTFLoader.js',`from './three.module.js?v=0.4.2'`],
 ['dist/vendor/GLTFLoader.js',`from './BufferGeometryUtils.js?v=0.4.2'`],
 ['dist/vendor/BufferGeometryUtils.js',`from './three.module.js?v=0.4.2'`],
 ['scripts/prepare-ha-test-installation.cjs',`import './frankys-seasonal-test-card.js?v=${version}';`],
];
for(const [file,snippet] of expected){
 assert(read(file).includes(snippet),`Missing or stale version in ${file}: ${snippet}`);
}
const entry=read('dist/frankys-christmas-card.js');
assert(entry.includes(`v${version} — HACS entry`),'HACS entry banner must match version');
assert.match(read('tests/seasonal-calendar.test.cjs'),new RegExp('seasonal-scenes\\.mjs\\?v='+version.replaceAll('.','\\.')),'Scene mocks follow the current version');
console.log('OK: Updated seasonal modules use the new release version, unchanged vendor and render engines retain stable v0.4.2 imports');
