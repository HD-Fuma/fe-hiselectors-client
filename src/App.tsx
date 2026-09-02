import { useEffect, useRef, useState, type ReactNode } from 'react'

import AppShell from './components/layout/AppShell'
import {
  API_BASE_URL,
  authFetch,
  clearAuthSession,
  fetchSelectorAccessLevel,
  hasValidUserSession,
  isLocalApplyTestMode,
  isSelectorAccessPending,
  persistAuthSession,
  readAuthSession,
  SelectorAccessRequestError,
} from './auth'
import { navigate } from './navigation'
import { getRouteRedirect, routeMatchesPath, selectRouteByPath } from './routes'
import { ShopDemoProvider } from './screens/shop/ShopDemoContext'
import { verifyOAuth, YOUTUBE_CHANNELS_STORAGE_KEY } from './oauth'
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

function pendingOAuthPath() {
  if (!hasPendingOAuthCallback()) {
    return null
  }
  return sessionStorage.getItem(KAKAO_OAUTH_PENDING_KEY) ? MEMBER_INFO_PATH : '/apply/form'
}

function selectCurrentRoute() {
  const productPathMatch = window.location.pathname.match(/\/product\/([^/]+)\/?$/)
  if (productPathMatch
    && new URLSearchParams(window.location.search).has('ptrsRefCd')) {
    return selectRouteByPath(`/product/${productPathMatch[1]}`)
  }

  const session = readAuthSession()
  let requestedPath = window.location.pathname
  const oauthPath = pendingOAuthPath()
  if (oauthPath === MEMBER_INFO_PATH) {
    requestedPath = oauthPath
    if (window.location.pathname !== requestedPath) {
      navigate(`${requestedPath}${window.location.search}`, { replace: true })
    }
  } else if (oauthPath) {
    const isApplicant = !hasValidUserSession(session)
      || (session?.role === 'USER'
        && (session.selectorAccessLevel === undefined || session.selectorAccessLevel === 'NONE'))
    if (isApplicant) {
      requestedPath = '/apply/form'
      if (window.location.pathname !== requestedPath) {
        navigate(`${requestedPath}${window.location.search}`, { replace: true })
      }
    } else if (requestedPath === '/') {
      requestedPath = '/home'
      navigate(`${requestedPath}${window.location.search}`, { replace: true })
    }
  }

  const route = selectRouteByPath(requestedPath)
  const routeRedirect = getRouteRedirect(route, session)
  if (routeRedirect && routeRedirect !== requestedPath) {
    if (!hasValidUserSession(session)) {
      sessionStorage.setItem('postLoginRedirect', requestedPath)
    }
    navigate(routeRedirect, { replace: true })
    return selectRouteByPath(routeRedirect)
  }

  if (!routeMatchesPath(route, requestedPath)) {
    const nextUrl = hasPendingOAuthCallback()
      ? `${route.path}${window.location.search}`
      : route.path
    navigate(nextUrl, { replace: true })
  }

  return route
}

