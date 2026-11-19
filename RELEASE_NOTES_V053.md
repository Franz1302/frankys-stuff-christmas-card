# Franky's Seasonal Fun Card v0.5.3

## Christkind transparency fix on Safari and iPadOS

The v0.5.2 Christkind WebM contains an alpha channel, but Safari can display its green original background because the browser does not reliably composite VP9 alpha.

**Fixed:** On modern Safari/iPadOS the card automatically plays the included transparent animated WebP (20 fps, 960×540, 15 seconds) with a separate synchronized MP3 soundtrack. Other browsers continue using the original transparent VP9 WebM with embedded sound.

No changes to the animation's characters, voice, figure selection, independent schedules, child lock, calendar or other seasonal scenes.

### Installation

Update the existing Franky's Seasonal Fun Card in HACS; no additional repository or second card is required. Reload the Home Assistant dashboard after updating so the browser gets the new JavaScript.

Older iOS 12 tablets do not have a supported conversion path in this release; compatibility work remains deferred.

Source code and media have separate licenses. See `SEASONAL_ASSET_SOURCES.md`.
