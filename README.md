# WOD5E HUD

A compact, gothic HUD for **World of Darkness 5e** on Foundry VTT (v13/v14).
It follows the selected token, adapts to the creature type and groups the most
used rolls and information into a small floating interface.

## Features

### Combat HUD

- Optional bar anchored **5 px above the macro hotbar** and horizontally
  centered on it.
- Starts with the **portrait**: vitality ring around it, “Health” tooltip and
  double-click to open the actor sheet.
- Then search (icon only), quick actions, attributes, skills (three columns),
  disciplines/powers and the settings gear.
- Ends with the **hunger indicator** (vampires only), using the same blood
  palette as the vitality ring.
- The **XP shortcut is currently hidden** while the experience flow is still
  being worked on. Set `SHOW_XP` to `true` in `scripts/core/constants.mjs` to
  re-enable it.
- When the player enables **Hide the macro hotbar**, the macro bar and its page
  arrows are hidden and the combat HUD takes their exact place, keeping the same
  bottom margin.

### Vitality ring

- Uses the same blood-red palette as the hunger gauge.
- Follows the system rule for superficial damage (half a health level per point)
  and has no numeric counter.

### Hunger indicator

- Displayed **only for vampires** (blood drop), at the end of the combat bar.
- Filled from the bottom with the same blood colors used by the system.
- The numeric value is centered inside the icon, above the fill.
- Empty area uses an obsidian base with a dark/red glow for readability on any
  scene background.

### Quick actions

| Category      | Actions                                                      |
| ------------- | ------------------------------------------------------------ |
| **Vitae**     | Rouse Check (Blood Check); Feeding (predator); Resist Frenzy |
| **Willpower** | Willpower Test                                               |
| **Humanity**  | Remorse Test                                                 |

Rouse and Frenzy open a confirmation prompt before rolling. Feeding rolls the
actor's predator type through the system roller, so it appears only for
vampires that have a predator type with a dicepool. The quick actions use the
native `wod5e` system flows (dialogs, rolls and actor updates).

### Search

- Global palette (`Alt+F`).
- Includes quick actions, attributes, skills, disciplines/powers, gifts, edges
  and features.
- Keyboard navigation with `ArrowUp`, `ArrowDown`, `Enter` and `Escape`.
- Selecting a quick action runs the same flow as the Actions drawer.

### Settings

The gear opens a window with two tabs:

- **Settings**
  - **Combat HUD** — show/hide the bar (portrait, vitality, hunger and actions).
  - **Hide the macro hotbar** — hides the macro bar and its page arrows; the
    combat HUD takes its place. Stored per client.
- **Game Master**
  - Allow players to toggle the combat HUD.
  - **Enable combat HUD for all players** (overrides their local option).

World permissions are stored as world settings and can also be edited from
Foundry’s module settings.

### Localization

- English (`en`), Portuguese Brazil (`pt-BR`) and Spanish (`es`).
- The module follows **Foundry’s configured language** per user, with English as
  the fallback for missing keys.

## Requirements

- Foundry VTT **v13+** (verified on 14.365).
- The **wod5e** system.

## Installation

### From manifest (recommended)

1. In Foundry Setup, open **Add-on Modules → Install Module**.
2. Paste the manifest URL:

   ```text
   https://github.com/estevamdev/wod5e-hud/releases/latest/download/module.json
   ```

3. Install and enable **WOD5E HUD** in the world.

### Manual

Copy this folder to `Data/modules/wod5e-hud` and enable the module.

> The module id is `wod5e-hud`. Settings and flags from the old `emo-hud`
> module are not migrated.

## Usage

| Shortcut | Action                   |
| -------- | ------------------------ |
| `Alt+C`  | Toggle the combat HUD    |
| `Alt+F`  | Open the search palette  |
| `Alt+S`  | Open the settings window |

- Double-click the portrait to open the actor sheet.
- Hover the ring for the “Health” tooltip and the portrait for the sheet hint.
- Click the gear to configure the HUD.

## Development

### Requirements

- Node.js 20+
- npm

### Build the CSS

```bash
cd build
npm ci
npm run build     # writes ../styles/wod5e-hud.css
npm run watch     # rebuild on changes
```

Tailwind configuration: `prefix: "wod-"`, `important: "#wod5e-hud-root"`,
`preflight: false`.

The compiled `styles/wod5e-hud.css` is **committed** and required by Foundry.

### Branch model

- **`main`**: production. Only release-ready code and tags. The compiled CSS is
  always present.
- **`dev`**: development integration branch.
- Feature/fix branches should target `dev`.

### Release process

1. Update `version` in `module.json` and write the release notes in
   `RELEASE_NOTES.md` on `dev`.
2. Run `npm run build` in `build/` and commit the compiled
   `styles/wod5e-hud.css`.
3. Run `build/publish-main.sh` from `dev` to copy the module files into `main`.
   The toolchain stays on `dev`, so there is no branch merge.
4. Create and push a tag `vX.Y.Z` on `dev` (the tag must match
   `module.json.version`).
5. GitHub Actions:
   - builds the CSS with Tailwind,
   - checks the version against the tag,
   - packages `module.zip` (module files at the root, excluding `build/` and
     repository files),
   - generates the release `module.json` with `url`, `manifest` and `download`,
   - publishes the GitHub Release using `RELEASE_NOTES.md` as the description.

The stable manifest URL is:

```text
https://github.com/estevamdev/wod5e-hud/releases/latest/download/module.json
```

The `download` field in the release manifest points to the versioned zip:

```text
https://github.com/estevamdev/wod5e-hud/releases/download/vX.Y.Z/module.zip
```

No pre-release channel is used: every published release is production.
