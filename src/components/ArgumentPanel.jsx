import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { getArgument, getSources, getUserVote, castVote, deleteArgument } from '../lib/firebase'
import ViewSourcesModal from './ViewSourcesModal'
import { consumePendingDiveId, setPendingBackId } from '../lib/diveTransition'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
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

export default function ArgumentPanel({ argumentId, treeId, deviceId, onAddSource }) {
  const navigate = useNavigate()
  const panelRef = useRef(null)
  const [argument, setArgument] = useState(null)
  const [sources, setSources] = useState([])
  const [userVote, setUserVote] = useState(null)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [viewSources, setViewSources] = useState(false)

  // If this panel is the destination of a dive transition, mark it as the
  // shared element so the browser morphs the list item into this position.
  useLayoutEffect(() => {
    const pendingId = consumePendingDiveId()
    if (pendingId === argumentId && panelRef.current) {
      panelRef.current.style.viewTransitionName = 'arg-panel'
    }
  }, [argumentId])

  useEffect(() => {
    setLoading(true)
    setConfirmDelete(false)

    const load = async () => {
      const [arg, srcs, vote] = await Promise.all([
        getArgument(argumentId),
        getSources(argumentId),
        getUserVote(argumentId, deviceId),
      ])
      setArgument(arg)
      setScore(arg?.score ?? 0)
      setSources(srcs)
      setUserVote(vote)
      setLoading(false)
    }

    load()
  }, [argumentId, treeId, deviceId])

  const goBack = () => {
    if (!argument?.parentId) return
    panelRef.current.style.viewTransitionName = 'arg-panel'
    setPendingBackId(argumentId)
    const url = `/${treeId}/${argument.parentId}`
    const state = {
      backArgId: argumentId,
      backArg: argument,
      backArgSources: sources,
      backArgVote: userVote,
    }
    if ('startViewTransition' in document) {
      document.startViewTransition(() => { flushSync(() => navigate(url, { state })) })
    } else {
      navigate(url, { state })
    }
  }

  const handleVote = async (value) => {
    if (voting) return
    setVoting(true)
    try {
      await castVote(argumentId, deviceId, value)
      const prevVote = userVote
      let delta = 0
      if (prevVote === null) delta = value
      else if (prevVote === value) delta = -value
      else delta = value * 2
      setScore(s => s + delta)
      setUserVote(prevVote === value ? null : value)
    } finally {
      setVoting(false)
    }
  }

  const handleDelete = async () => {
    await deleteArgument(argumentId)
    setArgument(prev => ({ ...prev, deleted: true }))
    setConfirmDelete(false)
  }

  const isAuthor = argument?.authorDeviceId === deviceId
  const scoreDisplay = score > 0 ? `+${score}` : `${score}`
  const scoreColor = score > 0 ? 'text-white' : 'text-gray-500'
  const upvoteActive = userVote === 1
  const downvoteActive = userVote === -1
  const sourceCount = sources.length

  // Single wrapper so panelRef is always attached — needed for the view
  // transition morph target to exist even while loading.
  return (
    <div ref={panelRef} className="shrink-0 bg-gray-900 px-4 pt-3 pb-4 space-y-3">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-7 bg-gray-800 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-gray-800 rounded-full" />
            <div className="h-4 w-2/3 bg-gray-800 rounded-full" />
          </div>
          <div className="h-2 w-24 bg-gray-800 rounded-full" />
          <div className="h-7 w-24 bg-gray-800 rounded-md" />
        </div>
      ) : !argument ? (
        <p className="text-gray-600 text-sm">Argument not found.</p>
      ) : argument.deleted ? (
        <>
          <p className="text-gray-600 text-sm italic">[deleted by user]</p>
          {argument.parentId && (
            <button
              onClick={goBack}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              <ChevronUp />
              Back
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex items-start gap-3">
            {/* Left: text + meta + add source */}
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <p className="text-white text-sm leading-snug">{argument.text}</p>
              <p className="text-xs text-gray-500">
                {argument.authorUsername}
                {argument.createdAt && ` · ${formatDate(argument.createdAt)}`}
                {sourceCount > 0 && (
                  <> · <button onClick={() => setViewSources(true)} className="text-gray-400 hover:text-gray-200 transition-colors">{sourceCount} source{sourceCount > 1 ? 's' : ''} ↗</button></>
                )}
              </p>
              {isAuthor && (
                <button
                  onClick={() => onAddSource(argumentId)}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors self-start"
                >
                  + Add source
                </button>
              )}
            </div>

            {/* Right: votes + delete */}
            <div className="flex flex-col items-center shrink-0 -my-0.5">
              <button
                onClick={() => handleVote(1)}
                disabled={voting}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  upvoteActive ? 'text-white' : 'text-gray-500 hover:text-white'
                }`}
              >↑</button>
              <span className={`text-xs font-mono font-medium px-1 py-0.5 ${scoreColor}`}>{scoreDisplay}</span>
              <button
                onClick={() => handleVote(-1)}
                disabled={voting}
                className={`px-2 py-1 text-sm rounded transition-colors ${
                  downvoteActive ? 'text-white' : 'text-gray-500 hover:text-white'
                }`}
              >↓</button>
              {isAuthor && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="p-1.5 mt-1 text-gray-700 hover:text-red-400 transition-colors"
                >
                  <TrashIcon />
                </button>
              )}
            </div>
          </div>

          {argument.parentId && (
            <button
              onClick={goBack}
              className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:text-gray-300 transition-colors"
            >
              <ChevronUp />
              Back
            </button>
          )}

          <ViewSourcesModal
            isOpen={viewSources}
            sources={sources}
            isAuthor={isAuthor}
            onAddSource={() => { setViewSources(false); onAddSource(argumentId) }}
            onClose={() => setViewSources(false)}
          />

          {confirmDelete && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xs p-5 space-y-4">
                <p className="text-white text-sm">Delete this argument?</p>
                <p className="text-xs text-gray-500">It will be replaced with a placeholder. Sub-arguments remain.</p>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setConfirmDelete(false)} className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5">Cancel</button>
                  <button onClick={handleDelete} className="text-sm text-red-400 hover:text-red-300 transition-colors px-3 py-1.5">Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
