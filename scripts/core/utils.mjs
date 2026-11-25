import { MODULE_ID } from './constants.mjs'

export function getSetting(key, fallback = undefined) {
  try {
    const value = game.settings.get(MODULE_ID, key)
    return value === undefined ? fallback : value
  } catch {
    return fallback
  }
}

export async function setSetting(key, value) {
  try {
    return await game.settings.set(MODULE_ID, key, value)
  } catch (error) {
    console.warn(`WOD5E HUD | failed to set ${key}`, error)
    return value
  }
}

export function localize(key, fallback = key) {
  try {
    const value = game.i18n.localize(key)
    return value === key ? fallback : value
  } catch {
    return fallback
  }
}

export function clamp(value, min, max) {
  return Math.min(Math.max(Number(value) || 0, min), max)
}

export function debounce(fn, waitMs = 80) {
  let timer = null
  return (...args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, waitMs)
  }
}

/** Case- and accent-insensitive normalization for the search palette. */
export function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function isOwner(actor) {
  if (!actor) return false
  if (game.user?.isGM) return true
  try {
    return actor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
  } catch {
    return actor.isOwner ?? false
  }
}

/**
 * Resolve the actor shown by the HUD:
 * 1. Selected token, if the user owns it.
 * 2. The user's assigned character, if owned.
 * 3. Nothing.
 */
export function resolveActor() {
  try {
    const token = canvas?.tokens?.controlled?.[0]
    if (token?.actor && isOwner(token.actor)) {
      return { actor: token.actor, token }
    }
  } catch {
    // canvas not ready
  }

  if (game.user?.character && isOwner(game.user.character)) {
    return { actor: game.user.character, token: null }
  }

  return null
}

export function tokenPortrait(token, actor) {
  return token?.document?.texture?.src || actor?.img || 'icons/svg/mystery-man.svg'
}

export function tokenName(token, actor) {
  return token?.name || actor?.name || ''
}
