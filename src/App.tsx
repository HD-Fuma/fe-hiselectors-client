import { useEffect, useState } from 'react'

import AppShell from './components/AppShell'
import { selectScreenByHash } from './screenRegistry'
import { getScreenComponent } from './screens'
import './styles/global.css'

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

  const Screen = getScreenComponent(screen.id)

  return (
    <AppShell screenId={screen.id}>
      <Screen />
    </AppShell>
  )
}
