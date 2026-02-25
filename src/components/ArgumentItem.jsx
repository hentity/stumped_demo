import { useState, useEffect, useLayoutEffect, useRef, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import SourcesModal from './SourcesModal'
import { recordFlipSource, consumeFlipRect, applyFlipViaClone } from '../lib/diveTransition'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,1 6,6 10,1" />
    </svg>
  )
}

function ChevronUp() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,7 6,2 10,7" />
    </svg>
  )
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  )
}

const ArgumentItem = forwardRef(function ArgumentItem({
  argument,
  treeId,
  deviceId,
  isExpanded,
  onToggle,
  userVote,
  sources,
  onVote,
  onSourceAdded,
  onSourceDeleted,
  onDiveDeeper,
  onDelete,
  onBack,          // panel mode: back button callback
  isPanel = false, // panel mode: always expanded, different bg, back instead of sub-args
  animIndex = 0,
  skipAnimation = false,
}, ref) {
  const localRef = useRef(null)
  const divRef = ref ?? localRef

  const [voting, setVoting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewSources, setViewSources] = useState(false)

  const animStyle = useRef(null)
  if (!animStyle.current) {
    animStyle.current = skipAnimation ? {} : {
      animation: 'item-pop 140ms ease-out both',
      animationDelay: `${animIndex * 40}ms`,
    }
  }

  // Back transition: if this item is the FLIP destination, animate it from the panel position.
  // Uses a fixed-position clone so the animation isn't clipped by overflow:hidden ancestors.
  useLayoutEffect(() => {
    if (isPanel) return
    const sourceRect = consumeFlipRect(argument.id)
    if (sourceRect && divRef.current) {
      // If the item is below the bottom of its scroll container, scroll it into view
      // at the bottom so its getBoundingClientRect is correct for the FLIP animation.
      let scrollParent = divRef.current.parentElement
      while (scrollParent) {
        const { overflow, overflowY } = window.getComputedStyle(scrollParent)
        if (/auto|scroll/.test(overflow + overflowY)) break
        scrollParent = scrollParent.parentElement
      }
      if (scrollParent) {
        const itemRect = divRef.current.getBoundingClientRect()
        const containerRect = scrollParent.getBoundingClientRect()
        if (itemRect.bottom > containerRect.bottom) {
          scrollParent.scrollTop += itemRect.bottom - containerRect.bottom
        }
      }
      applyFlipViaClone(divRef.current, sourceRect)
    }
  }, [argument.id])

  const expanded = isPanel ? true : isExpanded
  const isAuthor = argument.authorDeviceId === deviceId

  useEffect(() => {
    if (!expanded) { setConfirmDelete(false); setViewSources(false) }
  }, [expanded])

  const handleVote = async (value) => {
    if (voting) return
    setVoting(true)
    try {
      await onVote(argument.id, value)
    } finally {
      setVoting(false)
    }
  }

  const handleDiveDeeper = () => {
    recordFlipSource(divRef.current, argument.id)
    const initialData = { argument, sources, userVote }
    onDiveDeeper(argument.id, initialData)
  }

  const likeActive = userVote === 1
  const sourceCount = sources?.length ?? 0

  const wrapperClass = isPanel
    ? 'shrink-0 bg-gray-900'
    : 'border-b border-gray-800'

  return (
    <div ref={divRef} style={isPanel ? undefined : animStyle.current} className={wrapperClass}>
      <div className="flex items-stretch">
        {/* Left column */}
        <div
          onClick={isPanel ? undefined : () => onToggle(argument.id)}
          className={`flex-1 min-w-0 text-left px-4 py-3 flex flex-col${isPanel ? '' : ' cursor-pointer'}${expanded ? '' : ' justify-center'}`}
        >
          {argument.deleted ? (
            <span className="text-gray-600 text-sm italic">[deleted by user]</span>
          ) : (
            <>
              <span className={`text-sm leading-snug ${isPanel ? 'text-white' : 'text-gray-300'} ${expanded ? '' : 'truncate'}`}>
                {argument.text}
              </span>

              <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden min-h-0">
                  <div className="flex flex-col gap-2 pt-2">
                    <p className="text-xs text-gray-500">
                      {argument.authorUsername}
                      {argument.createdAt && ` · ${formatDate(argument.createdAt)}`}
                    </p>
                    {(sourceCount > 0 || isAuthor) && (
                      <button
                        onClick={e => { e.stopPropagation(); setViewSources(true) }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-start"
                      >
                        {sourceCount > 0 ? `${sourceCount} source${sourceCount > 1 ? 's' : ''} ↗` : '+ Add source'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right column: like widget + delete */}
        {!argument.deleted && (
          <div className={`flex flex-col items-center justify-center pr-4 pl-2 py-3 shrink-0 gap-1`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleVote(1)}
                disabled={voting}
                className={`p-1 rounded transition-colors ${likeActive ? 'text-red-500' : 'text-gray-500 hover:text-red-400'}`}
              >
                <HeartIcon filled={likeActive} />
              </button>
              <span className={`text-xs font-mono font-medium ${argument.score > 0 ? 'text-white' : 'text-gray-500'}`}>
                {argument.score}
              </span>
            </div>

            {isAuthor && (
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out w-full"
                style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden min-h-0 flex justify-center">
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1.5 text-gray-700 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom button: Back (panel) or Sub-arguments (item) */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-4 pb-4">
            {isPanel ? (
              onBack && (
                <button
                  onClick={onBack}
                  className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:text-gray-300 transition-colors"
                >
                  <ChevronUp />
                  Back
                </button>
              )
            ) : (
              <button
                onClick={handleDiveDeeper}
                className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              >
                <ChevronDown />
                Sub-arguments
                {argument.forCount > 0 && <span className="bg-green-900/60 text-green-400 rounded px-1 font-mono">{argument.forCount}</span>}
                {argument.againstCount > 0 && <span className="bg-red-900/60 text-red-400 rounded px-1 font-mono">{argument.againstCount}</span>}
              </button>
            )}
          </div>
        </div>
      </div>

      <SourcesModal
        isOpen={viewSources}
        argumentId={argument.id}
        sources={sources ?? []}
        isAuthor={isAuthor}
        deviceId={deviceId}
        onSourceAdded={(src) => onSourceAdded(argument.id, src)}
        onSourceDeleted={(srcId) => onSourceDeleted(argument.id, srcId)}
        onClose={() => setViewSources(false)}
      />

      {confirmDelete && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xs p-5 space-y-4">
            <p className="text-white text-sm">Delete this argument?</p>
            <p className="text-xs text-gray-500">It will be replaced with a placeholder. Sub-arguments remain.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5">Cancel</button>
              <button onClick={() => onDelete(argument.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1.5">Delete</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
})

export default ArgumentItem