function RoutedApp({ shopProbe }: AppProps) {
  const [route, setRoute] = useState(selectCurrentRoute)
  const [authSession, setAuthSession] = useState(readAuthSession)
  const [showAuthGateModal, setShowAuthGateModal] = useState(false)
  const [showNoCohortModal, setShowNoCohortModal] = useState(false)
  const [hasActiveCohort, setHasActiveCohort] = useState(false)
  const [isCohortStatusLoaded, setIsCohortStatusLoaded] = useState(false)
  const localApplyTestMode = isLocalApplyTestMode()

  useEffect(() => {
    let disposed = false
    let inFlight: Promise<void> | null = null
    let hadSession = hasValidUserSession(readAuthSession())

    const refreshSelectorAccess = () => {
      const session = readAuthSession()
      if (!hasValidUserSession(session)) {
        if (hadSession) {
          hadSession = false
          window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }))
        }
        return
      }
      hadSession = true
      if (inFlight || session?.role !== 'USER') return

      const accessToken = session.accessToken
      const requestedAccessLevel = session.selectorAccessLevel
      inFlight = fetchSelectorAccessLevel(accessToken, session.tokenType)
        .then((selectorAccessLevel) => {
          if (disposed) return
          const latestSession = readAuthSession()
          if (!latestSession
            || latestSession.accessToken !== accessToken
            || latestSession.role !== 'USER'
            || latestSession.selectorAccessLevel !== requestedAccessLevel) return

          const accessChanged = latestSession.selectorAccessLevel !== selectorAccessLevel
          const nextSession = { ...latestSession, selectorAccessLevel }
          persistAuthSession(nextSession)
          if (accessChanged) {
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: nextSession }))
          }
        })
        .catch((error) => {
          if (disposed) return
          const latestSession = readAuthSession()
          if (!latestSession
            || latestSession.accessToken !== accessToken
            || latestSession.role !== 'USER'
            || latestSession.selectorAccessLevel !== requestedAccessLevel) return

          if (error instanceof SelectorAccessRequestError && [401, 403].includes(error.status)) {
            hadSession = false
            clearAuthSession()
            return
          }

          if (latestSession.selectorAccessLevel !== 'NONE') {
            const nextSession = { ...latestSession, selectorAccessLevel: 'NONE' as const }
            persistAuthSession(nextSession)
            window.dispatchEvent(new CustomEvent('auth:changed', { detail: nextSession }))
          }
        })
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

  const verifiedOAuthCodeRef = useRef<string | null>(null)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search)
      const code = params.get('code')
      const state = params.get('state')

      if (!code || !state) {
        return
      }

      // 같은 code로 verify를 두 번 교환하면 백엔드에서 이미 사용된 코드로 거부된다.
      if (verifiedOAuthCodeRef.current === code) {
        return
      }
      verifiedOAuthCodeRef.current = code

      const clearOAuthQueryParams = () => {
        window.history.replaceState(window.history.state, '', window.location.pathname)
      }

      if (sessionStorage.getItem(KAKAO_OAUTH_PENDING_KEY)) {
        return
      }

      const provider = sessionStorage.getItem('oauthProvider') as 'instagram' | 'youtube' | null
      if (!provider) {
        clearOAuthQueryParams()
        return
      }

      // authorization code는 일회용이므로 verify 호출 전에 동기적으로 URL에서 제거한다.
      // (StrictMode 이중 실행 / 새로고침 / 뒤로가기로 같은 code가 두 번 교환되는 것을 막음)
      clearOAuthQueryParams()

      try {
        const verified = await verifyOAuth(provider, code, state)
        if (verified.verified) {
          if (provider === 'youtube') {
            sessionStorage.removeItem('oauthVerified')
            sessionStorage.setItem(YOUTUBE_CHANNELS_STORAGE_KEY, JSON.stringify(verified.channels))
          } else {
            const accountId = verified.username?.trim()
            if (!accountId) {
              throw new Error('Instagram 사용자명을 인증 결과에서 찾을 수 없습니다.')
            }
            sessionStorage.removeItem(YOUTUBE_CHANNELS_STORAGE_KEY)
            sessionStorage.setItem('oauthVerified', JSON.stringify({
              provider,
              accountId,
              verificationToken: verified.verificationToken,
              followerCount: verified.followerCount ?? null,
              contentCount: verified.contentCount ?? null,
              label: accountId,
            }))
          }
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
        setRoute(selectCurrentRoute())
      }
    }

    void handleOAuthCallback()
  }, [])

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(selectCurrentRoute())
    }

    const handleApplyGateClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a[href="/apply/form"]')
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
        sessionStorage.setItem('postLoginRedirect', '/apply/form')
        setShowAuthGateModal(true)
      }
    }

    const handleAuthRequired = () => {
      setShowAuthGateModal(true)
    }

    const handleNavigationClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || !url.pathname.startsWith('/')) return

      event.preventDefault()
      navigate(`${url.pathname}${url.search}`)
    }

    const handleAuthChanged = () => {
      setAuthSession(readAuthSession())
      setShowAuthGateModal(false)
      setShowNoCohortModal(false)
      setRoute(selectCurrentRoute())
    }

    window.addEventListener('popstate', handleLocationChange)
    document.addEventListener('click', handleApplyGateClick, true)
    document.addEventListener('click', handleNavigationClick)
    window.addEventListener('auth:required', handleAuthRequired)
    window.addEventListener('auth:changed', handleAuthChanged)
    window.addEventListener('storage', handleAuthChanged)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      document.removeEventListener('click', handleApplyGateClick, true)
      document.removeEventListener('click', handleNavigationClick)
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

    sessionStorage.setItem('postLoginRedirect', '/apply/form')
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
    document.title = `${route.title} | 더현대Hi`
    document.querySelector<HTMLElement>('.client-panel h1')?.focus({ preventScroll: true })
  }, [route])

  const { Screen } = route
  const isAccessPending = route.access !== 'public'
    && isSelectorAccessPending(authSession)

  const handleGoToLogin = () => {
    setShowAuthGateModal(false)
    navigate('/login')
  }

  return (
    <>
      <AppShell
        screenId={route.id}
      >
        {isAccessPending ? (
          <p aria-live="polite" role="status">권한을 확인하고 있습니다.</p>
        ) : (
          <>
            <p aria-atomic="true" aria-live="polite" className="sr-only route-announcement">
              {route.title} 화면
            </p>
            <Screen />
          </>
        )}
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
