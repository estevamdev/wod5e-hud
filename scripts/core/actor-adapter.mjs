import { CATEGORY_ICONS, CATEGORY_LABELS, CREATURE_INFO, SHOW_XP } from './constants.mjs'
import { clamp, isOwner, localize, normalizeText, tokenName, tokenPortrait } from './utils.mjs'

const API = () => globalThis.WOD5E

function definitionList(name) {
  try {
    return API()?.[name]?.getList?.({}) ?? {}
  } catch {
    return {}
  }
}

function displayName(definition, key) {
  if (!definition) return key
  return definition.displayName || localize(definition.label, key)
}

function dotArray(value, max = 5) {
  const number = clamp(Number(value) || 0, 0, max)
  return Array.from({ length: max }, (_, index) => index < number)
}

function groupLabel(type) {
  const key = `WOD5E.SPC.${String(type).charAt(0).toUpperCase()}${String(type).slice(1)}`
  return localize(key, type)
}

function getCreature(actor) {
  const type = actor?.type ?? 'mortal'
  let info = CREATURE_INFO[type] ?? CREATURE_INFO.mortal

  if (type === 'spc') {
    const spcType = actor?.system?.spcType
    if (spcType && CREATURE_INFO[spcType] && spcType !== 'spc') {
      info = {
        ...CREATURE_INFO[spcType],
        key: 'spc',
        label: 'WOD5E_HUD.Creature.Spc'
      }
    }
  }

  return {
    ...info,
    key: type,
    labelText: localize(info.label, type)
  }
}

function buildHealth(actor) {
  const isCrinos =
    actor?.type === 'werewolf' &&
    actor?.system?.activeForm === 'crinos' &&
    actor?.system?.crinosHealth
  const data = isCrinos ? actor.system.crinosHealth : (actor?.system?.health ?? {})
  const max = Math.max(0, Number(data.max) || 0)
  const superficial = clamp(Number(data.superficial) || 0, 0, max)
  const aggravated = clamp(Number(data.aggravated) || 0, 0, max)
  // Same rule as the system: superficial damage counts as half a health level.
  const value = Math.max(0, max - aggravated - superficial / 2)
  const ratio = max > 0 ? clamp(value / max, 0, 1) : 0

  return {
    field: isCrinos ? 'system.crinosHealth' : 'system.health',
    isCrinos,
    max,
    superficial,
    aggravated,
    value,
    ratio,
    percent: Math.round(ratio * 1000) / 10
  }
}

function buildResource(actor, creature) {
  // Only vampires have a resource indicator (Hunger).
  if (creature.resource !== 'hunger') return null

  const data = actor?.system?.hunger ?? {}
  const max = Math.max(1, Number(data.max) || 5)
  const value = clamp(Number(data.value) || 0, 0, max)

  return {
    kind: 'blood',
    source: 'hunger',
    label: localize('WOD5E_HUD.Hunger', 'Hunger'),
    value,
    max,
    fill: ((max - value) / max) * 100,
    ratio: (max - value) / max,
    pulse: value >= 4,
    editable: true
  }
}

function buildXP(actor) {
  const derived = actor?.system?.derivedXP
  const legacy = actor?.system?.exp
  const remaining = Number(derived?.remainingXP ?? legacy?.value ?? 0)
  return {
    remaining,
    show: SHOW_XP && remaining > 0
  }
}

function buildAttributes(actor) {
  const definitions = definitionList('Attributes')
  const actorAttributes = actor?.system?.attributes ?? {}
  const groups = {
    physical: [],
    social: [],
    mental: []
  }

  for (const [key, definition] of Object.entries(definitions)) {
    const value = Number(actorAttributes[key]?.value) || 0
    const type = definition.type ?? 'physical'
    groups[type] ??= []
    groups[type].push({
      key,
      label: displayName(definition, key),
      value,
      dots: dotArray(value),
      type
    })
  }

  return Object.entries(groups).map(([id, items]) => ({
    id,
    label: groupLabel(id),
    items
  }))
}

