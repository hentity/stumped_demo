import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getArgument, getSources, getUserVote, castVote, deleteArgument } from '../lib/firebase'
import { recordFlipSource, consumeFlipRect, applyFlip } from '../lib/diveTransition'
import ArgumentItem from './ArgumentItem'

// Cache panel data so back-navigation can render immediately (no skeleton),
// giving the FLIP animation a stable layout to measure against.
const panelCache = new Map()

export default function ArgumentPanel({ argumentId, treeId, deviceId }) {
  const navigate = useNavigate()
  const location = useLocation()
  const panelRef = useRef(null)

  // Prefer navigation state (dive), then cache (back-nav), then nothing (direct load).
  const seed = location.state?.initialData ?? panelCache.get(argumentId) ?? null

  const [argument, setArgument] = useState(seed?.argument ?? null)
  const [sources, setSources] = useState(seed?.sources ?? [])
  const [userVote, setUserVote] = useState(seed?.userVote ?? null)
  const [score, setScore] = useState(seed?.argument?.score ?? 0)
  const [loading, setLoading] = useState(!seed)

  // Dive transition: if this panel is the FLIP destination, animate it from the item position.
  useLayoutEffect(() => {
    const sourceRect = consumeFlipRect(argumentId)
    if (sourceRect && panelRef.current) applyFlip(panelRef.current, sourceRect)
  }, [argumentId])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!seed) setLoading(true)
      const [arg, srcs, vote] = await Promise.all([
        getArgument(argumentId),
        getSources(argumentId),
        getUserVote(argumentId, deviceId),
      ])
      if (cancelled) return
      setArgument(arg)
      setScore(arg?.score ?? 0)
      setSources(srcs)
      setUserVote(vote)
      setLoading(false)
      // Update cache with fresh data
      if (arg) panelCache.set(argumentId, { argument: arg, sources: srcs, userVote: vote })
    }
    load()
    return () => { cancelled = true }
  }, [argumentId, treeId, deviceId])

  const goBack = () => {
    if (!argument?.parentId) return
    recordFlipSource(panelRef.current, argumentId)
    navigate(`/${treeId}/${argument.parentId}`, {
      state: {
        backArgId: argumentId,
        backArg: argument,
        backArgSources: sources,
        backArgVote: userVote,
      },
    })
  }

  const handleVote = async (argId, value) => {
    await castVote(argId, deviceId, value)
    const prevVote = userVote
    let delta = 0
    if (prevVote === null) delta = value
    else if (prevVote === value) delta = -value
    else delta = value * 2
    setScore(s => s + delta)
    setUserVote(prevVote === value ? null : value)
  }

  const handleSourceAdded = (source) => {
    setSources(prev => [...prev, source])
  }

  const handleSourceDeleted = (sourceId) => {
    setSources(prev => prev.filter(s => s.id !== sourceId))
  }

  const handleDelete = async () => {
    await deleteArgument(argumentId)
    setArgument(prev => ({ ...prev, deleted: true }))
  }

  if (loading) {
    return (
      <div className="shrink-0 bg-gray-900 px-4 pt-3 pb-4">
        <div className="animate-pulse space-y-3">
          <div className="h-7 bg-gray-800 rounded-lg" />
          <div className="space-y-1.5">
            <div className="h-4 w-full bg-gray-800 rounded-full" />
            <div className="h-4 w-2/3 bg-gray-800 rounded-full" />
          </div>
          <div className="h-2 w-24 bg-gray-800 rounded-full" />
          <div className="h-7 w-24 bg-gray-800 rounded-md" />
        </div>
      </div>
    )
  }

  if (!argument) {
    return <div className="shrink-0 bg-gray-900 px-4 pt-3 pb-4 text-gray-600 text-sm">Argument not found.</div>
  }

  return (
    <ArgumentItem
      ref={panelRef}
      argument={{ ...argument, score }}
      treeId={treeId}
      deviceId={deviceId}
      isPanel={true}
      userVote={userVote}
      sources={sources}
      onVote={handleVote}
      onSourceAdded={(_, src) => handleSourceAdded(src)}
      onSourceDeleted={(_, srcId) => handleSourceDeleted(srcId)}
      onDelete={handleDelete}
      onBack={argument.parentId ? goBack : null}
      skipAnimation={true}
    />
  )
}
