# WOD5E HUD v0.7.4

The HUD is now a single bar, with the portrait and the hunger indicator built
into the combat bar.

## Added

- Feeding quick action for vampires that have a predator type with a dicepool,
  rolling through the native system roller.
- Player option **Hide the macro hotbar**, which hides the macro bar and its
  page arrows, and the combat HUD takes their place with the same bottom margin.
- Hover tooltips on the Actions, Attributes, Skills and Powers buttons, and on
  every drawer row.
- Red ring around the hunger area, matching the portrait border.

## Changed

- The character HUD was merged into the combat bar, portrait first, hunger last,
  both as 72 px circular medallions (56 px on narrow screens).
- The bar keeps its 35 px thickness while its ends swell into the circular
  medallions, drawn as one continuous silhouette with a single border.
- The central band ends at the medallion centres, so the bar never extends past
  the portrait or the hunger area.
- The combat bar is centred on the macro hotbar and no longer overlaps it.
- The skills filter button now describes the next action, "Show all" or
  "Trained only", instead of the current state.
- The Rouse action is labelled Blood Check in pt-BR ("Checagem de Sangue") and
  es ("Chequeo de Sangre"), while en keeps "Rouse Check".

## Fixed

- The font scale inside the bar and drawers was forced to 16 px by a global
  reset, the original compact scale is restored.
- Hiding the hotbar now works reliably, applied directly to the element and
  re-applied on every render.
- The bar no longer continues beyond the portrait and hunger circles.

## Removed

- Character mini HUD, drag and dock positioning, and the Alt+H shortcut.
- Character HUD settings and the matching GM permissions.
- Reset position button.
- The XP shortcut is temporarily hidden with SHOW_XP = false in
  scripts/core/constants.mjs while the experience flow is reworked.

## Notes

- Foundry VTT v13+ (verified on 14.365) with the wod5e system.
- No migration needed, previous mini-HUD client preferences are ignored.
- Shortcuts, Alt+C for the combat HUD, Alt+F for search, Alt+S for settings.
