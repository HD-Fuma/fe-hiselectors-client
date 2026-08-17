import { API_BASE_URL, authFetch } from '../../auth'

export type SettlementStatus =
  | 'CALCULATING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_HOLD_INFO'
  | 'PAYMENT_HOLD_BLACK'
  | 'SETTLED'
  | 'EXPIRED'

export type SettlementEstimate = {
  settlementId: number
  selectorsId: number
  selectorsCode: string
  selectorsNickname: string
  activityMonth: string
  settlementMonth: string
  paymentMonth: string
  confirmedPurchaseCount: number
  confirmedSalesAmount: number
  settlementRate: number
  settlementAmount: number
  status: SettlementStatus
  calculatedAt: string
  updatedAt: string
}

export type SettlementHistories = {
  selectedYear: number
  availableYears: number[]
  histories: SettlementEstimate[]
}

export type SettlementAccount = {
  bankName: string
  accountNumber: string
  accountHolder: string
}

export class SettlementApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'SettlementApiError'
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

function extractMessage(payload: unknown, fallback: string): string {
  if (typeof payload === 'string' && payload.trim()) return payload

  if (typeof payload === 'object' && payload !== null) {
    const message = (payload as ApiEnvelope<unknown>).message
    if (typeof message === 'string' && message.trim()) return message
  }

  return fallback
}

async function request<T>(path: string): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`)
  const payload = parsePayload(await response.text())

  if (!response.ok) {
    const envelope = typeof payload === 'object' && payload !== null
      ? payload as ApiEnvelope<unknown>
      : undefined
    throw new SettlementApiError(
      response.status === 401
        ? '로그인이 필요합니다.'
        : extractMessage(payload, '정산 정보를 불러오지 못했습니다.'),
      response.status,
      envelope?.code,
    )
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T
  }

  return payload as T
}

function isSettlementEstimate(value: unknown): value is SettlementEstimate {
  return typeof value === 'object'
    && value !== null
    && typeof (value as SettlementEstimate).activityMonth === 'string'
    && typeof (value as SettlementEstimate).settlementAmount === 'number'
}

export async function getSettlementEstimate(activityMonth?: string): Promise<SettlementEstimate> {
  const query = activityMonth ? `?activityMonth=${encodeURIComponent(activityMonth)}` : ''
  const estimate = await request<SettlementEstimate>(`/api/settlements/estimates${query}`)
  if (!isSettlementEstimate(estimate)) {
    throw new Error('정산 조회 응답 형식이 올바르지 않습니다.')
  }
  return estimate
}

export async function getSettlementHistories(year: number): Promise<SettlementHistories> {
  const histories = await request<SettlementHistories>(`/api/settlements/estimates/histories?year=${year}`)
  if (!histories || !Array.isArray(histories.histories) || !Array.isArray(histories.availableYears)) {
    throw new Error('정산 이력 응답 형식이 올바르지 않습니다.')
  }
  return histories
}

export async function getSettlementAccount(): Promise<SettlementAccount> {
  const account = await request<SettlementAccount>('/api/settlements/account')
  if (
    !account
    || typeof account.bankName !== 'string'
    || typeof account.accountNumber !== 'string'
    || typeof account.accountHolder !== 'string'
  ) {
    throw new Error('정산 정보 조회 응답 형식이 올바르지 않습니다.')
  }
  return account
}

export function isSettlementNotCalculated(error: unknown): boolean {
  return error instanceof SettlementApiError
    && error.status === 404
    && error.code === 'SETTLEMENT_NOT_CALCULATED'
}

export function isSettlementAccountNotRegistered(error: unknown): boolean {
  return error instanceof SettlementApiError
    && error.status === 404
    && error.code === 'RESOURCE_NOT_FOUND'
}

export function getSettlementErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return '정산 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }

  return error instanceof Error ? error.message : '정산 정보를 불러오지 못했습니다.'
}
