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

  useEffect(() => {
    document.title = `${screen.title} | Selectors Client`
    document.querySelector<HTMLElement>('.client-panel h1')?.focus({ preventScroll: true })
  }, [screen])

  const Screen = getScreenComponent(screen.id)

  return (
    <AppShell screenId={screen.id}>
      <p aria-atomic="true" aria-live="polite" className="sr-only route-announcement">
        {screen.title} 화면
      </p>
      <Screen />
    </AppShell>
  )
}
