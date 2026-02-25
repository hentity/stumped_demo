import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { addSource, deleteSource } from '../lib/firebase'

export default function SourcesModal({
  isOpen,
  argumentId,
  sources: initialSources = [],
  isAuthor,
  deviceId,
  onClose,
  onSourceAdded,
  onSourceDeleted,
}) {
  const [localSources, setLocalSources] = useState(initialSources)
  const [url, setUrl] = useState('')
  const [quote, setQuote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { setLocalSources(initialSources) }, [initialSources])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl || submitting) return
    setSubmitting(true)
    setAddError('')
    try {
      const id = await addSource(argumentId, trimmedUrl, quote.trim(), deviceId)
      const newSource = { id, argumentId, url: trimmedUrl, quote: quote.trim(), addedByDeviceId: deviceId }
      setLocalSources(prev => [...prev, newSource])
      onSourceAdded(newSource)
      setUrl('')
      setQuote('')
    } catch (err) {
      console.error('Failed to add source:', err)
      setAddError('Failed to save source. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (sourceId) => {
    if (deletingId) return
    setDeletingId(sourceId)
    try {
      await deleteSource(sourceId)
      setLocalSources(prev => prev.filter(s => s.id !== sourceId))
      onSourceDeleted(sourceId)
    } catch (err) {
      console.error('Failed to delete source:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-white">
            Sources{localSources.length > 0 && <span className="ml-1.5 text-gray-500 font-normal">{localSources.length}</span>}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-sm leading-none">✕</button>
        </div>

        {/* Sources list */}
        {localSources.length > 0 && (
          <div className="px-5 py-3 space-y-3 max-h-56 overflow-y-auto border-b border-gray-800">
            {localSources.map(source => {
              const canDelete = isAuthor
              return (
                <div key={source.id} className="group flex gap-2 items-start">
                  <div className="flex-1 space-y-1 min-w-0">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline break-all block leading-relaxed"
                    >
                      {source.url}
                    </a>
                    {source.quote && (
                      <p className="text-xs text-gray-400 italic border-l-2 border-gray-700 pl-2 leading-relaxed">
                        "{source.quote}"
                      </p>
                    )}
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(source.id)}
                      disabled={deletingId === source.id}
                      className="shrink-0 text-gray-700 hover:text-red-400 transition-colors disabled:opacity-40 mt-0.5"
                      title="Delete source"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {localSources.length === 0 && !isAuthor && (
          <p className="text-xs text-gray-600 text-center py-6">No sources yet.</p>
        )}

        {/* Add form (authors only) */}
        {isAuthor ? (
          <div className="px-5 pt-4 pb-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Add a source</p>
            <form onSubmit={handleSubmit} className="space-y-2">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com/article"
                autoFocus
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500"
              />
              <textarea
                value={quote}
                onChange={e => setQuote(e.target.value)}
                placeholder="Relevant quote (optional)"
                rows={2}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500 resize-none"
              />
              {addError && <p className="text-xs text-red-400">{addError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!url.trim() || submitting}
                  className="flex-1 bg-white text-gray-950 font-semibold py-2 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  {submitting ? 'Adding…' : 'Add source'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="px-5 pb-5 pt-4">
            <button
              onClick={onClose}
              className="w-full border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
