import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import ViewSourcesModal from './ViewSourcesModal'
import { setPendingDiveId, getPendingBackId, clearPendingBackId } from '../lib/diveTransition'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,1 6,6 10,1" />
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

export default function ArgumentItem({
  argument,
  treeId,
  deviceId,
  isExpanded,
  onToggle,
  userVote,
  sources,
  onVote,
  onAddSource,
  onDiveDeeper,
  onDelete,
  animIndex = 0,
  skipAnimation = false,
}) {
  const [voting, setVoting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewSources, setViewSources] = useState(false)
  const divRef = useRef(null)

  // Freeze the animation style at mount so re-renders (vote, expand) don't replay it.
  // skipAnimation is set for the back-transition target so the entry pop doesn't
  // conflict with the view-transition morph.
  const animStyle = useRef(null)
  if (!animStyle.current) {
    animStyle.current = skipAnimation ? {} : {
      animation: 'item-pop 140ms ease-out both',
      animationDelay: `${animIndex * 40}ms`,
    }
  }

  // If this item is the destination of a back transition, claim the shared-element
  // name so the browser morphs the ArgumentPanel down into this position.
  useLayoutEffect(() => {
    if (getPendingBackId() === argument.id && divRef.current) {
      divRef.current.style.viewTransitionName = 'arg-panel'
      clearPendingBackId()
    }
  }, [argument.id])

  const isAuthor = argument.authorDeviceId === deviceId

  useEffect(() => {
    if (!isExpanded) { setConfirmDelete(false); setViewSources(false) }
  }, [isExpanded])

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
    if (divRef.current) divRef.current.style.viewTransitionName = 'arg-panel'
    setPendingDiveId(argument.id)
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        flushSync(() => onDiveDeeper(argument.id))
      })
    } else {
      onDiveDeeper(argument.id)
    }
  }

  const scoreDisplay = argument.score > 0 ? `+${argument.score}` : `${argument.score}`
  const scoreColor = argument.score > 0 ? 'text-white' : 'text-gray-500'
  const upvoteActive = userVote === 1
  const downvoteActive = userVote === -1
  const sourceCount = sources?.length ?? 0

  return (
    <div ref={divRef} style={animStyle.current} className="border-b border-gray-800">
      <div className="flex items-stretch">
        {/* Left column: tap to toggle */}
        <div
          onClick={() => onToggle(argument.id)}
          className="flex-1 min-w-0 text-left px-4 py-3 flex flex-col gap-2 cursor-pointer"
        >
          {argument.deleted ? (
            <span className="text-gray-600 text-sm italic">[deleted by user]</span>
          ) : (
            <>
              <span className={`text-gray-300 text-sm ${isExpanded ? 'leading-snug' : 'truncate'}`}>
                {argument.text}
              </span>

              {/* Meta + add source — animate in on expand */}
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out"
                style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden min-h-0">
                  <div className="flex flex-col gap-2 pt-1">
                    <p className="text-xs text-gray-500">
                      {argument.authorUsername}
                      {argument.createdAt && ` · ${formatDate(argument.createdAt)}`}
                      {sourceCount > 0 && (
                        <> · <button
                          onClick={e => { e.stopPropagation(); setViewSources(true) }}
                          className="text-gray-400 hover:text-gray-200 transition-colors"
                        >{sourceCount} source{sourceCount > 1 ? 's' : ''} ↗</button></>
                      )}
                    </p>
                    {isAuthor && (
                      <button
                        onClick={e => { e.stopPropagation(); onAddSource(argument.id) }}
                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-start"
                      >
                        + Add source
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right column: vote widget + delete */}
        {!argument.deleted && (
          <div className="flex flex-col items-center pr-4 pl-2 py-3 shrink-0">
            {/* ↑ button — slides down into view */}
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-in-out w-full"
              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden min-h-0 flex justify-center">
                <button
                  onClick={() => handleVote(1)}
                  disabled={voting}
                  className={`px-2 py-1 text-sm rounded transition-colors ${
                    upvoteActive ? 'text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >↑</button>
              </div>
            </div>

            {/* Score — always visible */}
            <span className={`text-xs font-mono font-medium px-1 py-0.5 ${scoreColor}`}>
              {scoreDisplay}
            </span>

            {/* ↓ button — slides up into view */}
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-in-out w-full"
              style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden min-h-0 flex justify-center">
                <button
                  onClick={() => handleVote(-1)}
                  disabled={voting}
                  className={`px-2 py-1 text-sm rounded transition-colors ${
                    downvoteActive ? 'text-white' : 'text-gray-500 hover:text-white'
                  }`}
                >↓</button>
              </div>
            </div>

            {/* Delete — slides in for authors */}
            {isAuthor && (
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-in-out w-full"
                style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
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

      {/* Sub-arguments button — full width, animates in */}
      <div
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden min-h-0">
          <div className="px-4 pb-4">
            <button
              onClick={handleDiveDeeper}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              <ChevronDown />
              Sub-arguments
              {argument.forCount > 0 && <span className="bg-green-900/60 text-green-400 rounded px-1 font-mono">{argument.forCount}</span>}
              {argument.againstCount > 0 && <span className="bg-red-900/60 text-red-400 rounded px-1 font-mono">{argument.againstCount}</span>}
            </button>
          </div>
        </div>
      </div>

      <ViewSourcesModal
        isOpen={viewSources}
        sources={sources ?? []}
        isAuthor={isAuthor}
        onAddSource={() => { setViewSources(false); onAddSource(argument.id) }}
        onClose={() => setViewSources(false)}
      />

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xs p-5 space-y-4">
            <p className="text-white text-sm">Delete this argument?</p>
            <p className="text-xs text-gray-500">It will be replaced with a placeholder. Sub-arguments remain.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5">Cancel</button>
              <button onClick={() => onDelete(argument.id)} className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1.5">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
