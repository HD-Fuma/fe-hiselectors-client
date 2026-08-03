import { useEffect, useState } from 'react'

import { selectScreenByHash } from './screenRegistry'

export default function App() {
  const [screen, setScreen] = useState(() =>
    selectScreenByHash(window.location.hash),
  )

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(selectScreenByHash(window.location.hash))
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <main data-screen-id={screen.id}>
      <h1>{screen.title}</h1>
    </main>
  )
}
