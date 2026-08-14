import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
// @ts-expect-error The transitive package ships declarations that TypeScript cannot resolve through its exports map.
import { computeAccessibleName } from 'dom-accessibility-api'
import { afterEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../../App'
import { logout } from '../../auth'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8').replace(/\s+/g, ' ')

afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
})

describe('The Hyundai login reference contract', () => {
  it('renders the complete H.Point member login form with native controls', () => {
    window.location.hash = '#/login'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '로그인' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'H.Point 통합회원 로그인' })).toBeTruthy()

    const userId = screen.getByLabelText('아이디')
    const password = screen.getByLabelText('비밀번호')
    expect(userId.closest('label')?.querySelector('.sr-only')?.textContent).toBe('아이디')
    expect(screen.getByText('비밀번호', { selector: 'label' }).classList.contains('sr-only')).toBe(true)
    expect(computeAccessibleName(password)).toBe('비밀번호')
    expect(userId.getAttribute('placeholder')).toBe('아이디')
    expect(password.getAttribute('placeholder')).toBe('비밀번호')
    expect(password.getAttribute('type')).toBe('password')

    const reveal = screen.getByRole('button', { name: '비밀번호 보기' })
    expect(reveal.getAttribute('type')).toBe('button')
    fireEvent.click(reveal)
    expect(password.getAttribute('type')).toBe('text')
    expect(computeAccessibleName(password)).toBe('비밀번호')
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 숨기기' }))
    expect(password.getAttribute('type')).toBe('password')
    expect(computeAccessibleName(password)).toBe('비밀번호')

    const rememberedId = screen.getByRole('checkbox', { name: '아이디 저장' })
    const autoLogin = screen.getByRole('checkbox', { name: '자동 로그인' })
    expect(rememberedId.tagName).toBe('INPUT')
    expect(autoLogin.tagName).toBe('INPUT')
    expect(screen.getByText('최근에 로그인 했어요.')).toBeTruthy()
  })

  it('calls the user login API and surfaces the backend message only', async () => {
    window.location.hash = '#/login'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        accessToken: 'test.jwt', tokenType: 'Bearer', role: 'USER',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    render(<App />)

    const expectedMethods = [
      '휴대폰 인증 로그인',
      '네이버 로그인',
      '카카오 로그인',
      '토스 로그인',
      'QR 코드 로그인',
      'H.Point APP 로그인',
    ]
    const alternativeGroup = screen.getByRole('group', { name: '간편 로그인' })
    const methods = within(alternativeGroup).getAllByRole('button')
    expect(methods.map((method) => method.textContent)).toEqual(expectedMethods)
    expect(methods).toHaveLength(6)

    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'admin-user' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'demo-pass' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://127.0.0.1:8080/api/auth/user/login',
      expect.objectContaining({
        method: 'POST',
        targetAddressSpace: 'local',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ loginId: 'admin-user', password: 'demo-pass' }),
      }),
    )

    await vi.waitFor(() => {
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        accessToken: 'test.jwt',
        role: 'USER',
      })
      expect(window.location.hash).toBe('#/campaigns')
    })

    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '아이디 또는 비밀번호가 올바르지 않습니다.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    window.location.hash = '#/login'
    cleanup()
    render(<App />)

    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'wrong-pass' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    const dialog = await screen.findByRole('dialog', { name: '로그인 실패' })
    expect(dialog).toBeTruthy()
    expect(within(dialog).getByText('아이디 또는 비밀번호가 올바르지 않습니다.')).toBeTruthy()
  })

  it('explains how to allow local API access when the browser blocks fetch', async () => {
    window.location.hash = '#/login'
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))

    render(<App />)
    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'hiuser1' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: '0000' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    const dialog = await screen.findByRole('dialog', { name: '로그인 실패' })
    expect(within(dialog).getByText(/로컬 네트워크 접근/)).toBeTruthy()
    expect(within(dialog).queryByText('Failed to fetch')).toBeNull()
  })

  it('returns to the requested application form after login', async () => {
    sessionStorage.setItem('postLoginRedirect', '#/apply/form')
    window.location.hash = '#/login'
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/generations/active')
        ? new Response(JSON.stringify({ data: { id: 1 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
        : new Response(JSON.stringify({
          data: { accessToken: 'test.jwt', tokenType: 'Bearer', role: 'USER' },
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
    ))

    render(<App />)
    fireEvent.change(screen.getByLabelText('아이디'), { target: { value: 'selector-user' } })
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'demo-pass' } })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await vi.waitFor(() => {
      expect(window.location.hash).toBe('#/apply/form')
      expect(sessionStorage.getItem('postLoginRedirect')).toBeNull()
    })
  })

  it('clears the auth session and redirects to login on logout', () => {
    localStorage.setItem('selectors-auth', JSON.stringify({ accessToken: 'keep.me', role: 'USER' }))
    window.location.hash = '#/campaigns'

    render(<App />)

    expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull()

    logout()

    expect(localStorage.getItem('selectors-auth')).toBeNull()
    expect(window.location.hash).toBe('#/login')
  })

  it('locks the compact reference form geometry', () => {
    expect(compactCss).toMatch(/\.login-form \{[^}]*gap: 8px;[^}]*margin-top: 13px;/)
    expect(compactCss).toMatch(/\.login-field > \.sr-only \{[^}]*position: absolute;/)
    expect(compactCss).toMatch(/\.login-field input \{[^}]*border: 1px solid #d2d2d2;/)
    expect(compactCss).toMatch(/\.login-field input:focus-visible \{[^}]*outline: 2px solid #2268e8;[^}]*outline-offset: -2px;/)
    expect(compactCss).toMatch(/\.login-options \{[^}]*margin-top: 4px;/)
    expect(compactCss).toMatch(/\.login-recent-badge \{[^}]*position: absolute;[^}]*right: 0;[^}]*top: 56px;[^}]*height: 24px;[^}]*background: #32e875;[^}]*color: var\(--black\);/)
    expect(compactCss).toMatch(/\.login-link-row \{[^}]*justify-content: space-between;[^}]*margin-top: 28px;/)
    expect(compactCss).toMatch(/\.login-simple-section \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*gap: 8px;[^}]*margin-top: 40px;/)
    expect(compactCss).toMatch(/\.login-simple-section button \{[^}]*display: flex;[^}]*align-items: center;[^}]*justify-content: center;[^}]*gap: 8px;[^}]*height: 44px;/)
    expect(compactCss).toMatch(/\.login-info-section \{[^}]*margin-top: 28px;[^}]*padding-top: 20px;/)
    expect(compactCss).toMatch(/\.login-info-section \+ \.login-info-section \{[^}]*margin-top: 40px;/)
    expect(compactCss).toMatch(/\.login-info-section p \{[^}]*margin-top: 8px;/)
    expect(compactCss).toMatch(/\.login-info-section button \{[^}]*margin-top: 12px;/)
  })
})
