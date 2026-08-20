import { useEffect, useState, type ReactNode } from 'react'

import AppShell from './components/layout/AppShell'
import {
  API_BASE_URL,
  authFetch,
  fetchSelectorAccessLevel,
  hasValidUserSession,
  isLocalApplyTestMode,
  persistAuthSession,
  readAuthSession,
} from './auth'
import { getRouteRedirect, routeMatchesHash, selectRouteByHash } from './routes'
import { ShopDemoProvider } from './screens/shop/ShopDemoContext'
import { verifyOAuth } from './oauth'
import { KAKAO_OAUTH_PENDING_KEY, MEMBER_INFO_PATH } from './screens/mypage/kakaoApi'
import './styles/global.css'
import './styles/shop.css'

type AppProps = {
  shopProbe?: ReactNode
}

function hasPendingOAuthCallback(): boolean {
  const params = new URLSearchParams(window.location.search)
  return Boolean(params.get('code') && params.get('state'))
}

function pendingOAuthHash() {
  if (!hasPendingOAuthCallback()) {
    return null
  }
  return sessionStorage.getItem(KAKAO_OAUTH_PENDING_KEY) ? MEMBER_INFO_PATH : '#/apply/form'
}

function selectCurrentRoute() {
  const productPathMatch = window.location.pathname.match(/\/product\/([^/]+)\/?$/)
  if (!window.location.hash
    && productPathMatch
    && new URLSearchParams(window.location.search).has('ptrsRefCd')) {
    return selectRouteByHash(`#/product/${productPathMatch[1]}`)
  }

  let requestedHash = window.location.hash
  const oauthHash = pendingOAuthHash()
  if (oauthHash) {
    requestedHash = oauthHash
    if (window.location.hash !== requestedHash) {
      window.location.hash = requestedHash
    }
  }

  const route = selectRouteByHash(requestedHash)
  const session = readAuthSession()
  const routeRedirect = getRouteRedirect(route, session)
  if (routeRedirect && routeRedirect !== requestedHash) {
    if (!hasValidUserSession(session)) {
      sessionStorage.setItem('postLoginRedirect', requestedHash)
    }
    window.history.replaceState(window.history.state, '', routeRedirect)
    window.setTimeout(() => window.dispatchEvent(new HashChangeEvent('hashchange')), 0)
    return selectRouteByHash(routeRedirect)
  }

  if (!routeMatchesHash(route, window.location.hash)) {
    const nextUrl = hasPendingOAuthCallback()
      ? `${window.location.pathname}${window.location.search}${route.path}`
      : route.path
    window.history.replaceState(window.history.state, '', nextUrl)
  }

  return route
}

