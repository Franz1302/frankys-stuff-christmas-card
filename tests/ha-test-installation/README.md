# Isolated Home Assistant test installation

This helper prepares a second, namespaced card bundle for an **isolated Home Assistant test configuration**. It does not edit the production Home Assistant configuration or replace the HACS-installed resource. The generated card has its own custom-element names, runtime globals, events, and browser storage keys, so both versions can be loaded on the same test dashboard without registering duplicate elements or sharing card settings.

## Prepare the test configuration

Use a separate Home Assistant test instance and its own configuration directory. Do not point these commands at the production configuration. The directory must already contain `configuration.yaml`.

Create an explicit safety marker in that test configuration directory:

```powershell
$testConfig = 'C:\ha-test\config'
[System.IO.File]::WriteAllText(
  (Join-Path $testConfig '.seasonal-calendar-test-instance'),
  'SEASONAL_CARD_TEST_INSTANCE',
  [System.Text.Encoding]::ASCII
)
```

From the repository root, generate a new resource folder under `<testConfig>\www\seasonal-calendar-test`:

```powershell
node scripts\prepare-ha-test-installation.cjs 'C:\ha-test\config'
```

The generator refuses to run without the test marker and refuses to overwrite an existing test bundle. It copies the committed `dist/` files and writes a `test-installation.json` manifest with the source commit. If the test bundle needs replacing, remove only `<testConfig>\www\seasonal-calendar-test` in the test instance, then run the generator again.

## Register and test the card

In the **test instance only**, add a Lovelace JavaScript module resource:

```text
/local/seasonal-calendar-test/frankys-christmas-card.js
```

Leave the existing HACS resource untouched. Add a test card using the isolated element:

```yaml
type: custom:frankys-seasonal-test-card
seasonal_calendar:
  enabled: true
```

The original HACS card keeps its existing `custom:frankys-seasonal-card` type, element names, and storage. Reload the test dashboard after registering the resource. To compare versions, place one HACS card and one test card on the same test dashboard; select St. Martin on the test card and verify the WebP overlay, stop cleanup, schedule, and optional annual calendar.

The test bundle uses the relative supporting files copied alongside its entry point. Its St. Martin media therefore resolves within `/local/seasonal-calendar-test/assets/`, independently of the HACS installation.
