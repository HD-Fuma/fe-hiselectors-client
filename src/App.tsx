import { useEffect, useState, type ReactNode } from 'react'

import AppShell from './components/AppShell'
import { hasValidUserSession, readAuthSession } from './auth'
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
  const [showAuthGateModal, setShowAuthGateModal] = useState(false)

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(selectCurrentScreen())
    }

    window.addEventListener('hashchange', handleHashChange)

    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const currentScreenId = screen.id
  const isProtectedApplyRoute = currentScreenId === 'apply-intro' || currentScreenId === 'apply-form'
  const session = readAuthSession()
  const requiresLogin = isProtectedApplyRoute && !hasValidUserSession(session)

  useEffect(() => {
    if (requiresLogin) {
      setShowAuthGateModal(true)
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login'
      }
    } else {
      setShowAuthGateModal(false)
    }
  }, [requiresLogin])

  useEffect(() => {
    const nextScreen = requiresLogin ? selectScreenByHash('#/login') : screen
    document.title = `${nextScreen.title} | Selectors Client`
    document.querySelector<HTMLElement>('.client-panel h1')?.focus({ preventScroll: true })
  }, [requiresLogin, screen])

  const routeScreen = requiresLogin ? selectScreenByHash('#/login') : screen
  const Screen = getScreenComponent(routeScreen.id)

  const handleGoToLogin = () => {
    setShowAuthGateModal(false)
    window.location.hash = '#/login'
  }

  return (
    <>
      <AppShell screenId={routeScreen.id}>
        <p aria-atomic="true" aria-live="polite" className="sr-only route-announcement">
          {routeScreen.title} 화면
        </p>
        <Screen />
      </AppShell>
      {showAuthGateModal ? (
        <div aria-modal="true" className="auth-gate-backdrop" role="dialog" aria-labelledby="auth-gate-title">
          <div className="auth-gate-modal">
            <h3 id="auth-gate-title">로그인이 필요합니다</h3>
            <p>지원서 제출은 로그인한 더현대 HI 회원만 사용할 수 있어요. 로그인 페이지로 이동할까요?</p>
            <div className="auth-gate-actions">
              <button className="secondary-action" onClick={() => setShowAuthGateModal(false)} type="button">취소</button>
              <button className="primary-action" onClick={handleGoToLogin} type="button">로그인하기</button>
            </div>
          </div>
        </div>
      ) : null}
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
