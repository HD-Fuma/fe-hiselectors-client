import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'

const authSession = {
  accessToken: 'demo.jwt',
  tokenType: 'Bearer',
  role: 'USER',
  loginId: 'hiuser1',
  userName: '홍길동',
  alimtalk: 'Y',
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

function requestUrl(input: RequestInfo | URL) {
  return typeof input === 'string' ? input : input.toString()
}

function mockMemberApis(options?: {
  profile?: unknown
  kakao?: unknown
  kakaoStatus?: Response
  authorizeUrl?: string
  connect?: unknown | Response
}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = requestUrl(input)
    const method = (init?.method ?? 'GET').toUpperCase()

    if (url.endsWith('/api/users/me')) {
      return jsonResponse({
        data: options?.profile ?? {
          hiId: 'hiuser1',
          name: '홍길동',
          email: 'hong@example.com',
          phone: '01012340348',
          alimtalk: 'Y',
        },
      })
    }
    if (url.endsWith('/api/kakao/oauth/status')) {
      if (options?.kakaoStatus) return options.kakaoStatus
      return jsonResponse({
        data: options?.kakao ?? { status: null },
      })
    }
    if (url.endsWith('/api/kakao/oauth/authorize')) {
      return jsonResponse({
        data: { authorizationUrl: options?.authorizeUrl ?? 'https://kauth.kakao.com/oauth/authorize?client_id=demo' },
      })
    }
    if (url.endsWith('/api/kakao/oauth/connect') && method === 'POST') {
      if (options?.connect instanceof Response) return options.connect
      return jsonResponse({
        data: options?.connect ?? { status: 'READY' },
      })
    }
    if (url.includes('/api/admin/')) {
      throw new Error(`Admin API must not be called: ${url}`)
    }
    return jsonResponse({ data: null })
  })
}

afterEach(() => {
  cleanup()
  window.location.hash = ''
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(window.history.state, '', window.location.pathname)
  vi.restoreAllMocks()
})

