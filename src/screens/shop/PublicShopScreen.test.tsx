import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import { useShopDemo } from './ShopDemoContext'

const shopHash = '#/shop/RC000003200T'
const badgeImage = 'https://image.thehyundai.com/images/badge/badge_manager_large.png?SF=webp&AO=1'
const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
const shareUrl = 'http://localhost:3000/#/shop/RC000003200T'

let clipboardDescriptor: PropertyDescriptor | undefined
let shareDescriptor: PropertyDescriptor | undefined
let navigatorMocksInstalled = false

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
    data: { accessLevel: 'CURRENT' },
  }))))
})

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
  localStorage.clear()
  sessionStorage.clear()
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

describe('public selectors shop', () => {
  it('renders the public reference content', () => {
    window.location.hash = shopHash

    const { container } = render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스샵' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe('#/home')
    expect(screen.queryByRole('button', { name: '셀렉터스샵 공유' })).toBeNull()

    const badge = screen.getByAltText('인플루언서 뱃지')
    expect(badge.getAttribute('src')).toBe(badgeImage)
    expect(screen.getByRole('heading', { level: 2, name: 'byunjjii' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'byunjjii의 ME스페이스' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: '관리하기' })).toBeNull()

    const sections = [...container.querySelectorAll<HTMLElement>('[data-shop-group-id]')]
    expect(sections.map((section) => (
      within(section).getByRole('heading', { level: 2 }).textContent
    ))).toEqual([
      '귀걸이',
      '여름의 결',
      '블루 니트',
      '블랙베리 향',
      '프리지아',
      '프랑지파니',
    ])

    const firstGroup = screen.getByRole('region', { name: '귀걸이' })
    const [firstCard, secondCard] = within(firstGroup).getAllByRole('article')

    const firstImage = within(firstCard).getByRole('img', {
      name: '에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX',
    })
    expect(firstImage.getAttribute('src')).toBe(
      'https://image.thehyundai.com/4/3/9/09/A2/60A2099341_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    )
    expect(within(firstCard).getByText('이에르로르')).toBeTruthy()
    expect(within(firstCard).getByText('에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX')).toBeTruthy()
    expect(within(firstCard).getByText('90,000원').tagName).toBe('DEL')
    expect(within(firstCard).getByText('15%')).toBeTruthy()
    expect(within(firstCard).getByText('76,500원').tagName).toBe('STRONG')

    const secondImage = within(secondCard).getByRole('img', {
      name: '[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX',
    })
    expect(secondImage.getAttribute('src')).toBe(
      'https://image.thehyundai.com/0/6/3/12/B1/60B1123606_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    )
    expect(secondCard.querySelector('.shop-product-brand')).toBeNull()
    expect(within(secondCard).getByText('[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX')).toBeTruthy()
    expect(within(secondCard).getByText('150,000원').tagName).toBe('DEL')
    expect(within(secondCard).getByText('15%')).toBeTruthy()
    expect(within(secondCard).getByText('127,500원').tagName).toBe('STRONG')

    expect(screen.getByText(disclosure)).toBeTruthy()
  })

  it('shows shop management only to the signed-in owner', () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'owner.token',
      role: 'USER',
      selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = shopHash

    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '관리자' }))

    expect(screen.getByRole('link', { name: '관리하기' }).getAttribute('href')).toBe(
      '#/shop/groups',
    )
  })

  it('keeps a previous generation shop read-only after access resolves', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'owner.token', role: 'USER',
    }))
    sessionStorage.setItem('selectors-shop-view-mode', 'owner')
    vi.mocked(globalThis.fetch).mockImplementation(() => Promise.resolve(new Response(JSON.stringify({
      data: { accessLevel: 'PREVIOUS' },
    }))))
    window.location.hash = shopHash

    render(<App />)

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
        selectorAccessLevel: 'PREVIOUS',
      })
      expect(sessionStorage.getItem('selectors-shop-view-mode')).toBe('public')
    })
    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스샵' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '관리자' })).toBeNull()
    expect(screen.queryByRole('link', { name: '관리하기' })).toBeNull()
  })

  it('preserves a legacy owner preference until current access resolves', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'owner.token', role: 'USER',
    }))
    sessionStorage.setItem('selectors-shop-view-mode', 'owner')
    let resolveAccess!: (response: Response) => void
    const accessResponse = new Promise<Response>((resolve) => { resolveAccess = resolve })
    vi.mocked(globalThis.fetch).mockImplementation((input) => (
      String(input).endsWith('/api/me/selector-access')
        ? accessResponse
        : Promise.resolve(new Response(JSON.stringify({ data: {} })))
    ))
    window.location.hash = shopHash

    const app = render(<App />)

    expect(sessionStorage.getItem('selectors-shop-view-mode')).toBe('owner')
    expect(screen.queryByRole('button', { name: '관리자' })).toBeNull()

    resolveAccess(new Response(JSON.stringify({ data: { accessLevel: 'CURRENT' } })))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('selectors-auth') ?? '{}')).toMatchObject({
      selectorAccessLevel: 'CURRENT',
    }))
    expect(sessionStorage.getItem('selectors-shop-view-mode')).toBe('owner')

    app.rerender(<App />)
    await waitFor(() => expect(screen.getByRole('link', { name: '관리하기' })).toBeTruthy())
  })

  it('announces only actual shop statuses', () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'owner.token', role: 'USER', selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = shopHash
    render(<App shopProbe={<SetShopStatusControl />} />)

    fireEvent.click(screen.getByRole('button', { name: '관리자' }))

    expect(screen.queryByRole('status')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '테스트 상태 설정' }))

    expect(screen.getByRole('alertdialog', { name: '알림' }).textContent).toContain('상품을 그룹에 담았어요.')
  })

  it('expands groups without remounting existing sections or resetting scroll', () => {
    window.location.hash = shopHash
    const { container } = render(<App />)
    const scrollContainer = container.querySelector<HTMLElement>('.screen-scroll')
    const firstSixSections = [
      ...container.querySelectorAll<HTMLElement>('[data-shop-group-id]'),
    ]

    expect(firstSixSections).toHaveLength(6)
    expect(scrollContainer).toBeTruthy()
    if (!scrollContainer) {
      throw new Error('Expected the public shop scroll container')
    }

    scrollContainer.scrollTop = 318
    fireEvent.click(screen.getByRole('button', { name: '더보기' }))

    const firstExpansion = [
      ...container.querySelectorAll<HTMLElement>('[data-shop-group-id]'),
    ]
    expect(firstExpansion).toHaveLength(12)
    firstSixSections.forEach((section, index) => {
      expect(firstExpansion[index]).toBe(section)
    })
    expect(scrollContainer.scrollTop).toBe(318)

    fireEvent.click(screen.getByRole('button', { name: '더보기' }))

    expect(container.querySelectorAll('[data-shop-group-id]')).toHaveLength(13)
    expect(screen.queryByRole('button', { name: '더보기' })).toBeNull()
    expect(scrollContainer.scrollTop).toBe(318)
  })

  it('shares through a local-only accessible sheet and restores the trigger on Escape', async () => {
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'owner.token', role: 'USER', selectorAccessLevel: 'CURRENT',
    }))
    const writeText = vi.fn()
    const nativeShare = vi.fn()
    const fetchSpy = vi.fn((input: RequestInfo | URL) => Promise.resolve(new Response(JSON.stringify({
      data: String(input).includes('/api/me/selector-access') ? { accessLevel: 'CURRENT' } : {},
    }))))
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
    window.location.hash = shopHash
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '관리자' }))

    const trigger = screen.getByRole('button', { name: '셀렉터스샵 공유' })
    trigger.focus()
    fireEvent.click(trigger)

    const dialog = screen.getByRole('dialog', { name: '셀렉터스샵 공유' })
    expect(within(dialog).getByRole('heading', { name: '셀렉터스샵 공유' })).toBeTruthy()
    const urlField = within(dialog).getByRole('textbox', { name: '공유 링크' }) as HTMLInputElement
    expect(urlField.value).toBe(shareUrl)
    expect(urlField.readOnly).toBe(true)
    expect(within(dialog).getByRole('button', { name: '링크 복사' })).toBeTruthy()
    expect(within(dialog).getByRole('button', { name: '닫기' })).toBeTruthy()

    fireEvent.click(within(dialog).getByRole('button', { name: '링크 복사' }))

    await waitFor(() => {
      expect(screen.getByRole('alertdialog', { name: '알림' }).textContent).toContain('링크를 복사했어요.')
    })
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(writeText).toHaveBeenCalledWith(shareUrl)
    expect(nativeShare).not.toHaveBeenCalled()
    expect(fetchSpy.mock.calls.filter(([input]) => String(input).includes('/api/view-logs'))).toHaveLength(1)

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog', { name: '셀렉터스샵 공유' })).toBeNull()
    expect(document.activeElement).toBe(trigger)
  })
})
