import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'

const authSession = {
  accessToken: 'demo.jwt',
  tokenType: 'Bearer',
  role: 'USER',
  loginId: 'hiuser1',
  selectorAccessLevel: 'CURRENT',
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
  endActivity?: Response | Promise<Response> | Error
  accessAfterEnd?: 'PREVIOUS' | 'BLACKLIST'
  accessAfterEndResponse?: Promise<Response>
}) {
  let activityEnded = false
  let deleteAttempted = false
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
    if (url.endsWith('/api/me/selector-access')) {
      if (method === 'DELETE') {
        deleteAttempted = true
        const configured = options?.endActivity ?? new Response(null, { status: 204 })
        if (configured instanceof Error) throw configured
        const response = await configured
        activityEnded = response.ok
        return response
      }
      if (deleteAttempted && options?.accessAfterEndResponse) {
        return options.accessAfterEndResponse
      }
      return jsonResponse({
        accessLevel: deleteAttempted && options?.accessAfterEnd
          ? options.accessAfterEnd
          : activityEnded ? 'PREVIOUS' : 'CURRENT',
      })
    }
    if (url.includes('/api/admin/')) {
      throw new Error(`Admin API must not be called: ${url}`)
    }
    return jsonResponse({ data: null })
  })
}

async function confirmSelectorActivityEnd() {
  fireEvent.click(await screen.findByRole('button', { name: '셀렉터스 활동 종료하기' }))
  const dialog = await screen.findByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })
  fireEvent.click(within(dialog).getByRole('button', { name: '활동 종료' }))
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState(window.history.state, '', window.location.pathname)
  vi.restoreAllMocks()
})

