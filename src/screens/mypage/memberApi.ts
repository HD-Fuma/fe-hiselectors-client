import { API_BASE_URL, authFetch, persistAuthSession, readAuthSession } from '../../auth'

export type MemberProfile = {
  hiId: string
  name: string
  email: string
  phone: string
  alimtalk: 'Y' | 'N'
}

export class MemberApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'MemberApiError'
    this.status = status
    this.code = code
  }
}

type ApiEnvelope<T> = {
  data?: T
  message?: string | null
  code?: string
}

const DUMMY_PHONE = '010-1234-5678'

function parsePayload(raw: string): unknown {
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

function unwrap<T>(payload: unknown): T {
  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T
  }
  return payload as T
}

function isAlimtalk(value: unknown): value is 'Y' | 'N' {
  return value === 'Y' || value === 'N'
}

function fallbackProfile(): MemberProfile {
  const session = readAuthSession()
  const hiId = session?.loginId?.trim() || 'hiuser'
  return {
    hiId,
    name: session?.userName?.trim() || hiId,
    email: `${hiId}@hpoint.co.kr`,
    phone: DUMMY_PHONE,
    alimtalk: session?.alimtalk === 'Y' ? 'Y' : 'N',
  }
}

function normalizeProfile(value: unknown): MemberProfile {
  const fallback = fallbackProfile()
  if (typeof value !== 'object' || value === null) {
    return fallback
  }

  const record = value as Record<string, unknown>
  const hiId = typeof record.hiId === 'string' && record.hiId.trim()
    ? record.hiId.trim()
    : fallback.hiId
  const name = typeof record.name === 'string' && record.name.trim()
    ? record.name.trim()
    : fallback.name
  const email = typeof record.email === 'string' && record.email.trim()
    ? record.email.trim()
    : `${hiId}@hpoint.co.kr`
  const phone = typeof record.phone === 'string' && record.phone.trim()
    ? record.phone.trim()
    : DUMMY_PHONE

  return {
    hiId,
    name,
    email,
    phone,
    alimtalk: isAlimtalk(record.alimtalk) ? record.alimtalk : fallback.alimtalk,
  }
}

export async function getMemberProfile(): Promise<MemberProfile> {
  try {
    const response = await authFetch(`${API_BASE_URL}/api/users/me`)
    const payload = parsePayload(await response.text())

    if (!response.ok) {
      if (response.status === 401) {
        throw new MemberApiError('로그인이 필요합니다.', 401, 'UNAUTHORIZED')
      }
      return fallbackProfile()
    }

    const profile = normalizeProfile(unwrap(payload))
    const session = readAuthSession()
    if (session) {
      persistAuthSession({
        ...session,
        loginId: profile.hiId || session.loginId,
        userName: profile.name || session.userName,
        alimtalk: profile.alimtalk,
      })
    }
    return profile
  } catch (error) {
    if (error instanceof MemberApiError) {
      throw error
    }
    return fallbackProfile()
  }
}

export function isMemberUnauthorized(error: unknown): boolean {
  return error instanceof MemberApiError && error.status === 401
}

export function getMemberErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return '회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
  return error instanceof Error ? error.message : '회원 정보를 불러오지 못했습니다.'
}
