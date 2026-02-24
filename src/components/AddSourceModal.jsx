import { useState } from 'react'

export default function AddSourceModal({ isOpen, onSubmit, onClose }) {
  const [url, setUrl] = useState('')
  const [quote, setQuote] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return
    onSubmit({ url: trimmedUrl, quote: quote.trim() })
    setUrl('')
    setQuote('')
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-5">
        <h2 className="text-white font-semibold mb-4">Add a source</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">URL</label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              autoFocus
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">
              Relevant quote <span className="normal-case text-gray-600">(optional)</span>
            </label>
            <textarea
              value={quote}
              onChange={e => setQuote(e.target.value)}
              placeholder="Paste a key quote from the source…"
              rows={3}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onClose(); setUrl(''); setQuote('') }}
              className="flex-1 border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="flex-1 bg-white text-gray-950 font-semibold py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
            >
              Add source
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
