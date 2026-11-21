# WOD5E HUD v0.7.5

Hotfix for the single-bar HUD.

## Changed

- The vitality ring was removed from the portrait, the vitality system is no
  longer part of the HUD. The red border around the portrait is kept.
- The hunger area now carries the same glow as the portrait, and its red ring
  is unchanged.
- Clicking the portrait or the hunger area now plays a short pulse effect.
- Double-clicking the hunger area rolls a Blood Check with the same
  confirmation as the menu action. A hover hint explains the shortcut.
- The HUD now waits for the chat message and the Dice So Nice animation before
  updating the hunger value, matching the system timing.

## Fixed

- The hunger value no longer changes before the roll result is presented.
- The menu hint on the hunger area is no longer hidden by the value tooltip.

## Documentation

- README rewritten for players, with the development status, vampire focus and
  the wod5e system requirement.

## Notes

- Foundry VTT v13+ with the wod5e system.
- No settings or data migration needed.
