# WOD5E HUD v0.7.6

All rolls trigger the sheet actions, the HUD only provides shortcuts.

## Added

- Drag the bar to move it. The position is saved per client and clamped to the
  viewport.
- Reset position in the settings window returns the bar above the hotbar.

## Changed

- All rolls trigger the sheet actions, the HUD only provides shortcuts.
- The HUD follows the system actor update timing.

## Removed

- Unused status fields, the old mini HUD id cleanup, empty action cases and the
  unused skill filter choices.
- Unused creature labels and redundant keys from the language files.

## Notes

- Foundry VTT v13+ with the wod5e system.
- No settings or data migration needed.
- The experience shortcut remains hidden.
