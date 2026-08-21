import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import indexHtml from '../index.html?raw'
import App from './App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8')
const compactCss = globalCss.replace(/\s+/g, ' ')
const shopCss = readFileSync(`${workspaceRoot}/src/styles/shop.css`, 'utf8')
const compactShopCss = shopCss.replace(/\s+/g, ' ')

beforeEach(() => {
  localStorage.setItem('selectors-auth', JSON.stringify({
    accessToken: 'test.jwt',
    tokenType: 'Bearer',
    role: 'USER',
    loginId: 'selector-user',
    selectorAccessLevel: 'NONE',
  }))
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { id: 1 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
  window.location.hash = ''
})

describe('reference shell contract', () => {
  it('declares Korean as the document language', () => {
    expect(indexHtml).toMatch(/<html\s+lang="ko">/)
  })

  it('renders the shared screen landmarks', () => {
    window.location.hash = '#/apply/form'

    render(<App />)

    expect(screen.getByRole('complementary', { name: '서비스 바로가기' })).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('banner')).toBeTruthy()

    cleanup()
    window.location.hash = '#/shop/RC000003200T'
    render(<App />)
    expect(screen.getByRole('link', { name: '뒤로 가기' })).toBeTruthy()
  })

  it('keeps visible proxy elements immediately after hidden checkboxes', () => {
    window.location.hash = '#/apply/form'
    const { container } = render(<App />)

    const customCheck = container.querySelector<HTMLInputElement>('.term-row input')
    expect(customCheck?.nextElementSibling?.classList.contains('custom-check')).toBe(true)

    cleanup()
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'test.jwt', role: 'USER', selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = '#/shop/groups/new'
    const editor = render(<App />)
    fireEvent.change(screen.getByLabelText('캠페인 선택'), { target: { value: 'season-pick' } })
    const productCheck = editor.container.querySelector<HTMLInputElement>('.picker-row input')
    expect(productCheck?.nextElementSibling?.classList.contains('product-check')).toBe(true)
    expect(compactCss).toContain('input:focus-visible + .custom-check')
    expect(compactShopCss).toContain('input:focus-visible + .product-check')
  })

  it('keeps the styled SNS selector visibly focusable', () => {
    expect(compactCss).toMatch(/\.sns-trigger \{[^}]*display: flex;/)
    expect(compactCss).toMatch(/\.sns-trigger:focus-visible, \.sns-option:focus-visible \{[^}]*outline: 2px solid var\(--black\);[^}]*outline-offset: -2px;/)
  })

  it('opens one SNS listbox from the combobox', () => {
    window.location.hash = '#/apply/form'
    render(<App />)

    const trigger = screen.getByRole('combobox', { name: '대표 SNS' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('listbox', { name: '대표 SNS 선택 목록' })).toBeTruthy()
  })

  it('locks the reference panel, header, login, and action geometry', () => {
    expect(compactCss).toMatch(/\.app-shell \{[^}]*grid-template-columns: 552px 552px;/)
    expect(compactCss).toMatch(/\.client-panel \{[^}]*width: 552px;/)
    expect(compactCss).toMatch(/\.screen-header \{[^}]*grid-template-columns: 36px minmax\(0, 1fr\) 32px;[^}]*padding: 0 16px 0 12px;/)
    expect(compactCss).toMatch(/\.screen-header h1 \{[^}]*text-align: left;/)
    expect(compactCss).toMatch(/\.screen-header h1:focus \{[^}]*outline: none;/)
    expect(compactCss).toMatch(/\.client-panel \{[^}]*border: 1px solid var\(--line\);[^}]*box-shadow: none;/)
    expect(compactCss).toMatch(/\.screen-header \{[^}]*border-bottom: 0;/)
    expect(compactCss).toMatch(/\.bottom-action-bar \{[^}]*flex: 0 0 77px;[^}]*padding: 12px 16px;/)
    expect(compactCss).toMatch(/\.primary-action \{[^}]*width: 100%;[^}]*max-width: 520px;/)
    expect(compactCss).toMatch(/\.login-screen \{[^}]*padding: 24px 16px 40px;/)

    const resolvedDesktopActionWidth = 552 - (16 * 2)
    expect(resolvedDesktopActionWidth).toBe(520)

    const tabletRules = compactCss.slice(compactCss.indexOf('@media (max-width: 1099px)'))
    expect(tabletRules).toMatch(/\.client-panel \{ box-sizing: border-box; width: 100%; max-width: none; margin: 0; \}/)

    const mobileRules = compactCss.slice(compactCss.indexOf('@media (max-width: 480px)'))
    expect(mobileRules).toMatch(/\.client-panel \{[^}]*border: 0;[^}]*box-shadow: none;/)
  })

  it('aligns the login and application section headings without changing the panel header token', () => {
    expect(compactCss).toMatch(/\.login-member-section > h2 \{[^}]*font-size: 18px;/)
    expect(compactCss).toMatch(/\.form-intro h2 \{[^}]*font-size: 18px;/)
    expect(compactCss).toMatch(/\.privacy-section h2, \.terms-section h2 \{[^}]*font-size: 18px;/)
    expect(compactCss).toMatch(/\.privacy-section \{[^}]*margin-top: 65px;/)
    expect(compactCss).toMatch(/\.terms-section \{[^}]*margin-top: 65px;/)
    expect(compactCss).toMatch(/\.screen-header h1 \{[^}]*font-size: 18px;[^}]*font-weight: 500;[^}]*line-height: 22\.5px;/)
    expect(compactCss).toMatch(/\.login-info-section h2 \{[^}]*font-size: 17px;[^}]*line-height: 1\.35;[^}]*letter-spacing: -0\.03em;/)
  })

  it('renders the supplied inverse QR path', () => {
    window.location.hash = '#/login'
    render(<App />)

    const qr = screen.getByRole('img', { name: '앱 설치 QR 코드' })
    expect(compactCss).toMatch(/\.qr-mark \{[^}]*width: 110px;[^}]*height: 110px;[^}]*padding: 0;[^}]*border: 0;/)
    expect(qr.getAttribute('viewBox')).toBe('0 0 33 33')
    expect(qr.querySelector('rect')?.getAttribute('fill')).toBe('#111111')
    expect(qr.querySelectorAll('path')).toHaveLength(1)
    expect(qr.querySelector('path')?.getAttribute('fill')).toBe('#FFFFFF')
    expect(qr.querySelector('path')?.getAttribute('d')).toContain('M 32 32')
    expect(qr.querySelector('image')).toBeNull()
  })

  it('keeps the reference tile direction and preserves the full product-grid width', () => {
    expect(compactCss).toMatch(/\.aside-tile \{[^}]*align-items: center;[^}]*justify-content: flex-end;/)
    expect(compactCss).toMatch(/\.aside-tile img \{[^}]*left: 0;/)
    expect(compactCss).toMatch(/\.screen-scroll \{[^}]*scrollbar-width: none;/)
    expect(compactCss).toMatch(/\.screen-scroll::-webkit-scrollbar \{[^}]*display: none;/)
  })
})
