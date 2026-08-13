export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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

export function redirectToMainScreen() {
  window.location.hash = '#/screens'
}

export function redirectToLoginScreen() {
  window.location.hash = '#/login'
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  window.location.hash = '#/login'
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = readAuthSession()
  const headers = new Headers(init.headers ?? {})

  if (session?.accessToken) {
    headers.set('Authorization', `${session.tokenType || 'Bearer'} ${session.accessToken}`)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
