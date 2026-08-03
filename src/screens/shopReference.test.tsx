import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactGlobalCss = readFileSync(
  `${workspaceRoot}/src/styles/global.css`,
  'utf8',
).replace(/\s+/g, ' ')
const compactShopCss = readFileSync(
  `${workspaceRoot}/src/styles/shop.css`,
  'utf8',
).replace(/\s+/g, ' ')

const expectedGroups = [
  [
    '귀걸이',
    [
      '에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX',
      '[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX',
    ],
  ],
  [
    '여름의 결',
    [
      '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)',
      '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)',
    ],
  ],
  ['블루 니트', ['[더현대Hi 단독] Cale ribbed half sleeve KN (Midnight blue)']],
  ['블랙베리 향', ['[단독] 블랙베리 앤 베이 코롱 100ml (+바디 워시 30ml 증정)']],
  ['프리지아', ['잉글리쉬 페어 앤 프리지아 코롱 30ml (+코롱 1.5ml 1종 +바디 사쉐 1종 증정)']],
  ['프랑지파니', ['프랑지파니 플라워 코롱 30ml']],
] as const

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('HiHi aside and public shop reference contract', () => {
  it('uses the exact HiHi aside labels and installation copy', () => {
    window.location.hash = '#/shop/RC000003200T'
    render(<App />)

    const aside = screen.getByRole('complementary', { name: 'HiHi 바로가기' })
    const asideQueries = within(aside)
    expect(asideQueries.getByText('검색어를 입력해 보세요.')).toBeTruthy()
    ;['더현대 기프트', '라이브', '이벤트', '예약/웨이팅', '콘텐츠', '아이콘샵'].forEach((label) => {
      expect(asideQueries.getByRole('link', { name: label })).toBeTruthy()
    })
    expect(asideQueries.getByText('앱 설치하고')).toBeTruthy()
    expect(asideQueries.getByText('다양한 더현대Hi 만나러 가기!')).toBeTruthy()
    expect(asideQueries.queryByText('HiHi 앱에서 더 편하게')).toBeNull()
  })

  it('locks the supplied 963px aside geometry', () => {
    expect(compactGlobalCss).toMatch(/\.hihi-aside \{[^}]*padding: 0;/)
    expect(compactGlobalCss).toMatch(/\.hihi-logo \{[^}]*width: 180px;[^}]*height: 71px;[^}]*margin: 139px auto 39px;/)
    expect(compactGlobalCss).toMatch(/\.aside-search \{[^}]*width: 422px;[^}]*height: 52px;[^}]*margin: 0 auto 35px;/)
    expect(compactGlobalCss).toMatch(/\.aside-tile-grid \{[^}]*width: 422px;[^}]*margin: 0 auto;/)
    expect(compactGlobalCss).toMatch(/\.aside-tile \{[^}]*height: 80px;/)
    expect(compactGlobalCss).toMatch(/\.qr-mark \{[^}]*width: 110px;[^}]*height: 110px;/)
  })

  it('matches the avatar, badge, and byunjjii profile without the old category identity', () => {
    window.location.hash = '#/shop/RC000003200T'
    const { container } = render(<App />)

    const badge = screen.getByAltText('인플루언서 뱃지')
    expect(badge.getAttribute('width')).toBe('32')
    expect(badge.getAttribute('height')).toBe('32')
    expect(container.querySelector('.selector-avatar-placeholder')).toBeTruthy()
    expect(container.querySelector('.selector-profile-thumb')?.contains(badge)).toBe(true)
    expect(screen.getByText('byunjjii')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'byunjjii의 ME스페이스' })).toBeTruthy()
    expect(screen.queryByText('오셀렉터스')).toBeNull()
    ;['패션', '뷰티', '주얼리'].forEach((category) => {
      expect(screen.queryByRole('heading', { name: category })).toBeNull()
    })
  })

  it('renders the first six provider-backed product groups in reference order', () => {
    window.location.hash = '#/shop/RC000003200T'
    const { container } = render(<App />)

    const groups = [...container.querySelectorAll<HTMLElement>('[data-shop-group-id]')]
    expect(groups).toHaveLength(expectedGroups.length)
    expect(groups.map((group) => [
      within(group).getByRole('heading', { level: 2 }).textContent,
      [...group.querySelectorAll<HTMLElement>('.shop-product-name')]
        .map((productName) => productName.textContent),
    ])).toEqual(expectedGroups)
  })

  it('locks the reference shop geometry', () => {
    expect(compactGlobalCss).toMatch(/\.panel-header \{[^}]*flex: 0 0 52px;[^}]*height: 52px;[^}]*padding: 0 16px;/)
    expect(compactShopCss).toMatch(/\.public-shop-screen \{[^}]*padding: 0 16px;/)
    expect(compactShopCss).toMatch(/\.selector-profile \{[^}]*align-items: flex-start;[^}]*gap: 16px;[^}]*padding: 16px 0 24px;/)
    expect(compactShopCss).toMatch(/\.selector-profile-thumb \{[^}]*position: relative;[^}]*width: 74px;[^}]*height: 79px;/)
    expect(compactShopCss).toMatch(/\.selector-avatar-placeholder \{[^}]*width: 74px;[^}]*height: 74px;[^}]*border-radius: 999px;[^}]*no_avatar\.png/)
    expect(compactShopCss).toMatch(/\.selector-badge \{[^}]*width: 32px;[^}]*height: 32px;/)
    expect(compactShopCss).toMatch(/\.selector-profile h2 \{[^}]*font-size: 24px;[^}]*font-weight: 700;[^}]*line-height: 30px;/)
    expect(compactShopCss).toMatch(/\.me-space-button \{[^}]*gap: 4px;[^}]*width: 100%;[^}]*max-width: 520px;[^}]*height: 44px;[^}]*font-size: 14px;[^}]*line-height: 14px;/)
    expect(compactShopCss).toMatch(/\.shop-product-grid \{[^}]*grid-template-columns: 168px 168px;[^}]*column-gap: 16px;/)
    expect(compactShopCss).toMatch(/\.shop-product img \{[^}]*width: 168px;[^}]*height: 168px;[^}]*aspect-ratio: 1;/)
    expect(compactShopCss).toMatch(/\.shop-group-heading \{[^}]*font-size: 18px;[^}]*font-weight: 700;[^}]*line-height: 24px;/)
    expect(compactShopCss).toMatch(/\.shop-group-heading-row \{[^}]*margin-bottom: 24px;/)
    expect(compactShopCss).toMatch(/\.shop-product-pricing del \{[^}]*color: var\(--gray-500\);[^}]*font-size: 12px;/)
    expect(compactShopCss).toMatch(/\.shop-product-pricing > span \{[^}]*color: #[0-9a-f]{6};[^}]*font-weight: 700;/)
    expect(compactShopCss).toMatch(/\.shop-product-pricing > strong \{[^}]*font-size: 16px;[^}]*font-weight: 700;/)
    expect(compactShopCss).toMatch(/\.shop-disclosure \{[^}]*font-size: 13px;[^}]*line-height: 18px;/)

    const mobileRules = compactShopCss.slice(compactShopCss.indexOf('@media (max-width: 480px)'))
    expect(mobileRules).toMatch(/\.shop-product-grid \{[^}]*grid-template-columns: 168px 168px;[^}]*column-gap: 16px;/)

    expect(552 - (16 * 2)).toBe(520)
    expect((168 * 2) + 16).toBeLessThanOrEqual(390 - (16 * 2))
  })
})
