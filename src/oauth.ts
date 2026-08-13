import { authFetch, readAuthSession } from './auth'

export type OAuthProvider = 'instagram' | 'youtube' | 'facebook'

export type OAuthAuthorizeResponse = {
  authorizationUrl?: string
}

export type OAuthVerifyResponse = {
  verified?: boolean
  accountId?: string
  channelId?: string
  username?: string
  channelTitle?: string
  followerCount?: number | null
}

function ensureSession() {
  const session = readAuthSession()

  if (!session?.accessToken) {
    throw new Error('로그인이 필요합니다.')
  }

  return session
}

export async function startOAuthAuthorization(provider: Exclude<OAuthProvider, 'facebook'>): Promise<string> {
  ensureSession()

  const response = await authFetch(`http://localhost:8080/api/${provider}/oauth/authorize`, {
    method: 'GET',
  })

  if (!response.ok) {
    const rawMessage = await response.text()
    throw new Error(rawMessage || 'OAuth 인증을 시작할 수 없습니다.')
  }

  const payload = (await response.json()) as OAuthAuthorizeResponse

  if (!payload.authorizationUrl) {
    throw new Error('인증 URL을 받지 못했습니다.')
  }

  return payload.authorizationUrl
}

export async function verifyOAuth(provider: Exclude<OAuthProvider, 'facebook'>, code: string, state: string): Promise<OAuthVerifyResponse> {
  ensureSession()

  const response = await authFetch(`http://localhost:8080/api/${provider}/oauth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  })

  if (!response.ok) {
    const rawMessage = await response.text()
    throw new Error(rawMessage || 'OAuth 인증 검증에 실패했습니다.')
  }

  return (await response.json()) as OAuthVerifyResponse
}