function buildSkills(actor, filter = 'trained') {
  const definitions = definitionList('Skills')
  const actorSkills = actor?.system?.skills ?? {}
  const groups = {
    physical: [],
    social: [],
    mental: []
  }

  for (const [key, definition] of Object.entries(definitions)) {
    const value = Number(actorSkills[key]?.value) || 0
    if (filter === 'trained' && value <= 0) continue
    const type = definition.type ?? 'physical'
    groups[type] ??= []
    groups[type].push({
      key,
      label: displayName(definition, key),
      value,
      dots: dotArray(value),
      type
    })
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([id, items]) => ({
      id,
      label: groupLabel(id),
      items
    }))
}

function buildItemEntry(item, category, meta = {}) {
  const system = item?.system ?? {}
  const dicepool = system.dicepool ?? {}
  const hasDicepool = Object.keys(dicepool).length > 0
  const rollableTypes = ['power', 'gift', 'perk', 'edgepool', 'weapon', 'gear', 'customRoll']
  const action = hasDicepool || rollableTypes.includes(item.type) ? 'roll' : 'chat'
  const costIcon =
    category === 'gift'
      ? 'fa-solid fa-fire'
      : category === 'power'
        ? 'fa-solid fa-droplet'
        : 'fa-solid fa-bolt'

  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    img: item.img || 'icons/svg/item-bag.svg',
    category,
    level: Number(system.level) || null,
    cost: Number(system.cost) || 0,
    costIcon,
    willpowercost: Number(system.willpowercost) || 0,
    hasDicepool,
    action,
    subtitle: meta.subtitle ?? '',
    meta
  }
}

function buildPowers(actor) {
  const type = actor?.type

  if (type === 'vampire' || type === 'ghoul') {
    const definitions = definitionList('Disciplines')
    const data = actor?.system?.disciplines ?? {}
    const groups = []

    for (const [id, discipline] of Object.entries(data)) {
      const value = Number(discipline.value) || 0
      const powers = (discipline.powers ?? []).map((power) =>
        buildItemEntry(power, 'power', {
          subtitle: displayName(definitions[id], id)
        })
      )
      if (value <= 0 && !discipline.visible && powers.length === 0) continue

      groups.push({
        id,
        label: displayName(definitions[id], id),
        value,
        dots: dotArray(value),
        open: groups.length === 0,
        items: powers
      })
    }

    return groups
  }

  if (type === 'werewolf') {
    const definitions = definitionList('Gifts')
    const data = actor?.system?.gifts ?? {}
    const groups = []

    for (const [id, gift] of Object.entries(data)) {
      const value = Number(gift.value) || 0
      const powers = (gift.powers ?? []).map((power) =>
        buildItemEntry(power, 'gift', {
          subtitle: displayName(definitions[id], id)
        })
      )
      if (value <= 0 && !gift.visible && powers.length === 0) continue

      groups.push({
        id,
        label: displayName(definitions[id], id),
        value,
        dots: dotArray(value),
        open: groups.length === 0,
        items: powers
      })
    }

    return groups
  }

  if (type === 'hunter') {
    const definitions = definitionList('Edges')
    const data = actor?.system?.edges ?? {}
    const groups = []

    for (const [id, edge] of Object.entries(data)) {
      const value = Number(edge.value) || 0
      const items = [...(edge.perks ?? []), ...(edge.pools ?? [])]
        .map((item) =>
          buildItemEntry(item, item.type === 'edgepool' ? 'edge' : 'perk', {
            subtitle: displayName(definitions[id], id)
          })
        )
        .filter(Boolean)
      if (value <= 0 && !edge.visible && items.length === 0) continue

      groups.push({
        id,
        label: displayName(definitions[id], id),
        value,
        dots: dotArray(value),
        open: groups.length === 0,
        items
      })
    }

    return groups
  }

  // Mortal, SPC and other fallbacks: features, boons and traits.
  const featureDefs = definitionList('Features')
  const groupsMap = new Map()
  for (const item of actor?.items ?? []) {
    if (!['feature', 'boon', 'trait'].includes(item.type)) continue
    const subtype = item.system?.featuretype || item.type
    if (!groupsMap.has(subtype)) {
      const label = featureDefs[subtype]
        ? displayName(featureDefs[subtype], subtype)
        : localize(`TYPES.Item.${item.type}`, subtype)
      groupsMap.set(subtype, { label, items: [] })
    }
    groupsMap.get(subtype).items.push(
      buildItemEntry(item, 'feature', {
        subtitle: localize('WOD5E_HUD.Search.Type.Feature', 'Feature')
      })
    )
  }

  return [...groupsMap.entries()].map(([id, group], index) => ({
    id,
    label: group.label,
    value: group.items.length,
    dots: [],
    open: index === 0,
    items: group.items
  }))
}

