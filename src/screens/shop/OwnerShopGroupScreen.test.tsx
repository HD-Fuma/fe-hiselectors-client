import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
// @ts-expect-error The app intentionally has no Node type dependency; Vitest runs this file in Node.
import { readFileSync } from 'node:fs'

import App from '../../App'
import { useShopDemo } from './ShopDemoContext'

const ownerHash = '#/shop/RC000003200T/1'
const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
const groupShareUrl = 'https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T/1'
const workspaceRoot = (globalThis as typeof globalThis & {
  process: { cwd(): string }
}).process.cwd()
const compactShopCss = readFileSync(
  `${workspaceRoot}/src/styles/shop.css`,
  'utf8',
).replace(/\s+/g, ' ')
const overviewGroups = [
  ['귀걸이', 2],
  ['여름의 결', 2],
  ['블루 니트', 1],
  ['블랙베리 향', 1],
  ['프리지아', 1],
  ['프랑지파니', 1],
  ['샴페인 주얼리', 1],
  ['플라워 브레이슬릿', 1],
  ['H 링크', 1],
  ['스타일 셀렉션', 2],
  ['향의 기록', 2],
  ['선물 추천', 2],
  ['오늘의 픽', 2],
] as const

let clipboardDescriptor: PropertyDescriptor | undefined
let shareDescriptor: PropertyDescriptor | undefined
let navigatorMocksInstalled = false

function SetShopStatusControl() {
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
  vi.unstubAllGlobals()
  vi.restoreAllMocks()

  if (navigatorMocksInstalled) {
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor)
    } else {
      Reflect.deleteProperty(navigator, 'clipboard')
    }

    if (shareDescriptor) {
      Object.defineProperty(navigator, 'share', shareDescriptor)
    } else {
      Reflect.deleteProperty(navigator, 'share')
    }
  }

  clipboardDescriptor = undefined
  shareDescriptor = undefined
  navigatorMocksInstalled = false
})

