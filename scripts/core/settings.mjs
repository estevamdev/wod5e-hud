import { MODULE_ID } from './constants.mjs'

const ObjectField = foundry?.data?.fields?.ObjectField

function freePositionType() {
  if (ObjectField) return new ObjectField({ initial: { x: null, y: null } })
  return Object
}

export function registerSettings() {
  game.settings.register(MODULE_ID, 'combatHud', {
    name: 'WOD5E_HUD.Settings.CombatHud',
    hint: 'WOD5E_HUD.Settings.CombatHudHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true
  })

  game.settings.register(MODULE_ID, 'hideHotbar', {
    name: 'WOD5E_HUD.Settings.HideHotbar',
    hint: 'WOD5E_HUD.Settings.HideHotbarHint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  })

  game.settings.register(MODULE_ID, 'allowPlayerCombatToggle', {
    name: 'WOD5E_HUD.Settings.AllowCombatToggle',
    hint: 'WOD5E_HUD.Settings.AllowCombatToggleHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  })

  game.settings.register(MODULE_ID, 'enablePlayerCombatForAll', {
    name: 'WOD5E_HUD.Settings.EnableCombatForAll',
    hint: 'WOD5E_HUD.Settings.EnableCombatForAllHint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: false
  })

  game.settings.register(MODULE_ID, 'freePosition', {
    scope: 'client',
    config: false,
    type: freePositionType(),
    default: { x: null, y: null }
  })

  game.settings.register(MODULE_ID, 'skillsFilter', {
    scope: 'client',
    config: false,
    type: String,
    default: 'trained'
  })
}
