import { API_BASE_URL, authFetch } from '../../auth'

export type SettlementStatus =
  | 'CALCULATING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_HOLD_INFO'
  | 'PAYMENT_HOLD_BLACK'
  | 'SETTLED'
  | 'EXPIRED'

export type SettlementProvisionalEstimate = {
  purchaseCount: number
  settlementAmount: number
}

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
  provisionalEstimate?: SettlementProvisionalEstimate | null
}

export type SettlementHistories = {
  selectedYear: number
  availableYears: number[]
  histories: SettlementEstimate[]
}

export type SettlementAccountType = 'INDIVIDUAL' | 'SOLE_PROPRIETOR' | 'CORPORATION'

export type SettlementAccount = {
  bankName: string
  accountNumber: string
  accountHolder: string
  settlementType?: SettlementAccountType | null
  businessNumber?: string | null
}

type SettlementAccountBaseInput = Pick<
  SettlementAccount,
  'bankName' | 'accountNumber' | 'accountHolder'
>

export type SettlementAccountUpsertInput = SettlementAccountBaseInput & (
  | {
    settlementType: 'INDIVIDUAL'
    businessNumber?: string
  }
  | {
    settlementType: 'SOLE_PROPRIETOR' | 'CORPORATION'
    businessNumber: string
  }
)

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

async function request<T>(
  path: string,
  init?: RequestInit,
  fallback = '정산 정보를 불러오지 못했습니다.',
): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`, init)
  const payload = parsePayload(await response.text())

  if (!response.ok) {
    const envelope = typeof payload === 'object' && payload !== null
      ? payload as ApiEnvelope<unknown>
      : undefined
    throw new SettlementApiError(
      response.status === 401
        ? '로그인이 필요합니다.'
        : extractMessage(payload, fallback),
      response.status,
      envelope?.code,
    )
  }

  if (typeof payload === 'object' && payload !== null && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data as T
  }

  return payload as T
}

function isProvisionalEstimate(value: unknown): value is SettlementProvisionalEstimate {
  return typeof value === 'object'
    && value !== null
    && typeof (value as SettlementProvisionalEstimate).purchaseCount === 'number'
    && typeof (value as SettlementProvisionalEstimate).settlementAmount === 'number'
}

function isSettlementEstimate(value: unknown): value is SettlementEstimate {
  if (typeof value !== 'object' || value === null) return false

  const estimate = value as SettlementEstimate
  if (typeof estimate.activityMonth !== 'string' || typeof estimate.settlementAmount !== 'number') {
    return false
  }

  return estimate.provisionalEstimate == null || isProvisionalEstimate(estimate.provisionalEstimate)
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

function isSettlementAccount(value: unknown): value is SettlementAccount {
  if (typeof value !== 'object' || value === null) return false

  const account = value as SettlementAccount
  const hasValidOptionalString = (candidate: unknown) => (
    candidate == null || typeof candidate === 'string'
  )
  const hasValidSettlementType = account.settlementType == null
    || ['INDIVIDUAL', 'SOLE_PROPRIETOR', 'CORPORATION'].includes(account.settlementType)

  return typeof account.bankName === 'string'
    && typeof account.accountNumber === 'string'
    && typeof account.accountHolder === 'string'
    && hasValidSettlementType
    && hasValidOptionalString(account.businessNumber)
}

function normalizeSettlementAccount(account: SettlementAccountUpsertInput): SettlementAccountUpsertInput {
  const common = {
    bankName: account.bankName.trim(),
    accountNumber: account.accountNumber.trim(),
    accountHolder: account.accountHolder.trim(),
  }

  if (account.settlementType === 'INDIVIDUAL') {
    const businessNumber = account.businessNumber?.trim()
    return {
      ...common,
      settlementType: account.settlementType,
      ...(businessNumber ? { businessNumber } : {}),
    }
  }

  return {
    ...common,
    settlementType: account.settlementType,
    businessNumber: account.businessNumber.trim(),
  }
}

export async function getSettlementAccount(): Promise<SettlementAccount> {
  const account = await request<SettlementAccount>('/api/settlements/account')
  if (!isSettlementAccount(account)) {
    throw new Error('정산 정보 조회 응답 형식이 올바르지 않습니다.')
  }
  return account
}

export async function upsertSettlementAccount(account: SettlementAccountUpsertInput): Promise<SettlementAccount> {
  const payload = normalizeSettlementAccount(account)
  const saved = await request<SettlementAccount | null>(
    '/api/settlements/account',
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    '정산 정보를 저장하지 못했습니다.',
  )

  if (saved == null) {
    return payload
  }
  if (!isSettlementAccount(saved)) {
    throw new Error('정산 정보 저장 응답 형식이 올바르지 않습니다.')
  }
  return saved
}

export function isSettlementNotCalculated(error: unknown): boolean {
  return error instanceof SettlementApiError
    && error.status === 404
    && error.code === 'SETTLEMENT_NOT_CALCULATED'
}

export function isSettlementAccountNotRegistered(error: unknown): boolean {
  return error instanceof SettlementApiError && error.status === 404
}

export function isSettlementUnauthorized(error: unknown): boolean {
  return error instanceof SettlementApiError && error.status === 401
}

export function getSettlementErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return '정산 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }

  return error instanceof Error ? error.message : '정산 정보를 불러오지 못했습니다.'
}