describe('MemberInfoScreen', () => {
  it('renders the member information form from the profile API', async () => {
    authenticate()
    mockMemberApis()
    window.history.replaceState({}, '', '/mypage/member')

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
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)

    expect(await screen.findByText('수신 가능')).toBeTruthy()
    expect(screen.queryByText('secret-uuid')).toBeNull()
    expect(screen.queryByText('99')).toBeNull()
  })

  it('treats a raw READY status payload as connected', async () => {
    authenticate()
    mockMemberApis({ kakao: 'READY' })
    window.history.replaceState({}, '', '/mypage/member')

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
        pathname: '/mypage/member',
        href: originalLocation.href,
        hash: '',
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
      '/mypage/member?code=kakao-code&state=kakao-state',
    )

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
    window.history.replaceState({}, '', '/mypage/member')
    render(<App />)

    await screen.findByRole('button', { name: '카카오 인증하기' })
    fireEvent.click(screen.getByRole('button', { name: '이메일주소 변경하기' }))

    expect(screen.getByRole('alertdialog', { name: '알림' }).textContent).toContain('시연 화면에서는 조회만 가능합니다.')
    expect(fetchSpy.mock.calls.some(([input]) => requestUrl(input).includes('/change'))).toBe(false)
  })

  it('ends selector activity after confirmation and keeps settlement access', async () => {
    authenticate()
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchSpy = mockMemberApis()
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    const pageButton = await screen.findByRole('button', { name: '셀렉터스 활동 종료하기' })
    fireEvent.click(pageButton)
    const dialog = await screen.findByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    const describedById = dialog.getAttribute('aria-describedby')
    expect(describedById).toBeTruthy()
    expect(describedById ? document.getElementById(describedById)?.textContent : null).toBe(
      '종료 즉시 셀렉터스 자격이 사라지며 이 작업은 되돌릴 수 없습니다.\n미정산 금액은 예정대로 정산됩니다.',
    )
    fireEvent.click(within(dialog).getByRole('button', { name: '활동 종료' }))
    expect(confirmSpy).not.toHaveBeenCalled()

    await waitFor(() => expect(fetchSpy.mock.calls.some(([input, init]) => (
      requestUrl(input).endsWith('/api/me/selector-access')
      && init?.method === 'DELETE'
    ))).toBe(true))
    expect(confirmSpy).not.toHaveBeenCalled()
    const deleteCall = fetchSpy.mock.calls.find(([input, init]) => (
      requestUrl(input).endsWith('/api/me/selector-access') && init?.method === 'DELETE'
    ))
    expect((deleteCall?.[1]?.headers as Headers).get('Authorization')).toBe('Bearer demo.jwt')
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}').selectorAccessLevel).toBe('PREVIOUS')
    await waitFor(() => expect(
      screen.getByRole('alertdialog', { name: '알림' }).querySelector('p')?.textContent,
    ).toBe('셀렉터스 활동이 종료되었습니다.\n미정산 금액은 예정대로 정산됩니다.'))
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })).toBeNull()
    expect(screen.queryByRole('button', { name: '셀렉터스 활동 종료하기' })).toBeNull()
  })

  it('does not end selector activity when confirmation is cancelled', async () => {
    authenticate()
    const fetchSpy = mockMemberApis()
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    const pageButton = await screen.findByRole('button', { name: '셀렉터스 활동 종료하기' })
    fireEvent.click(pageButton)
    const dialog = await screen.findByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })
    fireEvent.click(within(dialog).getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })).toBeNull()
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}').selectorAccessLevel).toBe('CURRENT')
    expect(document.activeElement).toBe(pageButton)
  })

  it('closes selector activity confirmation with Escape', async () => {
    authenticate()
    const fetchSpy = mockMemberApis()
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    const pageButton = await screen.findByRole('button', { name: '셀렉터스 활동 종료하기' })
    fireEvent.click(pageButton)
    const dialog = await screen.findByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })).toBeNull()
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)
    expect(document.activeElement).toBe(pageButton)
  })

  it('prevents duplicate selector activity end requests while pending', async () => {
    authenticate()
    let resolveDelete!: (response: Response) => void
    const pendingDelete = new Promise<Response>((resolve) => { resolveDelete = resolve })
    const fetchSpy = mockMemberApis({ endActivity: pendingDelete })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()
    await waitFor(() => expect(fetchSpy.mock.calls.filter(([input, init]) => (
      requestUrl(input).endsWith('/api/me/selector-access') && init?.method === 'DELETE'
    ))).toHaveLength(1))

    expect(screen.queryByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })).toBeNull()
    const pendingButton = screen.getByRole('button', { name: '종료 처리 중...' })
    expect((pendingButton as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(pendingButton)
    expect(fetchSpy.mock.calls.filter(([input, init]) => (
      requestUrl(input).endsWith('/api/me/selector-access') && init?.method === 'DELETE'
    ))).toHaveLength(1)

    resolveDelete(new Response(null, { status: 204 }))
    await waitFor(() => expect(screen.getByRole('alertdialog', { name: '알림' })).toBeTruthy())
  })

  it('keeps current access when ending selector activity fails', async () => {
    authenticate()
    mockMemberApis({
      endActivity: jsonResponse({ message: '활동 종료 요청을 처리하지 못했습니다.' }, 500),
    })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()

    expect((await screen.findByRole('alertdialog', { name: '알림' })).textContent)
      .toContain('활동 종료 요청을 처리하지 못했습니다.')
    expect(screen.queryByRole('dialog', { name: '셀렉터스 활동을 종료할까요?' })).toBeNull()
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}').selectorAccessLevel).toBe('CURRENT')
  })

  it('uses the authoritative access returned after an idempotent end request', async () => {
    authenticate()
    mockMemberApis({
      endActivity: new Response(null, { status: 403 }),
      accessAfterEnd: 'BLACKLIST',
    })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()

    await waitFor(() => expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}').selectorAccessLevel)
      .toBe('BLACKLIST'))
  })

  it('reconciles a committed activity end after an ambiguous network failure', async () => {
    authenticate()
    mockMemberApis({
      endActivity: new TypeError('Failed to fetch'),
      accessAfterEnd: 'PREVIOUS',
    })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()

    await waitFor(() => expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}').selectorAccessLevel)
      .toBe('PREVIOUS'))
    expect(screen.getByRole('alertdialog', { name: '알림' }).textContent)
      .toContain('셀렉터스 활동이 종료되었습니다.')
  })

  it('clears an expired session when the end request returns 401', async () => {
    authenticate()
    mockMemberApis({
      endActivity: jsonResponse({ message: '인증이 필요합니다.' }, 401),
      accessAfterEndResponse: Promise.resolve(jsonResponse({ message: '일시적인 오류입니다.' }, 500)),
    })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()

    await waitFor(() => expect(localStorage.getItem('selectors-auth')).toBeNull())
  })

  it('does not overwrite a replacement login after an end request completes', async () => {
    authenticate()
    let resolveDelete!: (response: Response) => void
    const pendingDelete = new Promise<Response>((resolve) => { resolveDelete = resolve })
    const fetchSpy = mockMemberApis({ endActivity: pendingDelete })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()
    await waitFor(() => expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true))

    const replacementSession = {
      ...authSession,
      accessToken: 'replacement.jwt',
      loginId: 'replacement-user',
      selectorAccessLevel: 'BLACKLIST',
    }
    localStorage.setItem('selectors-auth', JSON.stringify(replacementSession))
    window.dispatchEvent(new CustomEvent('auth:changed'))
    resolveDelete(new Response(null, { status: 204 }))

    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject(replacementSession)
  })

  it('does not overwrite a newer same-token access update', async () => {
    authenticate()
    let resolveAccess!: (response: Response) => void
    const pendingAccess = new Promise<Response>((resolve) => { resolveAccess = resolve })
    const fetchSpy = mockMemberApis({ accessAfterEndResponse: pendingAccess })
    window.history.replaceState({}, '', '/mypage/member')

    render(<App />)
    await confirmSelectorActivityEnd()
    await waitFor(() => expect(fetchSpy.mock.calls.filter(([input]) => (
      requestUrl(input).endsWith('/api/me/selector-access')
    ))).toHaveLength(3))

    localStorage.setItem('selectors-auth', JSON.stringify({
      ...authSession,
      selectorAccessLevel: 'BLACKLIST',
    }))
    window.dispatchEvent(new CustomEvent('auth:changed'))
    resolveAccess(jsonResponse({ accessLevel: 'PREVIOUS' }))

    await new Promise((resolve) => window.setTimeout(resolve, 0))
    expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}').selectorAccessLevel)
      .toBe('BLACKLIST')
  })

  it('unmasks queried member fields', async () => {
    authenticate()
    mockMemberApis()
    window.history.replaceState({}, '', '/mypage/member')
    render(<App />)

    await screen.findByDisplayValue('hiu****')
    fireEvent.click(screen.getByRole('button', { name: '마스킹 해제' }))

    expect(screen.getByDisplayValue('hiuser1')).toBeTruthy()
    expect(screen.getByDisplayValue('홍길동')).toBeTruthy()
    expect(screen.getByDisplayValue('hong@example.com')).toBeTruthy()
    expect(screen.getByDisplayValue('01012340348')).toBeTruthy()
  })

  it('asks for login when the member page is opened anonymously', () => {
    window.history.replaceState({}, '', '/mypage/member')
    render(<App />)

    expect(screen.getByText('회원정보는 로그인 후 확인할 수 있습니다.')).toBeTruthy()
    expect(screen.getByRole('link', { name: '로그인하기' }).getAttribute('href')).toBe('/login')
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
    window.history.replaceState({}, '', '/mypage/member')
    render(<App />)

    expect(await screen.findByText('확인 실패')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toContain('요청한 리소스를 찾을 수 없습니다.')
    expect(screen.queryByText('미연결')).toBeNull()
  })
})
