import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import { ApplyStatusScreen } from './ApplyScreens'

const authSession = {
  accessToken: 'demo.jwt',
  tokenType: 'Bearer',
  role: 'USER',
  loginId: 'demo-user',
}

const verifiedInstagram = {
  provider: 'instagram',
  accountId: 'creator-id',
  followerCount: 123,
  label: 'creator-name',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function authenticate() {
  localStorage.setItem('selectors-auth', JSON.stringify(authSession))
}

function verifyInstagram() {
  sessionStorage.setItem('oauthVerified', JSON.stringify(verifiedInstagram))
}

function requestUrl(input: RequestInfo | URL) {
  return typeof input === 'string' ? input : input.toString()
}

function chooseSns(label: string) {
  fireEvent.click(screen.getByRole('combobox', { name: '대표 SNS' }))
  fireEvent.click(screen.getByRole('option', { name: label }))
}

afterEach(() => {
  cleanup()
  window.location.hash = ''
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(window.history.state, '', window.location.pathname)
  vi.restoreAllMocks()
})

describe('apply flow', () => {
  it('matches the supplied intro and routes both calls to action into the form', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: { id: 1 } }))
    window.location.hash = '#/apply'

    render(<App />)

    expect(screen.getByRole('main').textContent).toContain(
      '셀렉터스는 안목있는 선택을 통해 가치를 만들고성과로 연결하는 더현대Hi의 서비스입니다.',
    )
    ;['상품 큐레이션', '링크 공유', '판매 발생', '수익 창출'].forEach((label) => {
      expect(screen.getByText(label)).toBeTruthy()
    })
    expect(screen.getByText('링크 공유').closest('li')?.classList.contains('is-active')).toBe(true)
    expect(screen.getByRole('link', { name: '자세히 알아보기' }).getAttribute('href')).toBe('#/apply/form')
    expect(screen.getByRole('link', { name: '셀렉터스 신청하기' }).getAttribute('href')).toBe('#/apply/form')
  })

  it('blocks the form when there is no active cohort', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: null }))
    window.location.hash = '#/apply'
    render(<App />)

    await waitFor(() => {
      fireEvent.click(screen.getByRole('link', { name: '셀렉터스 신청하기' }))
      expect(
        screen.getByRole('dialog', { name: '현재 모집 중인 기수가 없어 지원할 수 없습니다.' }),
      ).toBeTruthy()
    })
    expect(window.location.hash).toBe('#/apply')
  })

  it('allows an explicit local OAuth test URL without an active cohort', async () => {
    authenticate()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ data: null }),
    )
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}?applyTest=1#/apply/form`,
    )

    render(<App />)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스 신청하기' })).toBeTruthy()
    expect(screen.getByRole('combobox', { name: '대표 SNS' })).toBeTruthy()
    expect(
      screen.queryByRole('dialog', { name: '현재 모집 중인 기수가 없어 지원할 수 없습니다.' }),
    ).toBeNull()
  })

  it('requires a real login session for the local OAuth test form', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: null }))
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}?applyTest=1#/apply/form`,
    )

    render(<App />)

    expect(await screen.findByRole('dialog', { name: '로그인이 필요합니다' })).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: '대표 SNS' })).toBeNull()
    expect(sessionStorage.getItem('postLoginRedirect')).toBe('#/apply/form')
    expect(
      screen.queryByRole('dialog', { name: '현재 모집 중인 기수가 없어 지원할 수 없습니다.' }),
    ).toBeNull()
  })

  it('stores the post-login destination when an active application requires login', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ data: { generationId: 1 } }),
    )
    window.location.hash = '#/apply'
    render(<App />)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('link', { name: '셀렉터스 신청하기' }))

    expect(screen.getByRole('dialog', { name: '로그인이 필요합니다' })).toBeTruthy()
    expect(sessionStorage.getItem('postLoginRedirect')).toBe('#/apply/form')
    expect(window.location.hash).toBe('#/apply')
  })

  it('uses the styled SNS listbox and clears stale verification when the provider changes', () => {
    authenticate()
    verifyInstagram()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ data: { id: 1 } }))
    window.location.hash = '#/apply/form'
    render(<App />)

    const trigger = screen.getByRole('combobox', { name: '대표 SNS' })
    expect(trigger.textContent).toContain('인스타그램')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.querySelector('.sns-options')).toBeNull()
    expect(screen.getByText('연동 완료')).toBeTruthy()
    expect(screen.getByText('creator-name')).toBeTruthy()
    expect(screen.getByRole('button', { name: '인증 완료' })).toHaveProperty('disabled', true)

    fireEvent.click(trigger)
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      '인스타그램',
      '페이스북',
      '유튜브',
    ])
    fireEvent.click(screen.getByRole('option', { name: '유튜브' }))

    expect(screen.queryByText('연동 완료')).toBeNull()
    expect(screen.queryByText('creator-name')).toBeNull()
    expect(sessionStorage.getItem('oauthVerified')).toBeNull()
    expect(sessionStorage.getItem('selectedSnsProvider')).toBe('youtube')
    expect(screen.getByRole('button', { name: 'YouTube 계정 연결하기' })).toHaveProperty('disabled', false)
  })

  it('requests the provider authorization URL and redirects from the user click', async () => {
    authenticate()
    const originalLocation = window.location
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: originalLocation.origin,
        pathname: originalLocation.pathname,
        href: originalLocation.href,
        hash: '#/apply/form',
        search: originalLocation.search,
        assign: assignSpy,
      },
    })

    try {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = requestUrl(input)
        if (url.endsWith('/api/generations/active')) {
          return jsonResponse({ data: { id: 1 } })
        }
        if (url.endsWith('/api/instagram/oauth/authorize')) {
          return jsonResponse({
            authorizationUrl: 'https://instagram.example.com/oauth?redirect_uri=https%3A%2F%2Fapi.example.com%2Foauth%2Fcallback',
          })
        }
        throw new Error(`Unexpected request: ${url}`)
      })

      render(<App />)
      chooseSns('인스타그램')
      fireEvent.click(screen.getByRole('button', { name: 'Instagram 계정 연결하기' }))

      expect(fetchSpy).toHaveBeenCalledWith(
        'http://127.0.0.1:8080/api/instagram/oauth/authorize',
        expect.objectContaining({ method: 'GET' }),
      )
      await waitFor(() => expect(assignSpy).toHaveBeenCalledTimes(1))
      expect(assignSpy).toHaveBeenCalledWith(
        'https://instagram.example.com/oauth?redirect_uri=https%3A%2F%2Fapi.example.com%2Foauth%2Fcallback',
      )
      expect(sessionStorage.getItem('oauthProvider')).toBe('instagram')
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    }
  })

  it('shows the login modal when OAuth authorization returns 401', async () => {
    authenticate()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = requestUrl(input)
      if (url.endsWith('/api/generations/active')) {
        return jsonResponse({ data: { id: 1 } })
      }
      return jsonResponse({ message: '인증이 필요합니다.' }, 401)
    })
    window.location.hash = '#/apply/form'
    render(<App />)

    chooseSns('인스타그램')
    fireEvent.click(screen.getByRole('button', { name: 'Instagram 계정 연결하기' }))

    const dialog = await screen.findByRole('dialog', { name: '로그인이 필요합니다' })
    expect(within(dialog).getByText(/로그인 페이지로 이동할까요\?/)).toBeTruthy()
    expect(window.location.hash).toBe('#/apply/form')
    expect(sessionStorage.getItem('oauthProvider')).toBeNull()
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/instagram/oauth/authorize',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('verifies OAuth with code and state in the POST body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ data: { verified: true, ...verifiedInstagram } }),
    )
    const { verifyOAuth } = await import('../../oauth')

    await verifyOAuth('instagram', 'abc123', 'state-1')

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/instagram/oauth/verify',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ code: 'abc123', state: 'state-1' }),
      }),
    )
  })

  it('posts the verified application and moves to status only after success', async () => {
    authenticate()
    verifyInstagram()
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = requestUrl(input)
      if (url.endsWith('/api/generations/active')) {
        return jsonResponse({ data: { id: 1 } })
      }
      if (url.endsWith('/api/applications')) {
        return jsonResponse({ data: { applicationId: 10 } })
      }
      throw new Error(`Unexpected request: ${url}`)
    })
    window.location.hash = '#/apply/form'
    render(<App />)

    const submit = screen.getByRole('button', { name: '셀렉터스 신청하기' })
    expect(submit).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: '인증 완료' })).toBeTruthy()
    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox))
    expect(submit).toHaveProperty('disabled', false)

    fireEvent.click(submit)

    await waitFor(() => expect(window.location.hash).toBe('#/apply/status'))
    const applicationCall = fetchSpy.mock.calls.find(([input]) => (
      requestUrl(input).endsWith('/api/applications')
    ))
    expect(applicationCall).toBeTruthy()
    expect(applicationCall?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({
        snsCode: 'INSTAGRAM',
        snsAccountId: 'creator-name',
        followerCount: 123,
        privacyAgreed: true,
        alarmAgreed: true,
      }),
    })
    expect((applicationCall?.[1]?.headers as Headers).get('Authorization')).toBe('Bearer demo.jwt')
  })

  it.each([
    { status: 409, body: { message: 'duplicate' }, message: '이미 해당 기수에 신청하셨습니다.' },
    { status: 400, body: { message: '지원 정보를 확인해 주세요.' }, message: '지원 정보를 확인해 주세요.' },
  ])('keeps the form and modal on application error $status', async ({ body, message, status }) => {
    authenticate()
    verifyInstagram()
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = requestUrl(input)
      if (url.endsWith('/api/generations/active')) {
        return jsonResponse({ data: { id: 1 } })
      }
      return jsonResponse(body, status)
    })
    window.location.hash = '#/apply/form'
    render(<App />)

    screen.getAllByRole('checkbox').forEach((checkbox) => fireEvent.click(checkbox))
    fireEvent.click(screen.getByRole('button', { name: '셀렉터스 신청하기' }))

    const dialog = await screen.findByRole('dialog', { name: '제출 실패' })
    expect(within(dialog).getByText(message)).toBeTruthy()
    expect(window.location.hash).toBe('#/apply/form')
  })

  it('renders the application status destination', () => {
    render(<ApplyStatusScreen />)

    expect(screen.getByRole('heading', { level: 1, name: '신청 완료' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: '셀렉터스 신청을 완료했어요.' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '캠페인으로 이동' }).getAttribute('href')).toBe('#/campaigns')
  })
})
