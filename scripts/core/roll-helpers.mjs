import { localize } from './utils.mjs'

export function rollAttribute(actor, key) {
  if (!actor || !key) return
  // Same dataset as the sheet's attribute label.
  return globalThis.WOD5E?.api?.RollFromDataset?.({
    dataset: {
      valuePaths: `attributes.${key}.value`,
      selectDialog: true,
      attribute: key
    },
    actor
  })
}

export function rollSkill(actor, key) {
  if (!actor || !key) return
  // Same dataset as the sheet's skill label.
  return globalThis.WOD5E?.api?.RollFromDataset?.({
    dataset: {
      valuePaths: `skills.${key}.value`,
      selectDialog: true,
      skill: key,
      useFlavorPath: true,
      flavorPath: `skills.${key}.description`,
      macroid: actor.system?.skills?.[key]?.macroid ?? ''
    },
    actor
  })
}

/** Roll an item through the system's own roller when available. */
export async function rollItem(actor, item) {
  if (!actor || !item) return
  const roller = await import('/systems/wod5e/system/actor/scripts/item-roll.js')
  return roller._rollItem(actor, item)
}

export function openItemChat(item) {
  if (!item) return
  foundry.documents.ChatMessage.implementation.create({
    flags: {
      wod5e: {
        name: item.name,
        img: item.img,
        description: item.system?.description || ''
      }
    }
  })
}

export async function useItem(actor, item) {
  if (!actor || !item) return

  const rollableTypes = ['power', 'gift', 'perk', 'edgepool', 'weapon', 'gear', 'customRoll']
  const hasDicepool = Object.keys(item.system?.dicepool ?? {}).length > 0
  if (rollableTypes.includes(item.type) || hasDicepool) {
    return rollItem(actor, item)
  }

  openItemChat(item)
}

/** Open the system's "Spend Experience" dialog and write a negative entry. */
export async function spendXP(actor) {
  if (!actor) return

  const template = 'systems/wod5e/display/shared/actors/parts/experience-display.hbs'
  const content = await foundry.applications.handlebars.renderTemplate(template, {
    name: localize('WOD5E_HUD.XP.Spent', 'XP Spent'),
    value: 0
  })

  const result = await foundry.applications.api.DialogV2.input({
    window: {
      title: localize(
        'WOD5E.Experience.SpendExperience',
        localize('WOD5E_HUD.XP.SpendTitle', 'Spend Experience')
      )
    },
    content,
    ok: {
      icon: 'fas fa-check',
      label: localize('WOD5E.Add', localize('WOD5E_HUD.XP.Add', 'Add'))
    },
    buttons: [
      {
        action: 'cancel',
        icon: 'fas fa-times',
        label: localize('WOD5E.Cancel', localize('WOD5E_HUD.XP.Cancel', 'Cancel')),
        type: 'button'
      }
    ],
    classes: ['wod5e', actor.system?.gamesystem || 'mortal', 'dialog']
  })

  if (result === 'cancel' || result == null) return

  const experiences = foundry.utils.deepClone(actor.system?.experiences ?? [])
  experiences.push({
    id: foundry.utils.randomID(8),
    name: result.xpName || localize('WOD5E_HUD.XP.Spent', 'XP Spent'),
    value: -Math.abs(Number(result.xpValue) || 0),
    timestamp: Date.now()
  })

  return actor.update({ 'system.experiences': experiences })
}
