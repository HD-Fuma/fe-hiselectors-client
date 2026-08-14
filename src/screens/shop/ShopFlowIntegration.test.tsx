import { StrictMode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
// @ts-expect-error Vitest runs this file in Node; the app intentionally omits @types/node.
import { readFileSync } from 'node:fs'

import App from '../../App'
import { useShopDemo } from './ShopDemoContext'
import { initialShopGroups, shopCampaigns } from './shopData'

const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactShopCss = readFileSync(
  `${workspaceRoot}/src/styles/shop.css`,
  'utf8',
).replace(/\s+/g, ' ')

const seasonProductNames = [
  '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)',
  '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)',
  '[더현대Hi 단독] Cale ribbed half sleeve KN (Midnight blue)',
  '[단독] 블랙베리 앤 베이 코롱 100ml (+바디 워시 30ml 증정)',
] as const

function ShopFlowStateProbe() {
  const { state } = useShopDemo()
  const styleGroup = state.groups.find(({ name }) => name === '스타일 셀렉션')

  return (
    <>
      <output aria-label="스타일 셀렉션 상품">
        {JSON.stringify(styleGroup?.productIds ?? null)}
      </output>
      <output aria-label="빠른 추가 드래프트">
        {JSON.stringify(state.quickAddDraft)}
      </output>
      <output aria-label="생성한 상품 그룹">
        {JSON.stringify(state.groups.find(({ id }) => id === 'demo-14') ?? null)}
      </output>
    </>
  )
}

function SetCampaignStatusControl() {
  const { setStatus } = useShopDemo()

  return (
    <button onClick={() => setStatus('상품을 그룹에 담았어요.')} type="button">
      테스트 상태 설정
    </button>
  )
}

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('campaign quick-add integration', () => {
  it('opens with four and prevents zero', () => {
    window.location.hash = '#/campaigns/detail'
    render(<App />)

    const trigger = screen.getByRole('button', { name: '상품 그룹에 담기' })
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: '상품 그룹에 담기' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(within(dialog).getByRole('button', { name: '닫기' })).toBeTruthy()
    expect(within(dialog).getByText('4개 선택')).toBeTruthy()

    const checkboxes = within(dialog).getAllByRole('checkbox') as HTMLInputElement[]
    expect(checkboxes).toHaveLength(4)
    expect(checkboxes.map((checkbox) => checkbox.getAttribute('aria-label'))).toEqual(
      seasonProductNames,
    )
    expect(checkboxes.every((checkbox) => checkbox.checked)).toBe(true)
    expect(shopCampaigns[0].productIds).toEqual([
      'knit-ivory',
      'knit-blue',
      'knit-midnight',
      'cologne-blackberry',
    ])

    const groupButtons = initialShopGroups.map(({ name }) => (
      within(dialog).getByRole('button', { name })
    ))
    expect(groupButtons).toHaveLength(13)
    expect(within(dialog).getByRole('button', { name: '스타일 셀렉션' })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: '새 상품 그룹 만들기' })).toBeTruthy()

    for (const checkbox of checkboxes.slice(0, 3)) {
      fireEvent.click(checkbox)
    }

    expect(within(dialog).getByText('1개 선택')).toBeTruthy()
    expect(checkboxes[3].checked).toBe(true)
    expect(checkboxes[3].disabled).toBe(true)
    fireEvent.click(checkboxes[3])
    expect(within(dialog).getByText('1개 선택')).toBeTruthy()

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '상품 그룹에 담기' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })

  it('adds deduplicated products to existing group', () => {
    window.location.hash = '#/campaigns/detail'
    render(<App shopProbe={<ShopFlowStateProbe />} />)

    expect(JSON.parse(
      screen.getByRole('status', { name: '스타일 셀렉션 상품' }).textContent ?? 'null',
    )).toEqual(['knit-ivory', 'earring-essence'])

    fireEvent.click(screen.getByRole('button', { name: '상품 그룹에 담기' }))
    const dialog = screen.getByRole('dialog', { name: '상품 그룹에 담기' })
    fireEvent.click(within(dialog).getByRole('button', { name: '스타일 셀렉션' }))

    expect(screen.queryByRole('dialog', { name: '상품 그룹에 담기' })).toBeNull()
    expect(screen.getByText('상품을 그룹에 담았어요.').getAttribute('role')).toBe('status')
    expect(JSON.parse(
      screen.getByRole('status', { name: '스타일 셀렉션 상품' }).textContent ?? 'null',
    )).toEqual([
      'knit-ivory',
      'earring-essence',
      'knit-blue',
      'knit-midnight',
      'cologne-blackberry',
    ])
  })

  it('consumes a new-group draft once', async () => {
    window.location.hash = '#/campaigns/detail'
    render(
      <StrictMode>
        <App shopProbe={<ShopFlowStateProbe />} />
      </StrictMode>,
    )

    const draftOutput = screen.getByRole('status', { name: '빠른 추가 드래프트' })
    expect(draftOutput.textContent).toBe('null')

    fireEvent.click(screen.getByRole('button', { name: '상품 그룹에 담기' }))
    const dialog = screen.getByRole('dialog', { name: '상품 그룹에 담기' })
    fireEvent.click(within(dialog).getByRole('button', { name: '새 상품 그룹 만들기' }))

    expect(JSON.parse(draftOutput.textContent ?? 'null')).toEqual({
      campaignId: 'season-pick',
      productIds: ['knit-ivory', 'knit-blue', 'knit-midnight', 'cologne-blackberry'],
    })
    await waitFor(() => expect(window.location.hash).toBe('#/shop/groups/new/season-pick'))

    expect(
      (screen.getByRole('combobox', { name: '캠페인 선택' }) as HTMLSelectElement).value,
    ).toBe('season-pick')
    expect(screen.getByText('4개 선택')).toBeTruthy()
    expect(seasonProductNames.map((productName) => (
      (screen.getByRole('checkbox', { name: productName }) as HTMLInputElement).checked
    ))).toEqual([true, true, true, true])
    await waitFor(() => expect(draftOutput.textContent).toBe('null'))

    fireEvent.click(screen.getByRole('link', { name: '뒤로 가기' }))
    await waitFor(() => expect(window.location.hash).toBe('#/campaigns/detail'))
    expect(draftOutput.textContent).toBe('null')

    window.location.hash = '#/shop/groups/new/season-pick'
    await waitFor(() => expect(
      screen.getByRole('heading', { level: 1, name: '상품 그룹 만들기' }),
    ).toBeTruthy())
    expect(screen.getByText('0개 선택')).toBeTruthy()
    expect(seasonProductNames.map((productName) => (
      (screen.getByRole('checkbox', { name: productName }) as HTMLInputElement).checked
    ))).toEqual([false, false, false, false])

    fireEvent.click(screen.getByRole('link', { name: '뒤로 가기' }))
    await waitFor(() => expect(window.location.hash).toBe('#/campaigns/detail'))
    fireEvent.click(screen.getByRole('button', { name: '상품 그룹에 담기' }))
    fireEvent.click(within(
      screen.getByRole('dialog', { name: '상품 그룹에 담기' }),
    ).getByRole('button', { name: '닫기' }))

    expect(screen.queryByRole('dialog', { name: '상품 그룹에 담기' })).toBeNull()
    expect(draftOutput.textContent).toBe('null')
  })

  it('clears draft after create save', async () => {
    window.location.hash = '#/campaigns/detail'
    render(<App shopProbe={<ShopFlowStateProbe />} />)

    fireEvent.click(screen.getByRole('button', { name: '상품 그룹에 담기' }))
    fireEvent.click(within(
      screen.getByRole('dialog', { name: '상품 그룹에 담기' }),
    ).getByRole('button', { name: '새 상품 그룹 만들기' }))
    await waitFor(() => expect(window.location.hash).toBe('#/shop/groups/new/season-pick'))

    fireEvent.change(screen.getByRole('textbox', { name: '상품 그룹 이름' }), {
      target: { value: '시즌 셀렉션' },
    })
    fireEvent.click(screen.getByRole('button', { name: '상품 그룹 저장하기' }))

    await waitFor(() => expect(window.location.hash).toBe('#/shop/RC000003200T'))
    expect(screen.getByText('상품 그룹을 만들었어요.').getAttribute('role')).toBe('status')
    expect(JSON.parse(
      screen.getByRole('status', { name: '생성한 상품 그룹' }).textContent ?? 'null',
    )).toEqual({
      id: 'demo-14',
      name: '시즌 셀렉션',
      createdAt: '2026.08.04',
      campaignId: 'season-pick',
      productIds: ['knit-ivory', 'knit-blue', 'knit-midnight', 'cologne-blackberry'],
    })
    expect(screen.getByRole('status', { name: '빠른 추가 드래프트' }).textContent).toBe('null')

    window.location.hash = '#/shop/groups/new/season-pick'
    await waitFor(() => expect(
      screen.getByRole('heading', { level: 1, name: '상품 그룹 만들기' }),
    ).toBeTruthy())
    expect(screen.getByText('0개 선택')).toBeTruthy()
    expect(seasonProductNames.map((productName) => (
      (screen.getByRole('checkbox', { name: productName }) as HTMLInputElement).checked
    ))).toEqual([false, false, false, false])
  })

  it('keeps focus and mobile layering inside the sheet', () => {
    window.location.hash = '#/campaigns/detail'
    const { container } = render(<App shopProbe={<SetCampaignStatusControl />} />)

    fireEvent.click(screen.getByRole('button', { name: '테스트 상태 설정' }))
    const status = screen.getByText('상품을 그룹에 담았어요.')
    fireEvent.click(screen.getByRole('button', { name: '상품 그룹에 담기' }))

    const dialog = screen.getByRole('dialog', { name: '상품 그룹에 담기' })
    const close = within(dialog).getByRole('button', { name: '닫기' })
    const lastGroup = within(dialog).getByRole('button', { name: '오늘의 픽' })
    expect(document.activeElement).toBe(close)

    fireEvent.keyDown(close, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(lastGroup)
    fireEvent.keyDown(lastGroup, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    expect(status.isConnected).toBe(true)
    expect(container.querySelector('.campaign-quick-add-backdrop')).toBeTruthy()

    const statusLayer = Number(compactShopCss.match(
      /\.shop-status \{[^}]*z-index: (\d+);/,
    )?.[1])
    const sheetLayer = Number(compactShopCss.match(
      /\.campaign-quick-add-backdrop \{[^}]*z-index: (\d+);/,
    )?.[1])
    expect(sheetLayer).toBeGreaterThan(statusLayer)
    expect(compactShopCss).toMatch(
      /\.campaign-quick-add-sheet \{[^}]*width: 100%;[^}]*max-width: 520px;[^}]*overflow-y: auto;/,
    )

    const mobileCss = compactShopCss.slice(
      compactShopCss.indexOf('@media (max-width: 480px)'),
    )
    expect(mobileCss).toMatch(/\.campaign-quick-add-backdrop \{[^}]*padding: 0;/)
    expect(mobileCss).toMatch(
      /\.campaign-quick-add-sheet \{[^}]*max-width: none;[^}]*max-height: 100dvh;/,
    )
  })
})
