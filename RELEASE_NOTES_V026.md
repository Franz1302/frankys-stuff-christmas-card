# 🎅 Franky's Christmas Card v0.2.6 — Reliable Santa Audio

### Improved
- 🎅 Santa's “Ho Ho Ho” now uses a reusable Howler.js Web Audio player instead of creating delayed HTML Audio elements on each flight.
- 🔔 Crossfaded bells remain smooth, and use Howler's shared AudioContext where available; HTML5 fallback remains available.
- 👆 Enable, Sound on, and Test flight initiate audio unlocking. After a dashboard reload, the scheduled card preloads Santa audio so a later interaction anywhere on the dashboard can unlock playback.
- 🛠️ Browser console reports blocked audio playback and file loading errors.
- 🔒 Entirely local/offline: bundled Howler.js v2.2.4 under MIT license, no external requests or new HACS resources.
- ✅ Regression tests plus real Chromium desktop/tablet automatic-flight tests validate repeated playback without an additional click.

### Unchanged
- Global scheduled flights on all dashboard views, quiet hours, animation, media, design, settings and Ko-fi.

### Note on autoplay
A browser may still require a user gesture after opening/reloading Home Assistant. No JavaScript library can override a device's audio output settings or browser policy. A Fire tablet that cannot play local MP3 files audibly still needs a separate device-level investigation.

### Install / update
In Home Assistant open HACS → Franky's Christmas Card → Update, then fully reload the browser. On each display, open the control card once and tap **Ton an** or **Testflug** to activate audio. Device preferences are stored locally.

Minimal YAML is unchanged:

```yaml
type: custom:frankys-christmas-card
```

☕ [Support Franky's Stuff](https://ko-fi.com/Frankys_Stuff)
