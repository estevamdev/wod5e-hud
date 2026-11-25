export const MODULE_ID = 'wod5e-hud'
export const MODULE_TITLE = 'WOD5E HUD'
export const COMBAT_ID = 'wod-combat-root'
export const SEARCH_ID = 'wod5e-hud-search'

// The XP shortcut stays hidden until the experience flow is finished (see README).
export const SHOW_XP = false

export const CREATURE_INFO = {
  vampire: {
    accent: '#8a0303',
    resource: 'hunger'
  },
  ghoul: {
    accent: '#991b1b'
  },
  mortal: {
    accent: '#64748b'
  },
  hunter: {
    accent: '#d97706'
  },
  werewolf: {
    accent: '#b45309'
  },
  spc: {
    accent: '#64748b'
  },
  group: {
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
