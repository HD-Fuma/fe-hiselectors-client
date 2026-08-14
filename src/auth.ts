export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'

type LocalNetworkRequestInit = RequestInit & {
  targetAddressSpace?: 'local'
}

function isLoopbackRequest(input: RequestInfo | URL): boolean {
  const requestUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url

  try {
    const hostname = new URL(requestUrl, window.location.href).hostname
    return ['127.0.0.1', '[::1]', 'localhost'].includes(hostname)
  } catch {
    return false
  }
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const requestInit: LocalNetworkRequestInit = { ...init }

  if (isLoopbackRequest(input)) {
    requestInit.targetAddressSpace = 'local'
  }

  return fetch(input, requestInit)
}

export type AuthSession = {
  accessToken: string
  tokenType: string
  role: string
  loginId: string
  userName?: string
  issuedAt?: number
}

const AUTH_STORAGE_KEY = 'selectors-auth'

function isJwtExpired(token: string): boolean {
  const payload = token.split('.')[1]
  if (!payload) {
    return false
  }

  try {
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now()
  } catch {
    return false
  }
}

export function persistAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function readAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession> & {
      name?: string
      username?: string
      memberName?: string
    }
    if (!parsed.accessToken || typeof parsed.accessToken !== 'string') {
      return null
    }

    if (isJwtExpired(parsed.accessToken)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    const userName =
      (typeof parsed.userName === 'string' && parsed.userName.trim()) ||
      (typeof parsed.name === 'string' && parsed.name.trim()) ||
      (typeof parsed.username === 'string' && parsed.username.trim()) ||
      (typeof parsed.memberName === 'string' && parsed.memberName.trim()) ||
      (typeof parsed.loginId === 'string' && parsed.loginId.trim()) ||
      ''

    return {
      accessToken: parsed.accessToken,
      tokenType: parsed.tokenType || 'Bearer',
      role: parsed.role || 'USER',
      loginId: parsed.loginId || '',
      userName,
      issuedAt: parsed.issuedAt,
    }
  } catch {
    return null
  }
}

export function hasValidUserSession(session: AuthSession | null): boolean {
  return Boolean(session && session.accessToken && session.role)
}

export function isLocalApplyTestMode(): boolean {
  return import.meta.env.DEV
    && ['127.0.0.1', 'localhost'].includes(window.location.hostname)
    && new URLSearchParams(window.location.search).get('applyTest') === '1'
}

export function redirectToMainScreen() {
  window.location.hash = '#/campaigns'
}

export function redirectToLoginScreen() {
  window.location.hash = '#/login'
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }))
  if (window.location.hash !== '#/login') {
    window.location.hash = '#/login'
  }
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = readAuthSession()
  const headers = new Headers(init.headers ?? {})

  if (session?.accessToken) {
    headers.set('Authorization', `${session.tokenType || 'Bearer'} ${session.accessToken}`)
  }

  return apiFetch(input, {
    ...init,
    headers,
  })
}
