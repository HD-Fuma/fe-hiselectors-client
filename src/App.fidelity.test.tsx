import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error Vitest runs this file in Node; the app intentionally omits @types/node.
import { existsSync, readFileSync } from 'node:fs'

import App from './App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const tokensCss = readFileSync(`${workspaceRoot}/src/styles/tokens.css`, 'utf8') as string
const globalCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8') as string
const compactCss = globalCss.replace(/\s+/g, ' ')

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

describe('reference typography and packaged font', () => {
  it('declares the local variable face and the exact global baseline', () => {
    expect(tokensCss).toMatch(/@font-face\s*{[^}]*font-family:\s*pretendard;[^}]*src:\s*url\('\.\.\/assets\/fonts\/PretendardVariable\.woff2'\) format\('woff2'\);[^}]*font-style:\s*normal;[^}]*font-weight:\s*45 920;[^}]*font-display:\s*swap;/s)
    expect(tokensCss).toContain('font-family: pretendard, "pretendard Fallback", "Microsoft YaHei", "PingFang SC", sans-serif;')
    expect(compactCss).toMatch(/body \{[^}]*font-size: 14px;[^}]*font-weight: 400;[^}]*line-height: 1\.4;[^}]*letter-spacing: -0\.25px;/)
    expect(compactCss).toMatch(/html \{[^}]*-webkit-font-smoothing: antialiased;/)
    expect(compactCss).toMatch(/\.screen-header h1 \{[^}]*font-size: 18px;[^}]*font-weight: 500;[^}]*line-height: 22\.5px;/)
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
    const packagedLicense = readFileSync(licensePath, 'utf8').replace(/\r\n/g, '\n')
    const canonicalLicense = readFileSync(canonicalLicensePath, 'utf8').replace(/\r\n/g, '\n')
    expect(signature).toBe('wOF2')
    expect(packagedFont.byteLength).toBe(canonicalFont.byteLength)
    expect(packagedFont.every((byte, index) => byte === canonicalFont[index])).toBe(true)
    expect(packagedLicense).toBe(canonicalLicense)
    expect(packagedLicense).toContain('SIL OPEN FONT LICENSE Version 1.1')
  })

  it('keeps the approved login and application landmarks after the baseline change', () => {
    window.history.replaceState({}, '', '/login')
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '로그인' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '로그인' })).toBeTruthy()
    cleanup()
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'test.jwt',
      tokenType: 'Bearer',
      role: 'USER',
      loginId: 'selector-user',
      selectorAccessLevel: 'NONE',
    }))
    window.history.replaceState({}, '', '/apply/form')
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
    const bottomActionRule = baseCss.match(/\.bottom-action-bar \{([^}]*)\}/)?.[1] ?? ''

    expect(clientPanelRule).toContain('border: 1px solid var(--line);')
    expect(clientPanelRule).toContain('box-shadow: none;')
    expect(clientPanelRule).toContain('box-sizing: content-box;')
    expect(clientPanelRule).not.toMatch(/border-(?:left|right): 0;/)
    expect(clientPanelRule).not.toContain('box-shadow: inset')
    expect(baseCss).toMatch(/\.screen-header \{[^}]*border-bottom: 0;/)
    expect(baseCss).toMatch(/\.bottom-action-bar \{[^}]*border-top: 1px solid var\(--line-soft\);/)
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
    const mobileStart = compactCss.indexOf('@media (max-width: 480px)', tabletStart)
    const narrowDesktopCss = compactCss.slice(narrowDesktopStart, tabletStart)
    const tabletCss = compactCss.slice(tabletStart, mobileStart)

    expect(narrowDesktopCss).toMatch(/\.client-panel \{[^}]*box-sizing: border-box;/)
    expect(tabletCss).toMatch(/\.client-panel \{[^}]*box-sizing: border-box;/)
  })

  it('removes only the campaign activity-commission claim', () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'test.jwt', role: 'USER', selectorAccessLevel: 'CURRENT',
    }))
    window.history.replaceState({}, '', '/campaigns/season-pick')
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

  it('retains aggregate, product-level, and settlement commission reporting', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'test.jwt', role: 'USER', selectorAccessLevel: 'CURRENT',
    }))
    const product = {
      productId: 1,
      productCode: 'PRODUCT-1',
      productName: '테스트 상품',
      brandName: '테스트 브랜드',
      thumbnailUrl: '/product.jpg',
      clickCount: 2840,
      conversionCount: 92,
      conversionAmount: 10_826_667,
      conversionRate: 3.24,
      estimatedSettlementAmount: 324_800,
    }
    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => Promise.resolve(
      String(input).includes('/api/performance/products')
        ? new Response(JSON.stringify({ data: { activityMonth: '2026-08', conversionCount: 386, totalProductCount: 1, products: [product] } }))
        : String(input).includes('/api/performance/summary')
        ? new Response(JSON.stringify({ data: {
          activityMonth: '2026-08',
          settlementRate: 3,
          metrics: { estimatedSettlementAmount: 1_284_600, conversionAmount: 42_820_000, conversionCount: 386, clickCount: 12_840, conversionRate: 3.01 },
          previousMonthMetrics: { estimatedSettlementAmount: 1_057_300, conversionAmount: 36_660_000, conversionCount: 342, clickCount: 10_863, conversionRate: 2.61 },
          trends: [{ date: '2026-08-01', clickCount: 420, conversionCount: 12, conversionAmount: 1_340_000 }],
          topProducts: [product],
        } }))
        : new Response(JSON.stringify({ data: { accessLevel: 'CURRENT' } })),
    ))
    window.history.replaceState({}, '', '/performance')
    render(<App />)
    expect(screen.getByRole('heading', { name: '셀렉터스 성과' })).toBeTruthy()
    expect((screen.getByRole('combobox', { name: '조회 월 선택' }) as HTMLSelectElement).value).toBe('2026-08')
    expect(screen.getByText('구매 전환 금액', { selector: '.metric-card > span' })).toBeTruthy()
    expect(screen.getByText('구매 전환 수', { selector: '.metric-card > span' })).toBeTruthy()
    expect(screen.getByText('누적 클릭 수', { selector: '.metric-card > span' })).toBeTruthy()
    expect(screen.getByText('전환율')).toBeTruthy()
    expect(await screen.findByRole('img', {
      name: '2026년 8월 클릭, 구매 전환 수, 구매 전환 금액 추이',
    })).toBeTruthy()
    const aggregateCommission = screen.getByText('예상 정산 수수료').closest('.metric-card') as HTMLElement
    expect(within(aggregateCommission).getByText('예상 정산 수수료')).toBeTruthy()
    expect(within(aggregateCommission).getByText('1,284,600')).toBeTruthy()
    expect(within(aggregateCommission).getByText('원')).toBeTruthy()

    cleanup()
    window.history.replaceState({}, '', '/performance/products')
    render(<App />)
    const productTable = screen.getByRole('table', { name: '상품별 성과 지표' })
    expect(await within(productTable).findByRole('cell', { name: '예상 수수료 324,800원' })).toBeTruthy()

    cleanup()
    window.history.replaceState({}, '', '/settlement')
    vi.mocked(globalThis.fetch).mockImplementation((input) => Promise.resolve(
      String(input).endsWith('/api/me/selector-access')
        ? new Response(JSON.stringify({ data: { accessLevel: 'CURRENT' } }))
        : String(input).includes('/histories')
        ? new Response(JSON.stringify({ data: { selectedYear: 2026, availableYears: [2026], histories: [] } }))
        : new Response(JSON.stringify({
          data: {
            settlementId: 1,
            selectorsId: 1,
            selectorsCode: 'SELECTORS-1',
            selectorsNickname: '셀렉터스',
            activityMonth: '2026-08',
            settlementMonth: '2026-09',
            paymentMonth: '2026-10',
            confirmedPurchaseCount: 386,
            confirmedSalesAmount: 42_820_000,
            settlementRate: 3,
            settlementAmount: 1_284_600,
            status: 'CALCULATING',
            calculatedAt: '2026-09-01T00:00:00',
            updatedAt: '2026-09-01T00:00:00',
            provisionalEstimate: {
              purchaseCount: 386,
              settlementAmount: 1_284_600,
            },
          },
        })),
    ))
    render(<App />)
    const settlementSummary = (await screen.findByText('2026년 8월 활동 예상 수수료')).closest('.settlement-summary') as HTMLElement
    expect(within(settlementSummary).getByText('2026년 8월 활동 예상 수수료')).toBeTruthy()
    expect(within(settlementSummary).getByText('1,284,600')).toBeTruthy()
    expect(within(settlementSummary).getByText('원')).toBeTruthy()
  })
})
