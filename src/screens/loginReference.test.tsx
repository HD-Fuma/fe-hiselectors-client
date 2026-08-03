import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
// @ts-expect-error The transitive package ships declarations that TypeScript cannot resolve through its exports map.
import { computeAccessibleName } from 'dom-accessibility-api'
import { afterEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8').replace(/\s+/g, ' ')

afterEach(() => {
  vi.restoreAllMocks()
  cleanup()
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

  it('keeps every login action inert while exposing the required alternatives in order', () => {
    window.location.hash = '#/login'
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
    const providerMarks = alternativeGroup.querySelectorAll('.login-provider-mark')
    expect(providerMarks).toHaveLength(6)
    expect([...providerMarks].every((mark) => mark.getAttribute('aria-hidden') === 'true')).toBe(true)
    expect([...providerMarks].every((mark) => mark.tagName.toLowerCase() === 'svg')).toBe(true)
    expect([...providerMarks].every((mark) => mark.querySelector('path, circle, rect, ellipse'))).toBe(true)

    expect(screen.queryByText('|', { exact: true })).toBeNull()

    expect(screen.getByRole('heading', { name: 'BIZ회원 로그인' })).toBeTruthy()
    expect(screen.getByText('BIZ회원으로 가입하시는 경우 BIZ회원 로그인 화면에서 로그인 해주세요.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'BIZ회원 로그인 페이지로' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '통합회원 전환' })).toBeTruthy()
    expect(screen.getByText('기존 더현대닷컴 회원이라면 H.Point 통합회원으로 전환해 주세요.')).toBeTruthy()
    expect(screen.getByRole('button', { name: '통합회원 전환하기' })).toBeTruthy()

    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    const actionNames = [
      '비밀번호 보기',
      '로그인',
      '통합회원 가입하기',
      '아이디/비밀번호 찾기',
      ...expectedMethods,
      'BIZ회원 로그인 페이지로',
      '통합회원 전환하기',
    ]
    actionNames.forEach((name) => {
      const action = screen.getByRole('button', { name })
      expect(action.getAttribute('type')).toBe(name === '로그인' ? 'submit' : 'button')
      const hashBeforeAction = window.location.hash
      fireEvent.click(action)
      expect(window.location.hash).toBe(hashBeforeAction)
    })

    const form = screen.getByRole('button', { name: '로그인' }).closest('form')
    expect(form).not.toBeNull()
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    fireEvent(form as HTMLFormElement, submitEvent)
    expect(submitEvent.defaultPrevented).toBe(true)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(storageSpy).not.toHaveBeenCalled()
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
