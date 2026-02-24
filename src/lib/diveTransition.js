// Coordinates the shared-element view transition between ArgumentItem and ArgumentPanel.
// The clicked item sets this ID before the transition; ArgumentPanel reads it on mount.
let _pendingId = null

export const setPendingDiveId = (id) => { _pendingId = id }
export const consumePendingDiveId = () => { const id = _pendingId; _pendingId = null; return id }

// Back transition: ArgumentPanel sets this before navigating; the matching
// ArgumentItem reads it (non-destructively) and claims the 'arg-panel' name.
let _pendingBackId = null

export const setPendingBackId = (id) => { _pendingBackId = id }
export const getPendingBackId = () => _pendingBackId
export const clearPendingBackId = () => { _pendingBackId = null }
