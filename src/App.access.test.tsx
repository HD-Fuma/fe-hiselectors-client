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
  it('keeps a legacy protected deep link without mounting it until access is resolved', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'legacy.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'legacy-user',
    }))
    window.history.replaceState({}, '', '/campaigns')
    let resolveAccess!: (response: Response) => void
    const accessResponse = new Promise<Response>((resolve) => { resolveAccess = resolve })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => (
      String(input).endsWith('/api/me/selector-access')
        ? accessResponse
        : Promise.resolve(json({ data: [] }))
    ))

    render(<App />)

    expect(window.location.pathname).toBe('/campaigns')
    expect(screen.getByRole('status').textContent).toBe('권한을 확인하고 있습니다.')
    expect(screen.queryByRole('heading', { level: 1, name: '캠페인' })).toBeNull()
    expect(fetchSpy.mock.calls.filter(([input]) => !String(input).endsWith('/api/me/selector-access'))).toHaveLength(0)

    resolveAccess(json({ data: { accessLevel: 'CURRENT' } }))
    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/campaigns')
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'CURRENT',
      })
      expect(screen.getByRole('heading', { level: 1, name: '캠페인' })).toBeTruthy()
    })
  })

  it('resolves a legacy session on boot and reroutes with the returned access', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'legacy.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'legacy-user',
    }))
    window.history.replaceState({}, '', '/home')
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? json({ data: { accessLevel: 'CURRENT' } })
        : json({ data: { id: 1 } }),
    ))

    render(<App />)

    await vi.waitFor(() => {
      expect(window.location.pathname).toBe('/home')
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
    window.history.replaceState({}, '', '/campaigns')
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
      expect(window.location.pathname).toBe('/home')
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'BLACKLIST',
      })
    })
    const navigation = screen.getByRole('navigation', { name: '셀렉터스 메뉴' })
    expect(within(navigation).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/settlement',
      '/mypage/member',
    ])

    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(fetchSpy.mock.calls.filter(([input]) => String(input).endsWith('/api/me/selector-access'))).toHaveLength(2)
  })

  it('does not overwrite a local access change with an older refresh response', async () => {
    const currentSession = {
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }
    localStorage.setItem('selectors-auth', JSON.stringify(currentSession))
    window.history.replaceState({}, '', '/home')
    let resolveAccess!: (response: Response) => void
    const accessResponse = new Promise<Response>((resolve) => { resolveAccess = resolve })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => (
      String(input).endsWith('/api/me/selector-access')
        ? accessResponse
        : Promise.resolve(json({ data: { id: 1 } }))
    ))

    render(<App />)
    await vi.waitFor(() => expect(fetchSpy.mock.calls.some(([input]) => (
      String(input).endsWith('/api/me/selector-access')
    ))).toBe(true))

    localStorage.setItem('selectors-auth', JSON.stringify({
      ...currentSession,
      selectorAccessLevel: 'PREVIOUS',
    }))
    window.dispatchEvent(new CustomEvent('auth:changed'))
    resolveAccess(json({ data: { accessLevel: 'CURRENT' } }))

    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}'))
      .toMatchObject({ selectorAccessLevel: 'PREVIOUS' })
  })

  it('does not fail closed from an older refresh rejection after a local access change', async () => {
    const currentSession = {
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }
    localStorage.setItem('selectors-auth', JSON.stringify(currentSession))
    window.history.replaceState({}, '', '/home')
    let rejectAccess!: (reason: unknown) => void
    const accessResponse = new Promise<Response>((_resolve, reject) => { rejectAccess = reject })
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => (
      String(input).endsWith('/api/me/selector-access')
        ? accessResponse
        : Promise.resolve(json({ data: { id: 1 } }))
    ))

    render(<App />)
    await vi.waitFor(() => expect(fetchSpy.mock.calls.some(([input]) => (
      String(input).endsWith('/api/me/selector-access')
    ))).toBe(true))

    localStorage.setItem('selectors-auth', JSON.stringify({
      ...currentSession,
      selectorAccessLevel: 'PREVIOUS',
    }))
    window.dispatchEvent(new CustomEvent('auth:changed'))
    rejectAccess(new TypeError('Failed to fetch'))

    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}'))
      .toMatchObject({ selectorAccessLevel: 'PREVIOUS' })
  })

  it('reconciles the route when focus discovers an expired session', async () => {
    let now = 1_800_000_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const payload = btoa(JSON.stringify({ exp: Math.ceil((now + 1_000) / 1_000) }))
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: `header.${payload}.signature`, tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.history.replaceState({}, '', '/campaigns')
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? json({ data: { accessLevel: 'CURRENT' } })
        : json({ data: [] }),
    ))

    render(<App />)
    await vi.waitFor(() => expect(window.location.pathname).toBe('/campaigns'))

    now += 2_000
    window.dispatchEvent(new Event('focus'))

    await vi.waitFor(() => {
      expect(localStorage.getItem('selectors-auth')).toBeNull()
      expect(window.location.pathname).toBe('/login')
    })
  })

  it.each([401, 403])('clears a cached session when access refresh returns %s', async (status) => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.history.replaceState({}, '', '/campaigns')
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? new Response(null, { status })
        : json({ data: [] }),
    ))

    render(<App />)

    await vi.waitFor(() => {
      expect(localStorage.getItem('selectors-auth')).toBeNull()
      expect(window.location.pathname).toBe('/login')
    })
  })

  it('keeps login but fails closed when access refresh is temporarily unavailable', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.history.replaceState({}, '', '/campaigns')
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
      expect(window.location.pathname).toBe('/apply')
    })
  })

  it('verifies a privileged OAuth callback without repeating route redirects', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    sessionStorage.setItem('oauthProvider', 'instagram')
    window.history.replaceState({}, '', '/?code=oauth-code&state=oauth-state')
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
    window.addEventListener('popstate', countHashChange)

    try {
      render(<App />)
      let previousHashChangeCount = -1
      await vi.waitFor(() => {
        const previousCount = previousHashChangeCount
        previousHashChangeCount = hashChangeCount
        expect(window.location.pathname).toBe('/home')
        expect(hashChangeCount).toBeGreaterThan(0)
        expect(hashChangeCount).toBe(previousCount)
        expect(hashChangeCount).toBeLessThanOrEqual(2)
      })

      resolveVerification(json({
        data: {
          verified: true,
          verificationToken: 'verification-token',
          username: 'creator',
        },
      }))
      await vi.waitFor(() => expect(window.location.search).toBe(''))
      expect(window.location.pathname).toBe('/home')
      expect(hashChangeCount).toBeLessThanOrEqual(2)
    } finally {
      window.removeEventListener('popstate', countHashChange)
    }
  })

  it('keeps a legacy applicant OAuth callback on the form while NONE access resolves', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'legacy.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'legacy-user',
    }))
    sessionStorage.setItem('oauthProvider', 'instagram')
    window.history.replaceState({}, '', '/?code=oauth-code&state=oauth-state')
    let resolveAccess!: (response: Response) => void
    const accessResponse = new Promise<Response>((resolve) => { resolveAccess = resolve })
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/api/me/selector-access')) return accessResponse
      if (url.endsWith('/api/instagram/oauth/verify')) {
        return Promise.resolve(json({
          data: {
            verified: true,
            verificationToken: 'verification-token',
            username: 'creator',
          },
        }))
      }
      if (url.endsWith('/api/generations/active')) return Promise.resolve(json({ data: { id: 1 } }))
      return Promise.resolve(json({ data: [] }))
    })

    render(<App />)

    expect(window.location.pathname).toBe('/apply/form')
    expect(screen.getByRole('status').textContent).toBe('권한을 확인하고 있습니다.')
    resolveAccess(json({ data: { accessLevel: 'NONE' } }))

    await vi.waitFor(() => {
      expect(window.location.search).toBe('')
      expect(window.location.pathname).toBe('/apply/form')
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'NONE',
      })
      expect(screen.getByRole('heading', { level: 1, name: '셀렉터스 신청하기' })).toBeTruthy()
    })
  })
})
