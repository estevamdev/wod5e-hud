import { COMBAT_ID, ROOT_ID, SEARCH_ID } from '../core/constants.mjs'
import {
  buildActionsDrawer,
  buildAttributesDrawer,
  buildContext,
  buildPowersDrawer,
  buildSearchResults,
  buildSkillsDrawer,
  buildStatus
} from '../core/actor-adapter.mjs'
import {
  clamp,
  debounce,
  getSetting,
  localize,
  resolveActor,
  setSetting
} from '../core/utils.mjs'
import { rollAttribute, rollItem, rollSkill, spendXP, useItem } from '../core/roll-helpers.mjs'

const TEMPLATES = {
  combatHud: 'modules/wod5e-hud/templates/combat-hud.hbs',
  attributes: 'modules/wod5e-hud/templates/drawer-attributes.hbs',
  skills: 'modules/wod5e-hud/templates/drawer-skills.hbs',
  powers: 'modules/wod5e-hud/templates/drawer-powers.hbs',
  actions: 'modules/wod5e-hud/templates/drawer-actions.hbs',
  search: 'modules/wod5e-hud/templates/search.hbs',
  searchResults: 'modules/wod5e-hud/templates/search-results.hbs'
}

async function render(template, context) {
  const renderer = foundry.applications.handlebars?.renderTemplate ?? globalThis.renderTemplate
  return renderer(template, context)
}

export class Wod5eHud {
  constructor() {
    this.combatRoot = null
    this.searchRoot = null
    this.actor = null
    this.token = null
    this.context = null
    this.combatDrawer = null
    this.searchState = { query: '', results: null, selected: 0 }
    this._renderToken = null
    this._statusRefresh = debounce(() => this.updateStatus(), 80)
    this._animateTimer = null
    this.combatVisible = null
    this.skillsFilter = null
    this.settingsApp = null
    this._hotbarEl = null
    this._hotbarObserver = null
    this._hotbarMetrics = null
  }

  async init() {
    // Remove leftovers from older versions that used a separate mini HUD.
    document.getElementById(ROOT_ID)?.remove()
    document.getElementById(COMBAT_ID)?.remove()
    document.getElementById(SEARCH_ID)?.remove()

    this.initCombat()
    this.#applyHotbarVisibility()
    document.addEventListener('pointerdown', this.#onDocumentPointerDown, true)
    document.addEventListener('keydown', this.#onGlobalKeyDown, true)
    window.addEventListener('resize', this.#onResize)

    await this.refresh()
    this.positionCombat()
  }

  initCombat() {
    const root = document.createElement('div')
    root.id = COMBAT_ID
    document.body.append(root)
    this.combatRoot = root
  }

  async refresh({ animate = false } = {}) {
    const resolved = resolveActor()
    if (!resolved?.actor) {
      this.hide()
      return
    }

    const { actor, token } = resolved
    const tokenId = token?.id ?? null
    if (this._renderToken?.actorId !== actor.id || this._renderToken?.tokenId !== tokenId) {
      this.combatDrawer = null
      this.closeSearch()
    }

    this._renderToken = { actorId: actor.id, tokenId }
    this.actor = actor
    this.token = token

    const context = buildContext(actor, token)
    this.context = context
    if (this.combatVisible === null) {
      this.combatVisible = getSetting('combatHud', true)
    }

    this.combatRoot.dataset.creature = context.creature.key
    this.combatRoot.style.setProperty('--wod-accent', context.accent)

    await this.renderCombat()
    this.positionCombat()
    if (animate) this.#animate()
  }

  #canToggleCombat() {
    return Boolean(game.user?.isGM) || Boolean(getSetting('allowPlayerCombatToggle', true))
  }

  #worldCombatForced() {
    return Boolean(getSetting('enablePlayerCombatForAll', false))
  }

  #combatEnabled() {
    return this.#worldCombatForced() || (this.combatVisible ?? getSetting('combatHud', true))
  }

