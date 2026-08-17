import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App'
import { useShopDemo } from './screens/shop/ShopDemoContext'

const screenExpectations = [
  {
    path: '#/login',
    id: 'login',
    heading: '로그인',
    content: 'H.Point 통합회원 로그인',
  },
  {
    path: '#/apply',
    id: 'apply-intro',
    heading: '셀렉터스 신청하기',
    content: '당신의 감각을 보여주세요!',
  },
  {
    path: '#/apply/form',
    id: 'apply-form',
    heading: '셀렉터스 신청하기',
    content: '카카오 알림톡 수신 동의 (필수)',
  },
  {
    path: '#/apply/status',
    id: 'apply-status',
    heading: '신청 완료',
    content: '심사가 끝나면 결과를 안내해 드릴게요.',
  },
  {
    path: '#/campaigns',
    id: 'campaign-list',
    heading: '캠페인',
    content: '진행 중',
  },
  {
    path: '#/campaigns/detail',
    id: 'campaign-detail',
    heading: '시즌 픽 캠페인',
    content: '캠페인 상품',
  },
  {
    path: '#/shop/RC000003200T',
    id: 'public-shop',
    heading: '셀렉터스샵',
    content: 'byunjjii',
  },
  {
    path: '#/shop/RC000003200T/1',
    id: 'owner-shop-group',
    heading: '셀렉터스샵',
    content: '귀걸이',
  },
  {
    path: '#/shop/groups',
    id: 'shop-groups',
    heading: '상품 그룹',
    content: '생성 순서대로 셀렉터스샵에 노출됩니다.',
  },
  {
    path: '#/shop/groups/new',
    id: 'group-create',
    heading: '상품 그룹 만들기',
    content: '캠페인 상품 선택',
  },
  {
    path: '#/shop/groups/1/edit',
    id: 'group-edit',
    heading: '상품 그룹 편집',
    content: '캠페인 상품 선택',
  },
  {
    path: '#/shop/groups/new/season-pick',
    id: 'group-campaign-create',
    heading: '상품 그룹 만들기',
    content: '캠페인 상품 선택',
  },
  {
    path: '#/performance',
    id: 'performance-summary',
    heading: '성과 요약',
    content: '누적 클릭 수',
  },
  {
    path: '#/performance/products',
    id: 'product-performance',
    heading: '상품별 성과',
    content: '구매 전환 수',
  },
  {
    path: '#/settlement/info',
    id: 'settlement-info',
    heading: '정산 정보 입력',
    content: '정산 정보를 입력해 주세요',
  },
  {
    path: '#/settlement',
    id: 'settlement',
    heading: '정산 내역',
    content: 'Toss Payments',
  },
] as const

const editorRoutes = [
  {
    path: '#/shop/groups/new',
    mode: 'create',
    groupId: '',
    initialCampaign: '',
    backHref: '#/shop/groups',
  },
  {
    path: '#/shop/groups/1/edit',
    mode: 'edit',
    groupId: '1',
    initialCampaign: '',
    backHref: '#/shop/RC000003200T/1',
  },
  {
    path: '#/shop/groups/new/season-pick',
    mode: 'campaign-create',
    groupId: '',
    initialCampaign: 'season-pick',
    backHref: '#/campaigns/detail',
  },
] as const

function DeleteGroupOneControl() {
  const { deleteGroup } = useShopDemo()

  return (
    <button onClick={() => deleteGroup('1')} type="button">
      테스트 그룹 삭제
    </button>
  )
}

