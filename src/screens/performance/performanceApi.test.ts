import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPerformanceSummary, getProductPerformance, PerformanceApiError } from './performanceApi'

const metrics = {
  estimatedSettlementAmount: 30_000,
  conversionAmount: 1_000_000,
  conversionCount: 10,
  clickCount: 250,
  conversionRate: 4,
}

const product = {
  productId: 1,
  productCode: 'PRODUCT-1',
  productName: '테스트 상품',
  brandName: '테스트 브랜드',
  thumbnailUrl: '/product.jpg',
  ...metrics,
}

beforeEach(() => {
  localStorage.setItem('selectors-auth', JSON.stringify({
    accessToken: 'performance-token',
    tokenType: 'Bearer',
    role: 'USER',
  }))
})

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('performance API', () => {
  it('requests the selected summary month with the authenticated client session', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: {
        activityMonth: '2026-07',
        settlementRate: 3,
        metrics,
        previousMonthMetrics: metrics,
        trends: [{ date: '2026-07-01', clickCount: 10, conversionCount: 1, conversionAmount: 100_000 }],
        topProducts: [product],
      },
    })))

    const result = await getPerformanceSummary('2026-07')

    expect(result.metrics.clickCount).toBe(250)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/performance/summary?activityMonth=2026-07')
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer performance-token')
  })

  it('returns product performance from the client-only endpoint', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: { activityMonth: '2026-07', conversionCount: 10, totalProductCount: 1, products: [product] },
    })))

    const result = await getProductPerformance('2026-07')

    expect(result.products[0].estimatedSettlementAmount).toBe(30_000)
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/performance/products?activityMonth=2026-07')
  })

  it('surfaces the server error message and status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ message: '조회할 수 없는 월입니다.' }),
      { status: 400 },
    ))

    await expect(getPerformanceSummary('2099-01')).rejects.toMatchObject({
      message: '조회할 수 없는 월입니다.',
      status: 400,
    } satisfies Partial<PerformanceApiError>)
  })
})
