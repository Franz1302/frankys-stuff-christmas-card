# Changelog

## v0.2.4 — Responsive layout & visual editor
- Native Home Assistant visual configuration editor, with localized controls (German/English)
- Responsive auto/compact/comfortable card density, accessible touch targets (at least 44px)
- Native Sections-grid sizing: 12 columns default, resizable down to 6 columns, auto content height
- Graphically configurable flight times, duration, sleigh size and sound volumes; advanced media URLs
- Existing daily random schedule, iOS/WebM media selection, stardust and Ko-fi retained

## v0.2.3 — Quiet hours / configurable flight hours
- Automatic flights only between 09:00 and 22:00 by default (local display time)
- Start and end time editable in the card and via YAML (`schedule_start`, `schedule_end`)
- Existing 1–10 random flights/day and optional minute intervals both honor the time window
- Manual Test flight works even outside the scheduled time window
- Existing audio, media formats, Ko-fi button and saved settings retained

## v0.2.2 — iOS display compatibility
- Automatic Safari/iOS animated WebP with clean alpha, original WebM on other browsers
- Original video, stardust, bells, Santa voice and scheduling unchanged
- Animated WebP is packaged beside the existing files in HACS

## v0.2.1 — Public beta
- Prominent Ko-fi support buttons in the README and Christmas card
- SPDX-recognized MIT source license

## v0.2.0 — Initial beta
- Standalone Home Assistant dashboard card
- Bundled transparent 3D Santa and reindeer video
- Golden stardust and SVG fallback for incompatible browsers
- Bundled Santa voice and crossfaded, smoothly fading sleigh bells
- Default 1–10 randomized flights per local day
- Optional legacy 1–2 / 3–8 / 5–10 / 10–20 minute flights
- Local enable/disable, sound toggle, and test flight button
- German/English interface following Home Assistant language
- No extra helpers, automations, or Browser Mod required
