export const AUTH_STORAGE_KEY = 'selectors-auth'

export type AuthSession = {
  accessToken: string
  tokenType?: string
  role?: string
  loginId?: string
  issuedAt?: number
}

export function readAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!raw) {
      return null
    }

    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function persistAuthSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const session = readAuthSession()
  const headers = { ...(init.headers ?? {}) } as Record<string, string>

  if (session && !(headers.Authorization || headers.authorization)) {
    const tokenType = session.tokenType || 'Bearer'
    headers.Authorization = `${tokenType} ${session.accessToken}`
  }

  if (init.body != null && typeof init.body === 'string' && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json'
  }

  return fetch(input, {
    ...init,
    headers,
  })
}

export function redirectToMainScreen() {
  window.location.hash = '#/screens'
}
