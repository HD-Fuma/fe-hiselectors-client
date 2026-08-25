import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  PerformanceSummaryScreen,
  ProductPerformanceScreen,
  formatActivityPeriod,
  formatExpectedPaymentDate,
  getCurrentActivityMonth,
  monthLabel,
  shiftMonth,
} from './PerformanceScreens'

function requestUrl(input: RequestInfo | URL) {
  return typeof input === 'string' ? input : input.toString()
}

const metrics = {
  estimatedSettlementAmount: 1_284_600,
  conversionAmount: 42_820_000,
  conversionCount: 386,
  clickCount: 12_840,
  conversionRate: 3.01,
}

beforeEach(() => {
  localStorage.setItem('selectors-auth', JSON.stringify({
    accessToken: 'performance-token',
    tokenType: 'Bearer',
    role: 'USER',
  }))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('PerformanceSummaryScreen', () => {
  it('loads the current activity month performance summary by default', async () => {
    const currentMonth = getCurrentActivityMonth()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      data: {
        activityMonth: currentMonth,
        settlementRate: 3,
        metrics,
        previousMonthMetrics: metrics,
        trends: [{ date: `${currentMonth}-01`, clickCount: 420, conversionCount: 12, conversionAmount: 1_340_000 }],
        topProducts: [],
      },
    })))

    render(<PerformanceSummaryScreen />)

    expect(await screen.findByText('이번달 예상 수수료')).toBeTruthy()
    const featuredCard = screen.getByText('이번달 예상 수수료').closest('.metric-card') as HTMLElement
    expect(within(featuredCard).getByText(`${formatExpectedPaymentDate(currentMonth)} 지급 예정`)).toBeTruthy()
    expect(within(featuredCard).queryByText(formatActivityPeriod(currentMonth))).toBeNull()
    expect(screen.queryByText(`지급 예정월 ${monthLabel(shiftMonth(currentMonth, 2))}`)).toBeNull()
    expect(document.querySelector('.performance-screen > .period-row .period-caption')).toBeNull()
    expect(screen.getByText('구매 전환 금액', { selector: '.metric-card > span' })).toBeTruthy()
    expect(screen.getByText('구매 전환 수', { selector: '.metric-card > span' })).toBeTruthy()
    expect(screen.getByText('누적 클릭 수', { selector: '.metric-card > span' })).toBeTruthy()
    expect(screen.getByText('전환율', { selector: '.metric-card > span' })).toBeTruthy()
    expect((screen.getByRole('combobox', { name: '조회 월 선택' }) as HTMLSelectElement).value).toBe(currentMonth)
    expect(String(fetchSpy.mock.calls[0][0])).toContain(`/api/performance/summary?activityMonth=${encodeURIComponent(currentMonth)}`)
  })
})

describe('ProductPerformanceScreen', () => {
  it('shows the selected month once and reloads product performance when it changes', async () => {
    const initialMonth = getCurrentActivityMonth()
    const previousMonth = shiftMonth(initialMonth, -1)
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const activityMonth = new URL(requestUrl(input)).searchParams.get('activityMonth') ?? ''
      return Promise.resolve(new Response(JSON.stringify({
        data: {
          activityMonth,
          conversionCount: activityMonth === previousMonth ? 7 : 8,
          totalProductCount: 1,
          products: [{
            productId: 1,
            productCode: 'P-1',
            productName: '테스트 상품',
            brandName: '테스트 브랜드',
            thumbnailUrl: 'https://example.com/product.jpg',
            detailUrl: 'https://example.com/product',
            clickCount: 10,
            conversionCount: 3,
            conversionAmount: 30_000,
            conversionRate: 30,
            estimatedSettlementAmount: 900,
          }],
        },
      })))
    })

    render(<ProductPerformanceScreen />)

    const periodRow = document.querySelector('.product-period-row')
    expect(periodRow).not.toBeNull()
    const monthSelect = within(periodRow as HTMLElement).getByRole('combobox', { name: '조회 월 선택' }) as HTMLSelectElement
    expect(monthSelect.value).toBe(initialMonth)
    expect(within(periodRow as HTMLElement).getAllByText(monthLabel(initialMonth))).toHaveLength(1)
    expect(await screen.findByText('8건')).toBeTruthy()
    expect(screen.getByRole('link', { name: /테스트 상품/ }).getAttribute('href'))
      .toBe('https://example.com/product')

    fireEvent.change(monthSelect, { target: { value: previousMonth } })

    await waitFor(() => {
      expect(fetchSpy.mock.calls.some(([input]) => requestUrl(input).includes(`activityMonth=${previousMonth}`))).toBe(true)
    })
    expect(monthSelect.value).toBe(previousMonth)
    expect(within(periodRow as HTMLElement).getAllByText(monthLabel(previousMonth))).toHaveLength(1)
    expect(await screen.findByText('7건')).toBeTruthy()
    expect(screen.queryByText('조회 기간')).toBeNull()
    expect(screen.queryByText('월별 성과')).toBeNull()
  })
})
