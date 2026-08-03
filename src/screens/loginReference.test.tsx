import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8').replace(/\s+/g, ' ')

afterEach(() => {
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
    expect(password.closest('label')?.querySelector('.sr-only')?.textContent).toBe('비밀번호')
    expect(userId.getAttribute('placeholder')).toBe('아이디')
    expect(password.getAttribute('placeholder')).toBe('비밀번호')
    expect(password.getAttribute('type')).toBe('password')

    const reveal = screen.getByRole('button', { name: '비밀번호 보기' })
    expect(reveal.getAttribute('type')).toBe('button')
    fireEvent.click(reveal)
    expect(password.getAttribute('type')).toBe('text')
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 숨기기' }))
    expect(password.getAttribute('type')).toBe('password')

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

    expect(screen.queryByText('|', { exact: true })).toBeNull()

    expect(screen.getByRole('heading', { name: 'BIZ회원 로그인' })).toBeTruthy()
    expect(screen.getByText('BIZ회원으로 가입하시는 경우 BIZ회원 로그인 화면에서 로그인 해주세요.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'BIZ회원 로그인 페이지로' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '통합회원 전환' })).toBeTruthy()
    expect(screen.getByText('기존 더현대닷컴 회원이라면 H.Point 통합회원으로 전환해 주세요.')).toBeTruthy()
    expect(screen.getByRole('button', { name: '통합회원 전환하기' })).toBeTruthy()

    const actions = screen.getAllByRole('button').concat(screen.getByRole('button', { name: '로그인' }))
    const uniqueActions = [...new Set(actions)]
    uniqueActions.forEach((action) => expect(action.getAttribute('type')).toBe(action.textContent === '로그인' ? 'submit' : 'button'))

    const hashBeforeAction = window.location.hash
    uniqueActions.forEach((action) => fireEvent.click(action))
    expect(window.location.hash).toBe(hashBeforeAction)
  })

  it('locks the compact reference form geometry', () => {
    expect(compactCss).toMatch(/\.login-form \{[^}]*gap: 8px;[^}]*margin-top: 13px;/)
    expect(compactCss).toMatch(/\.login-field > \.sr-only \{[^}]*position: absolute;/)
    expect(compactCss).toMatch(/\.login-field input \{[^}]*border: 1px solid #d2d2d2;/)
    expect(compactCss).toMatch(/\.login-options \{[^}]*margin-top: 4px;/)
    expect(compactCss).toMatch(/\.login-recent-badge \{[^}]*position: absolute;[^}]*right: 0;[^}]*top: 56px;[^}]*height: 24px;[^}]*background: #32e875;[^}]*color: var\(--black\);/)
    expect(compactCss).toMatch(/\.login-link-row \{[^}]*justify-content: space-between;[^}]*margin-top: 28px;/)
    expect(compactCss).toMatch(/\.login-simple-section \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*gap: 8px;[^}]*margin-top: 40px;/)
    expect(compactCss).toMatch(/\.login-simple-section button \{[^}]*display: flex;[^}]*align-items: center;[^}]*justify-content: center;[^}]*gap: 8px;[^}]*height: 44px;/)
    expect(compactCss).toMatch(/\.login-provider-mark \{[^}]*position: static;/)
    expect(compactCss).toMatch(/\.login-info-section \{[^}]*margin-top: 28px;[^}]*padding-top: 20px;/)
    expect(compactCss).toMatch(/\.login-info-section p \{[^}]*margin-top: 8px;/)
    expect(compactCss).toMatch(/\.login-info-section button \{[^}]*margin-top: 12px;/)
  })
})
