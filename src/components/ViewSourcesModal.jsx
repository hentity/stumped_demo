export default function ViewSourcesModal({ isOpen, sources, isAuthor, onAddSource, onClose }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Sources</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-sm">✕</button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-72 overflow-y-auto">
          {sources.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-4">No sources yet.</p>
          ) : (
            sources.map(source => (
              <div key={source.id} className="bg-gray-800/60 rounded-lg p-3 space-y-1.5">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {source.url}
                </a>
                {source.quote && (
                  <p className="text-xs text-gray-400 italic border-l-2 border-gray-600 pl-2">
                    "{source.quote}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
          >
            Close
          </button>
          {isAuthor && (
            <button
              onClick={onAddSource}
              className="flex-1 bg-white text-gray-950 font-semibold py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              + Add source
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
