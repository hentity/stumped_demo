import { useState } from 'react'

const MAX_CHARS = 300

export default function AddArgumentModal({ isOpen, parentRelation, onSubmit, onClose }) {
  const [text, setText] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setText('')
  }

  const isFor = parentRelation === 'for'
  const accentClass = isFor ? 'text-green-400' : 'text-red-400'
  const label = isFor ? 'Add FOR argument' : 'Add AGAINST argument'
  const placeholder = isFor
    ? 'State a reason this argument is correct…'
    : 'State a reason this argument is incorrect…'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-5">
        <h2 className={`font-semibold mb-4 ${accentClass}`}>{label}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder={placeholder}
              rows={4}
              autoFocus
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 resize-none"
            />
            <div className={`text-right text-xs mt-1 ${text.length >= 280 ? 'text-red-400' : 'text-gray-600'}`}>
              {text.length}/{MAX_CHARS}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onClose(); setText('') }}
              className="flex-1 border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex-1 bg-white text-gray-950 font-semibold py-2 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