function ShopContinuityProbe() {
  const { getGroup, renameGroup } = useShopDemo()

  return (
    <>
      <button onClick={() => renameGroup('1', '별칭 유지')} type="button">
        테스트 그룹 이름 변경
      </button>
      <output aria-label="상품 그룹 1 이름">{getGroup('1')?.name}</output>
    </>
  )
}

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ data: { id: 1 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }))
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('Selectors client routes', () => {
  it.each(screenExpectations)(
    'renders the unique heading and representative content for $path',
    ({ path, id, heading, content }) => {
      if (path === '#/apply/form') {
        localStorage.setItem('selectors-auth', JSON.stringify({
          accessToken: 'test.jwt',
          tokenType: 'Bearer',
          role: 'USER',
          loginId: 'selector-user',
        }))
      }
      window.location.hash = path

      render(<App />)

      expect(screen.getByRole('main').getAttribute('data-screen-id')).toBe(id)
      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeTruthy()
      expect(
        screen.getAllByText(content, { exact: false }).length,
      ).toBeGreaterThan(0)
    },
  )

  it('links each main work area without a screen catalog', () => {
    window.location.hash = '#/campaigns'

    render(<App />)

    const navigation = screen.getByRole('navigation', { name: '주요 기능' })
    expect(within(navigation).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '#/shop/RC000003200T',
      '#/campaigns',
      '#/performance',
      '#/settlement/check',
    ])
    expect(within(navigation).getByRole('link', { name: '캠페인' }).getAttribute('aria-current')).toBe('page')
    expect(navigation.previousElementSibling?.classList.contains('screen-header')).toBe(true)
    expect(document.querySelector('[data-screen-id="catalog"]')).toBeNull()
  })

  it('opens the public shop from navigation without requiring login', () => {
    window.location.hash = '#/campaigns'
    render(<App />)

    const shopLink = screen.getByRole('link', { name: '샵' })
    expect(shopLink.getAttribute('href')).toBe('#/shop/RC000003200T')
    window.location.hash = shopLink.getAttribute('href') ?? ''
    fireEvent(window, new HashChangeEvent('hashchange'))

    expect(window.location.hash).toBe('#/shop/RC000003200T')
    expect(screen.getByRole('main').getAttribute('data-screen-id')).toBe('public-shop')
    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스샵' })).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: '로그인이 필요합니다' })).toBeNull()
  })

  it.each(editorRoutes)(
    'provides the exact $mode editor route mode for $path',
    ({ path, mode, groupId, initialCampaign, backHref }) => {
      window.location.hash = path

      const { container } = render(<App />)

      const editor = container.querySelector<HTMLElement>('[data-editor-mode]')
      expect(editor?.getAttribute('data-editor-mode')).toBe(mode)
      expect(editor?.getAttribute('data-group-id')).toBe(groupId)
      expect(editor?.getAttribute('data-initial-campaign')).toBe(initialCampaign)
      expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe(backHref)
    },
  )

  it('renders the owner missing-group state from live provider state', () => {
    window.location.hash = '#/shop/RC000003200T/1'

    const { container } = render(<App shopProbe={<DeleteGroupOneControl />} />)
    expect(screen.getByText('귀걸이')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '테스트 그룹 삭제' }))

    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스샵' })).toBeTruthy()
    expect(screen.getByText('상품 그룹을 찾을 수 없습니다.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: '셀렉터스샵으로 돌아가기' }).getAttribute('href'),
    ).toBe('#/shop/RC000003200T')
    expect(screen.queryByText('귀걸이')).toBeNull()
    expect(container.querySelector('.public-product')).toBeNull()
  })

  it('renders the edit missing-group state from live provider state', () => {
    window.location.hash = '#/shop/groups/1/edit'

    const { container } = render(<App shopProbe={<DeleteGroupOneControl />} />)
    expect(container.querySelector('[data-editor-mode="edit"]')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '테스트 그룹 삭제' }))

    expect(screen.getByRole('heading', { level: 1, name: '상품 그룹 편집' })).toBeTruthy()
    expect(screen.getByText('상품 그룹을 찾을 수 없습니다.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: '셀렉터스샵으로 돌아가기' }).getAttribute('href'),
    ).toBe('#/shop/RC000003200T')
    expect(container.querySelector('.group-editor-screen')).toBeNull()
    expect(container.querySelector('.picker-row')).toBeNull()
    expect(container.querySelector('#group-name')).toBeNull()
  })

  it('redirects an unknown legacy route to login without resetting shop state', () => {
    window.location.hash = '#/shop/groups'
    render(<App shopProbe={<ShopContinuityProbe />} />)
    fireEvent.click(screen.getByRole('button', { name: '테스트 그룹 이름 변경' }))
    expect(screen.getByRole('status', { name: '상품 그룹 1 이름' }).textContent).toBe('별칭 유지')

    const replaceState = vi.spyOn(window.history, 'replaceState')
    window.location.hash = '#/shop/groups/edit'
    fireEvent(window, new HashChangeEvent('hashchange'))

    expect(window.location.hash).toBe('#/login')
    expect(screen.getByRole('status', { name: '상품 그룹 1 이름' }).textContent).toBe('별칭 유지')
    expect(replaceState).toHaveBeenCalledTimes(1)

    expect(document.querySelectorAll('.route-announcement')).toHaveLength(1)
  })
})
