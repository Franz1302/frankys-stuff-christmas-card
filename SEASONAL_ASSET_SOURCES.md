# Seasonal Fun Card — Asset sources and rights

## Christmas (unchanged)
- Original Santa sleigh `sleigh.webm` and `sleigh-ipad.webp`: retained from previous Christmas Card releases.
- `santa.mp3`, `bells.mp3`: previous royalty-free audio sources and attribution remain documented in `ASSET_LICENSE.md` and `THIRD_PARTY_LICENSES.md`.

## Halloween
- `assets/marshmallow-animated.glb`: original 3D character created by the author using Meshy. Animation and model were supplied by the author.
- Initial reference image generated with ChatGPT at the author's direction.
- `assets/laugh.mp3`, `assets/balloon-pop.mp3`, `assets/bubble-pops.mp3`: royalty-free audio supplied and adjusted by the author; kept as part of the combined creative work. Do not extract or redistribute as standalone audio.
- Users must comply with the originating asset services' licensing terms. The MIT license for the code does not transfer to the media.

## St. Martin and St. Nicholas
- The St. Martin scene bundles the supplied transparent animation at `dist/assets/St_Martin_korrigiert.webp`; a custom WebP URL can override it. **St. Martin sound provider: [Mirelo AI](https://mirelo.ai/)**. Its soundtrack `dist/assets/St_Martin_Mirelo_Ton_9s.mp3` was extracted from the author's Mirelo-exported 10.04-second video and trimmed/faded to 9.25 seconds to match the transparent animation. Sound can be disabled or its path/volume overridden. It has the same non-commercial and attribution restrictions as the St. Nicholas Mirelo audio below; it is not MIT-licensed.
- St. Nicholas animation: `dist/assets/Nikolaus_ohne_Wasserzeichen_transparent.webp`, author-created Meshy video converted to transparent animated WebP. The extra donkey unexpectedly falls out of the gift sack and is intentionally retained.
- **St. Nicholas sound provider: [Mirelo AI](https://mirelo.ai/)**. Track: `dist/assets/Nikolaus_Mirelo_Ton_15s.mp3`, generated from the author's video to match movement (15 seconds). The audio is NOT licensed under this repository's MIT source-code license. Under the [Mirelo Terms of Service](https://mirelo.ai/terms) (2026-10-19), Free Plan output is for non-commercial use only (section 2.1), and any shared or published output must visibly credit Mirelo as the sound provider (section 7.5). Do not relicense, sell, or redistribute this audio as a standalone stock sound.
- Custom WebP and sound paths remain configurable. Browser autoplay restrictions can mute automatic playback until a user interacts with the dashboard.
- Confirm and document the supplied St. Martin asset's usage terms before any public release; no license or attribution details were present in the repository. A public release also requires the two St. Nicholas media files to be present in dist/assets/.

## Local 3D dependencies
- `dist/vendor/three.core.js`, `three.module.js`, `GLTFLoader.js`, `BufferGeometryUtils.js`: Three.js r180, copyright Three.js authors, MIT.
- Imports adjusted to local relative paths; original MIT notice is preserved in `dist/vendor/THREE_LICENSE.txt`.
- No remote CDN is used for rendering at runtime.
