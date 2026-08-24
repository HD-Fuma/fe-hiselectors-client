import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProductPerformanceScreen } from './PerformanceScreens'

function monthValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string) {
  const [year, value] = month.split('-')
  return `${year}년 ${Number(value)}월`
}

function requestUrl(input: RequestInfo | URL) {
  return typeof input === 'string' ? input : input.toString()
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

describe('ProductPerformanceScreen', () => {
  it('shows the selected month once and reloads product performance when it changes', async () => {
    const now = new Date()
    const initialMonth = monthValue(now)
    const previousMonth = monthValue(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const activityMonth = new URL(requestUrl(input)).searchParams.get('activityMonth') ?? ''
      return Promise.resolve(new Response(JSON.stringify({
        data: {
          activityMonth,
          conversionCount: activityMonth === previousMonth ? 7 : 8,
          totalProductCount: 0,
          products: [],
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

    fireEvent.change(monthSelect, { target: { value: previousMonth } })

    await waitFor(() => {
      expect(fetchSpy.mock.calls.some(([input]) => requestUrl(input).includes(`activityMonth=${previousMonth}`))).toBe(true)
    })
    expect(monthSelect.value).toBe(previousMonth)
    expect(within(periodRow as HTMLElement).getAllByText(monthLabel(previousMonth))).toHaveLength(1)
    expect(await screen.findByText('7건')).toBeTruthy()
    expect(within(periodRow as HTMLElement).getByText('조회 기간')).toBeTruthy()
    expect(screen.queryByText('월별 성과')).toBeNull()
  })
})
