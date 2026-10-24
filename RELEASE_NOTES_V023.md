# 🎅 Franky's Christmas Card v0.2.3 — Customizable flight hours

**Santa is asleep at night!** By default, automatic flights run **09:00–22:00** in your display's local time.

- 🕘 Choose your own **From / Until** hours directly in the card.
- 🎲 The **1–10 random flights per day** are distributed within the selected daytime window, not over the whole 24 hours.
- ⏱️ The optional minute-based schedules now honor the same active hours.
- 🛷 **Test flight is always available**, even at night; it does not count toward the random quota.
- 📱 Existing Safari/iPad animated WebP and WebM auto-selection remain intact.
- 🎅 Santa voice, sleigh bells, stardust and Ko-fi button are unchanged.
- ⚙️ Optional YAML: `schedule_start: "09:00"` and `schedule_end: "22:00"` (local HH:MM, start earlier than end).

## Install / update

Update **Franky's Christmas Card** from HACS, then reload your browser. Existing settings remain saved on each monitor.

Minimal card YAML remains unchanged:
```yaml
type: custom:frankys-christmas-card
```

☕ [Thanks for Coffee — Support Franky's Stuff](https://ko-fi.com/Frankys_Stuff)
