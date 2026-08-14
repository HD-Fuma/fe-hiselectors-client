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

  const envelope = await response.json() as { data: { authorizationUrl?: string; url?: string } }
  const authorizationUrl = envelope.data?.authorizationUrl ?? envelope.data?.url

  if (!authorizationUrl) {
    throw new Error('Authorization URL is missing from the OAuth response.')
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

  const envelope = (await response.json()) as { data: OAuthVerificationResult }
  return envelope.data
}
