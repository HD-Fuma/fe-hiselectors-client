import { API_BASE_URL, authFetch } from '../../auth'

export const KAKAO_OAUTH_PENDING_KEY = 'kakaoOauthPending'
export const MEMBER_INFO_PATH = '/mypage/member'

export type KakaoRecipientStatus = 'READY' | 'REAUTH_REQUIRED' | 'INACTIVE'

export type KakaoConnectionState = {
  status: KakaoRecipientStatus | null
}

export class KakaoApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'KakaoApiError'
    this.status = status
    this.code = code
  }
}

type ApiEnvelope<T> = {
  data?: T
  message?: string | null
  code?: string
}

function parsePayload(raw: string): unknown {
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function unwrap(payload: unknown): unknown {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return unwrap((payload as ApiEnvelope<unknown>).data)
  }
  return payload
}

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (typeof payload === 'object' && payload !== null) {
    const message = (payload as ApiEnvelope<unknown>).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}

function extractCode(payload: unknown): string | undefined {
  if (typeof payload === 'object' && payload !== null && 'code' in payload) {
    const code = (payload as ApiEnvelope<unknown>).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

function isRecipientStatus(value: unknown): value is KakaoRecipientStatus {
  return value === 'READY' || value === 'REAUTH_REQUIRED' || value === 'INACTIVE'
}

function readRecipientStatus(value: unknown): KakaoRecipientStatus | null {
  if (isRecipientStatus(value)) {
    return value
  }
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const record = value as Record<string, unknown>
  const candidate = record.status ?? record.recipientStatus
  return isRecipientStatus(candidate) ? candidate : null
}

function toConnectionState(value: unknown): KakaoConnectionState {
  return { status: readRecipientStatus(value) }
}

async function request<T>(
  path: string,
  init: RequestInit | undefined,
  fallback: string,
  map: (payload: unknown) => T,
): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const payload = parsePayload(await response.text())

  if (!response.ok) {
    throw new KakaoApiError(
      response.status === 401 ? '로그인이 필요합니다.' : extractMessage(payload, fallback),
      response.status,
      extractCode(payload),
    )
  }

  return map(unwrap(payload))
}

export function unlinkedKakaoState(): KakaoConnectionState {
  return { status: null }
}

export async function getKakaoConnectionStatus(): Promise<KakaoConnectionState> {
  try {
    return await request(
      '/api/kakao/oauth/status',
      { method: 'GET' },
      '카카오 연결 상태를 확인하지 못했습니다.',
      toConnectionState,
    )
  } catch (error) {
    if (error instanceof KakaoApiError && error.status === 401) {
      throw error
    }
    if (error instanceof KakaoApiError && error.status === 404 && error.code === 'KAKAO_RECIPIENT_NOT_FOUND') {
      return unlinkedKakaoState()
    }
    throw error
  }
}

export async function getKakaoAuthorizationUrl(): Promise<string> {
  const authorizationUrl = await request(
    '/api/kakao/oauth/authorize',
    { method: 'GET' },
    '카카오 인증 주소를 찾지 못했습니다.',
    (payload) => {
      if (typeof payload === 'string' && payload.trim()) return payload.trim()
      if (typeof payload === 'object' && payload !== null) {
        const url = (payload as { authorizationUrl?: unknown }).authorizationUrl
        if (typeof url === 'string' && url.trim()) return url.trim()
      }
      throw new KakaoApiError('카카오 인증 주소를 응답에서 찾을 수 없습니다.', 500)
    },
  )
  return authorizationUrl
}

export async function connectKakaoAccount(code: string, state: string): Promise<KakaoConnectionState> {
  return request(
    '/api/kakao/oauth/connect',
    {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    },
    '카카오 계정 연결에 실패했습니다.',
    toConnectionState,
  )
}

export function getKakaoStatusLabel(status: KakaoRecipientStatus | null): string {
  if (status === 'READY') return '수신 가능'
  if (status === 'REAUTH_REQUIRED') return '수신 불가'
  return '미연결'
}

export function getKakaoStatusHelp(status: KakaoRecipientStatus | null): string {
  if (status === 'READY') return '카카오 메시지로 활동 안내를 받을 수 있어요.'
  if (status === 'REAUTH_REQUIRED') return '메시지 권한이 만료되었어요. 다시 연결해 주세요.'
  if (status === 'INACTIVE') return '카카오 메시지 연결이 비활성 상태예요. 다시 연결해 주세요.'
  return '카카오 계정을 연결하면 운영 메시지를 받을 수 있어요.'
}

export function getKakaoErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return '카카오 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }

  if (error instanceof KakaoApiError) {
    if (error.code === 'KAKAO_REQUIRED_SCOPE_MISSING') {
      return '카카오 메시지 권한에 동의해 주세요.'
    }
    if (error.code === 'KAKAO_FRIEND_NOT_FOUND') {
      return '셀렉터스 카카오톡 계정과 친구를 맺은 뒤 다시 연결해 주세요.'
    }
    if (error.code === 'KAKAO_CONNECTION_DUPLICATED') {
      return '이미 다른 계정에 연결된 카카오 계정입니다.'
    }
    if (error.code === 'KAKAO_STATE_INVALID') {
      return '카카오 인증 요청이 만료되었습니다. 다시 시도해 주세요.'
    }
    if (error.code === 'KAKAO_OAUTH_FAILED') {
      return '카카오 인증 처리 중 오류가 발생했습니다.'
    }
    return error.message
  }

  return error instanceof Error ? error.message : '카카오 계정 연결에 실패했습니다.'
}

export function isKakaoUnauthorized(error: unknown): boolean {
  return error instanceof KakaoApiError && error.status === 401
}
