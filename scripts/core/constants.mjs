export const MODULE_ID = 'wod5e-hud'
export const MODULE_TITLE = 'WOD5E HUD'
export const ROOT_ID = 'wod5e-hud-root'
export const COMBAT_ID = 'wod-combat-root'
export const SEARCH_ID = 'wod5e-hud-search'

// The XP shortcut stays hidden until the experience flow is finished (see README).
export const SHOW_XP = false

export const CREATURE_INFO = {
  vampire: {
    key: 'vampire',
    label: 'WOD5E_HUD.Creature.Vampire',
    accent: '#8a0303',
    resource: 'hunger'
  },
  ghoul: {
    key: 'ghoul',
    label: 'WOD5E_HUD.Creature.Ghoul',
    accent: '#991b1b'
  },
  mortal: {
    key: 'mortal',
    label: 'WOD5E_HUD.Creature.Mortal',
    accent: '#64748b'
  },
  hunter: {
    key: 'hunter',
    label: 'WOD5E_HUD.Creature.Hunter',
    accent: '#d97706'
  },
  werewolf: {
    key: 'werewolf',
    label: 'WOD5E_HUD.Creature.Werewolf',
    accent: '#b45309'
  },
  spc: {
    key: 'spc',
    label: 'WOD5E_HUD.Creature.Spc',
    accent: '#64748b'
  },
  group: {
    key: 'group',
    label: 'WOD5E_HUD.Creature.Group',
    accent: '#52525b'
  }
}

export const CATEGORY_ICONS = {
  attribute: 'fa-solid fa-hand-fist',
  skill: 'fa-solid fa-dice-d20',
  power: 'fa-solid fa-wand-sparkles',
  gift: 'fa-solid fa-paw',
  perk: 'fa-solid fa-shield-halved',
  edge: 'fa-solid fa-shield-halved',
  feature: 'fa-solid fa-star'
}

export const CATEGORY_LABELS = {
  action: 'WOD5E_HUD.Search.Type.Action',
  attribute: 'WOD5E_HUD.Search.Type.Attribute',
  skill: 'WOD5E_HUD.Search.Type.Skill',
  power: 'WOD5E_HUD.Search.Type.Power',
  gift: 'WOD5E_HUD.Search.Type.Gift',
  perk: 'WOD5E_HUD.Search.Type.Perk',
  edge: 'WOD5E_HUD.Search.Type.Edge',
  feature: 'WOD5E_HUD.Search.Type.Feature'
}
