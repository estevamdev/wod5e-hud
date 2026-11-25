import { clamp } from './utils.mjs'

const DRAG_THRESHOLD = 4
const EDGE_MARGIN = 8

export function clampToViewport(x, y, width, height) {
  return {
    x: clamp(x, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerWidth - width - EDGE_MARGIN)),
    y: clamp(y, EDGE_MARGIN, Math.max(EDGE_MARGIN, window.innerHeight - height - EDGE_MARGIN))
  }
}

/**
 * Makes an element draggable with a pointer. A small threshold keeps clicks
 * and double clicks working. Interactive controls can be skipped with `ignore`.
 */
export function enableDrag(element, { ignore, onDrag, onEnd } = {}) {
  if (!element) return () => {}

  let drag = null

  const onPointerDown = (event) => {
    if (event.button !== 0) return
    if (ignore && event.target.closest?.(ignore)) return

    const rect = element.getBoundingClientRect()
    drag = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
      last: null
    }
  }

  const onPointerMove = (event) => {
    if (!drag) return

    const dx = event.clientX - drag.pointerX
    const dy = event.clientY - drag.pointerY

    if (!drag.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      drag.moved = true
      try {
        element.setPointerCapture?.(drag.pointerId)
      } catch {
        // Synthetic pointers and some browsers do not support capture here.
      }
      element.classList.add('wod-dragging')
    }

    event.preventDefault()

    drag.last = clampToViewport(
      drag.x + dx,
      drag.y + dy,
      drag.width || element.offsetWidth,
      drag.height || element.offsetHeight
    )
    onDrag?.(drag.last)
  }

  const finish = (event) => {
    if (!drag) return

    const moved = drag.moved
    const last = drag.last
    drag = null
    try {
      element.releasePointerCapture?.(event.pointerId)
    } catch {
      // Ignore a missing capture.
    }
    element.classList.remove('wod-dragging')

    if (moved && last) onEnd?.(last)
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', finish)
  element.addEventListener('pointercancel', finish)

  return () => {
    element.removeEventListener('pointerdown', onPointerDown)
    element.removeEventListener('pointermove', onPointerMove)
    element.removeEventListener('pointerup', finish)
    element.removeEventListener('pointercancel', finish)
  }
}
