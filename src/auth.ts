export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.hiselectors.shop'

export type SelectorAccessLevel = 'CURRENT' | 'PREVIOUS' | 'NONE' | 'BLACKLIST'

export type AuthSession = {
  accessToken: string
  tokenType: string
  role: string
  loginId: string
  selectorAccessLevel: SelectorAccessLevel
  userName?: string
  alimtalk?: string
  issuedAt?: number
}

const AUTH_STORAGE_KEY = 'selectors-auth'
const selectorAccessLevels = new Set<SelectorAccessLevel>(['CURRENT', 'PREVIOUS', 'NONE', 'BLACKLIST'])

function isSelectorAccessLevel(value: unknown): value is SelectorAccessLevel {
  return typeof value === 'string' && selectorAccessLevels.has(value as SelectorAccessLevel)
}

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
      alimtalk?: string
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
      selectorAccessLevel: isSelectorAccessLevel(parsed.selectorAccessLevel)
        ? parsed.selectorAccessLevel
        : 'NONE',
      userName,
      alimtalk: parsed.alimtalk,
      issuedAt: parsed.issuedAt,
    }
  } catch {
    return null
  }
}

export function hasValidUserSession(session: AuthSession | null): boolean {
  return Boolean(session && session.accessToken && session.role)
}

export function getSelectorAccessLevel(session: AuthSession | null): SelectorAccessLevel {
  return hasValidUserSession(session) && session?.role === 'USER'
    ? session.selectorAccessLevel
    : 'NONE'
}

export function canManageSelectorOperations(session: AuthSession | null): boolean {
  return getSelectorAccessLevel(session) === 'CURRENT'
}

export function canViewSelectorShop(session: AuthSession | null): boolean {
  const accessLevel = getSelectorAccessLevel(session)
  return accessLevel === 'CURRENT' || accessLevel === 'PREVIOUS'
}

export function canViewSettlementHistory(session: AuthSession | null): boolean {
  return getSelectorAccessLevel(session) !== 'NONE'
}

export async function fetchSelectorAccessLevel(
  accessToken: string,
  tokenType: string,
): Promise<SelectorAccessLevel> {
  const response = await fetch(`${API_BASE_URL}/api/me/selector-access`, {
    headers: {
      Authorization: `${tokenType || 'Bearer'} ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error('셀렉터스 권한 정보를 확인하지 못했습니다.')
  }

  const body = await response.json() as unknown
  const envelope = typeof body === 'object' && body !== null ? body as { data?: unknown } : null
  const candidate = envelope && 'data' in envelope ? envelope.data : body
  const accessLevel = typeof candidate === 'object' && candidate !== null
    ? (candidate as { accessLevel?: unknown }).accessLevel
    : undefined

  if (!isSelectorAccessLevel(accessLevel)) {
    throw new Error('셀렉터스 권한 응답 형식이 올바르지 않습니다.')
  }

  return accessLevel
}

export function isLocalApplyTestMode(): boolean {
  return import.meta.env.DEV
    && ['127.0.0.1', 'localhost'].includes(window.location.hostname)
    && new URLSearchParams(window.location.search).get('applyTest') === '1'
}

export function redirectToMainScreen() {
  window.location.hash = '#/home'
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

  return fetch(input, {
    ...init,
    headers,
  })
}
