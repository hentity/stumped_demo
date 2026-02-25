import { useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { addArgument } from '../lib/firebase'
import { useDeviceId } from '../hooks/useDeviceId'
import { useUsername } from '../hooks/useUsername'
import ArgumentPanel from '../components/ArgumentPanel'
import ArgumentList from '../components/ArgumentList'
import UsernameModal from '../components/UsernameModal'
import AddArgumentModal from '../components/AddArgumentModal'
import Navbar from '../components/Navbar'

export default function ArgumentPage() {
  const { treeId, argumentId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const deviceId = useDeviceId()
  const [username, setUsername] = useUsername()

  const forListRef = useRef(null)
  const againstListRef = useRef(null)

  const [usernameModalOpen, setUsernameModalOpen] = useState(false)
  const [addArgumentModalOpen, setAddArgumentModalOpen] = useState(false)

  const [pendingAction, setPendingAction] = useState(null)
  const [activeParentRelation, setActiveParentRelation] = useState(null)

  // Back-transition: pre-expand the item we're returning to, and pass its
  // data to the matching ArgumentList so it can render synchronously (giving
  // the View Transitions API a DOM target for the shared-element morph).
  const backState = location.state
  const backRelation = backState?.backArg?.parentRelation
  const forBackTarget  = backRelation === 'for'     ? backState : null
  const againstBackTarget = backRelation === 'against' ? backState : null

  const [expandedArgId, setExpandedArgId] = useState(backState?.backArgId ?? null)
  const [expandedPanel, setExpandedPanel] = useState(backRelation ?? null)

  // Synchronously reset/restore expanded state when argumentId changes.
  // Calling setState during render causes React to discard the current pass and
  // immediately re-render with the new value — so the very first commit already
  // has the correct expanded state, and the view-transition snapshot sees the
  // fully-expanded item rather than a mid-CSS-transition collapsed one.
  const [lastArgId, setLastArgId] = useState(argumentId)
  if (lastArgId !== argumentId) {
    const bs = location.state
    const nextArgId = bs?.backArgId ?? null
    const nextPanel = bs?.backArg?.parentRelation ?? null

    setLastArgId(argumentId)

    if (expandedArgId !== nextArgId) setExpandedArgId(nextArgId)
    if (expandedPanel !== nextPanel) setExpandedPanel(nextPanel)
  }

  const handleForToggle = useCallback((argId) => {
    setExpandedArgId(argId)
    setExpandedPanel(argId ? 'for' : null)
  }, [])

  const handleAgainstToggle = useCallback((argId) => {
    setExpandedArgId(argId)
    setExpandedPanel(argId ? 'against' : null)
  }, [])

  const handleAddArgument = (parentRelation) => {
    if (!username) {
      setPendingAction({ type: 'addArgument', parentRelation })
      setUsernameModalOpen(true)
    } else {
      setActiveParentRelation(parentRelation)
      setAddArgumentModalOpen(true)
    }
  }

  const handleUsernameSubmit = (name) => {
    setUsername(name)
    setUsernameModalOpen(false)

    if (pendingAction?.type === 'addArgument') {
      setActiveParentRelation(pendingAction.parentRelation)
      setAddArgumentModalOpen(true)
    }
    setPendingAction(null)
  }

  const handleArgumentSubmit = async (text) => {
    setAddArgumentModalOpen(false)
    try {
      await addArgument(treeId, argumentId, activeParentRelation, text, deviceId, username)
      if (activeParentRelation === 'for') {
        forListRef.current?.refetch()
      } else {
        againstListRef.current?.refetch()
      }
    } catch (err) {
      console.error('Failed to add argument:', err)
    }
  }

  const handleDiveDeeper = (targetArgumentId, initialData) => {
    navigate(`/${treeId}/${targetArgumentId}`, { state: { initialData } })
  }

  const handleForSectionToggle = useCallback(() => {
    setExpandedArgId(null)

    setExpandedPanel(prev =>
      prev === 'for' ? null : 'for'
    )
  }, [])

  const handleAgainstSectionToggle = useCallback(() => {
    setExpandedArgId(null)

    setExpandedPanel(prev =>
      prev === 'against' ? null : 'against'
    )
  }, [])

  return (
    <div className="flex flex-col h-dvh bg-gray-950 overflow-hidden">
      <Navbar treeId={treeId} />
      <div key={argumentId} className="flex flex-col flex-1 min-h-0">
        <ArgumentPanel
          argumentId={argumentId}
          treeId={treeId}
          deviceId={deviceId}
        />

        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col min-h-0 overflow-hidden basis-0" style={{ flexGrow: expandedPanel === 'for' ? 2 : 1, transition: 'flex-grow 250ms ease-in-out' }}>
            <ArgumentList
              ref={forListRef}
              treeId={treeId}
              parentId={argumentId}
              parentRelation="for"
              deviceId={deviceId}
              expandedId={expandedArgId}
              onToggle={handleForToggle}
              onSectionToggle={handleForSectionToggle}
              onAddArgument={handleAddArgument}
              onDiveDeeper={handleDiveDeeper}
              backTarget={forBackTarget}
            />
          </div>

          <div className="flex flex-col min-h-0 overflow-hidden basis-0" style={{ flexGrow: expandedPanel === 'against' ? 2 : 1, transition: 'flex-grow 250ms ease-in-out' }}>
            <ArgumentList
              ref={againstListRef}
              treeId={treeId}
              parentId={argumentId}
              parentRelation="against"
              deviceId={deviceId}
              expandedId={expandedArgId}
              onToggle={handleAgainstToggle}
              onSectionToggle={handleAgainstSectionToggle}
              onAddArgument={handleAddArgument}
              onDiveDeeper={handleDiveDeeper}
              backTarget={againstBackTarget}
            />
          </div>
        </div>
      </div>

      <UsernameModal
        isOpen={usernameModalOpen}
        onSubmit={handleUsernameSubmit}
        onClose={() => { setUsernameModalOpen(false); setPendingAction(null) }}
      />
      <AddArgumentModal
        isOpen={addArgumentModalOpen}
        parentRelation={activeParentRelation}
        onSubmit={handleArgumentSubmit}
        onClose={() => setAddArgumentModalOpen(false)}
      />
    </div>
  )
}