describe('owner selectors shop group', () => {
  it('owner reference and menu keyboard', () => {
    window.location.hash = ownerHash

    const { container } = render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스샵' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '뒤로 가기' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '상품 그룹 공유' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'byunjjii' })).toBeNull()
    expect(screen.queryByAltText('인플루언서 뱃지')).toBeNull()
    expect(screen.queryByRole('button', { name: 'byunjjii의 ME스페이스' })).toBeNull()

    const group = screen.getByRole('region', { name: '귀걸이' })
    expect(within(group).getByRole('heading', { level: 2, name: '귀걸이' })).toBeTruthy()
    expect(within(group).getByText('매일을 빛내는 작은 주얼리')).toBeTruthy()
    const cards = within(group).getAllByRole('article')
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByRole('img').getAttribute('src')).toBe(
      'https://image.thehyundai.com/4/3/9/09/A2/60A2099341_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    )
    expect(within(cards[0]).getByText('이에르로르')).toBeTruthy()
    expect(within(cards[0]).getByText('에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX')).toBeTruthy()
    expect(within(cards[0]).getByText('90,000원').tagName).toBe('DEL')
    expect(within(cards[0]).getByText('15%')).toBeTruthy()
    expect(within(cards[0]).getByText('76,500원').tagName).toBe('STRONG')
    expect(within(cards[1]).getByRole('img').getAttribute('src')).toBe(
      'https://image.thehyundai.com/0/6/3/12/B1/60B1123606_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    )
    expect(cards[1].querySelector('.shop-product-brand')).toBeNull()
    expect(within(cards[1]).getByText('[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX')).toBeTruthy()
    expect(within(cards[1]).getByText('150,000원').tagName).toBe('DEL')
    expect(within(cards[1]).getByText('15%')).toBeTruthy()
    expect(within(cards[1]).getByText('127,500원').tagName).toBe('STRONG')
    expect(screen.getByText(disclosure)).toBeTruthy()

    const trigger = screen.getByRole('button', { name: '옵션 열기' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    const menuId = trigger.getAttribute('aria-controls')
    expect(menuId).toBeTruthy()

    fireEvent.click(trigger)

    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    const menu = screen.getByRole('menu')
    expect(menu.id).toBe(menuId)
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual([
      '그룹 공유',
      '그룹명 수정',
      '항목 변경',
      '그룹 삭제',
    ])
    expect(document.activeElement).toBe(items[0])

    fireEvent.keyDown(items[0], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[1])
    fireEvent.keyDown(items[1], { key: 'End' })
    expect(document.activeElement).toBe(items[3])
    fireEvent.keyDown(items[3], { key: 'ArrowDown' })
    expect(document.activeElement).toBe(items[0])
    fireEvent.keyDown(items[0], { key: 'ArrowUp' })
    expect(document.activeElement).toBe(items[3])
    fireEvent.keyDown(items[3], { key: 'Home' })
    expect(document.activeElement).toBe(items[0])

    const editItem = within(menu).getByRole('menuitem', { name: '항목 변경' })
    expect(editItem.tagName).toBe('A')
    expect(editItem.getAttribute('href')).toBe('#/shop/groups/1/edit')

    fireEvent.pointerDown(container.querySelector('.owner-shop-group-screen') as Element)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)
    const reopenedMenu = screen.getByRole('menu')
    fireEvent.keyDown(reopenedMenu, { key: 'Escape' })

    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('opens every group through its own detail and edit route', async () => {
    window.location.hash = '#/shop/RC000003200T/2'
    render(<App />)

    const group = screen.getByRole('region', { name: '여름의 결' })
    expect(within(group).getByText('여름의 결을 고르는 시즌 픽')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '옵션 열기' }))
    const editLink = screen.getByRole('menuitem', { name: '항목 변경' })
    expect(editLink.getAttribute('href')).toBe(
      '#/shop/groups/2/edit',
    )

    fireEvent.click(editLink)

    await waitFor(() => expect(window.location.hash).toBe('#/shop/groups/2/edit'))
    expect((screen.getByRole('textbox', { name: '상품 그룹 이름' }) as HTMLInputElement).value).toBe(
      '여름의 결',
    )
    expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe(
      '#/shop/RC000003200T/2',
    )
  })

  it('closes the menu on Tab without trapping focus', () => {
    window.location.hash = ownerHash
    render(<App />)

    const trigger = screen.getByRole('button', { name: '옵션 열기' })
    fireEvent.click(trigger)
    const firstItem = screen.getAllByRole('menuitem')[0]

    expect(fireEvent.keyDown(firstItem, { key: 'Tab' })).toBe(true)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)
    const reopenedFirstItem = screen.getAllByRole('menuitem')[0]

    expect(fireEvent.keyDown(reopenedFirstItem, { key: 'Tab', shiftKey: true })).toBe(true)
    expect(screen.queryByRole('menu')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('activates the edit anchor with Space', async () => {
    window.location.hash = ownerHash
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '옵션 열기' }))
    const editItem = screen.getByRole('menuitem', { name: '항목 변경' }) as HTMLAnchorElement
    const clickSpy = vi.spyOn(editItem, 'click')
    editItem.focus()

    expect(fireEvent.keyDown(editItem, { key: ' ' })).toBe(false)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(editItem.getAttribute('href')).toBe('#/shop/groups/1/edit')
    expect(screen.queryByRole('menu')).toBeNull()
    await waitFor(() => expect(window.location.hash).toBe('#/shop/groups/1/edit'))
  })

  it('shares from both owner entry points', () => {
    const writeText = vi.fn()
    const nativeShare = vi.fn()
    const fetchSpy = vi.fn()
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    shareDescriptor = Object.getOwnPropertyDescriptor(navigator, 'share')
    navigatorMocksInstalled = true
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: nativeShare,
    })
    vi.stubGlobal('fetch', fetchSpy)
    window.location.hash = ownerHash
    render(<App />)

    const assertShareSheet = () => {
      const dialog = screen.getByRole('dialog', { name: '상품 그룹 공유' })
      expect(screen.getAllByRole('dialog')).toHaveLength(1)
      expect(within(dialog).getByRole('heading', { name: '상품 그룹 공유' })).toBeTruthy()
      const urlField = within(dialog).getByRole('textbox', { name: '공유 링크' }) as HTMLInputElement
      expect(urlField.value).toBe(groupShareUrl)
      expect(urlField.readOnly).toBe(true)
      fireEvent.click(within(dialog).getByRole('button', { name: '링크 복사' }))
      expect(within(dialog).getByRole('status').textContent).toBe('링크를 복사했어요.')
      return dialog
    }

    const headerTrigger = screen.getByRole('button', { name: '상품 그룹 공유' })
    headerTrigger.focus()
    fireEvent.click(headerTrigger)
    const headerDialog = assertShareSheet()

    fireEvent.keyDown(headerDialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '상품 그룹 공유' })).toBeNull()
    expect(document.activeElement).toBe(headerTrigger)

    const menuTrigger = screen.getByRole('button', { name: '옵션 열기' })
    fireEvent.click(menuTrigger)
    fireEvent.click(screen.getByRole('menuitem', { name: '그룹 공유' }))

    expect(screen.queryByRole('menu')).toBeNull()
    const menuDialog = assertShareSheet()
    fireEvent.keyDown(menuDialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '상품 그룹 공유' })).toBeNull()
    expect(document.activeElement).toBe(menuTrigger)
    expect(writeText).not.toHaveBeenCalled()
    expect(nativeShare).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('keeps the share overlay above a retained shop status', () => {
    window.location.hash = ownerHash
    const { container } = render(<App shopProbe={<SetShopStatusControl />} />)

    fireEvent.click(screen.getByRole('button', { name: '테스트 상태 설정' }))
    const status = screen.getByRole('status')
    expect(status.textContent).toBe('상품을 그룹에 담았어요.')

    fireEvent.click(screen.getByRole('button', { name: '상품 그룹 공유' }))

    expect(screen.getByRole('dialog', { name: '상품 그룹 공유' })).toBeTruthy()
    expect(status.isConnected).toBe(true)
    const backdrop = container.querySelector<HTMLElement>('.share-shop-backdrop')
    expect(backdrop).toBeTruthy()
    if (!backdrop) {
      throw new Error('Expected the share backdrop')
    }

    const statusLayer = Number(compactShopCss.match(/\.shop-status \{[^}]*z-index: (\d+);/)?.[1])
    const shareLayer = Number(compactShopCss.match(/\.share-shop-backdrop \{[^}]*z-index: (\d+);/)?.[1])
    const dialogLayer = Number(compactShopCss.match(/\.group-dialog-backdrop \{[^}]*z-index: (\d+);/)?.[1])
    expect(statusLayer).toBe(40)
    expect(shareLayer).toBeGreaterThan(statusLayer)
    expect(dialogLayer).toBeGreaterThan(statusLayer)
  })

  it('renames with accessible validation', () => {
    window.location.hash = ownerHash
    render(<App />)

    const menuTrigger = screen.getByRole('button', { name: '옵션 열기' })
    fireEvent.click(menuTrigger)
    fireEvent.click(screen.getByRole('menuitem', { name: '그룹명 수정' }))

    expect(screen.queryByRole('menu')).toBeNull()
    const dialog = screen.getByRole('dialog')
    const input = within(dialog).getByRole('textbox', { name: '상품 그룹 이름' }) as HTMLInputElement
    const cancel = within(dialog).getByRole('button', { name: '취소' })
    const save = within(dialog).getByRole('button', { name: '저장' }) as HTMLButtonElement
    expect(input.value).toBe('귀걸이')
    expect(input.maxLength).toBe(30)
    expect(within(dialog).getByText('3 / 30')).toBeTruthy()
    expect(document.activeElement).toBe(input)

    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(save)
    fireEvent.keyDown(save, { key: 'Tab' })
    expect(document.activeElement).toBe(input)
    expect(cancel).toBeTruthy()

    fireEvent.change(input, { target: { value: '   ' } })

    expect(within(dialog).getByRole('alert').textContent).toBe('상품 그룹 이름을 입력해 주세요.')
    expect(save.disabled).toBe(true)
    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: '귀걸이' })).toBeTruthy()
    expect(document.activeElement).toBe(menuTrigger)

    fireEvent.click(menuTrigger)
    fireEvent.click(screen.getByRole('menuitem', { name: '그룹명 수정' }))

    const reopenedDialog = screen.getByRole('dialog')
    const reopenedInput = within(reopenedDialog).getByRole('textbox', {
      name: '상품 그룹 이름',
    }) as HTMLInputElement
    expect(reopenedInput.value).toBe('귀걸이')
    fireEvent.change(reopenedInput, { target: { value: '새 귀걸이 ' } })
    fireEvent.click(within(reopenedDialog).getByRole('button', { name: '저장' }))

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: '새 귀걸이' })).toBeTruthy()
  })

  it('cancels and confirms named deletion', async () => {
    window.location.hash = ownerHash
    const { container } = render(<App />)
    const menuTrigger = screen.getByRole('button', { name: '옵션 열기' })

    const openDeleteDialog = () => {
      fireEvent.click(menuTrigger)
      fireEvent.click(screen.getByRole('menuitem', { name: '그룹 삭제' }))
      return screen.getByRole('dialog', { name: '상품 그룹을 삭제할까요?' })
    }

    const escapeDialog = openDeleteDialog()
    expect(within(escapeDialog).getByRole('heading', { name: '상품 그룹을 삭제할까요?' })).toBeTruthy()
    expect(within(escapeDialog).getByText('‘귀걸이’ 상품 그룹을 삭제하면 되돌릴 수 없습니다.')).toBeTruthy()
    const cancel = within(escapeDialog).getByRole('button', { name: '취소' })
    const confirm = within(escapeDialog).getByRole('button', { name: '삭제' })
    expect(document.activeElement).toBe(cancel)

    fireEvent.keyDown(cancel, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(confirm)
    fireEvent.keyDown(confirm, { key: 'Tab' })
    expect(document.activeElement).toBe(cancel)
    fireEvent.keyDown(escapeDialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '상품 그룹을 삭제할까요?' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: '귀걸이' })).toBeTruthy()
    expect(document.activeElement).toBe(menuTrigger)

    const cancelDialog = openDeleteDialog()
    fireEvent.click(within(cancelDialog).getByRole('button', { name: '취소' }))

    expect(screen.queryByRole('dialog', { name: '상품 그룹을 삭제할까요?' })).toBeNull()
    expect(screen.getByRole('heading', { level: 2, name: '귀걸이' })).toBeTruthy()
    expect(document.activeElement).toBe(menuTrigger)

    const confirmDialog = openDeleteDialog()
    fireEvent.click(within(confirmDialog).getByRole('button', { name: '삭제' }))

    await waitFor(() => {
      expect(window.location.hash).toBe('#/shop/RC000003200T')
      expect(screen.getByRole('main').getAttribute('data-screen-id')).toBe('public-shop')
    })
    expect(screen.getByRole('status').textContent).toBe('상품 그룹을 삭제했어요.')

    window.location.hash = ownerHash
    fireEvent(window, new HashChangeEvent('hashchange'))

    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스샵' })).toBeTruthy()
    expect(screen.getByText('상품 그룹을 찾을 수 없습니다.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: '셀렉터스샵으로 돌아가기' }).getAttribute('href'),
    ).toBe('#/shop/RC000003200T')
    expect(screen.queryByText('귀걸이')).toBeNull()
    expect(container.querySelector('.shop-product')).toBeNull()
    expect(screen.queryByRole('button', { name: '옵션 열기' })).toBeNull()

    window.location.hash = '#/shop/groups/1/edit'
    fireEvent(window, new HashChangeEvent('hashchange'))

    expect(screen.getByRole('heading', { level: 1, name: '상품 그룹 편집' })).toBeTruthy()
    expect(screen.getByText('상품 그룹을 찾을 수 없습니다.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: '셀렉터스샵으로 돌아가기' }).getAttribute('href'),
    ).toBe('#/shop/RC000003200T')
    expect(container.querySelector('.group-editor-screen')).toBeNull()
    expect(container.querySelector('.picker-row')).toBeNull()
    expect(container.querySelector('#group-name')).toBeNull()
  })

  it('lists provider-backed overview', () => {
    window.location.hash = '#/shop/groups'
    const { container } = render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '상품 그룹' })).toBeTruthy()
    expect(screen.getByText('13개').textContent).toBe('13개')
    const cards = [...container.querySelectorAll<HTMLElement>('.group-card')]
    expect(cards).toHaveLength(13)
    expect(cards.map((card) => (
      within(card).getByText(/^(귀걸이|여름의 결|블루 니트|블랙베리 향|프리지아|프랑지파니|샴페인 주얼리|플라워 브레이슬릿|H 링크|스타일 셀렉션|향의 기록|선물 추천|오늘의 픽)$/).textContent
    ))).toEqual(overviewGroups.map(([name]) => name))
    overviewGroups.forEach(([name, productCount], index) => {
      expect(within(cards[index]).getByRole('link', { name }).getAttribute('href')).toBe(
        `#/shop/RC000003200T/${index + 1}`,
      )
      expect(
        within(cards[index]).getByText(`상품 ${productCount}개 · 2026.08.04 생성`),
      ).toBeTruthy()
    })

    expect(
      screen.getByRole('link', { name: '귀걸이' }).getAttribute('href'),
    ).toBe(ownerHash)
    const ownerLinks = cards.flatMap((card) => (
      [...card.querySelectorAll<HTMLAnchorElement>(`a[href="${ownerHash}"]`)]
    ))
    expect(ownerLinks).toHaveLength(1)
    const createLink = screen.getByRole('link', { name: '상품 그룹 만들기' })
    expect(createLink.getAttribute('href')).toBe('#/shop/groups/new')
    expect(createLink.closest('.bottom-action-bar')).toBeTruthy()
  })

  it('keeps shop state for the App lifetime and resets it on remount', () => {
    window.location.hash = ownerHash
    const app = render(<App />)

    const menuTrigger = screen.getByRole('button', { name: '옵션 열기' })
    fireEvent.click(menuTrigger)
    fireEvent.click(screen.getByRole('menuitem', { name: '그룹명 수정' }))
    const renameDialog = screen.getByRole('dialog')
    fireEvent.change(within(renameDialog).getByRole('textbox', { name: '상품 그룹 이름' }), {
      target: { value: 'SPA 유지' },
    })
    fireEvent.click(within(renameDialog).getByRole('button', { name: '저장' }))
    expect(screen.getByRole('heading', { level: 2, name: 'SPA 유지' })).toBeTruthy()

    window.location.hash = '#/shop/RC000003200T'
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(screen.getByRole('heading', { level: 2, name: 'SPA 유지' })).toBeTruthy()

    window.location.hash = ownerHash
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(screen.getByRole('heading', { level: 2, name: 'SPA 유지' })).toBeTruthy()

    window.location.hash = '#/shop/groups/edit'
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(window.location.hash).toBe('#/login')

    window.location.hash = ownerHash
    fireEvent(window, new HashChangeEvent('hashchange'))
    expect(screen.getByRole('heading', { level: 2, name: 'SPA 유지' })).toBeTruthy()

    app.unmount()
    window.location.hash = '#/shop/groups'
    const freshApp = render(<App />)

    expect(freshApp.container.querySelectorAll('.group-card')).toHaveLength(13)
    expect(screen.getByRole('link', { name: '귀걸이' })).toBeTruthy()
    expect(screen.queryByText('SPA 유지')).toBeNull()
  })
})
