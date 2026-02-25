// FLIP animation helper for shared-element transitions between ArgumentItem and ArgumentPanel.
//
// Before navigating: call recordFlipSource(el, id) on the source element.
// After the destination mounts: call consumeFlipRect(id) to get the source rect,
// then applyFlip (for elements outside overflow containers) or
// applyFlipViaClone (for elements inside overflow:hidden containers) to animate.

let _rect = null
let _id   = null

export const recordFlipSource = (el, id) => {
  if (!el) return
  const r = el.getBoundingClientRect()
  _rect = { top: r.top, left: r.left, width: r.width, height: r.height }
  _id   = id
}

export const consumeFlipRect = (id) => {
  if (_id !== id) return null
  const r = _rect
  _rect = null
  _id   = null
  return r
}

// For elements NOT inside overflow:hidden containers (e.g. the panel at the top of the page).
// Applies the inverse transform directly to the element and animates it away.
export const applyFlip = (el, sourceRect) => {
  const t  = el.getBoundingClientRect()
  const dx = sourceRect.left - t.left
  const dy = sourceRect.top  - t.top
  const sx = sourceRect.width  / t.width
  const sy = sourceRect.height / t.height

  el.style.transformOrigin = 'top left'
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`

  const raf = requestAnimationFrame(() => {
    el.style.transition = 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)'
    el.style.transform  = ''
    el.addEventListener('transitionend', () => {
      el.style.transition      = ''
      el.style.transformOrigin = ''
    }, { once: true })
  })
  return raf
}

// For elements inside overflow:hidden containers (e.g. list items in ArgumentList).
// Clones the element onto document.body with position:fixed so the animation
// is never clipped, then hides the real element until the clone finishes.
export const applyFlipViaClone = (el, sourceRect) => {
  const targetRect = el.getBoundingClientRect()

  const clone = el.cloneNode(true)
  Object.assign(clone.style, {
    position:        'fixed',
    top:             `${sourceRect.top}px`,
    left:            `${sourceRect.left}px`,
    width:           `${sourceRect.width}px`,
    height:          `${sourceRect.height}px`,
    overflow:        'hidden',
    margin:          '0',
    zIndex:          '999',
    pointerEvents:   'none',
    transform:       'none',
    transition:      'none',
    transformOrigin: 'top left',
    backgroundColor: 'rgb(17, 24, 39)', // gray-900 — matches the panel background
  })
  document.body.appendChild(clone)
  el.style.visibility = 'hidden'

  const dx = targetRect.left - sourceRect.left
  const dy = targetRect.top  - sourceRect.top
  const sx = targetRect.width  / sourceRect.width
  const sy = targetRect.height / sourceRect.height

  const raf = requestAnimationFrame(() => {
    clone.style.transition = 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)'
    clone.style.transform  = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`
    clone.addEventListener('transitionend', () => {
      // Cross-fade: show real element at zero opacity, fade clone out simultaneously
      el.style.opacity    = '0'
      el.style.visibility = ''
      requestAnimationFrame(() => {
        clone.style.transition = 'opacity 150ms ease-out'
        clone.style.opacity    = '0'
        el.style.transition    = 'opacity 150ms ease-out'
        el.style.opacity       = '1'
      })
      setTimeout(() => {
        clone.remove()
        el.style.transition = ''
        el.style.opacity    = ''
      }, 160)
    }, { once: true })
  })
  return raf
}
