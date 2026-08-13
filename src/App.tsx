import { useEffect, useState, type ReactNode } from 'react'

import AppShell from './components/AppShell'
import { hasValidUserSession, readAuthSession } from './auth'
import { selectScreenByHash } from './screenRegistry'
import { getScreenComponent } from './screens'
import { ShopDemoProvider } from './shop/ShopDemoContext'
import { verifyOAuth } from './oauth'
import './styles/global.css'
import './styles/shop.css'

type AppProps = {
  shopProbe?: ReactNode
}

export function canonicalizeHash(hash: string): string {
  return hash === '#/shop/groups/edit' ? '#/shop/groups/new' : hash
}

function hasPendingOAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search)
  return Boolean(params.get('code') && params.get('state'))
}

function selectCurrentScreen() {
  const currentHash = window.location.hash
  const canonicalHash = canonicalizeHash(currentHash)

  if (canonicalHash !== currentHash) {
    window.history.replaceState(window.history.state, '', canonicalHash)
  }

  if (hasPendingOAuthCallback()) {
    const nextHash = '#/apply/form'
    window.history.replaceState(window.history.state, '', window.location.pathname + nextHash)
    return selectScreenByHash(nextHash)
  }

  return selectScreenByHash(canonicalHash)
}

const hasActiveCohort = false

function RoutedApp({ shopProbe }: AppProps) {
  const [screen, setScreen] = useState(selectCurrentScreen)
  const [showAuthGateModal, setShowAuthGateModal] = useState(false)
  const [showNoCohortModal, setShowNoCohortModal] = useState(() => !hasActiveCohort && selectCurrentScreen().id === 'apply-form')
  const [authRequired, setAuthRequired] = useState(false)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')

      if (!code || !state) {
        return
      }

      const provider = sessionStorage.getItem('oauthProvider') as 'instagram' | 'youtube' | null
      if (!provider) {
        return
      }

      try {
        const verified = await verifyOAuth(provider, code, state)
        if (verified.verified) {
          const nextVerifiedState = {
            provider,
            accountId: provider === 'instagram' ? (verified.accountId ?? verified.username ?? '') : (verified.channelId ?? verified.channelTitle ?? ''),
            followerCount: verified.followerCount ?? null,
            label: provider === 'instagram' ? (verified.username ?? 'Instagram') : (verified.channelTitle ?? 'YouTube'),
          }

          sessionStorage.setItem('oauthVerified', JSON.stringify(nextVerifiedState))
          sessionStorage.setItem('selectedSnsProvider', provider)
          window.dispatchEvent(new CustomEvent('oauth-verified'))
        }
      } catch (error) {
        console.error('OAuth verification failed:', error)
      } finally {
        sessionStorage.removeItem('oauthProvider')
        setScreen(selectScreenByHash('#/apply/form'))
        if (window.location.hash !== '#/apply/form') {
          window.location.hash = '#/apply/form'
        }
      }
    }

    void handleOAuthCallback()
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(selectCurrentScreen())
    }

    const handleCohortGateClick = (event: MouseEvent) => {
      if (hasActiveCohort) {
        return
      }

      const anchor = (event.target as HTMLElement).closest('a[href="#/apply"], a[href="#/apply/form"]')
      if (!anchor) {
        return
      }

      event.preventDefault()
      setShowNoCohortModal(true)
    }

    const handleAuthRequired = () => {
      setAuthRequired(true)
      setShowAuthGateModal(true)
    }

    const handleAuthChanged = () => {
      setAuthRequired(false)
      setShowAuthGateModal(false)
      setShowNoCohortModal(false)
      setScreen(selectCurrentScreen())
    }

    window.addEventListener('hashchange', handleHashChange)
    document.addEventListener('click', handleCohortGateClick, true)
    window.addEventListener('auth:required', handleAuthRequired)
    window.addEventListener('auth:changed', handleAuthChanged)
    window.addEventListener('storage', handleAuthChanged)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      document.removeEventListener('click', handleCohortGateClick, true)
      window.removeEventListener('auth:required', handleAuthRequired)
      window.removeEventListener('auth:changed', handleAuthChanged)
      window.removeEventListener('storage', handleAuthChanged)
    }
  }, [])

  const currentScreenId = screen.id

  useEffect(() => {
    if (!hasActiveCohort && currentScreenId === 'apply-form') {
      setShowNoCohortModal(true)
    }
  }, [currentScreenId])

  const isProtectedApplyRoute = currentScreenId === 'apply-intro' || currentScreenId === 'apply-form'
  const session = readAuthSession()
  const requiresLogin = isProtectedApplyRoute && !hasValidUserSession(session)

  useEffect(() => {
    if (requiresLogin) {
      setAuthRequired(true)
      setShowAuthGateModal(true)
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login'
      }
      return
    }

    setAuthRequired(false)
    setShowAuthGateModal(false)
  }, [authRequired, requiresLogin])

  useEffect(() => {
    const nextScreen = requiresLogin ? selectScreenByHash('#/login') : screen
    document.title = `${nextScreen.title} | Selectors Client`
    document.querySelector<HTMLElement>('.client-panel h1')?.focus({ preventScroll: true })
  }, [requiresLogin, screen])

  const routeScreen = requiresLogin ? selectScreenByHash('#/login') : screen
  const Screen = getScreenComponent(routeScreen.id)

  const handleGoToLogin = () => {
    setAuthRequired(false)
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
      {showNoCohortModal ? (
        <div aria-modal="true" className="auth-gate-backdrop" role="dialog" aria-labelledby="cohort-closed-title">
          <div className="auth-gate-modal">
            <h3 id="cohort-closed-title">현재 모집 중인 기수가 없어 지원할 수 없습니다.</h3>
            <p>모집이 시작되면 다시 신청해 주세요.</p>
            <div className="auth-gate-actions">
              <button className="primary-action" onClick={() => setShowNoCohortModal(false)} type="button">확인</button>
            </div>
          </div>
        </div>
      ) : null}
      {showAuthGateModal ? (
        <div aria-modal="true" className="auth-gate-backdrop" role="dialog" aria-labelledby="auth-gate-title">
          <div className="auth-gate-modal">
            <h3 id="auth-gate-title">로그인이 필요합니다</h3>
            <p>지원서 제출은 로그인한 더현대 HI 회원만 사용할 수 있어요. 로그인 페이지로 이동할까요?</p>
            <div className="auth-gate-actions">
              <button className="secondary-action" onClick={() => {
                setAuthRequired(false)
                setShowAuthGateModal(false)
              }} type="button">취소</button>
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
