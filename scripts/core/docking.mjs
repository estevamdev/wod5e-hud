import { clamp } from './utils.mjs'

const DOCK_CLASSES = [
  'wod-dock-top-left',
  'wod-dock-top-right',
  'wod-dock-bottom-left',
  'wod-dock-bottom-right',
  'wod-dock-free'
]

const DRAG_THRESHOLD = 4

export function applyDock(root, dock, freePosition) {
  if (!root) return
  root.classList.remove(...DOCK_CLASSES)
  root.classList.add(`wod-dock-${dock}`)

  if (dock === 'free') {
    const x = Number(freePosition?.x)
    const y = Number(freePosition?.y)
    if (Number.isFinite(x) && Number.isFinite(y)) {
      root.style.left = `${x}px`
      root.style.top = `${y}px`
    } else {
      root.style.left = '16px'
      root.style.top = '120px'
    }
    return
  }

  root.style.left = ''
  root.style.top = ''
}

export function clampPosition(x, y, width, height) {
  const margin = 8
  return {
    x: clamp(x, margin, Math.max(margin, window.innerWidth - width - margin)),
    y: clamp(y, margin, Math.max(margin, window.innerHeight - height - margin))
  }
}

/**
 * Make the whole HUD draggable. A movement threshold keeps clicks and double
 * clicks working, and `ignore` skips interactive controls such as buttons.
 * @param {HTMLElement} root
 * @param {HTMLElement} handle
 * @param {(position: {x: number, y: number}) => void} onSave
 * @param {{ignore?: string}} [options]
 * @returns {() => void} cleanup function
 */
export function enableDrag(root, handle, onSave, { ignore } = {}) {
  if (!root || !handle) return () => {}

  let drag = null

  const onPointerDown = (event) => {
    if (event.button !== 0) return
    if (ignore && event.target.closest?.(ignore)) return

    const rect = root.getBoundingClientRect()
    drag = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false
    }
  }

  const onPointerMove = (event) => {
    if (!drag) return

    const dx = event.clientX - drag.pointerX
    const dy = event.clientY - drag.pointerY

    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      drag.moved = true
      handle.setPointerCapture?.(drag.pointerId)

      if (!root.classList.contains('wod-dock-free')) {
        root.classList.remove(...DOCK_CLASSES)
        root.classList.add('wod-dock-free')
        root.style.left = `${Math.round(drag.x)}px`
        root.style.top = `${Math.round(drag.y)}px`
      }

      root.classList.add('wod-dragging')
    }

    event.preventDefault()

    const next = clampPosition(drag.x + dx, drag.y + dy, drag.width || 120, drag.height || 80)
    root.style.left = `${next.x}px`
    root.style.top = `${next.y}px`
  }

  const finish = (event) => {
    if (!drag) return

    const moved = drag.moved
    drag = null
    handle.releasePointerCapture?.(event.pointerId)
    root.classList.remove('wod-dragging')

    if (!moved) return

    // Prevent the click that follows a drag from triggering buttons/sheets.
    root.dataset.wodDraggedAt = String(performance.now())
    onSave?.({
      x: root.offsetLeft,
      y: root.offsetTop
    })
  }

  handle.addEventListener('pointerdown', onPointerDown)
  handle.addEventListener('pointermove', onPointerMove)
  handle.addEventListener('pointerup', finish)
  handle.addEventListener('pointercancel', finish)

  return () => {
    handle.removeEventListener('pointerdown', onPointerDown)
    handle.removeEventListener('pointermove', onPointerMove)
    handle.removeEventListener('pointerup', finish)
    handle.removeEventListener('pointercancel', finish)
  }
}
