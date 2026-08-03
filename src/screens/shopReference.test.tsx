import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../App'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactCss = readFileSync(`${workspaceRoot}/src/styles/global.css`, 'utf8').replace(/\s+/g, ' ')

const expectedProducts = [
  ['알투더블유', '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)', '151,200원'],
  ['알투더블유', '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)', '151,200원'],
  ['알투더블유', '[더현대Hi 단독] Cale ribbed half sleeve KN (Midnight blue)', '151,200원'],
  ['조 말론 런던', '[단독] 블랙베리 앤 베이 코롱 100ml (+바디 워시 30ml 증정)', '232,750원'],
  ['조 말론 런던', '잉글리쉬 페어 앤 프리지아 코롱 30ml (+코롱 1.5ml 1종 +바디 사쉐 1종 증정)', '104,500원'],
  ['조 말론 런던', '프랑지파니 플라워 코롱 30ml', '108,300원'],
  ['이에르로르', '샴페인 풀문 (Y) 빅 보울 귀걸이 HL2E53215YBXXX', '59,500원'],
  ['이에르로르', '에센스 실버(W) 모이사나이트 플라워 스테이션 팔찌 HL4B61404W9175', '119,000원'],
  ['이에르로르', '[이에르로르] [Premium Plating] H링크 AB(W) 듀오 라인 파베 뱅글 HL3B63304WB', '93,500원'],
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
    expect(compactCss).toMatch(/\.hihi-aside \{[^}]*padding: 0;/)
    expect(compactCss).toMatch(/\.hihi-logo \{[^}]*width: 180px;[^}]*height: 71px;[^}]*margin: 139px auto 39px;/)
    expect(compactCss).toMatch(/\.aside-search \{[^}]*width: 422px;[^}]*height: 52px;[^}]*margin: 0 auto 35px;/)
    expect(compactCss).toMatch(/\.aside-tile-grid \{[^}]*width: 422px;[^}]*margin: 0 auto;/)
    expect(compactCss).toMatch(/\.aside-tile \{[^}]*height: 80px;/)
    expect(compactCss).toMatch(/\.qr-mark \{[^}]*width: 110px;[^}]*height: 110px;/)
  })

  it('matches the vertical live-shop profile without invented profile copy', () => {
    window.location.hash = '#/shop/RC000003200T'
    render(<App />)

    expect(screen.getByText('오셀렉터스')).toBeTruthy()
    expect(screen.queryByText('SELECTOR')).toBeNull()
    expect(screen.queryByText('매일의 취향이 또렷해지는 아이템을 고릅니다.')).toBeNull()
    expect(screen.queryByText(/ITEMS$/)).toBeNull()
    expect(compactCss).toMatch(/\.selector-profile \{[^}]*flex-direction: column;[^}]*text-align: center;/)
    expect(compactCss).toMatch(/\.selector-avatar \{[^}]*width: 74px;[^}]*height: 74px;/)
  })

  it('renders all nine exact live-reference product fixtures in order', () => {
    window.location.hash = '#/shop/RC000003200T'
    const { container } = render(<App />)

    const cards = [...container.querySelectorAll<HTMLElement>('.public-product')]
    expect(cards).toHaveLength(expectedProducts.length)
    expect(cards.map((card) => [
      card.querySelector('span')?.textContent,
      card.querySelector('strong')?.textContent,
      card.querySelector('b')?.textContent,
    ])).toEqual(expectedProducts)
  })
})
