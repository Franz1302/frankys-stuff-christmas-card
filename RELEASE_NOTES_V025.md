# 🎅 Franky's Christmas Card v0.2.5 — Santa Everywhere!

Santa no longer needs his control card to stay on screen: **after enabling it once on a browser/display, he can fly on all Home Assistant Lovelace dashboard views**.

### New
- 🛷 Global browser-local flight scheduler: changing views no longer stops Santa.
- 🕐 **Every full hour / Jede volle Stunde** option: scheduled exactly at full clock hours (for example 09:00, 10:00 and 11:00), within your chosen flight hours.
- 🎲 Existing random daily or minute interval modes remain fully available.
- 🛡️ No duplicate schedules on navigation or card reopening; resumes when Home Assistant is reloaded, even on a different view.
- 🧪 Regression coverage for navigation, scheduling, active hours, reload and background tab behavior.

### Unchanged
- 🎄 Default automatic hours 09:00–22:00 (customizable), manual test flights anytime.
- 🎞️ Transparent WebM/WebP (Safari/iPad), stardust, Santa's voice, bells and Ko-fi.
- 🌍 German / English and visual settings editor.
- 📱 Schedules and preferences are independent per browser/display, **not** synchronized between devices.

### Update
Open HACS → **Franky's Christmas Card** → **Update**, then reload the browser (Ctrl+Shift+R). **Open the control card once on each display after upgrading**, so its configuration is saved for global use. Thereafter it can run on other views without a visible card.

Closing Home Assistant or the browser stops flights; missed flights are skipped, never queued. Automatic sound playback may require a prior user interaction depending on the browser.

The card's YAML stays unchanged:

```yaml
type: custom:frankys-christmas-card
```

☕ [Thanks for Coffee — Support Franky's Stuff](https://ko-fi.com/Frankys_Stuff)
