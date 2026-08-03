import { useEffect, useState, type ReactNode } from 'react'

import AppShell from './components/AppShell'
import { selectScreenByHash } from './screenRegistry'
import { getScreenComponent } from './screens'
import { ShopDemoProvider } from './shop/ShopDemoContext'
import './styles/global.css'
import './styles/shop.css'

type AppProps = {
  shopProbe?: ReactNode
}

export function canonicalizeHash(hash: string): string {
  return hash === '#/shop/groups/edit' ? '#/shop/groups/new' : hash
}

function selectCurrentScreen() {
  const currentHash = window.location.hash
  const canonicalHash = canonicalizeHash(currentHash)

  if (canonicalHash !== currentHash) {
    window.history.replaceState(window.history.state, '', canonicalHash)
  }

  return selectScreenByHash(canonicalHash)
}

function RoutedApp({ shopProbe }: AppProps) {
  const [screen, setScreen] = useState(selectCurrentScreen)

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(selectCurrentScreen())
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
    <>
      <AppShell screenId={screen.id}>
        <p aria-atomic="true" aria-live="polite" className="sr-only route-announcement">
          {screen.title} 화면
        </p>
        <Screen />
      </AppShell>
      {shopProbe}
    </>
  )
}

export default function App({ shopProbe }: AppProps = {}) {
  return (
    <ShopDemoProvider>
      <RoutedApp shopProbe={shopProbe} />
    </ShopDemoProvider>
  )
}
