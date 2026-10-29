# Seasonal Fun Card — Asset sources and rights

## Christmas (unchanged)
- Original Santa sleigh `sleigh.webm` and `sleigh-ipad.webp`: retained from previous Christmas Card releases.
- `santa.mp3`, `bells.mp3`: previous royalty-free audio sources and attribution remain documented in `ASSET_LICENSE.md` and `THIRD_PARTY_LICENSES.md`.

## Halloween
- `assets/marshmallow-animated.glb`: original 3D character created by the author using Meshy. Animation and model were supplied by the author.
- Initial reference image generated with ChatGPT at the author's direction.
- `assets/laugh.mp3`, `assets/balloon-pop.mp3`, `assets/bubble-pops.mp3`: royalty-free audio supplied and adjusted by the author; kept as part of the combined creative work. Do not extract or redistribute as standalone audio.
- Users must comply with the originating asset services' licensing terms. The MIT license for the code does not transfer to the media.

## Local 3D dependencies
- `dist/vendor/three.core.js`, `three.module.js`, `GLTFLoader.js`, `BufferGeometryUtils.js`: Three.js r180, copyright Three.js authors, MIT.
- Imports adjusted to local relative paths; original MIT notice is preserved in `dist/vendor/THREE_LICENSE.txt`.
- No remote CDN is used for rendering at runtime.