  async renderCombat() {
    if (!this.combatRoot) return
    if (!this.#combatEnabled() || !this.actor) {
      this.hideCombat()
      return
    }

    this.combatRoot.style.display = ''
    this.combatRoot.style.setProperty('--wod-accent', this.context?.accent ?? '#8a0303')
    this.combatRoot.innerHTML = await render(TEMPLATES.combatHud, {
      ...this.context,
      xp: this.context?.xp ?? { show: false, remaining: 0 }
    })
    this.#bindActions(this.combatRoot)
    this.positionCombat()
    requestAnimationFrame(() => this.positionCombat())

    if (this.combatDrawer) await this.openDrawer(this.combatDrawer, { force: true })
  }

  #hotbarElement() {
    const uiHotbar = globalThis.ui?.hotbar?.element
    const element = uiHotbar?.[0] ?? uiHotbar
    if (element instanceof HTMLElement) return element

    return (
      document.querySelector('#hotbar:not(template)') ??
      document.querySelector('#action-bar')?.closest('#hotbar') ??
      document.querySelector('.hotbar')
    )
  }

  #observeHotbar() {
    const element = this.#hotbarElement()
    if (!element || element === this._hotbarEl) return
    this._hotbarObserver?.disconnect()
    this._hotbarEl = element
    if (typeof ResizeObserver === 'function') {
      this._hotbarObserver = new ResizeObserver(() => this.positionCombat())
      this._hotbarObserver.observe(element)
    }
  }

  #applyHotbarVisibility() {
    const hidden = Boolean(getSetting('hideHotbar', false))
    document.body?.classList.toggle('wod-hide-hotbar', hidden)
    this.#syncHotbarVisibility(hidden)
  }

  /**
   * Hides or restores the macro hotbar directly on the element, so the option
   * works even if the stylesheet is cached. While hiding, it records the bar's
   * real bottom margin and center so the combat HUD can take its exact place.
   */
  #syncHotbarVisibility(hidden) {
    const element = this.#hotbarElement()
    if (!element) return

    if (hidden) {
      const rect = element.getBoundingClientRect()
      if (rect.height > 0) {
        this._hotbarMetrics = {
          bottom: Math.max(0, Math.round(window.innerHeight - rect.bottom)),
          center: Math.round(rect.left + rect.width / 2)
        }
      }
      element.style.display = 'none'
      element.classList.add('wod-hotbar-hidden')
      return
    }

    element.style.display = ''
    element.classList.remove('wod-hotbar-hidden')
    this._hotbarMetrics = null
  }

  positionCombat() {
    if (!this.combatRoot) return

    const hotbarHidden = Boolean(getSetting('hideHotbar', false))
    document.body?.classList.toggle('wod-hide-hotbar', hotbarHidden)
    this.#syncHotbarVisibility(hotbarHidden)

    // When the hotbar is hidden the combat bar takes its exact place.
    if (hotbarHidden) {
      const metrics = this._hotbarMetrics
      const bottom = Math.max(metrics?.bottom ?? 16, 16)
      this.combatRoot.style.left = metrics ? `${metrics.center}px` : '50%'
      this.combatRoot.style.bottom = `${bottom}px`
      this.combatRoot.style.setProperty('--wod-hotbar-height', '0px')
      return
    }

    this.#observeHotbar()

    const element = this._hotbarEl ?? this.#hotbarElement()
    if (!element) {
      this.combatRoot.style.left = '50%'
      this.combatRoot.style.bottom = '88px'
      return
    }

    const rect = element.getBoundingClientRect()
    if (!rect.height || rect.top >= window.innerHeight) {
      this.combatRoot.style.left = '50%'
      this.combatRoot.style.bottom = '88px'
      return
    }

    // Anchors the combat bar above the macro hotbar, centered on it, leaving
    // room for the portrait to overflow downwards without covering the hotbar.
    this.combatRoot.style.left = `${Math.round(rect.left + rect.width / 2)}px`
    this.combatRoot.style.bottom = `${Math.max(
      0,
      Math.round(window.innerHeight - rect.top + 5)
    )}px`
    this.combatRoot.style.setProperty('--wod-hotbar-height', `${Math.round(rect.height)}px`)
  }

  hideCombat() {
    if (this.combatRoot) this.combatRoot.style.display = 'none'
    this.closeDrawer()
  }

  async updateStatus() {
    if (!this.actor) return

    const status = buildStatus(this.actor, this.token)
    this.context = { ...(this.context ?? {}), ...status }
    this.#renderStatus()
  }

  #renderStatus() {
    const root = this.combatRoot
    const context = this.context
    if (!root || !context) return

    root.style.setProperty('--wod-accent', context.accent)

    const portrait = root.querySelector('.wod-portrait')
    if (portrait) {
      if (portrait.getAttribute('src') !== context.portrait) portrait.src = context.portrait
      portrait.alt = context.name
    }

    const ring = root.querySelector('.wod-health-ring')
    ring?.style.setProperty('--wod-health-ratio', `${context.health.percent}%`)

    const resource = root.querySelector('.wod-combat-resource')
    if (Boolean(context.resource) !== Boolean(resource)) {
      this.renderCombat().catch((error) =>
        console.error('[WOD5E HUD] combat re-render failed', error)
      )
      return
    }

    if (resource && context.resource) {
      resource.style.setProperty('--wod-fill', `${context.resource.fill}%`)
      const gauge = resource.querySelector('.wod-gauge')
      if (gauge) {
        gauge.classList.toggle('is-pulsing', Boolean(context.resource.pulse))
        gauge.dataset.tooltip = `${context.resource.label} ${context.resource.value}/${context.resource.max}`
      }
      const count = resource.querySelector('.wod-resource-count')
      if (count) count.textContent = String(context.resource.value)
    }
  }

  hide() {
    this.hideCombat()
    this.closeSearch()
    this.actor = null
    this.token = null
    this.context = null
    this._renderToken = null
  }

  toggleCombatHud(force) {
    if (this.#worldCombatForced() && typeof force !== 'boolean') {
      ui.notifications?.info?.(
        localize('WOD5E_HUD.Settings.ForcedByGM', 'Enabled by the Game Master.')
      )
      return true
    }

    if (typeof force !== 'boolean' && !this.#canToggleCombat()) {
      ui.notifications?.warn?.(localize('WOD5E_HUD.Settings.Locked', 'Locked by the GM.'))
      return this.#combatEnabled()
    }

    const next = typeof force === 'boolean' ? force : !this.#combatEnabled()
    this.combatVisible = next
    if (next) {
      this.renderCombat().catch((error) =>
        console.error('[WOD5E HUD] combat render failed', error)
      )
    } else {
      this.hideCombat()
    }
    void setSetting('combatHud', next)
    return next
  }

  async applyPreferences() {
    this.combatVisible = Boolean(getSetting('combatHud', true))
    this.#applyHotbarVisibility()
    await this.refresh({ animate: true })
  }

  refreshSettingsApp() {
    this.settingsApp?.render?.()
  }

  async openSettings() {
    if (!this.settingsApp) {
      try {
        const { Wod5eSettingsApp } = await import('./settings-app.mjs')
        this.settingsApp = new Wod5eSettingsApp({
          onChange: () => this.applyPreferences()
        })
      } catch (error) {
        console.error('[WOD5E HUD] failed to open settings', error)
        ui.notifications?.error?.(
          localize('WOD5E_HUD.Settings.Unavailable', 'Settings are unavailable.')
        )
        return
      }
    }

    this.settingsApp.render(true)
  }

  #animate() {
    const root = this.combatRoot
    if (!root) return
    if (this._animateTimer) clearTimeout(this._animateTimer)
    root.classList.remove('wod-animating')
    void root.offsetWidth
    root.classList.add('wod-animating')
    this._animateTimer = setTimeout(() => {
      root.classList.remove('wod-animating')
      this._animateTimer = null
    }, 260)
  }

  async #dispatchAction(action, element) {
    switch (action) {
      case 'settings':
        await this.openSettings()
        break
      case 'search':
        await this.openSearch()
        break
      case 'close-search':
        this.closeSearch()
        break
      case 'search-result':
        this.#executeSearchResult(Number(element.dataset.index))
        break
      case 'open-sheet':
        break
      case 'drawer':
        await this.openDrawer(element.dataset.drawer)
        break
      case 'close-drawer':
        this.closeDrawer()
        break
      case 'xp':
        await spendXP(this.actor)
        break
      case 'roll-attribute':
        rollAttribute(this.actor, element.dataset.key)
        break
      case 'roll-skill':
        rollSkill(this.actor, element.dataset.key)
        break
      case 'toggle-skills-filter':
        await this.toggleSkillsFilter()
        break
      case 'toggle-power-group':
        element.closest('.wod-power-group')?.classList.toggle('is-open')
        break
      case 'quick-action':
        await this.#runQuickAction(element.dataset.quick)
        break
      case 'use-item': {
        const item = this.actor?.items?.get?.(element.dataset.itemId)
        if (item) await useItem(this.actor, item)
        break
      }
      default:
        break
    }
  }

  #systemModule(path) {
    const systemId = game.system?.id ?? 'wod5e'
    return import(`/systems/${systemId}/system/${path}`)
  }

  async #confirmQuickAction(title, content) {
    const DialogV2 = foundry.applications?.api?.DialogV2
    if (!DialogV2?.confirm) return true

    try {
      return Boolean(
        await DialogV2.confirm({
          window: { title },
          modal: true,
          rejectClose: false,
          content: `<p>${content}</p>`,
          yes: {
            label: localize('WOD5E_HUD.Actions.Roll', 'Roll'),
            icon: 'fa-solid fa-dice-d20',
            default: true,
            callback: () => true
          },
          no: {
            label: localize('WOD5E_HUD.Actions.Cancel', 'Cancel'),
            icon: 'fa-solid fa-xmark',
            default: false,
            callback: () => false
          }
        })
      )
    } catch (error) {
      console.error('[WOD5E HUD] action confirmation failed', error)
      return false
    }
  }

  async #runQuickAction(id) {
    const actor = this.actor
    if (!actor || !id) return

    const event = { preventDefault() {}, stopPropagation() {} }

    try {
      switch (id) {
        case 'rouse': {
          const confirmed = await this.#confirmQuickAction(
            localize('WOD5E_HUD.Actions.Rouse', 'Rouse Check'),
            localize('WOD5E_HUD.Actions.ConfirmRouse', 'Do you want to roll the Rouse check?')
          )
          if (!confirmed) return
          const { _onRouseCheck } = await this.#systemModule('actor/vtm/scripts/rouse.js')
          await _onRouseCheck(actor, {
            name: localize('WOD5E_HUD.Actions.Rouse', 'Rouse Check'),
            system: { level: 1, cost: 1, discipline: '' }
          })
          break
        }
        case 'feeding': {
          const predator = actor.items?.find?.((item) => item.type === 'predatorType')
          if (!predator) {
            ui.notifications?.warn?.(
              localize('WOD5E_HUD.Actions.NoPredator', 'No predator type found for this actor.')
            )
            return
          }
          await rollItem(actor, predator)
          break
        }
        case 'frenzy': {
          const confirmed = await this.#confirmQuickAction(
            localize('WOD5E_HUD.Actions.ResistFrenzy', 'Resist Frenzy'),
            localize(
              'WOD5E_HUD.Actions.ConfirmFrenzy',
              'Do you want to roll the test to resist Frenzy?'
            )
          )
          if (!confirmed) return
          const { _onFrenzyRoll } = await this.#systemModule('actor/vtm/scripts/frenzy-roll.js')
          await _onFrenzyRoll.call({ actor }, event)
          break
        }
        case 'willpower': {
          const { _onWillpowerRoll } = await this.#systemModule(
            'actor/scripts/on-willpower-roll.js'
          )
          await _onWillpowerRoll.call({ actor }, event)
          break
        }
        case 'remorse': {
          const { _onRemorseRoll } = await this.#systemModule(
            'actor/vtm/scripts/roll-remorse.js'
          )
          await _onRemorseRoll.call({ actor }, event)
          break
        }
        default:
          return
      }
    } catch (error) {
      console.error(`[WOD5E HUD] quick action "${id}" failed`, error)
      ui.notifications?.error?.(
        localize('WOD5E_HUD.Actions.Failed', 'The action could not be performed.')
      )
    }

    await this.updateStatus()
  }

  #onResize = () => {
    this.positionCombat()
  }

  #bindActions(container) {
    if (!container) return
    container.querySelectorAll('[data-action]').forEach((element) => {
      if (element.dataset.wodBound === '1') return
      element.dataset.wodBound = '1'
      element.addEventListener('click', this.#onActionClick)
      if (element.dataset.action === 'open-sheet') {
        element.addEventListener('dblclick', this.#onSheetDoubleClick)
      }
    })
  }

  #onActionClick = async (event) => {
    const element = event.currentTarget
    if (!element) return
    const action = element.dataset.action

    event.preventDefault()
    event.stopPropagation()

    if (!['search', 'close-search', 'search-result'].includes(action)) {
      this.#closeSearchIf(action)
    }

    try {
      await this.#dispatchAction(action, element)
    } catch (error) {
      console.error(`[WOD5E HUD] action "${action}" failed`, error)
    }
  }

  #onSheetDoubleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    this.actor?.sheet?.render(true)
  }

  #onGlobalKeyDown = (event) => {
    if (event.key === 'Escape' && this.searchRoot) {
      event.preventDefault()
      this.closeSearch()
    }
  }

  #onDocumentPointerDown = (event) => {
    if (!this.combatDrawer) return
    if (this.combatRoot?.contains(event.target)) return
    this.closeDrawer()
  }

  async openDrawer(type, { force = false } = {}) {
    if (!this.actor || !this.combatRoot) return
    if (!['attributes', 'skills', 'powers', 'actions'].includes(type)) return

    if (this.combatDrawer === type && !force) {
      this.closeDrawer()
      return
    }

    this.combatDrawer = type
    const slot = this.combatRoot.querySelector('.wod-drawer-slot')
    if (!slot) return

    let context
    let template
    if (type === 'attributes') {
      context = buildAttributesDrawer(this.actor)
      template = TEMPLATES.attributes
    } else if (type === 'skills') {
      context = buildSkillsDrawer(this.actor, this.#skillsFilter())
      template = TEMPLATES.skills
    } else if (type === 'actions') {
      context = buildActionsDrawer(this.actor)
      template = TEMPLATES.actions
    } else {
      context = buildPowersDrawer(this.actor)
      template = TEMPLATES.powers
    }

    slot.innerHTML = await render(template, context)
    this.#bindActions(this.combatRoot)
    const drawer = slot.querySelector('.wod-drawer')
    if (drawer) {
      drawer.dataset.side = 'up'
      requestAnimationFrame(() => drawer.classList.add('is-open'))
    }

    this.combatRoot.querySelectorAll('[data-action="drawer"]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.drawer === type)
    })
  }

  closeDrawer() {
    this.combatDrawer = null
    const slot = this.combatRoot?.querySelector('.wod-drawer-slot')
    if (slot) slot.innerHTML = ''
    this.combatRoot?.querySelectorAll('[data-action="drawer"]').forEach((button) => {
      button.classList.remove('is-active')
    })
  }

  #skillsFilter() {
    return this.skillsFilter ?? getSetting('skillsFilter', 'trained')
  }

  toggleSkillsFilter() {
    const next = this.#skillsFilter() === 'trained' ? 'all' : 'trained'
    this.skillsFilter = next
    void setSetting('skillsFilter', next)
    if (this.combatDrawer === 'skills') {
      this.openDrawer('skills', { force: true }).catch((error) =>
        console.error('[WOD5E HUD] skills drawer failed', error)
      )
    }
  }

  async openSearch() {
    if (!this.actor) return
    if (this.searchRoot) {
      this.searchRoot.querySelector('.wod-search-input')?.focus()
      return
    }

    this.closeDrawer()

    const root = document.createElement('div')
    root.id = SEARCH_ID
    root.style.setProperty('--wod-accent', this.context?.accent ?? '#8a0303')
    document.body.append(root)
    this.searchRoot = root

    root.addEventListener('input', this.#onSearchInput)
    root.addEventListener('keydown', this.#onSearchKeyDown)

    let html
    try {
      html = await render(TEMPLATES.search, {
        title: localize('WOD5E_HUD.Search.Title', 'Search'),
        placeholder: localize(
          'WOD5E_HUD.Search.Placeholder',
          'Search attributes, skills, disciplines...'
        ),
        hint: localize('WOD5E_HUD.Search.Hint', 'Type to filter. Enter to roll or open.')
      })
    } catch (error) {
      console.error('WOD5E HUD | failed to render search', error)
      this.closeSearch()
      return
    }

    root.innerHTML = html
    this.#bindActions(root)

    this.searchState = {
      query: '',
      results: buildSearchResults(this.actor, ''),
      selected: 0
    }
    await this.#renderSearchResults()
    root.querySelector('.wod-search-input')?.focus()
  }

  closeSearch() {
    this.searchRoot?.remove()
    this.searchRoot = null
    this.searchState = { query: '', results: null, selected: 0 }
  }

  #closeSearchIf(action) {
    if (this.searchRoot && action !== 'search') this.closeSearch()
  }

  #onSearchInput = (event) => {
    if (!event.target.closest('.wod-search-input')) return
    this.searchState.query = event.target.value
    this.searchState.results = buildSearchResults(this.actor, event.target.value)
    this.searchState.selected = 0
    this.#renderSearchResults()
  }

  #onSearchKeyDown = (event) => {
    if (!this.searchRoot) return
    const results = this.searchState.results
    const total = results?.flat?.length ?? 0

    if (event.key === 'Escape') {
      event.preventDefault()
      this.closeSearch()
      return
    }

    if (event.key === 'ArrowDown' && total > 0) {
      event.preventDefault()
      this.searchState.selected = clamp(this.searchState.selected + 1, 0, total - 1)
      this.#renderSearchResults()
      return
    }

    if (event.key === 'ArrowUp' && total > 0) {
      event.preventDefault()
      this.searchState.selected = clamp(this.searchState.selected - 1, 0, total - 1)
      this.#renderSearchResults()
      return
    }

    if (event.key === 'Enter' && total > 0) {
      event.preventDefault()
      this.#executeSearchResult(this.searchState.selected)
    }
  }

  async #renderSearchResults() {
    if (!this.searchRoot) return
    const results = this.searchState.results ?? { groups: [], empty: true }
    const groups = results.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        selected: item.index === this.searchState.selected
      }))
    }))

    const html = await render(TEMPLATES.searchResults, {
      groups,
      empty: results.empty ?? groups.length === 0
    })

    const container = this.searchRoot.querySelector('.wod-search-results')
    if (container) container.innerHTML = html
    this.#bindActions(this.searchRoot)
    container?.querySelector('.wod-search-result.is-selected')?.scrollIntoView({
      block: 'nearest'
    })
  }

  #executeSearchResult(index) {
    const result = this.searchState.results?.flat?.[index]
    if (!result) return
    this.closeSearch()

    if (result.kind === 'action') {
      this.#runQuickAction(result.actionId).catch((error) =>
        console.error('[WOD5E HUD] quick action failed', error)
      )
      return
    }
    if (result.kind === 'attribute') {
      rollAttribute(this.actor, result.key)
      return
    }
    if (result.kind === 'skill') {
      rollSkill(this.actor, result.key)
      return
    }
    if (result.kind === 'drawer') {
      this.openDrawer('powers')
      return
    }
    if (result.kind === 'item') {
      const item = this.actor?.items?.get?.(result.itemId)
      if (item) useItem(this.actor, item)
    }
  }

  isActiveActor(actor) {
    return Boolean(actor && this.actor && actor.id === this.actor.id)
  }

  isActiveToken(tokenDocument) {
    if (!tokenDocument) return false
    if (this.token && tokenDocument.id === this.token.id) return true
    return this.isActiveActor(tokenDocument.actor)
  }

  scheduleStatusUpdate() {
    this._statusRefresh()
  }

  destroy() {
    this.closeSearch()
    this.closeDrawer()
    this.settingsApp?.close?.()
    this.settingsApp = null
    this._hotbarObserver?.disconnect()
    this._hotbarObserver = null
    this._hotbarEl = null
    this.#syncHotbarVisibility(false)
    document.body?.classList.remove('wod-hide-hotbar')
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown, true)
    document.removeEventListener('keydown', this.#onGlobalKeyDown, true)
    window.removeEventListener('resize', this.#onResize)
    this.combatRoot?.remove()
    this.combatRoot = null
    this.actor = null
    this.token = null
    this.context = null
    if (this._animateTimer) clearTimeout(this._animateTimer)
  }
}
