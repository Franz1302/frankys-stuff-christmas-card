# 🎅 Franky's Christmas Card v0.2.1 — Public Beta

A Christmas sleigh flies across your Home Assistant dashboard, complete with galloping reindeer, golden stardust, a festive Santa voice, and softly fading sleigh bells.

## ✨ Highlights
- 🛷 Bundled cinematic transparent 3D Santa sleigh (`sleigh.webm`)
- 🎄 Gold stardust overlay
- 🎅 Bundled “Ho Ho Hooo” and continuous crossfaded sleigh bells
- 🎲 1–10 randomly distributed flights per day by default
- ⏱️ Optional 1–2, 3–8, 5–10 or 10–20 minute flight intervals
- 🌐 English and German controls
- 🖥️ Runs standalone on one monitor; no entities, helpers, Browser Mod, or HA automations required
- ☕ Visible **Thanks for Coffee** Ko-fi button in the card and README

## 🧩 Installation
1. In HACS, add this repository as a custom **Dashboard** repository:
   `https://github.com/Franz1302/frankys-stuff-christmas-card`
2. Install **Franky's Christmas Card**, refresh Home Assistant.
3. Add a card to a dashboard:

```yaml
type: custom:frankys-christmas-card
```

4. Tap **Test flight** to preview and **Enable** for automatic visits.
5. Turn **Sound on** if you want the included voice and bells. Browser audio-autoplay rules may require an initial tap.

Video and both sound files are included automatically in the HACS download.

## ⚠️ Compatibility and licensing
- Transparent WebM may not be supported on older tablet browsers; an SVG fallback is provided.
- Card source code is MIT licensed.
- The 3D animation and third-party audio are separate from the MIT code license. See [ASSET_LICENSE.md](ASSET_LICENSE.md), which explains the integrated Pixabay audio credits and usage restrictions.

☕ [Thanks for Coffee — Support Franky's Stuff](https://ko-fi.com/Frankys_Stuff)

Feedback and reports: [GitHub Issues](https://github.com/Franz1302/frankys-stuff-christmas-card/issues).
