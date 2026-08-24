import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProductDetailScreen from './ProductDetailScreen'
import { ShopDemoProvider } from './ShopDemoContext'

describe('shop product detail', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/product/40B1342672?ptrsRefCd=RC000003200T')
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('renders the internal product detail instead of an external Hyundai link', () => {
    render(<ShopDemoProvider><ProductDetailScreen /></ShopDemoProvider>)

    expect(screen.getByRole('heading', { name: /Cale ribbed half sleeve KN/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: '구매하기' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /더현대/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '구매하기' }))
    const dialog = screen.getByRole('dialog', { name: '구매 옵션' })
    expect((within(dialog).getByRole('button', { name: '수량 줄이기' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(within(dialog).getByRole('button', { name: '구매하기' }))
    expect(sessionStorage.getItem('postLoginRedirect')).toBe(
      '/product/40B1342672?ptrsRefCd=RC000003200T',
    )
    expect(window.location.pathname).toBe('/login')
  })

  it('records a purchase conversion for the logged-in member', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'test.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'buyer',
    }))
    const fetchSpy = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: true,
      data: { purchaseHistoryId: 3, orderNo: 'ORD202600003', paidAmount: 151200, status: 'PURCHASED' },
    }), { status: 201, headers: { 'Content-Type': 'application/json' } }))
    const alertSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    vi.stubGlobal('alert', alertSpy)
    render(<ShopDemoProvider><ProductDetailScreen /></ShopDemoProvider>)

    fireEvent.click(screen.getByRole('button', { name: '구매하기' }))
    const dialog = screen.getByRole('dialog', { name: '구매 옵션' })
    fireEvent.click(within(dialog).getByRole('button', { name: '수량 늘리기' }))
    expect(within(dialog).getByLabelText('수량').textContent).toBe('2')
    fireEvent.click(within(dialog).getByRole('button', { name: '구매하기' }))

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('구매 완료되었습니다. 주문번호 ORD202600003'))
    expect(screen.queryByText(/구매가 기록되었습니다/)).toBeNull()
    expect(screen.queryByText(/이 상품 구매로 발생한 수익의 일부/)).toBeNull()
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.hiselectors.shop/api/purchases/me',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toMatchObject({
      selectorsCode: 'RC000003200T', productCode: '40B1342672', quantity: 2,
    })
  })
})
