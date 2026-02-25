import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDeviceId } from '../hooks/useDeviceId'
import { useUsername } from '../hooks/useUsername'
import { chunkText, generateTreeText, parseTreeText, writeTree } from '../lib/treeGenerator'

const MODELS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet (fast, recommended)' },
  { value: 'claude-opus-4-6',   label: 'Claude Opus (thorough, slower)' },
]

export default function GeneratePage() {
  const navigate = useNavigate()
  const deviceId = useDeviceId()
  const [username, setUsernameStore] = useUsername()

  const [name, setName] = useState(username || '')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState(MODELS[0].value)
  const [rootClaim, setRootClaim] = useState('')
  const [text, setText] = useState('')
  const [uploadedFile, setUploadedFile] = useState(null) // File object, mutually exclusive with text

  // status: idle | processing | writing | done | error
  const [status, setStatus] = useState('idle')
  const [progress, setProgress] = useState(null) // { chunk, total }
  const [error, setError] = useState('')

  const chunks = chunkText(text)
  const chunkCount = chunks.length

  const hasInput = uploadedFile != null || text.trim().length > 0

  const handleGenerate = async () => {
    if (!hasInput) return
    if (!name.trim()) { setError('Please enter a username.'); return }
    if (!apiKey.trim()) { setError('Please enter your Anthropic API key.'); return }

    setError('')
    setStatus('processing')
    setProgress({ chunk: 0, total: 1 })

    try {
      setUsernameStore(name.trim())

      const resolvedText = uploadedFile
        ? await uploadedFile.text()
        : text.trim()

      const treeText = await generateTreeText({
        text: resolvedText,
        apiKey: apiKey.trim(),
        model,
        rootClaim: rootClaim.trim() || null,
        onProgress: ({ chunk, total }) => setProgress({ chunk, total }),
      })

      setStatus('writing')
      const parsed = parseTreeText(treeText)
      const { treeId, rootArgumentId } = await writeTree(parsed, deviceId, name.trim())

      setStatus('done')
      setTimeout(() => navigate(`/${treeId}/${rootArgumentId}`), 600)
    } catch (err) {
      console.error(err)
      setError(
        err.message === 'NO_ARGUMENTS'
          ? 'The text doesn\'t appear to contain a clear argument or debate. Try pasting a debate transcript, opinion piece, or argumentative text.'
          : err.message
      )
      setStatus('error')
    }
  }

  const isRunning = status === 'processing' || status === 'writing' || status === 'done'

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-6 block"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Generate from text</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Paste a debate transcript, essay, or any argumentative text. Claude will build an argument tree from it.
        </p>

        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Your username
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alice"
              maxLength={30}
              disabled={isRunning}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
            />
          </div>

          {/* API key */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Anthropic API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              disabled={isRunning}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500 font-mono disabled:opacity-50"
            />
            <p className="text-xs text-gray-600 mt-1">Not stored — sent directly to Anthropic and discarded.</p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Model
            </label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              disabled={isRunning}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
            >
              {MODELS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Root claim override */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Root claim <span className="text-gray-600 normal-case">(optional — leave blank to infer)</span>
            </label>
            <input
              type="text"
              value={rootClaim}
              onChange={e => setRootClaim(e.target.value)}
              placeholder="e.g. Nuclear energy should be part of the climate solution"
              disabled={isRunning}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
            />
          </div>

          {/* Text input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider">
                Text
              </label>
              <label className={`text-xs text-gray-500 hover:text-gray-300 transition-colors cursor-pointer ${isRunning ? 'opacity-50 pointer-events-none' : ''}`}>
                Upload .txt
                <input
                  type="file"
                  accept=".txt,text/plain"
                  disabled={isRunning}
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploadedFile(file)
                    setText('')
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {uploadedFile ? (
              <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5">
                <span className="text-sm text-gray-300 flex-1 truncate">{uploadedFile.name}</span>
                <span className="text-xs text-gray-600">{(uploadedFile.size / 1024).toFixed(0)} KB</span>
                {!isRunning && (
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-600 hover:text-gray-400 transition-colors ml-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste your debate transcript, article, or essay here…"
                rows={10}
                disabled={isRunning}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500 resize-y disabled:opacity-50"
              />
            )}
            {!uploadedFile && chunkCount > 1 && (
              <p className="text-xs text-gray-600 mt-1">
                {chunkCount} chunks · text will be processed iteratively
              </p>
            )}
          </div>

          {/* Error */}
          {status === 'error' && error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Progress */}
          {(status === 'processing' || status === 'writing' || status === 'done') && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm">
              {status === 'processing' && progress && (
                <p className="text-gray-300">
                  Processing chunk {progress.chunk} of {progress.total}…
                </p>
              )}
              {status === 'writing' && (
                <p className="text-gray-300">Writing tree to database…</p>
              )}
              {status === 'done' && (
                <p className="text-green-400">Done — redirecting…</p>
              )}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isRunning || !hasInput}
            className="w-full bg-white text-gray-950 font-semibold py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            {isRunning ? '…' : 'Generate tree'}
          </button>
        </div>
      </div>
    </div>
  )
}
