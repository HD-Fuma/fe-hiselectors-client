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
    window.location.hash = '#/shop/RC000004900T'
    render(<App />)
    expect(screen.getByRole('link', { name: '뒤로 가기' })).toBeTruthy()
  })

  it('keeps visible proxy elements immediately after hidden checkboxes', () => {
    window.location.hash = '#/apply/form'
    const { container } = render(<App />)

    const customCheck = container.querySelector<HTMLInputElement>('.term-row input')
    expect(customCheck?.nextElementSibling?.classList.contains('custom-check')).toBe(true)

    cleanup()
    window.location.hash = '#/shop/groups/edit'
    const editor = render(<App />)
    const productCheck = editor.container.querySelector<HTMLInputElement>('.picker-row input')
    expect(productCheck?.nextElementSibling?.classList.contains('product-check')).toBe(true)
    expect(compactCss).toContain('input:focus-visible + .custom-check')
    expect(compactCss).toContain('input:focus-visible + .product-check')
  })

  it('locks the reference panel, header, login, and action geometry', () => {
    expect(compactCss).toMatch(/\.app-shell \{[^}]*grid-template-columns: 552px 552px;/)
    expect(compactCss).toMatch(/\.client-panel \{[^}]*width: 552px;/)
    expect(compactCss).toMatch(/\.panel-header \{[^}]*grid-template-columns: 34px minmax\(0, 1fr\) 40px;[^}]*padding: 0 16px;/)
    expect(compactCss).toMatch(/\.panel-header h1 \{[^}]*text-align: left;/)
    expect(compactCss).toMatch(/\.bottom-action \{[^}]*flex: 0 0 77px;[^}]*padding: 12px 16px;/)
    expect(compactCss).toMatch(/\.login-screen \{[^}]*padding: 48px 16px 32px;/)

    const tabletRules = compactCss.slice(compactCss.indexOf('@media (max-width: 1099px)'))
    expect(tabletRules).toMatch(/\.client-panel \{ width: 100%; max-width: none; margin: 0; \}/)
  })
})
