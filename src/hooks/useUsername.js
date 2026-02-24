import { useState } from 'react'

export function useUsername() {
  const [username, setUsernameState] = useState(
    () => localStorage.getItem('username') || ''
  )

  const setUsername = (name) => {
    localStorage.setItem('username', name)
    setUsernameState(name)
  }

  return [username, setUsername]
}
