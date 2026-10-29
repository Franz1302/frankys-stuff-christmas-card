# Franky's Seasonal Fun Card

**Formerly Franky's Christmas Card.** Seasonal overlay animations for Home Assistant dashboards. Christmas and Halloween share one schedule and a compact customizable control card.

## Existing Christmas Card users — important

**This is an update to the same HACS repository. Do not uninstall Christmas Card or add a second repository.**

The repository address and HACS resource filename remain unchanged. Existing cards using `type: custom:frankys-christmas-card` continue to work and open the new controls. The default season is Christmas. Existing per-browser settings are migrated when they are still available. A one-time bilingual notice explains the rename.

If you previously installed a separate Seasonal beta resource under `/local/frankys-seasonal/`, remove that *separate beta resource* before using the HACS release to avoid duplicate schedulers.

## New installation

In HACS, add **Dashboard** custom repository `https://github.com/Franz1302/frankys-stuff-christmas-card` and install **Franky's Seasonal Fun Card**.

Add a card:

```yaml
type: custom:frankys-seasonal-card
```

The repository URL retains the original `christmas-card` slug for safe upgrades.

## Features

- **Season** button: Christmas or Halloween; no random switching between seasons.
- Christmas: original Santa sleigh, bell sounds, transparent WebM and iPad/Safari WebP.
- Halloween: animated 3D marshmallow with walking, turning and bursting into smaller marshmallows, plus individual sounds.
- Shared local schedule: 1–10 random appearances/day, hourly, 1–2 / 3–8 / 5–10 / 10–20 minute patterns and user-defined minute interval, all within configurable start/end times.
- Enable, Sound, Test and Stop buttons; extra settings under **Options**.
- Visual editor with custom colors, opacity, rounding and optional scoped CSS.
- German/English language chosen automatically from Home Assistant (English fallback).
- Fully local runtime: Three.js r180 and GLTFLoader included; no CDN calls or cloud dependency.
- Each browser/display has independent settings and schedule. No HA automations or Browser Mod required.

**Playback compatibility:** WebGL is required for Halloween; browser autoplay policies may require an initial interaction to unlock sound, especially on Silk and Safari.

## HACS and manual setup

The HACS entry deliberately stays `dist/frankys-christmas-card.js` to preserve automatic updates. The old YAML type is preserved as an alias. HACS distributes all supporting files from `dist/`, including `vendor/`, `assets/` and the original Christmas media.

Manual installations must copy all of `dist/` into one web directory and register its `frankys-christmas-card.js` as a JavaScript module.

## Credits and media licenses

Card source code: MIT, © 2026 Franky's Stuff. Original Christmas media and audio retain their applicable terms in `ASSET_LICENSE.md` and `THIRD_PARTY_LICENSES.md`. The Halloween model and original image were created by the author using Meshy and ChatGPT. The bundled sound effects are provided only for this creative project, not for standalone redistribution. Third-party Three.js code is MIT licensed: see `dist/vendor/THREE_LICENSE.txt`.

[Support Franky's Stuff](https://ko-fi.com/Frankys_Stuff) · [Issues and feedback](https://github.com/Franz1302/frankys-stuff-christmas-card/issues)
