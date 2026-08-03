import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error Vitest runs this file in Node; the app intentionally omits @types/node.
import { existsSync, readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const tokensCss = readFileSync(`${workspaceRoot}/src/styles/tokens.css`, 'utf8') as string
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8') as string
const compactCss = globalCss.replace(/\s+/g, ' ')

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('reference typography and packaged font', () => {
  it('declares the local variable face and the exact global baseline', () => {
    expect(tokensCss).toMatch(/@font-face\s*{[^}]*font-family:\s*pretendard;[^}]*src:\s*url\('\.\.\/assets\/fonts\/PretendardVariable\.woff2'\) format\('woff2'\);[^}]*font-style:\s*normal;[^}]*font-weight:\s*45 920;[^}]*font-display:\s*swap;/s)
    expect(tokensCss).toContain('font-family: pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif;')
    expect(compactCss).toMatch(/body \{[^}]*font-size: 14px;[^}]*font-weight: 400;[^}]*line-height: 1\.4;[^}]*letter-spacing: -0\.25px;/)
    expect(compactCss).toMatch(/html \{[^}]*-webkit-font-smoothing: antialiased;/)
    expect(compactCss).toMatch(/\.panel-header h1 \{[^}]*font-size: 18px;[^}]*font-weight: 500;[^}]*line-height: 22\.5px;/)
    expect(compactCss).toMatch(/\.aside-tile \{[^}]*font-size: 14px;[^}]*font-weight: 400;/)
    const numericWeights = Array.from(
      globalCss.matchAll(/font-weight:\s*(\d+)\s*;/g),
      (match) => Number(match[1]),
    )
    expect(numericWeights.length).toBeGreaterThan(0)
    expect(numericWeights.every((weight) => [400, 500, 600, 700].includes(weight))).toBe(true)
  })

  it('packages a real WOFF2 and the complete OFL text', () => {
    const fontPath = `${workspaceRoot}/src/assets/fonts/PretendardVariable.woff2`
    const licensePath = `${workspaceRoot}/public/fonts/OFL.txt`
    const canonicalFontPath = `${workspaceRoot}/node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2`
    const canonicalLicensePath = `${workspaceRoot}/node_modules/pretendard/dist/LICENSE.txt`
    expect(existsSync(fontPath)).toBe(true)
    expect(existsSync(licensePath)).toBe(true)
    expect(existsSync(canonicalFontPath)).toBe(true)
    expect(existsSync(canonicalLicensePath)).toBe(true)
    const packagedFont = readFileSync(fontPath) as Uint8Array
    const canonicalFont = readFileSync(canonicalFontPath) as Uint8Array
    const signature = Array.from(packagedFont.subarray(0, 4))
      .map((byte) => String.fromCharCode(byte)).join('')
    const packagedLicense = readFileSync(licensePath) as Uint8Array
    const canonicalLicense = readFileSync(canonicalLicensePath) as Uint8Array
    expect(signature).toBe('wOF2')
    expect(packagedFont.byteLength).toBe(canonicalFont.byteLength)
    expect(packagedFont.every((byte, index) => byte === canonicalFont[index])).toBe(true)
    expect(packagedLicense.byteLength).toBe(canonicalLicense.byteLength)
    expect(packagedLicense.every((byte, index) => byte === canonicalLicense[index])).toBe(true)
    expect(readFileSync(licensePath, 'utf8')).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })

  it('keeps the approved login and application landmarks after the baseline change', () => {
    window.location.hash = '#/login'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '로그인' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '로그인' })).toBeTruthy()
    cleanup()
    window.location.hash = '#/apply/form'
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스 신청하기' })).toBeTruthy()
    expect(within(screen.getByRole('main')).getByText('나의 대표 SNS')).toBeTruthy()
  })
})

