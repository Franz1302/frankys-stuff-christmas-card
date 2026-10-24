# 🎅 Franky's Christmas Card v0.2.4 — Responsive Card & Visual Editor

The Christmas Card is now **resizable and fully configurable without editing YAML**.

### New
- **Home Assistant visual card editor** (Deutsch / English), including card title, layout density, schedule start and end, flight duration, sleigh size, separate volume controls, and advanced media URLs.
- **Responsive layout** that wraps controls when the card gets narrow.
- **Sections view resizing**: default width 12 columns, minimum 6 columns, automatic height.
- **Three presentation modes**: Auto (default), Compact, Comfortable.
- **Touch-friendly buttons**, minimum 44 px tall, balanced 2×2 arrangement in medium widths.
- Additional automated editor and layout tests.

### Preserved
- 09:00–22:00 automatic time window, customizable per card.
- 1–10 random flights/day or selectable minute intervals.
- Manual Test Flight at any time.
- Transparent animated WebP on iOS/Safari, WebM elsewhere; stardust, bells, voice and Ko-fi remain unchanged.

### Install / update
Open HACS → **Franky's Christmas Card** → Update, then refresh your Home Assistant browser.
For a *Sections* dashboard, edit the dashboard and use the card Layout tab to resize it. Open the card editor for new visual settings.

Minimal YAML stays:
```yaml
type: custom:frankys-christmas-card
```

☕ [Thanks for Coffee](https://ko-fi.com/Frankys_Stuff)
