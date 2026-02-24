import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTree } from '../lib/firebase'
import { useDeviceId } from '../hooks/useDeviceId'
import { useUsername } from '../hooks/useUsername'

const MAX_CHARS = 300

export default function Home() {
  const navigate = useNavigate()
  const deviceId = useDeviceId()
  const [username, setUsername] = useUsername()

  const [text, setText] = useState('')
  const [name, setName] = useState(username)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    if (!name.trim()) {
      setError('Please enter a username.')
      return
    }
    setLoading(true)
    setError('')
    try {
      setUsername(name.trim())
      const { treeId, argumentId } = await createTree(text.trim(), deviceId, name.trim())
      navigate(`/${treeId}/${argumentId}`)
    } catch (err) {
      console.error(err)
      setError('Failed to create argument. Check your Firebase config.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Stumped</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Start an argument. Share the link. Let the debate begin.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">
              Opening argument
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value.slice(0, MAX_CHARS))}
              placeholder="State your argument clearly and concisely…"
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-gray-500 resize-none"
            />
            <div className={`text-right text-xs mt-1 ${text.length >= 280 ? 'text-red-400' : 'text-gray-600'}`}>
              {text.length}/{MAX_CHARS}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !text.trim() || !name.trim()}
            className="w-full bg-white text-gray-950 font-semibold py-2.5 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
          >
            {loading ? 'Creating…' : 'Create argument'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <a
            href="/generate"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Generate tree from text →
          </a>
        </div>
      </div>
    </div>
  )
}