function buildSearchIndex(actor) {
  const index = []

  for (const group of buildAttributes(actor)) {
    for (const attribute of group.items) {
      index.push({
        id: `attribute:${attribute.key}`,
        kind: 'attribute',
        category: 'attribute',
        key: attribute.key,
        label: attribute.label,
        subtitle: group.label,
        value: attribute.value,
        icon: CATEGORY_ICONS.attribute,
        searchText: normalizeText(`${attribute.label} ${group.label} attribute`)
      })
    }
  }

  for (const group of buildSkills(actor, 'all')) {
    for (const skill of group.items) {
      index.push({
        id: `skill:${skill.key}`,
        kind: 'skill',
        category: 'skill',
        key: skill.key,
        label: skill.label,
        subtitle: `${group.label} · ${skill.value}`,
        value: skill.value,
        icon: CATEGORY_ICONS.skill,
        searchText: normalizeText(`${skill.label} ${group.label} skill`)
      })
    }
  }

  for (const group of buildPowers(actor)) {
    const itemCategory = group.items[0]?.category
    const category =
      itemCategory ??
      (actor?.type === 'werewolf'
        ? 'gift'
        : actor?.type === 'hunter'
          ? 'edge'
          : actor?.type === 'vampire' || actor?.type === 'ghoul'
            ? 'power'
            : 'feature')

    index.push({
      id: `group:${group.id}`,
      kind: 'drawer',
      category,
      label: group.label,
      subtitle: localize(CATEGORY_LABELS[category] ?? 'WOD5E_HUD.Search.Type.Power', category),
      icon: CATEGORY_ICONS[category] ?? CATEGORY_ICONS.power,
      searchText: normalizeText(`${group.label} ${category}`)
    })

    for (const item of group.items) {
      index.push({
        id: `item:${item.id}`,
        kind: 'item',
        category: item.category ?? category,
        itemId: item.id,
        action: item.action,
        label: item.name,
        subtitle: group.label,
        icon: CATEGORY_ICONS[item.category] ?? CATEGORY_ICONS.feature,
        searchText: normalizeText(`${item.name} ${group.label} ${item.category}`)
      })
    }
  }

  return index
}

export function buildStatus(actor, token) {
  const creature = getCreature(actor)
  return {
    actorId: actor.id,
    tokenId: token?.id ?? null,
    name: tokenName(token, actor),
    portrait: tokenPortrait(token, actor),
    accent: creature.accent,
    creature,
    creatureLabel: creature.labelText,
    health: buildHealth(actor),
    resource: buildResource(actor, creature),
    xp: buildXP(actor),
    canEdit: isOwner(actor)
  }
}

export function buildContext(actor, token, settings) {
  return {
    ...buildStatus(actor, token),
    dock: settings.dock ?? 'bottom-left'
  }
}

export function buildAttributesDrawer(actor) {
  return {
    groups: buildAttributes(actor)
  }
}

export function buildSkillsDrawer(actor, filter) {
  const trainedOnly = filter !== 'all'
  return {
    groups: buildSkills(actor, filter),
    toggleLabel: trainedOnly ? 'WOD5E_HUD.SkillsFilter.All' : 'WOD5E_HUD.SkillsFilter.Trained'
  }
}

