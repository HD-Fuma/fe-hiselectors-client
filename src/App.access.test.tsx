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
  it('keeps a legacy protected deep link until access is resolved', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'legacy.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'legacy-user',
    }))
    window.location.hash = '#/campaigns'
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? json({ data: { accessLevel: 'CURRENT' } })
        : json({ data: [] }),
    ))

    render(<App />)

    expect(window.location.hash).toBe('#/campaigns')
    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/campaigns')
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'CURRENT',
      })
    })
  })

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

  it('reconciles the route when focus discovers an expired session', async () => {
    let now = 1_800_000_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const payload = btoa(JSON.stringify({ exp: Math.ceil((now + 1_000) / 1_000) }))
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: `header.${payload}.signature`, tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = '#/campaigns'
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? json({ data: { accessLevel: 'CURRENT' } })
        : json({ data: [] }),
    ))

    render(<App />)
    await vi.waitFor(() => expect(window.location.hash).toBe('#/campaigns'))

    now += 2_000
    window.dispatchEvent(new Event('focus'))

    await vi.waitFor(() => {
      expect(localStorage.getItem('selectors-auth')).toBeNull()
      expect(window.location.hash).toBe('#/login')
    })
  })

  it.each([401, 403])('clears a cached session when access refresh returns %s', async (status) => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = '#/campaigns'
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? new Response(null, { status })
        : json({ data: [] }),
    ))

    render(<App />)

    await vi.waitFor(() => {
      expect(localStorage.getItem('selectors-auth')).toBeNull()
      expect(window.location.hash).toBe('#/login')
    })
  })

  it('keeps login but fails closed when access refresh is temporarily unavailable', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = '#/campaigns'
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => (
      String(input).endsWith('/api/me/selector-access')
        ? Promise.reject(new TypeError('Failed to fetch'))
        : Promise.resolve(json({ data: [] }))
    ))

    render(<App />)

    await vi.waitFor(() => {
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        accessToken: 'selector.jwt',
        selectorAccessLevel: 'NONE',
      })
      expect(window.location.hash).toBe('#/apply')
    })
  })

  it('verifies a privileged OAuth callback without repeating route redirects', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    sessionStorage.setItem('oauthProvider', 'instagram')
    window.history.replaceState({}, '', '/?code=oauth-code&state=oauth-state#/apply/form')
    let resolveVerification!: (response: Response) => void
    const verification = new Promise<Response>((resolve) => { resolveVerification = resolve })
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/api/me/selector-access')) return Promise.resolve(json({ data: { accessLevel: 'CURRENT' } }))
      if (url.endsWith('/api/instagram/oauth/verify')) return verification
      return Promise.resolve(json({ data: [] }))
    })
    let hashChangeCount = 0
    const countHashChange = () => { hashChangeCount += 1 }
    window.addEventListener('hashchange', countHashChange)

    render(<App />)
    await vi.waitFor(() => expect(window.location.hash).toBe('#/home'))
    await new Promise((resolve) => window.setTimeout(resolve, 20))
    expect(hashChangeCount).toBeLessThanOrEqual(2)

    resolveVerification(json({
      data: {
        verified: true,
        verificationToken: 'verification-token',
        username: 'creator',
      },
    }))
    await vi.waitFor(() => expect(window.location.search).toBe(''))
    expect(window.location.hash).toBe('#/home')
    window.removeEventListener('hashchange', countHashChange)
  })
})
