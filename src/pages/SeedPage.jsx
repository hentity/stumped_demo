import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { seedDemo, DEMO_TREE_ID, DEMO_ROOT_ID } from '../lib/seedDemo'

export default function SeedPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('idle') // idle | loading | done | error
  const [error, setError] = useState(null)

  const handleSeed = async () => {
    setStatus('loading')
    try {
      await seedDemo()
      setStatus('done')
      setTimeout(() => navigate(`/${DEMO_TREE_ID}/${DEMO_ROOT_ID}`), 800)
    } catch (err) {
      console.error(err)
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div className="h-dvh bg-gray-950 flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center space-y-2">
        <h1 className="text-white font-semibold">Seed demo tree</h1>
        <p className="text-xs text-gray-500 max-w-xs">
          Creates a 3-level argument tree at{' '}
          <span className="text-gray-400 font-mono">/{DEMO_TREE_ID}/{DEMO_ROOT_ID}</span>.
          Safe to run multiple times.
        </p>
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>
      )}

      <button
        onClick={handleSeed}
        disabled={status === 'loading' || status === 'done'}
        className="px-5 py-2.5 bg-white text-gray-950 font-semibold rounded-lg text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors"
      >
        {status === 'loading' ? 'Seeding…' : status === 'done' ? 'Done — redirecting…' : 'Seed demo'}
      </button>

      <button
        onClick={() => navigate(`/${DEMO_TREE_ID}/${DEMO_ROOT_ID}`)}
        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
      >
        Go to demo (skip seed)
      </button>
    </div>
  )
}
