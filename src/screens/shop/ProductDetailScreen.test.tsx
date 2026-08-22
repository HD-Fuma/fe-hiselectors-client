import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    vi.stubGlobal('fetch', fetchSpy)
    render(<ShopDemoProvider><ProductDetailScreen /></ShopDemoProvider>)

    fireEvent.change(screen.getByLabelText('수량'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: '구매하기' }))

    await waitFor(() => expect(screen.getByText(/ORD202600003/)).toBeTruthy())
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.hiselectors.shop/api/purchases/me',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(JSON.parse(fetchSpy.mock.calls[0][1].body)).toMatchObject({
      selectorsCode: 'RC000003200T', productCode: '40B1342672', quantity: 2,
    })
  })
})
