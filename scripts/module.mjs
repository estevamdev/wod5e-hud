import { MODULE_ID, MODULE_TITLE } from './core/constants.mjs'
import { registerSettings } from './core/settings.mjs'
import { Wod5eHud } from './ui/hud.mjs'

let activeHud = null
let api = null

function registerKeybindings() {
  game.keybindings.register(MODULE_ID, 'openSearch', {
    name: 'WOD5E_HUD.Search.Title',
    editable: [{ key: 'KeyF', modifiers: ['Alt'] }],
    onDown: () => {
      api?.openSearch()
      return true
    }
  })

  game.keybindings.register(MODULE_ID, 'openSettings', {
    name: 'WOD5E_HUD.Settings.Title',
    editable: [{ key: 'KeyS', modifiers: ['Alt'] }],
    onDown: () => {
      api?.openSettings()
      return true
    }
  })

  game.keybindings.register(MODULE_ID, 'toggleCombatHud', {
    name: 'WOD5E_HUD.Combat',
    editable: [{ key: 'KeyC', modifiers: ['Alt'] }],
    onDown: () => {
      api?.toggleCombat()
      return true
    }
  })
}

Hooks.once('init', () => {
  registerSettings()
  registerKeybindings()
  console.log(`${MODULE_TITLE} | initializing`)
})

Hooks.once('ready', async () => {
  if (game.system?.id !== 'wod5e') {
    console.warn(`${MODULE_TITLE} | the wod5e system is not active; HUD will stay idle.`)
    return
  }

  try {
    const hud = new Wod5eHud()
    activeHud = hud
    await hud.init()
    for (const delay of [250, 750, 1500]) {
      setTimeout(() => hud.positionCombat(), delay)
    }

    api = {
      hud,
      toggleCombat: (force) => hud.toggleCombatHud(force),
      refresh: () => hud.refresh({ animate: true }),
      openSearch: () => hud.openSearch(),
      openSettings: () => hud.openSettings(),
      getActiveActor: () => hud.actor,
      getActiveToken: () => hud.token
    }

    const module = game.modules.get(MODULE_ID)
    if (module) module.api = api
    game.wod5eHud = api

    Hooks.on('controlToken', () => hud.refresh({ animate: true }))

    Hooks.on('updateActor', (actor) => {
      if (hud.isActiveActor(actor)) hud.scheduleStatusUpdate()
    })

    Hooks.on('updateToken', (document, changes) => {
      if (!hud.isActiveToken(document)) return
      if (
        changes.name !== undefined ||
        changes.texture !== undefined ||
        changes.actorId !== undefined ||
        changes.hidden !== undefined ||
        changes.actorLink !== undefined
      ) {
        hud.refresh({ animate: true })
      }
    })

    Hooks.on('deleteToken', (document) => {
      if (hud.isActiveToken(document)) hud.refresh({ animate: true })
    })

    Hooks.on('canvasReady', () => {
      hud.refresh()
      hud.positionCombat()
    })
    Hooks.on('renderHotbar', () => hud.positionCombat())
    Hooks.on('updateUser', (user) => {
      if (user?.id === game.user?.id) hud.refresh()
    })
    Hooks.on('updateSetting', (setting) => {
      if (!setting?.key?.startsWith(`${MODULE_ID}.`)) return
      const key = setting.key.slice(MODULE_ID.length + 1)
      const keys = [
        'combatHud',
        'hideHotbar',
        'minimalActions',
        'allowPlayerCombatToggle',
        'enablePlayerCombatForAll',
        'disablePlayerCombatForAll'
      ]
      if (!keys.includes(key)) return

      // The force-on and force-off switches are mutually exclusive.
      if (key === 'enablePlayerCombatForAll' && setting.value) {
        if (game.settings.get(MODULE_ID, 'disablePlayerCombatForAll')) {
          void game.settings.set(MODULE_ID, 'disablePlayerCombatForAll', false)
        }
      }
      if (key === 'disablePlayerCombatForAll' && setting.value) {
        if (game.settings.get(MODULE_ID, 'enablePlayerCombatForAll')) {
          void game.settings.set(MODULE_ID, 'enablePlayerCombatForAll', false)
        }
      }

      hud.applyPreferences()
      if (
        [
          'allowPlayerCombatToggle',
          'enablePlayerCombatForAll',
          'disablePlayerCombatForAll'
        ].includes(key)
      ) {
        hud.refreshSettingsApp()
      }
    })

    console.log(`${MODULE_TITLE} | ready`)
  } catch (error) {
    console.error(`${MODULE_TITLE} | failed to initialize`, error)
  }
})
