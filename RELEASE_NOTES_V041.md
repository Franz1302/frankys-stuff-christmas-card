# Franky's Seasonal Fun Card v0.4.1

## Update for existing users

**Update the existing HACS Dashboard repository — do not uninstall or add a second repository.** The GitHub repository address and HACS JavaScript resource filename `frankys-christmas-card.js` remain unchanged. Existing `type: custom:frankys-christmas-card` cards still work; new cards may use `type: custom:frankys-seasonal-card`.

## What's new
- **Annual season calendar:** Halloween (25–31 October), St. Martin (8–11 November), St. Nicholas (1–6 December), Christmas (7–26 December). Every season can be enabled/disabled separately, with editable dates including periods crossing New Year.
- **In-card settings:** Open **Options → Annual calendar** to edit the schedule directly without dashboard edit mode. Existing options-panel and season-picker behavior is preserved. Calendar edits made inside the card are stored per browser, not synchronized across displays.
- **St. Martin:** Bundled transparent 9.25-second scene with corrected synchronized Mirelo audio.
- **St. Nicholas:** Bundled transparent 15-second scene with Mirelo audio; includes the second donkey that unexpectedly falls out of the gift sack.
- Existing sound toggle controls both new soundtracks. Visual editor supports custom scene/sound paths and their volume controls.

## Preserved
- Christmas sleigh and bells, Halloween animated marshmallow with sounds.
- Original installation and card type compatibility, scheduling, options behavior, English and German UI.
- Browser-local enable, sound and schedule preferences.

## Important notes
- Web browsers, especially Silk and Safari, may require a user interaction before playing sound automatically.
- **Sound effects provided by [Mirelo AI](https://mirelo.ai/)**. The Mirelo Free Plan restricts its output to non-commercial use and requires clear, visible attribution when published. See [Mirelo terms](https://mirelo.ai/terms) §§ 2.1 and 7.5.
- The MIT license covers code only, not bundled media. Asset sources and restrictions are documented in [SEASONAL_ASSET_SOURCES.md](SEASONAL_ASSET_SOURCES.md).
- When testing a separate `/local/seasonal-calendar-test/` installation, remove that test resource on devices intended for the final HACS version to avoid two independent schedulers.

This is the next release after v0.4.0. No separate HACS repository is needed.
