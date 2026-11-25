import { getSetting, setSetting } from '../core/utils.mjs'

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Player-facing settings window for the HUD.
 * Player options are only editable when the GM allows them; the GM permissions
 * live in their own tab.
 */
export class Wod5eSettingsApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    tag: 'form',
    id: 'wod5e-hud-settings',
    classes: ['wod-settings-app'],
    window: {
      icon: 'fa-solid fa-gear',
      title: 'WOD5E_HUD.Settings.Title',
      resizable: false
    },
    position: {
      width: 430
    }
  }

  static PARTS = {
    main: {
      template: 'modules/wod5e-hud/templates/settings.hbs'
    }
  }

  activeTab = 'player'

  constructor({ onChange, onResetPosition, ...options } = {}) {
    super(options)
    this.onChange = onChange ?? (() => {})
    this.onResetPosition = onResetPosition ?? (() => {})
  }

  async _prepareContext() {
    const data = await super._prepareContext()
    const isGM = Boolean(game.user?.isGM)
    const uiScale = getSetting('uiScale', 'default')
    const worldCombatForced = Boolean(getSetting('enablePlayerCombatForAll', false))
    const worldCombatDisabled = Boolean(getSetting('disablePlayerCombatForAll', false))
    const allowCombatToggle = Boolean(getSetting('allowPlayerCombatToggle', true))
    const tabs = [
      {
        id: 'player',
        label: 'WOD5E_HUD.Settings.TabPlayer',
        icon: 'fa-solid fa-user'
      }
    ]

    if (isGM) {
      tabs.push({
        id: 'gm',
        label: 'WOD5E_HUD.Settings.TabGM',
        icon: 'fa-solid fa-crown'
      })
    }

    return {
      ...data,
      isGM,
      tabs,
      activeTab: this.activeTab,
      combatHud: worldCombatForced
        ? true
        : worldCombatDisabled
          ? false
          : Boolean(getSetting('combatHud', true)),
      hideHotbar: Boolean(getSetting('hideHotbar', false)),
      scaleOptions: [
        {
          id: 'default',
          label: 'WOD5E_HUD.Settings.ScaleDefault',
          active: uiScale === 'default'
        },
        { id: 'medium', label: 'WOD5E_HUD.Settings.ScaleMedium', active: uiScale === 'medium' },
        { id: 'large', label: 'WOD5E_HUD.Settings.ScaleLarge', active: uiScale === 'large' }
      ],
      allowCombatToggle,
      enableCombatForAll: worldCombatForced,
      disableCombatForAll: worldCombatDisabled,
      canToggleCombat: !worldCombatForced && !worldCombatDisabled && (isGM || allowCombatToggle)
    }
  }

  async _onRender() {
    await super._onRender()
    const element = this.element
    if (!element) return

    element.querySelectorAll('[data-tab]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault()
        this.activateTab(button.dataset.tab)
      })
    })

    element.querySelectorAll('[data-setting]').forEach((input) => {
      input.addEventListener('change', async () => {
        await setSetting(input.dataset.setting, input.checked)
        await this.onChange()
        this.render()
      })
    })

    element.querySelectorAll('[data-world-setting]').forEach((input) => {
      input.addEventListener('change', async () => {
        if (!game.user?.isGM) return
        const key = input.dataset.worldSetting
        await setSetting(key, input.checked)
        if (input.checked && key === 'enablePlayerCombatForAll') {
          await setSetting('disablePlayerCombatForAll', false)
        }
        if (input.checked && key === 'disablePlayerCombatForAll') {
          await setSetting('enablePlayerCombatForAll', false)
        }
        this.render()
      })
    })

    element.querySelectorAll('[data-scale]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault()
        await setSetting('uiScale', button.dataset.scale)
        await this.onChange()
        this.render()
      })
    })

    element
      .querySelector('[data-action="reset-position"]')
      ?.addEventListener('click', async (event) => {
        event.preventDefault()
        await this.onResetPosition()
      })

    this.activateTab(this.activeTab)
  }

  activateTab(tab = 'player') {
    this.activeTab = tab === 'gm' && !game.user?.isGM ? 'player' : tab
    const element = this.element
    if (!element) return

    element.querySelectorAll('[data-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.tab === this.activeTab)
    })
    element.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.tabPanel === this.activeTab)
    })
  }
}