export function buildPowersDrawer(actor) {
  const groups = buildPowers(actor)
  return {
    groups,
    title:
      actor?.type === 'hunter'
        ? 'WOD5E_HUD.Drawer.Edges'
        : actor?.type === 'werewolf'
          ? 'WOD5E_HUD.Drawer.Gifts'
          : actor?.type === 'vampire' || actor?.type === 'ghoul'
            ? 'WOD5E_HUD.Drawer.Disciplines'
            : 'WOD5E_HUD.Drawer.Features'
  }
}

export function buildActionsDrawer(actor) {
  const type = actor?.type
  const isVampire = type === 'vampire'
  const isGhoul = type === 'ghoul'
  const hasWillpower = Boolean(actor?.system?.willpower)
  const predator = isVampire
    ? actor?.items?.find?.((item) => item.type === 'predatorType')
    : null
  const canFeed = Boolean(predator?.system?.dicepool)
  const groups = []

  if (isVampire) {
    const actions = [
      {
        id: 'rouse',
        label: localize('WOD5E_HUD.Actions.Rouse', 'Rouse Check'),
        icon: 'fa-solid fa-droplet'
      }
    ]

    if (canFeed) {
      actions.push({
        id: 'feeding',
        label: localize('WOD5E_HUD.Actions.Feeding', 'Feeding'),
        icon: 'fa-solid fa-dice-d10'
      })
    }

    actions.push({
      id: 'frenzy',
      label: localize('WOD5E_HUD.Actions.ResistFrenzy', 'Resist Frenzy'),
      icon: 'fa-solid fa-fire'
    })

    groups.push({
      id: 'vitae',
      label: localize('WOD5E_HUD.Actions.Vitae', 'Vitae'),
      actions
    })
  }

  if (hasWillpower) {
    groups.push({
      id: 'willpower',
      label: localize('WOD5E_HUD.Actions.WillpowerGroup', 'Willpower'),
      actions: [
        {
          id: 'willpower',
          label: localize('WOD5E_HUD.Actions.Willpower', 'Willpower Test'),
          icon: 'fa-solid fa-brain'
        }
      ]
    })
  }

  if (isVampire || isGhoul) {
    groups.push({
      id: 'humanity',
      label: localize('WOD5E_HUD.Actions.Humanity', 'Humanity'),
      actions: [
        {
          id: 'remorse',
          label: localize('WOD5E_HUD.Actions.Remorse', 'Remorse Test'),
          icon: 'fa-solid fa-heart-crack'
        }
      ]
    })
  }

  return { groups }
}

function buildActionSearchIndex(actor) {
  const { groups } = buildActionsDrawer(actor)
  const index = []

  for (const group of groups) {
    for (const action of group.actions) {
      index.push({
        id: `action:${action.id}`,
        kind: 'action',
        category: 'action',
        actionId: action.id,
        label: action.label,
        subtitle: group.label,
        icon: action.icon,
        searchText: normalizeText(`${action.label} ${group.label} action acao`)
      })
    }
  }

  return index
}

export function buildSearchResults(actor, query = '') {
  const normalized = normalizeText(query)
  const all = [...buildActionSearchIndex(actor), ...buildSearchIndex(actor)]
  const filtered = normalized
    ? all.filter((entry) => entry.searchText.includes(normalized))
    : all

  const groups = []
  const seen = new Map()
  let index = 0

  for (const entry of filtered) {
    if (!seen.has(entry.category)) {
      const group = {
        id: entry.category,
        label: CATEGORY_LABELS[entry.category] ?? entry.category,
        items: []
      }
      seen.set(entry.category, group)
      groups.push(group)
    }
    seen.get(entry.category).items.push({
      ...entry,
      index
    })
    index += 1
  }

  return {
    groups,
    flat: groups.flatMap((group) => group.items),
    total: groups.reduce((total, group) => total + group.items.length, 0),
    empty: groups.length === 0
  }
}
