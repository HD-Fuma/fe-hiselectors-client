import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import indexHtml from '../../index.html?raw'
import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8')
const compactCss = globalCss.replace(/\s+/g, ' ')
const shopCss = readFileSync(`${workspaceRoot}/src/styles/shop.css`, 'utf8')
const compactShopCss = shopCss.replace(/\s+/g, ' ')

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('reference shell contract', () => {
  it('declares Korean as the document language', () => {
    expect(indexHtml).toMatch(/<html\s+lang="ko">/)
  })

  it('renders the shared screen landmarks', () => {
    window.location.hash = '#/apply/form'

    render(<App />)

    expect(screen.getByRole('complementary', { name: 'HiHi 바로가기' })).toBeTruthy()
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
    window.location.hash = '#/shop/groups/new'
    const editor = render(<App />)
    const productCheck = editor.container.querySelector<HTMLInputElement>('.picker-row input')
    expect(productCheck?.nextElementSibling?.classList.contains('product-check')).toBe(true)
    expect(compactCss).toContain('input:focus-visible + .custom-check')
    expect(compactShopCss).toContain('input:focus-visible + .product-check')
  })

  it('suppresses pointer focus rings on the SNS picker while preserving keyboard focus', () => {
    expect(compactCss).toMatch(/\.sns-trigger, \.sns-option \{[^}]*outline: none;/)
    expect(compactCss).toMatch(/\.sns-trigger:focus-visible, \.sns-option:focus-visible \{[^}]*outline: 2px solid var\(--black\);[^}]*outline-offset: 2px;/)
  })

  it('locks the reference panel, header, login, and action geometry', () => {
    expect(compactCss).toMatch(/\.app-shell \{[^}]*grid-template-columns: 552px 552px;/)
    expect(compactCss).toMatch(/\.client-panel \{[^}]*width: 552px;/)
    expect(compactCss).toMatch(/\.panel-header \{[^}]*grid-template-columns: 34px minmax\(0, 1fr\) 40px;[^}]*padding: 0 16px;/)
    expect(compactCss).toMatch(/\.panel-header h1 \{[^}]*text-align: left;/)
    expect(compactCss).toMatch(/\.panel-header h1:focus \{[^}]*outline: none;/)
    expect(compactCss).toMatch(/\.client-panel \{[^}]*border: 1px solid var\(--line\);[^}]*box-shadow: none;/)
    expect(compactCss).toMatch(/\.panel-header \{[^}]*border-bottom: 0;/)
    expect(compactCss).toMatch(/\.bottom-action \{[^}]*flex: 0 0 77px;[^}]*padding: 12px 16px;/)
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
    expect(compactCss).toMatch(/\.panel-header h1 \{[^}]*font-size: 18px;[^}]*font-weight: 500;[^}]*line-height: 22\.5px;/)
    expect(compactCss).toMatch(/\.login-info-section h2 \{[^}]*font-size: 17px;[^}]*line-height: 1\.35;[^}]*letter-spacing: -0\.03em;/)
  })

  it('renders a dense fixed QR mark with standard locator and timing structures', () => {
    window.location.hash = '#/login'
    render(<App />)

    const qr = screen.getByRole('img', { name: 'HiHi 앱 설치 QR 코드' })
    expect(qr.getAttribute('viewBox')).toBe('0 0 29 29')
    expect([...qr.querySelectorAll('[data-qr-role="finder"]')].map((finder) => (
      finder.getAttribute('transform')
    ))).toEqual(['translate(0 0)', 'translate(22 0)', 'translate(0 22)'])
    expect(qr.querySelectorAll('[data-qr-role="timing"] rect')).toHaveLength(14)
    expect(qr.querySelector('[data-qr-role="alignment"]')).toBeTruthy()
    expect(qr.querySelectorAll('[data-qr-role="data"] rect').length).toBeGreaterThanOrEqual(180)
    expect(qr.querySelector('image')).toBeNull()
  })

  it('keeps the reference tile direction and preserves the full product-grid width', () => {
    expect(compactCss).toMatch(/\.aside-tile \{[^}]*align-items: center;[^}]*justify-content: flex-end;/)
    expect(compactCss).toMatch(/\.aside-tile img \{[^}]*left: 0;/)
    expect(compactCss).toMatch(/\.screen-scroll \{[^}]*scrollbar-width: none;/)
    expect(compactCss).toMatch(/\.screen-scroll::-webkit-scrollbar \{[^}]*display: none;/)
  })
})