describe('MemberInfoScreen', () => {
  it('renders the member information form from the profile API', async () => {
    authenticate()
    mockMemberApis()
    window.location.hash = '#/mypage/member'

    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '회원정보 변경' })).toBeTruthy()
    expect(await screen.findByDisplayValue('hon****@*********')).toBeTruthy()
    expect(screen.getByDisplayValue('hiu****')).toBeTruthy()
    expect(screen.getByDisplayValue('홍*동')).toBeTruthy()
    expect(screen.getByDisplayValue('010-****-0348')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('미연결')
    expect(screen.getByRole('checkbox', { name: 'SMS/카카오톡' })).toHaveProperty('checked', true)
    expect(screen.getByRole('checkbox', { name: 'SMS/카카오톡' })).toHaveProperty('disabled', true)
    expect(screen.getByRole('button', { name: '카카오 인증하기' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '저장하기' })).toBeTruthy()
  })

  it('shows receivable status without exposing kakao identifiers', async () => {
    authenticate()
    mockMemberApis({
      kakao: { status: 'READY' },
    })
    window.location.hash = '#/mypage/member'

    render(<App />)

    expect(await screen.findByText('수신 가능')).toBeTruthy()
    expect(screen.queryByText('secret-uuid')).toBeNull()
    expect(screen.queryByText('99')).toBeNull()
  })

  it('treats a raw READY status payload as connected', async () => {
    authenticate()
    mockMemberApis({ kakao: 'READY' })
    window.location.hash = '#/mypage/member'

    render(<App />)

    expect(await screen.findByText('수신 가능')).toBeTruthy()
  })

  it('starts kakao authorization from the independent kakao row', async () => {
    authenticate()
    const originalLocation = window.location
    const assignSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        origin: originalLocation.origin,
        pathname: originalLocation.pathname,
        href: originalLocation.href,
        hash: '#/mypage/member',
        search: originalLocation.search,
        assign: assignSpy,
      },
    })

    try {
      mockMemberApis({ authorizeUrl: 'https://kauth.kakao.com/oauth/authorize?demo=1' })
      render(<App />)
      fireEvent.click(await screen.findByRole('button', { name: '카카오 인증하기' }))

      await waitFor(() => expect(assignSpy).toHaveBeenCalledTimes(1))
      expect(assignSpy).toHaveBeenCalledWith('https://kauth.kakao.com/oauth/authorize?demo=1')
      expect(sessionStorage.getItem('kakaoOauthPending')).toBe('1')
    } finally {
      Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
    }
  })

  it('connects kakao from the oauth callback without using admin APIs', async () => {
    authenticate()
    sessionStorage.setItem('kakaoOauthPending', '1')
    const fetchSpy = mockMemberApis()
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}?code=kakao-code&state=kakao-state`,
    )
    window.location.hash = '#/mypage/member'

    render(<App />)

    const dialog = await screen.findByRole('alertdialog', { name: '알림' })
    expect(dialog.textContent).toContain('카카오 메시지 연결이 완료되었습니다.')
    expect(screen.getByText('수신 가능')).toBeTruthy()
    const connectCall = fetchSpy.mock.calls.find(([input, init]) => (
      requestUrl(input).endsWith('/api/kakao/oauth/connect') && (init?.method ?? 'GET').toUpperCase() === 'POST'
    ))
    expect(connectCall?.[1]).toMatchObject({
      body: JSON.stringify({ code: 'kakao-code', state: 'kakao-state' }),
    })
    expect(window.location.search.includes('code=')).toBe(false)
    expect(sessionStorage.getItem('kakaoOauthPending')).toBeNull()
  })

  it('keeps change actions as demo-only lookups', async () => {
    authenticate()
    const fetchSpy = mockMemberApis()
    window.location.hash = '#/mypage/member'
    render(<App />)

    await screen.findByRole('button', { name: '카카오 인증하기' })
    fireEvent.click(screen.getByRole('button', { name: '이메일주소 변경하기' }))

    expect(screen.getByRole('alertdialog', { name: '알림' }).textContent).toContain('시연 화면에서는 조회만 가능합니다.')
    expect(fetchSpy.mock.calls.some(([input]) => requestUrl(input).includes('/change'))).toBe(false)
  })

  it('unmasks queried member fields', async () => {
    authenticate()
    mockMemberApis()
    window.location.hash = '#/mypage/member'
    render(<App />)

    await screen.findByDisplayValue('hiu****')
    fireEvent.click(screen.getByRole('button', { name: '마스킹 해제' }))

    expect(screen.getByDisplayValue('hiuser1')).toBeTruthy()
    expect(screen.getByDisplayValue('홍길동')).toBeTruthy()
    expect(screen.getByDisplayValue('hong@example.com')).toBeTruthy()
    expect(screen.getByDisplayValue('01012340348')).toBeTruthy()
  })

  it('asks for login when the member page is opened anonymously', () => {
    window.location.hash = '#/mypage/member'
    render(<App />)

    expect(screen.getByText('회원정보는 로그인 후 확인할 수 있습니다.')).toBeTruthy()
    expect(screen.getByRole('link', { name: '로그인하기' }).getAttribute('href')).toBe('#/login')
    expect(screen.queryByRole('button', { name: '카카오 인증하기' })).toBeNull()
  })

  it('does not treat a missing status endpoint as disconnected', async () => {
    authenticate()
    mockMemberApis({
      kakaoStatus: jsonResponse({
        code: 'RESOURCE_NOT_FOUND',
        message: '요청한 리소스를 찾을 수 없습니다.',
      }, 404),
    })
    window.location.hash = '#/mypage/member'
    render(<App />)

    expect(await screen.findByText('확인 실패')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('요청한 리소스를 찾을 수 없습니다.')
    expect(screen.queryByText('미연결')).toBeNull()
  })
})
