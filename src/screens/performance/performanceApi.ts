import { API_BASE_URL, authFetch } from '../../auth'

export type PerformanceMetrics = {
  estimatedSettlementAmount: number
  conversionAmount: number
  conversionCount: number
  clickCount: number
  conversionRate: number
}

export type PerformanceTrend = {
  date: string
  clickCount: number
  conversionCount: number
  conversionAmount: number
}

export type ProductPerformance = PerformanceMetrics & {
  productId: number
  productCode: string
  productName: string
  brandName: string
  thumbnailUrl: string
  detailUrl: string | null
}

export type PerformanceSummary = {
  activityMonth: string
  settlementRate: number
  metrics: PerformanceMetrics
  previousMonthMetrics: PerformanceMetrics
  trends: PerformanceTrend[]
  topProducts: ProductPerformance[]
}

export type ProductPerformanceList = {
  activityMonth: string
  conversionCount: number
  totalProductCount: number
  products: ProductPerformance[]
}

type ApiEnvelope<T> = { data?: T; message?: string | null }

export class PerformanceApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'PerformanceApiError'
    this.status = status
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`)
  const raw = await response.text()
  let payload: unknown = null

  if (raw.trim()) {
    try { payload = JSON.parse(raw) } catch { payload = raw }
  }

  if (!response.ok) {
    const envelope = typeof payload === 'object' && payload !== null ? payload as ApiEnvelope<unknown> : null
    const message = typeof envelope?.message === 'string'
      ? envelope.message
      : response.status === 401 ? '로그인이 필요합니다.' : '성과 정보를 불러오지 못했습니다.'
    throw new PerformanceApiError(message, response.status)
  }

  return typeof payload === 'object' && payload !== null && 'data' in payload
    ? (payload as ApiEnvelope<T>).data as T
    : payload as T
}

function hasMetrics(value: unknown): value is PerformanceMetrics {
  if (typeof value !== 'object' || value === null) return false
  const metrics = value as Partial<PerformanceMetrics>
  return ['estimatedSettlementAmount', 'conversionAmount', 'conversionCount', 'clickCount', 'conversionRate']
    .every((key) => typeof metrics[key as keyof PerformanceMetrics] === 'number')
}

function isProduct(value: unknown): value is ProductPerformance {
  if (typeof value !== 'object' || value === null || !hasMetrics(value)) return false
  const product = value as Partial<ProductPerformance>
  return typeof product.productId === 'number'
    && typeof product.productCode === 'string'
    && typeof product.productName === 'string'
    && typeof product.brandName === 'string'
    && typeof product.thumbnailUrl === 'string'
    && (product.detailUrl === null || typeof product.detailUrl === 'string')
}

export async function getPerformanceSummary(activityMonth: string): Promise<PerformanceSummary> {
  const summary = await request<PerformanceSummary>(`/api/performance/summary?activityMonth=${encodeURIComponent(activityMonth)}`)
  if (!summary || typeof summary.activityMonth !== 'string' || !hasMetrics(summary.metrics)
    || !hasMetrics(summary.previousMonthMetrics) || !Array.isArray(summary.trends)
    || !Array.isArray(summary.topProducts) || !summary.topProducts.every(isProduct)) {
    throw new Error('성과 요약 응답 형식이 올바르지 않습니다.')
  }
  return summary
}

export async function getProductPerformance(activityMonth: string): Promise<ProductPerformanceList> {
  const result = await request<ProductPerformanceList>(`/api/performance/products?activityMonth=${encodeURIComponent(activityMonth)}`)
  if (!result || typeof result.activityMonth !== 'string' || typeof result.conversionCount !== 'number'
    || typeof result.totalProductCount !== 'number' || !Array.isArray(result.products)
    || !result.products.every(isProduct)) {
    throw new Error('상품별 성과 응답 형식이 올바르지 않습니다.')
  }
  return result
}

export function getPerformanceErrorMessage(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return '성과 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
  }
  return error instanceof Error ? error.message : '성과 정보를 불러오지 못했습니다.'
}
