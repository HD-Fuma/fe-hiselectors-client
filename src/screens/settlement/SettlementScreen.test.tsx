import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SettlementScreen, {
  formatPaymentDate,
  formatSettlementPeriod,
} from './SettlementScreen'
import type { SettlementEstimate } from './settlementApi'

const estimate: SettlementEstimate = {
  settlementId: 1,
  selectorsId: 7,
  selectorsCode: 'SELECTORS-7',
  selectorsNickname: '셀렉터스',
  activityMonth: '2026-07',
  settlementMonth: '2026-08',
  paymentMonth: '2026-09',
  confirmedPurchaseCount: 386,
  confirmedSalesAmount: 42_820_000,
  settlementRate: 3,
  settlementAmount: 1_284_600,
  status: 'CALCULATING',
  calculatedAt: '2026-08-10T00:00:00',
  updatedAt: '2026-08-10T00:00:00',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string' ? input : input.toString()
}

function historyResponse(year: number, histories: SettlementEstimate[] = [estimate]) {
  return json({ data: { selectedYear: year, availableYears: [2026, 2025], histories } })
}

function setSession() {
  localStorage.setItem('selectors-auth', JSON.stringify({
    accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
  }))
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('SettlementScreen', () => {
  it('loads the authenticated estimate and selected-year histories', async () => {
    setSession()
    const settled: SettlementEstimate = {
      ...estimate,
      settlementId: 2,
      activityMonth: '2026-06',
      settlementMonth: '2026-07',
      paymentMonth: '2026-08',
      settlementAmount: 742_800,
      status: 'SETTLED',
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      requestUrl(input).includes('/histories?year=2026')
        ? historyResponse(2026, [estimate, settled])
        : json({ data: estimate }),
    ))

    render(<SettlementScreen />)

    expect(await screen.findByText('2026년 7월 예상 정산 금액')).toBeTruthy()
    expect(screen.getByText('구매 확정 386건')).toBeTruthy()
    expect(screen.getByText('정산 예정일 2026.09.20')).toBeTruthy()
    expect(screen.getByText('지급 완료')).toBeTruthy()
    expect(screen.getByText('2026.08.20 지급')).toBeTruthy()
    expect((screen.getByLabelText('정산 이력 연도') as HTMLSelectElement).value).toBe('2026')

    const estimateCall = fetchSpy.mock.calls.find(([input]) => requestUrl(input).endsWith('/api/settlements/estimates'))
    expect((estimateCall?.[1]?.headers as Headers).get('Authorization')).toBe('Bearer selector.jwt')
  })

  it('reloads histories when the selected year changes', async () => {
    setSession()
    const previousYear: SettlementEstimate = {
      ...estimate,
      settlementId: 3,
      activityMonth: '2025-12',
      settlementMonth: '2026-01',
      paymentMonth: '2026-02',
      status: 'SETTLED',
    }
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = requestUrl(input)
      if (url.includes('/histories?year=2025')) return Promise.resolve(historyResponse(2025, [previousYear]))
      if (url.includes('/histories?year=2026')) return Promise.resolve(historyResponse(2026))
      return Promise.resolve(json({ data: estimate }))
    })

    render(<SettlementScreen />)
    await screen.findByText('2026년 7월 예상 정산 금액')
    fireEvent.change(screen.getByLabelText('정산 이력 연도'), { target: { value: '2025' } })

    expect(await screen.findByText('2025년 12월')).toBeTruthy()
    expect(fetchSpy.mock.calls.some(([input]) => requestUrl(input).includes('/histories?year=2025'))).toBe(true)
  })

  it('keeps the page usable when the current estimate has not been calculated', async () => {
    setSession()
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      requestUrl(input).includes('/histories')
        ? historyResponse(2026, [])
        : json({ code: 'SETTLEMENT_NOT_CALCULATED', message: '계산된 정산 이력이 없습니다.' }, 404),
    ))

    render(<SettlementScreen />)

    expect(await screen.findByText('아직 계산된 정산 내역이 없습니다.')).toBeTruthy()
    expect(screen.getByText('선택한 연도에 정산 내역이 없습니다.')).toBeTruthy()
  })

  it('calculates settlement and payment dates across year boundaries', () => {
    expect(formatSettlementPeriod('2024-02')).toBe('2024.02.01 - 2024.02.29')
    expect(formatPaymentDate('2025-12')).toBe('2025.12.20')
  })
})
