import { API_BASE_URL, authFetch } from './auth'

export type OAuthProvider = 'instagram' | 'facebook' | 'youtube'

export type OAuthVerificationResult = {
  verified: boolean
  username?: string
  accountId?: string
  followerCount?: number
  channelId?: string
  channelTitle?: string
}

function extractErrorMessage(payload: string): string {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>
    return typeof parsed.message === 'string' && parsed.message.trim() ? parsed.message.trim() : payload
  } catch {
    return payload
  }
}

function unwrapPayload(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) {
    return value
  }

  const envelope = value as Record<string, unknown>
  if ('data' in envelope && envelope.data != null) {
    return unwrapPayload(envelope.data)
  }
  if ('result' in envelope && envelope.result != null) {
    return unwrapPayload(envelope.result)
  }

  return value
}

function extractAuthorizationUrl(value: unknown): string | null {
  const payload = unwrapPayload(value)
  if (typeof payload === 'string') {
    return payload.trim() || null
  }
  if (typeof payload !== 'object' || payload === null) {
    return null
  }

  const record = payload as Record<string, unknown>
  for (const key of ['authorizationUrl', 'authorizeUrl', 'redirectUrl', 'url']) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

async function getAuthorizationUrl(provider: OAuthProvider): Promise<string> {
  const response = await authFetch(`${API_BASE_URL}/api/${provider}/oauth/authorize`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const rawMessage = await response.text()
    if (response.status === 401) {
      throw new Error('인증이 필요합니다.')
    }
    throw new Error(extractErrorMessage(rawMessage) || 'OAuth authorization failed.')
  }

  const authorizationUrl = extractAuthorizationUrl(await response.json())

  if (!authorizationUrl) {
    throw new Error('OAuth 인증 주소를 응답에서 찾을 수 없습니다.')
  }

  return authorizationUrl
}

export async function startOAuthAuthorization(provider: OAuthProvider): Promise<string> {
  if (provider === 'facebook') {
    return getAuthorizationUrl(provider)
  }

  return getAuthorizationUrl(provider)
}

export async function verifyOAuth(provider: OAuthProvider, code: string, state: string): Promise<OAuthVerificationResult> {
  const response = await authFetch(`${API_BASE_URL}/api/${provider}/oauth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  })

  if (!response.ok) {
    const rawMessage = await response.text()
    throw new Error(extractErrorMessage(rawMessage) || 'OAuth verification failed.')
  }

  const result = unwrapPayload(await response.json())
  if (typeof result !== 'object' || result === null) {
    throw new Error('OAuth 인증 결과 형식이 올바르지 않습니다.')
  }

  return result as OAuthVerificationResult
}
