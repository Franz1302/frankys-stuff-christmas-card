# Changelog

## v0.4.1 — Annual calendar, St. Martin and St. Nicholas (2026-11-08)
- New annual calendar with separate enable switches and editable date windows for Halloween, St. Martin, St. Nicholas and Christmas; inclusive annual ranges, including New Year crossings
- Calendar can be edited inside the existing Options dropdown without entering dashboard edit mode; changes are browser-local, saved between reloads and do not change HA card YAML
- Manual season selection overrides automatic calendar choice until the next local calendar date
- Bundled St. Martin transparent animated WebP (9.25 s) with a corrected synchronized Mirelo AI soundtrack
- Bundled St. Nicholas transparent animated WebP (~15 s) and its synchronized Mirelo AI soundtrack; retains the intentional second donkey joke
- Optional custom animation/audio URLs and sound-volume configuration, existing sound toggle applies
- Existing HACS resource filename, Christmas/Halloween behavior, legacy Lovelace card aliases and local schedules retained
- Sound provider credits and third-party media limitations documented in README and SEASONAL_ASSET_SOURCES.md
- Automated JS, calendar, browser and HACS validation tests

## v0.2.6 — Reliable Santa audio across dashboard flights
- Reusable, locally bundled Howler.js Web Audio for Santa voice, with audio unlocking on card buttons
- Global scheduler preloads audio so subsequent dashboard interaction can unlock future automatic flights
- Glöckchen retain crossfade and fade envelopes, with shared audio context and HTML5 fallback
- Error reporting for blocked audio and media loading failures
- Automated regression tests and real Chromium desktop/tablet browser tests for repeated automatic flights
- No change to dashboard configuration, flight times, animation or local-only operation

## v0.2.5 — Global dashboard flights & fixed hourly schedule
- Santa keeps flying on every Lovelace dashboard view on the current browser/display, without the control card remaining visible
- New "Every full hour" / "Jede volle Stunde" schedule alongside existing random-per-day and random-minute options
- Existing configurable daily flight window, media, audio, manual test button, and locally saved settings retained
- A global browser-local scheduler prevents duplicate intervals during dashboard navigation and resumes after page reloads
- Compatibility with the pre-existing JARVIS Christmas event overlay; no Home Assistant restart required
- New regression tests cover navigation, tab visibility, reloads, hourly scheduling, and narrow windows


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
