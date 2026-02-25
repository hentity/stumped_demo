import { useState, useEffect, useCallback, useImperativeHandle, useRef, forwardRef } from 'react'
import { getChildArguments, getSources, getUserVote, castVote, deleteArgument } from '../lib/firebase'
import ArgumentItem from './ArgumentItem'

const PAGE_SIZE = 10

// Cache full list state so back-navigation renders items at their correct positions,
// giving the FLIP animation a stable, correctly-positioned target to animate toward.
const listCache = new Map()

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

const ArgumentList = forwardRef(function ArgumentList(
  { treeId, parentId, parentRelation, deviceId, expandedId, onToggle, onAddArgument, onDiveDeeper, backTarget },
  ref
) {
  // backTarget = { backArgId, backArg, backArgSources, backArgVote } | null
  // When present, restore full list from cache so the back-target item renders
  // at its correct position, giving the FLIP animation the right target rect.
  const cacheKey = `${treeId}:${parentId}:${parentRelation}`
  const cached = backTarget ? listCache.get(cacheKey) : null

  const [args, setArgs] = useState(() =>
    cached ? cached.args : backTarget ? [backTarget.backArg] : []
  )
  const [loading, setLoading] = useState(!backTarget && !cached)
  const [sourcesMap, setSourcesMap] = useState(() => {   // { [argumentId]: source[] }
    if (cached) return { ...cached.sourcesMap, ...(backTarget ? { [backTarget.backArgId]: backTarget.backArgSources ?? [] } : {}) }
    return backTarget ? { [backTarget.backArgId]: backTarget.backArgSources ?? [] } : {}
  })
  const [votesMap, setVotesMap] = useState(() => {        // { [argumentId]: 1 | -1 | null }
    if (cached) return { ...cached.votesMap, ...(backTarget ? { [backTarget.backArgId]: backTarget.backArgVote ?? null } : {}) }
    return backTarget ? { [backTarget.backArgId]: backTarget.backArgVote ?? null } : {}
  })
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [sentinel, setSentinel] = useState(null)

  // Suppress the loading spinner for the first fetch when we have a pre-populated
  // back target — the transition lands on the item, then the real list loads in.
  const suppressNextLoad = useRef(!!backTarget)

  const isFor = parentRelation === 'for'

  console.log(`[ArgumentList:${parentRelation}] render`, { expandedId, backTarget: !!backTarget, backArgId: backTarget?.backArgId, backArgRelation: backTarget?.backArg?.parentRelation, argsLength: args.length })

  const fetch = useCallback(async () => {
    if (suppressNextLoad.current) {
      suppressNextLoad.current = false
    } else {
      setLoading(true)
    }
    try {
      const data = await getChildArguments(treeId, parentId, parentRelation)
      setArgs(data)
      const votes = await Promise.all(data.map(a => getUserVote(a.id, deviceId)))
      setVotesMap(prev => {
        const updated = { ...prev }
        data.forEach((a, i) => { updated[a.id] = votes[i] })
        return updated
      })
    } finally {
      setLoading(false)
    }
  }, [treeId, parentId, parentRelation, deviceId])

  useEffect(() => {
    fetch()
  }, [fetch])

  useImperativeHandle(ref, () => ({ refetch: fetch }), [fetch])

  // Infinite scroll — load next page when sentinel enters view
  useEffect(() => {
    if (!sentinel) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount(c => Math.min(c + PAGE_SIZE, args.length))
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [sentinel, args.length])

  const handleToggle = useCallback(async (argumentId) => {
    const isOpening = expandedId !== argumentId
    onToggle(isOpening ? argumentId : null)

    if (isOpening && sourcesMap[argumentId] === undefined) {
      const sources = await getSources(argumentId)
      setSourcesMap(prev => ({ ...prev, [argumentId]: sources }))
    }
  }, [expandedId, sourcesMap, deviceId, onToggle])

  const handleVote = useCallback(async (argumentId, value) => {
    await castVote(argumentId, deviceId, value)
    setArgs(prev => prev.map(a => {
      if (a.id !== argumentId) return a
      const prevVote = votesMap[argumentId] ?? null
      let delta = 0
      if (prevVote === null) delta = value
      else if (prevVote === value) delta = -value
      else delta = value * 2
      return { ...a, score: a.score + delta }
    }).sort((a, b) => b.score - a.score))

    setVotesMap(prev => {
      const prevVote = prev[argumentId] ?? null
      if (prevVote === value) return { ...prev, [argumentId]: null }
      return { ...prev, [argumentId]: value }
    })
  }, [deviceId, votesMap])

  const handleDiveDeeper = useCallback((targetArgumentId, initialData) => {
    listCache.set(cacheKey, { args, sourcesMap, votesMap })
    onDiveDeeper(targetArgumentId, initialData)
  }, [cacheKey, args, sourcesMap, votesMap, onDiveDeeper])

  const handleSourceAdded = useCallback((argumentId, source) => {
    setSourcesMap(prev => ({ ...prev, [argumentId]: [...(prev[argumentId] ?? []), source] }))
  }, [])

  const handleSourceDeleted = useCallback((argumentId, sourceId) => {
    setSourcesMap(prev => ({ ...prev, [argumentId]: (prev[argumentId] ?? []).filter(s => s.id !== sourceId) }))
  }, [])

  const handleDelete = useCallback(async (argumentId) => {
    const arg = args.find(a => a.id === argumentId)
    if (!arg) return
    await deleteArgument(argumentId)
    setArgs(prev => prev.map(a => a.id === argumentId ? { ...a, deleted: true } : a))
    onToggle(null)
  }, [args, onToggle])

  const headerBg = isFor ? 'bg-green-950/40' : 'bg-red-950/40'
  const headerBorder = isFor ? 'border-green-900/50' : 'border-red-900/50'
  const headerText = isFor ? 'text-green-400' : 'text-red-400'

  const emptyText = isFor
    ? 'No supporting arguments yet.'
    : 'No opposing arguments yet.'

  const visible = args.slice(0, visibleCount)

  return (
    <div className={`flex flex-col flex-1 min-h-0 overflow-hidden border-t ${headerBorder}`}>
      {/* Panel header */}
      <div className={`px-4 py-2.5 ${headerBg} border-b ${headerBorder} flex items-center gap-2 shrink-0`}>
        <span className={`text-xs font-semibold uppercase tracking-widest ${headerText}`}>
          {isFor ? 'For' : 'Against'}
        </span>
        <span className="text-xs text-gray-600 font-mono">{args.length}</span>
        <span className="flex-1" />
        <button
          onClick={() => onAddArgument(parentRelation)}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${headerBorder} ${headerText} opacity-70 hover:opacity-100 transition-opacity`}
        >
          <PencilIcon />
          Add argument
        </button>
      </div>

      {/* Argument list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-4 py-6 text-xs text-gray-600 text-center">Loading…</div>
        ) : args.length === 0 ? (
          <div className="px-4 py-6 text-xs text-gray-600 text-center">{emptyText}</div>
        ) : (
          <>
            {visible.map((arg, i) => (
              <ArgumentItem
                key={arg.id}
                argument={arg}
                treeId={treeId}
                deviceId={deviceId}
                userVote={votesMap[arg.id] ?? null}
                sources={sourcesMap[arg.id]}
                isExpanded={expandedId === arg.id}
                animIndex={i % PAGE_SIZE}
                skipAnimation={backTarget?.backArgId === arg.id}
                onToggle={handleToggle}
                onVote={handleVote}
                onSourceAdded={handleSourceAdded}
                onSourceDeleted={handleSourceDeleted}
                onDiveDeeper={handleDiveDeeper}
                onDelete={handleDelete}
              />
            ))}
            {/* Sentinel: observed to trigger next page */}
            {visibleCount < args.length && (
              <div ref={setSentinel} className="h-8" />
            )}
          </>
        )}
      </div>
    </div>
  )
})

export default ArgumentList