function RoutedApp({ shopProbe }: AppProps) {
  const [route, setRoute] = useState(selectCurrentRoute)
  const [showAuthGateModal, setShowAuthGateModal] = useState(false)
  const [showNoCohortModal, setShowNoCohortModal] = useState(false)
  const [hasActiveCohort, setHasActiveCohort] = useState(false)
  const [isCohortStatusLoaded, setIsCohortStatusLoaded] = useState(false)
  const localApplyTestMode = isLocalApplyTestMode()

  useEffect(() => {
    let disposed = false
    let inFlight: Promise<void> | null = null

    const refreshSelectorAccess = () => {
      const session = readAuthSession()
      if (inFlight || !hasValidUserSession(session) || session?.role !== 'USER') return

      const accessToken = session.accessToken
      inFlight = fetchSelectorAccessLevel(accessToken, session.tokenType)
        .then((selectorAccessLevel) => {
          if (disposed) return
          const latestSession = readAuthSession()
          if (!latestSession || latestSession.accessToken !== accessToken || latestSession.role !== 'USER') return

          const accessChanged = latestSession.selectorAccessLevel !== selectorAccessLevel
          const nextSession = { ...latestSession, selectorAccessLevel }
          persistAuthSession(nextSession)
          if (accessChanged) {
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: nextSession }))
          }
        })
        .catch(() => undefined)
        .finally(() => {
          inFlight = null
        })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshSelectorAccess()
    }

    refreshSelectorAccess()
    window.addEventListener('focus', refreshSelectorAccess)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      disposed = true
      window.removeEventListener('focus', refreshSelectorAccess)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (route.id !== 'apply-intro' && route.id !== 'apply-form') {
      setHasActiveCohort(false)
      setIsCohortStatusLoaded(false)
      return
    }

    let cancelled = false

    authFetch(`${API_BASE_URL}/api/generations/active`)
      .then((response) => (response.ok ? response.json().catch(() => null) : null))
      .then((envelope) => {
        const data = envelope?.data ?? null
        if (!cancelled) {
          setHasActiveCohort(Boolean(data))
          setIsCohortStatusLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasActiveCohort(false)
          setIsCohortStatusLoaded(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [route.id])

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')

      if (!code || !state) {
        return
      }

      const clearOAuthQueryParams = () => {
        window.history.replaceState(window.history.state, '', window.location.pathname + window.location.hash)
      }

      if (sessionStorage.getItem(KAKAO_OAUTH_PENDING_KEY)) {
        return
      }

      const provider = sessionStorage.getItem('oauthProvider') as 'instagram' | 'youtube' | null
      if (!provider) {
        clearOAuthQueryParams()
        return
      }

      try {
        const verified = await verifyOAuth(provider, code, state)
        if (verified.verified) {
          const accountId = provider === 'instagram'
            ? verified.username?.trim()
            : verified.channelId?.trim()
          if (!accountId) {
            throw new Error(provider === 'instagram'
              ? 'Instagram 사용자명을 인증 결과에서 찾을 수 없습니다.'
              : 'YouTube 채널 ID를 인증 결과에서 찾을 수 없습니다.')
          }
          const nextVerifiedState = {
            provider,
            accountId,
            verificationToken: verified.verificationToken,
            followerCount: verified.followerCount ?? null,
            contentCount: verified.contentCount ?? null,
            label: provider === 'instagram' ? accountId : (verified.channelTitle?.trim() || 'YouTube'),
          }

          sessionStorage.setItem('oauthVerified', JSON.stringify(nextVerifiedState))
          sessionStorage.setItem('selectedSnsProvider', provider)
          window.dispatchEvent(new CustomEvent('oauth-verified'))
        } else {
          sessionStorage.setItem('oauthVerificationError', 'SNS 계정 인증에 실패했습니다. 다시 시도해 주세요.')
          window.dispatchEvent(new CustomEvent('oauth-verification-failed'))
        }
      } catch (error) {
        console.error('OAuth verification failed:', error)
        const message = error instanceof Error ? error.message : 'SNS 계정 연동 중 오류가 발생했습니다.'
        sessionStorage.setItem('oauthVerificationError', message)
        window.dispatchEvent(new CustomEvent('oauth-verification-failed'))
      } finally {
        sessionStorage.removeItem('oauthProvider')
        clearOAuthQueryParams()
        setRoute(selectRouteByHash('#/apply/form'))
        if (window.location.hash !== '#/apply/form') {
          window.location.hash = '#/apply/form'
        }
      }
    }

    void handleOAuthCallback()
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(selectCurrentRoute())
    }

    const handleApplyGateClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a[href="#/apply/form"]')
      if (!anchor) {
        return
      }

      if (!localApplyTestMode && isCohortStatusLoaded && !hasActiveCohort) {
        event.preventDefault()
        setShowNoCohortModal(true)
        return
      }

      if (!hasValidUserSession(readAuthSession())) {
        event.preventDefault()
        sessionStorage.setItem('postLoginRedirect', '#/apply/form')
        setShowAuthGateModal(true)
      }
    }

    const handleAuthRequired = () => {
      setShowAuthGateModal(true)
    }

    const handleAuthChanged = () => {
      setShowAuthGateModal(false)
      setShowNoCohortModal(false)
      setRoute(selectCurrentRoute())
    }

    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handleHashChange)
    document.addEventListener('click', handleApplyGateClick, true)
    window.addEventListener('auth:required', handleAuthRequired)
    window.addEventListener('auth:changed', handleAuthChanged)
    window.addEventListener('storage', handleAuthChanged)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handleHashChange)
      document.removeEventListener('click', handleApplyGateClick, true)
      window.removeEventListener('auth:required', handleAuthRequired)
      window.removeEventListener('auth:changed', handleAuthChanged)
      window.removeEventListener('storage', handleAuthChanged)
    }
  }, [hasActiveCohort, isCohortStatusLoaded, localApplyTestMode])

  const currentRouteId = route.id

  useEffect(() => {
    if (
      currentRouteId !== 'apply-form'
      || hasValidUserSession(readAuthSession())
    ) {
      return
    }

    sessionStorage.setItem('postLoginRedirect', '#/apply/form')
    setShowAuthGateModal(true)
  }, [currentRouteId])

  useEffect(() => {
    if (!isCohortStatusLoaded) {
      return
    }
    const shouldShowCohortModal = hasValidUserSession(readAuthSession())
      && !localApplyTestMode
      && !hasActiveCohort
      && currentRouteId === 'apply-form'
    setShowNoCohortModal(shouldShowCohortModal)
  }, [currentRouteId, hasActiveCohort, isCohortStatusLoaded, localApplyTestMode])

  useEffect(() => {
    document.title = `${route.title} | Selectors Client`
    document.querySelector<HTMLElement>('.client-panel h1')?.focus({ preventScroll: true })
  }, [route])

  const { Screen } = route

  const handleGoToLogin = () => {
    setShowAuthGateModal(false)
    window.location.hash = '#/login'
  }

  return (
    <>
      <AppShell
        screenId={route.id}
      >
        <p aria-atomic="true" aria-live="polite" className="sr-only route-announcement">
          {route.title} 화면
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
                sessionStorage.removeItem('postLoginRedirect')
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