describe('shared panel and campaign fidelity', () => {
  it('uses one outer frame without a header divider and removes it on mobile', () => {
    const baseCss = compactCss.slice(0, compactCss.indexOf('@media'))
    const mobileCss = compactCss.slice(compactCss.indexOf('@media (max-width: 480px)'))
    const clientPanelRule = baseCss.match(/\.client-panel \{([^}]*)\}/)?.[1] ?? ''
    const bottomActionRule = baseCss.match(/\.bottom-action \{([^}]*)\}/)?.[1] ?? ''

    expect(clientPanelRule).toContain('border: 1px solid var(--line);')
    expect(clientPanelRule).toContain('box-shadow: none;')
    expect(clientPanelRule).toContain('box-sizing: content-box;')
    expect(clientPanelRule).not.toMatch(/border-(?:left|right): 0;/)
    expect(clientPanelRule).not.toContain('box-shadow: inset')
    expect(baseCss).toMatch(/\.panel-header \{[^}]*border-bottom: 0;/)
    expect(baseCss).toMatch(/\.bottom-action \{[^}]*border-top: 1px solid var\(--line-soft\);/)
    expect(mobileCss).toMatch(/\.client-panel \{[^}]*border: 0;[^}]*box-shadow: none;/)

    const desktopPanelInnerWidth = Number(clientPanelRule.match(/width: (\d+)px;/)?.[1])
    const actionHorizontalInset = Number(bottomActionRule.match(/padding: \d+px (\d+)px;/)?.[1])
    expect(desktopPanelInnerWidth).toBe(552)
    expect(actionHorizontalInset).toBe(16)
    expect(desktopPanelInnerWidth - (actionHorizontalInset * 2)).toBe(520)
  })

  it('uses border-box sizing for responsive panel widths', () => {
    const narrowDesktopStart = compactCss.indexOf('@media (min-width: 1100px) and (max-width: 1151px)')
    const tabletStart = compactCss.indexOf('@media (max-width: 1099px)')
    const mobileStart = compactCss.indexOf('@media (max-width: 480px)')
    const narrowDesktopCss = compactCss.slice(narrowDesktopStart, tabletStart)
    const tabletCss = compactCss.slice(tabletStart, mobileStart)

    expect(narrowDesktopCss).toMatch(/\.client-panel \{[^}]*box-sizing: border-box;/)
    expect(tabletCss).toMatch(/\.client-panel \{[^}]*box-sizing: border-box;/)
  })

  it('removes only the campaign activity-commission claim', () => {
    window.location.hash = '#/campaigns/detail'
    render(<App />)

    expect(screen.queryByText('활동 수수료')).toBeNull()
    expect(screen.queryByText('상품별 최대 8%')).toBeNull()
    const campaignPeriod = screen.getByText('캠페인 기간').closest('dl') as HTMLElement
    expect(within(campaignPeriod).getByText('캠페인 기간')).toBeTruthy()
    expect(within(campaignPeriod).getByText('2026.08.01 - 2026.08.31')).toBeTruthy()

    const participatingBrands = screen.getByLabelText('참여 브랜드')
    expect(within(participatingBrands).getByText('TIME')).toBeTruthy()

    const campaignProductsHeading = screen.getByRole('heading', { level: 2, name: '캠페인 상품' })
    const campaignProducts = campaignProductsHeading.closest('section') as HTMLElement
    expect(within(campaignProducts).getByText('[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)')).toBeTruthy()
  })

  it('retains aggregate, product-level, and settlement commission reporting', () => {
    window.location.hash = '#/performance'
    render(<App />)
    const aggregateCommission = screen.getByText('예상 정산 수수료').closest('.metric-card') as HTMLElement
    expect(within(aggregateCommission).getByText('예상 정산 수수료')).toBeTruthy()
    expect(within(aggregateCommission).getByText('1,284,600')).toBeTruthy()
    expect(within(aggregateCommission).getByText('원')).toBeTruthy()

    cleanup()
    window.location.hash = '#/performance/products'
    render(<App />)
    const productTable = screen.getByRole('table', { name: '상품별 성과 지표' })
    expect(within(productTable).getByRole('cell', { name: '예상 수수료 324,800원' })).toBeTruthy()

    cleanup()
    window.location.hash = '#/settlement'
    render(<App />)
    const settlementSummary = screen.getByText('8월 예상 정산 금액').closest('.settlement-summary') as HTMLElement
    expect(within(settlementSummary).getByText('8월 예상 정산 금액')).toBeTruthy()
    expect(within(settlementSummary).getByText('1,284,600')).toBeTruthy()
    expect(within(settlementSummary).getByText('원')).toBeTruthy()
  })
})
