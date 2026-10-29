# Franky's Seasonal Fun Card v0.4.0

## For existing Christmas Card users
**Franky's Christmas Card has become Franky's Seasonal Fun Card.** This is an update to the same HACS repository, not a separate installation. Do not uninstall the original repository. Existing `type: custom:frankys-christmas-card` dashboard cards continue working, and Christmas stays the selected season by default.

Where present, saved Christmas browser preferences migrate automatically. A one-time German/English notice explains the change. No dashboard YAML edit is required.

## New
- Manual Season selector: Christmas and Halloween; never randomly switches the season.
- New 3D Halloween Marshmallow appearance with separated and adjustable sounds.
- Shared scheduler, Stop control and compact Options panel with custom minutes interval.
- Custom card colors, transparency, corner radius, scoped CSS.
- Local Three.js r180, GLTFLoader and model playback: no external CDN calls.
- English and German interfaces and known error messages.

## Preserved
- Christmas sleigh animation, golden trail, Santa sound, bells and transparent WebM/WebP media.
- Original GitHub URL, HACS `frankys-christmas-card.js` entry file and old Lovelace custom-card type.
- Independent browser schedules, daily time windows, supported devices and sound-unlock behavior.

## New installs
Install via the existing HACS Dashboard custom repo `https://github.com/Franz1302/frankys-stuff-christmas-card`, then add `type: custom:frankys-seasonal-card`.

**Remove a separately installed Seasonal beta dashboard resource before loading the unified HACS update.**

Copyright and licensing: see README, ASSET_LICENSE, THIRD_PARTY_LICENSES and SEASONAL_ASSET_SOURCES.
