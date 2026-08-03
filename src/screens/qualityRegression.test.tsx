import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8').replace(/\s+/g, ' ')
const tokensCss = readFileSync(`${workspaceRoot}/src/styles/tokens.css`, 'utf8')

function relativeLuminance(hex: string) {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((channel) => {
    const value = Number.parseInt(channel, 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }) ?? []

  return (channels[0] * 0.2126) + (channels[1] * 0.7152) + (channels[2] * 0.0722)
}

afterEach(() => {
  cleanup()
  window.location.hash = ''
  document.title = 'Selectors Client'
})

describe('quality regression contracts', () => {
  it('fits the two-column shell at intermediate desktop widths and lets a short aside scroll', () => {
    const intermediateRules = globalCss.slice(globalCss.indexOf('@media (min-width: 1100px) and (max-width: 1151px)'))

    expect(intermediateRules).toMatch(/\.app-shell \{[^}]*grid-template-columns: repeat\(2, minmax\(0, 552px\)\);[^}]*gap: clamp\(0px, calc\(100vw - 1104px\), 48px\);/)
    expect(intermediateRules).toMatch(/\.hihi-aside, \.client-panel \{[^}]*width: 100%;/)
    expect(globalCss).toMatch(/\.hihi-aside \{[^}]*overflow-x: hidden;[^}]*overflow-y: auto;/)
  })

  it('announces and focuses a newly selected hash screen', async () => {
    window.location.hash = '#/screens'
    render(<App />)

    window.location.hash = '#/apply'
    fireEvent(window, new HashChangeEvent('hashchange'))

    const heading = await screen.findByRole('heading', { level: 1, name: '셀렉터스 신청하기' })
    await waitFor(() => expect(document.activeElement).toBe(heading))
    expect(heading.getAttribute('tabindex')).toBe('-1')
    expect(document.title).toBe('셀렉터스 신청하기 | Selectors Client')
    expect(screen.getByText('셀렉터스 신청하기 화면', { selector: '.route-announcement' })).toBeTruthy()
  })

  it('keeps secondary text at WCAG AA contrast on white and surface backgrounds', () => {
    const gray500 = tokensCss.match(/--gray-500:\s*(#[a-f\d]{6})/i)?.[1]
    expect(gray500).toBeTruthy()

    ;['#ffffff', '#f7f7f7'].forEach((background) => {
      const contrast = (relativeLuminance(background) + 0.05) / (relativeLuminance(gray500 as string) + 0.05)
      expect(contrast).toBeGreaterThanOrEqual(4.5)
    })
  })

  it('preserves accessible mobile metric labels while visually compacting the table', () => {
    window.location.hash = '#/performance/products'
    render(<App />)

    const table = screen.getByRole('table', { name: '상품별 성과 지표' })
    expect(within(table).getByRole('cell', { name: '클릭 2,840' })).toBeTruthy()
    expect(within(table).getByRole('cell', { name: '예상 수수료 324,800원' })).toBeTruthy()

    const mobileRules = globalCss.slice(globalCss.indexOf('@media (max-width: 480px)'))
    expect(mobileRules).not.toMatch(/\.performance-table-header \{[^}]*display: none;/)
    expect(mobileRules).toMatch(/\.performance-table-header \{[^}]*position: absolute;[^}]*clip: rect\(0, 0, 0, 0\);/)
  })

  it('does not expose a fake search landmark without a search control', () => {
    window.location.hash = '#/screens'
    render(<App />)

    expect(screen.queryByRole('search')).toBeNull()
  })
})
