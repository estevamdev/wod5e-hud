# WOD5E HUD

A compact HUD for **World of Darkness 5e** on Foundry VTT. It keeps the
selected character's essentials on screen, so hunger and the most used rolls
are always within reach.

> **Status: in development and functional for vampire play.** This module is
> made for the **wod5e** system (**VTM5e**) and is being tested with vampire
> characters. Support for other creature types is partial and still being
> expanded.

## What it is for

- Follows the selected token and adapts to the creature type.
- Shows portrait and hunger at a glance.
- Gives quick access to the rolls used most during a session.
- Keeps the actor sheet for reference instead of routine actions.

## Features

### Character bar

- Portrait with a red border. Double-click it to open the sheet.
- Hunger indicator for vampires, at the end of the bar. The count shows how
  many points remain until extreme hunger.
- Menu buttons for Actions, Attributes, Skills and Powers.
- Search palette for attributes, skills, disciplines, gifts, edges and features.
- Hover hints on the menu buttons and on every menu entry.

### Quick actions

| Category      | Actions                                                      |
| ------------- | ------------------------------------------------------------ |
| **Vitae**     | Blood Check (Rouse Check), Feeding (predator), Resist Frenzy |
| **Willpower** | Willpower test                                               |
| **Humanity**  | Remorse test                                                 |

All quick actions use the native **wod5e** rolls and dialogs, exactly like their
sheet buttons. Blood Check opens the system roll dialog and Resist Frenzy opens
the system Resist/Give in dialog.

### Menus

- **Attributes** and **Skills** with their dot ratings. Skills can show all
  entries or only the trained ones.
- **Disciplines**, **Gifts**, **Edges** and **Features**, with their costs.
- **Actions** grouped by Vitae, Willpower and Humanity.

### Options

- Show or hide the combat bar.
- Hide the macro hotbar, so the HUD uses that area instead.
- Choose the menu scale, default, medium or large, to resize the HUD drawers
  without changing the bar, the portrait or the hunger area.
- Enable a **minimalist action bar** to show only the menu icons, with the name
  on hover.
- Drag the bar to move it. The position is saved per player and **Reset
  position** returns it above the hotbar.
- Preferences are stored per player. The GM can allow players to toggle the HUD,
  force it on for everyone or force it off for everyone.

### Search and localization

- Search palette (`Alt+F`). It lists quick actions, attributes, skills,
  disciplines, gifts, edges and features.
- Keyboard navigation with `ArrowUp`, `ArrowDown`, `Enter` and `Escape`.
- English, Portuguese (Brazil) and Spanish. The module follows Foundry's
  configured language, with English as fallback.

## Requirements

- Foundry VTT **v13 or newer**.
- The **wod5e** system.
- Best experience with **vampire** characters. Other creature types have partial
  support.

## Installation

1. In Foundry Setup, open **Add-on Modules → Install Module**.
2. Paste the manifest URL:

   ```text
   https://github.com/estevamdev/wod5e-hud/releases/latest/download/module.json
   ```

3. Install and enable **WOD5E HUD** in the world.

To install manually, copy the module folder to your Foundry `Data/modules`
directory and enable it in the world.

## Usage

| Shortcut | Action                   |
| -------- | ------------------------ |
| `Alt+C`  | Toggle the combat HUD    |
| `Alt+F`  | Open the search palette  |
| `Alt+S`  | Open the settings window |

- Double-click the portrait to open the actor sheet.
- Double-click the hunger area to roll a Blood Check, the same action as the
  menu button.
- Drag the bar background to move it. **Reset position** in the settings window
  returns it above the hotbar.
- Click the gear to configure the HUD.
- Hover the menu buttons and their entries to read the full label.

## Notes and limitations

- The hunger indicator is shown only for vampires.
- The experience shortcut is hidden while that flow is being reworked.
- Creature types other than vampires are still being expanded.
- This module works only with the **wod5e** system. It is not compatible with
  other game systems.

## Development

- Node.js 20 or newer is required to build the CSS.
- Run `npm ci` and `npm run build` inside `build/`. The compiled stylesheet is
  committed and loaded by Foundry.
- Work happens on `dev`. The `main` branch holds the production module files.
- Releases are tags `vX.Y.Z` matching `module.json`. The release description
  comes from `RELEASE_NOTES.md`.
