import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from './App'

function json(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

describe('selector access refresh', () => {
  it('resolves a legacy session on boot and reroutes with the returned access', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'legacy.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'legacy-user',
    }))
    window.location.hash = '#/home'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? json({ data: { accessLevel: 'CURRENT' } })
        : json({ data: { id: 1 } }),
    ))

    render(<App />)

    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/home')
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'CURRENT',
      })
    })
    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스' })).toBeTruthy()
    expect(fetchSpy.mock.calls.filter(([input]) => String(input).endsWith('/api/me/selector-access'))).toHaveLength(1)
  })

  it('refreshes on focus, reroutes a blacklist change, and does not loop on auth events', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = '#/campaigns'
    let accessRequestCount = 0
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      if (String(input).endsWith('/api/me/selector-access')) {
        accessRequestCount += 1
        return Promise.resolve(json({
          data: { accessLevel: accessRequestCount === 1 ? 'CURRENT' : 'BLACKLIST' },
        }))
      }
      return Promise.resolve(json({ data: { id: 1 } }))
    })

    render(<App />)
    await vi.waitFor(() => expect(accessRequestCount).toBe(1))
    await new Promise((resolve) => window.setTimeout(resolve, 0))

    window.dispatchEvent(new Event('focus'))

    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/home')
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'BLACKLIST',
      })
    })
    const navigation = screen.getByRole('navigation', { name: '셀렉터스 메뉴' })
    expect(within(navigation).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '#/settlement',
    ])

    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(fetchSpy.mock.calls.filter(([input]) => String(input).endsWith('/api/me/selector-access'))).toHaveLength(2)
  })
})
