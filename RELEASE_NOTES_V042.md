# Franky's Seasonal Fun Card v0.4.2

## Browser cache compatibility fix

Fixes an update issue that could leave the older Christmas Card UI visible after installing v0.4.1 through HACS, especially in Chrome and Amazon Silk (Echo Show).

The HACS loader now stamps the release version onto every nested JavaScript import, including the calendar and scene modules, Halloween engine and local Three.js dependencies. This prevents browsers from reusing an older ES module from their caches when the HACS resource itself has updated.

**After installing the update, reload or reopen the dashboard once.** There should be no need to manually clear the browser cache. Tabs that remain open cannot load new code until they refresh.

No changes to calendar dates, animation playback, existing dashboard card types, settings, HACS repository path or media licensing. All existing v0.4.1 functionality is retained.
