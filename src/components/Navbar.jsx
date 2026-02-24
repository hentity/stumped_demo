import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTree, getArgument } from '../lib/firebase'

function Logo() {
  return (
    <svg width="32" height="25" viewBox="0 0 32 25" fill="none">
      <line x1="16" y1="6" x2="5" y2="19" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="6" x2="27" y2="19" stroke="#4b5563" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="5.5" r="4.5" fill="#1f2937" stroke="#6b7280" strokeWidth="1.5" />
      <circle cx="5"  cy="19.5" r="4"   fill="#14532d" stroke="#22c55e" strokeWidth="1.5" />
      <circle cx="27" cy="19.5" r="4"   fill="#7f1d1d" stroke="#ef4444" strokeWidth="1.5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function Navbar({ treeId }) {
  const navigate = useNavigate()
  const [rootText, setRootText] = useState('')
  const [rootArgumentId, setRootArgumentId] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!treeId) return
    const load = async () => {
      const tree = await getTree(treeId)
      if (!tree) return
      const arg = await getArgument(tree.rootArgumentId)
      if (!arg) return
      setRootText(arg.text)
      setRootArgumentId(tree.rootArgumentId)
    }
    load()
  }, [treeId])

  const goToRoot = () => {
    if (rootArgumentId) navigate(`/${treeId}/${rootArgumentId}`)
  }

  const openSearch = () => {
    setSearchOpen(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <nav className="flex items-center h-12 px-4 bg-gray-950 border-b border-gray-700 shrink-0 gap-3">
      {/* Logo */}
      <button onClick={goToRoot} className="shrink-0">
        <Logo />
      </button>

      {/* Root claim — collapses when search opens */}
      <div className={`min-w-0 transition-all duration-200 ${searchOpen ? 'flex-none w-0 overflow-hidden opacity-0' : 'flex-1 opacity-100'}`}>
        <button
          onClick={goToRoot}
          className="w-full text-left text-sm text-gray-400 font-bold hover:text-gray-200 truncate block transition-colors"
        >
          {rootText || <span className="text-gray-700">…</span>}
        </button>
      </div>

      {/* Search — expands to cover root claim */}
      <div className={`flex items-center gap-2 transition-all duration-200 ${searchOpen ? 'flex-1' : 'shrink-0'}`}>
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search…"
          className={`text-sm text-gray-200 placeholder-gray-600 rounded-lg border outline-none transition-all duration-200 ${
            searchOpen
              ? 'flex-1 w-full bg-gray-800 border-gray-700 focus:border-gray-500 px-3 py-1.5 opacity-100'
              : 'w-0 h-0 opacity-0 pointer-events-none border-transparent bg-transparent p-0'
          }`}
        />
        {searchOpen ? (
          <button
            onClick={closeSearch}
            className="shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <XIcon />
          </button>
        ) : (
          <button
            onClick={openSearch}
            className="shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <SearchIcon />
          </button>
        )}
      </div>
    </nav>
  )
}
