import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createInitialShopDemoState,
  ShopDemoProvider,
  shopDemoReducer,
  useShopDemo,
  type ShopDemoAction,
  type ShopDemoState,
} from './ShopDemoContext'

import {
  initialShopGroups,
  selectorProducts,
  selectorProfile,
  shopCampaigns,
} from './shopData'

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.location.hash = ''
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('shop fixture contract', () => {
  it('locks the exact selector profile', () => {
    expect(selectorProfile).toEqual({
      name: 'byunjjii',
      avatarImage: '',
      meSpaceLabel: 'byunjjii의 ME스페이스',
      badgeAlt: '인플루언서 뱃지',
      badgeImage: 'https://image.thehyundai.com/images/badge/badge_manager_large.png?SF=webp&AO=1',
      verified: true,
    })
  })

  it('locks all products in their exact order with live identity fields', () => {
    expect(selectorProducts.map(({ id }) => id)).toEqual([
      'knit-ivory',
      'knit-blue',
      'knit-midnight',
      'cologne-blackberry',
      'cologne-pear',
      'cologne-frangipani',
      'jewelry-fullmoon',
      'jewelry-flower',
      'jewelry-hlink',
      'earring-essence',
      'earring-souvenir',
    ])
    expect(selectorProducts.map(({ category }) => category)).toEqual([
      '패션',
      '패션',
      '패션',
      '뷰티',
      '뷰티',
      '뷰티',
      '주얼리',
      '주얼리',
      '주얼리',
      '주얼리',
      '주얼리',
    ])
    expect(selectorProducts.map(({ id, brand, name, image }) => [
      id,
      brand,
      name,
      image,
    ])).toEqual([
      [
        'knit-ivory',
        '알투더블유',
        '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)',
        'https://image.thehyundai.com/7/6/2/34/B1/40B1342672_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'knit-blue',
        '알투더블유',
        '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)',
        'https://image.thehyundai.com/1/7/2/34/B1/40B1342714_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'knit-midnight',
        '알투더블유',
        '[더현대Hi 단독] Cale ribbed half sleeve KN (Midnight blue)',
        'https://image.thehyundai.com/3/7/2/34/B1/40B1342730_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'cologne-blackberry',
        '조 말론 런던',
        '[단독] 블랙베리 앤 베이 코롱 100ml (+바디 워시 30ml 증정)',
        'https://image.thehyundai.com/4/7/0/25/A2/40A2250746_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'cologne-pear',
        '조 말론 런던',
        '잉글리쉬 페어 앤 프리지아 코롱 30ml (+코롱 1.5ml 1종 +바디 사쉐 1종 증정)',
        'https://image.thehyundai.com/5/8/0/25/A2/40A2250850_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'cologne-frangipani',
        '조 말론 런던',
        '프랑지파니 플라워 코롱 30ml',
        'https://image.thehyundai.com/6/4/0/32/A2/40A2320469_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'jewelry-fullmoon',
        '이에르로르',
        '샴페인 풀문 (Y) 빅 보울 귀걸이 HL2E53215YBXXX',
        'https://image.thehyundai.com/6/3/4/08/A2/60A2084362_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'jewelry-flower',
        '이에르로르',
        '에센스 실버(W) 모이사나이트 플라워 스테이션 팔찌 HL4B61404W9175',
        'https://image.thehyundai.com/0/6/5/28/A2/60A2285600_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'jewelry-hlink',
        '이에르로르',
        '[이에르로르] [Premium Plating] H링크 AB(W) 듀오 라인 파베 뱅글 HL3B63304WB',
        'https://image.thehyundai.com/8/4/3/12/B1/60B1123482_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'earring-essence',
        '이에르로르',
        '에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX',
        'https://image.thehyundai.com/4/3/9/09/A2/60A2099341_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
      [
        'earring-souvenir',
        '',
        '[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX',
        'https://image.thehyundai.com/0/6/3/12/B1/60B1123606_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
      ],
    ])
  })

  it('locks every product price and campaign membership tuple', () => {
    expect(selectorProducts.map(({
      id,
      originalPrice,
      discountRate,
      salePrice,
      campaignIds,
    }) => [id, originalPrice, discountRate, salePrice, campaignIds])).toEqual([
      ['knit-ivory', '189,000원', '20%', '151,200원', ['season-pick']],
      ['knit-blue', '189,000원', '20%', '151,200원', ['season-pick']],
      ['knit-midnight', '189,000원', '20%', '151,200원', ['season-pick']],
      ['cologne-blackberry', '245,000원', '5%', '232,750원', ['season-pick', 'fragrance-note']],
      ['cologne-pear', '110,000원', '5%', '104,500원', ['fragrance-note']],
      ['cologne-frangipani', '114,000원', '5%', '108,300원', ['fragrance-note']],
      ['jewelry-fullmoon', '70,000원', '15%', '59,500원', ['jewelry-focus']],
      ['jewelry-flower', '140,000원', '15%', '119,000원', ['jewelry-focus']],
      ['jewelry-hlink', '110,000원', '15%', '93,500원', ['jewelry-focus']],
      ['earring-essence', '90,000원', '15%', '76,500원', ['jewelry-focus']],
      ['earring-souvenir', '150,000원', '15%', '127,500원', ['jewelry-focus']],
    ])
  })

  it('locks the exact campaign product membership', () => {
    expect(shopCampaigns.map(({ id, name, productIds }) => [id, name, productIds])).toEqual([
      [
        'season-pick',
        '여름의 결을 고르는 시즌 픽',
        ['knit-ivory', 'knit-blue', 'knit-midnight', 'cologne-blackberry'],
      ],
      [
        'fragrance-note',
        '은은하게 오래 남는 향',
        ['cologne-blackberry', 'cologne-pear', 'cologne-frangipani'],
      ],
      [
        'jewelry-focus',
        '매일을 빛내는 작은 주얼리',
        ['jewelry-fullmoon', 'jewelry-flower', 'jewelry-hlink', 'earring-essence', 'earring-souvenir'],
      ],
    ])
  })

  it('locks all thirteen initial groups in display order', () => {
    expect(initialShopGroups).toEqual([
      {
        id: '1',
        name: '귀걸이',
        createdAt: '2026.08.04',
        campaignId: 'jewelry-focus',
        productIds: ['earring-essence', 'earring-souvenir'],
      },
      {
        id: '2',
        name: '여름의 결',
        createdAt: '2026.08.04',
        campaignId: 'season-pick',
        productIds: ['knit-ivory', 'knit-blue'],
      },
      {
        id: '3',
        name: '블루 니트',
        createdAt: '2026.08.04',
        campaignId: 'season-pick',
        productIds: ['knit-midnight'],
      },
      {
        id: '4',
        name: '블랙베리 향',
        createdAt: '2026.08.04',
        campaignId: 'season-pick',
        productIds: ['cologne-blackberry'],
      },
      {
        id: '5',
        name: '프리지아',
        createdAt: '2026.08.04',
        campaignId: 'fragrance-note',
        productIds: ['cologne-pear'],
      },
      {
        id: '6',
        name: '프랑지파니',
        createdAt: '2026.08.04',
        campaignId: 'fragrance-note',
        productIds: ['cologne-frangipani'],
      },
      {
        id: '7',
        name: '샴페인 주얼리',
        createdAt: '2026.08.04',
        campaignId: 'jewelry-focus',
        productIds: ['jewelry-fullmoon'],
      },
      {
        id: '8',
        name: '플라워 브레이슬릿',
        createdAt: '2026.08.04',
        campaignId: 'jewelry-focus',
        productIds: ['jewelry-flower'],
      },
      {
        id: '9',
        name: 'H 링크',
        createdAt: '2026.08.04',
        campaignId: 'jewelry-focus',
        productIds: ['jewelry-hlink'],
      },
      {
        id: '10',
        name: '스타일 셀렉션',
        createdAt: '2026.08.04',
        campaignId: null,
        productIds: ['knit-ivory', 'earring-essence'],
      },
      {
        id: '11',
        name: '향의 기록',
        createdAt: '2026.08.04',
        campaignId: 'fragrance-note',
        productIds: ['cologne-blackberry', 'cologne-pear'],
      },
      {
        id: '12',
        name: '선물 추천',
        createdAt: '2026.08.04',
        campaignId: null,
        productIds: ['jewelry-fullmoon', 'cologne-frangipani'],
      },
      {
        id: '13',
        name: '오늘의 픽',
        createdAt: '2026.08.04',
        campaignId: null,
        productIds: ['knit-blue', 'jewelry-hlink'],
      },
    ])
  })
})

describe('shop reducer', () => {
  it('creates isolated initial state without mutating the readonly fixtures', () => {
    const fixtureSnapshot = initialShopGroups.map((group) => ({
      ...group,
      productIds: [...group.productIds],
    }))

    const first = createInitialShopDemoState()
    const second = createInitialShopDemoState()

    expect(first).toMatchObject({
      status: null,
      quickAddDraft: null,
      nextGroupSerial: 14,
    })
    expect(first.groups).toHaveLength(13)
    expect(first.groups).not.toBe(second.groups)
    expect(first.groups.every((group, index) => group !== second.groups[index])).toBe(true)
    expect(first.groups.every((group, index) => (
      group.productIds !== second.groups[index].productIds
    ))).toBe(true)
    expect(first.groups[0]).not.toBe(initialShopGroups[0])
    expect(first.groups[0].productIds).not.toBe(initialShopGroups[0].productIds)

    first.groups[0].productIds.push('knit-blue')

    expect(second.groups[0].productIds).toEqual(['earring-essence', 'earring-souvenir'])
    expect(initialShopGroups).toEqual(fixtureSnapshot)
  })

  it('trims renamed groups and replaces update input fields', () => {
    const initial = createInitialShopDemoState()
    const renamed = shopDemoReducer(initial, {
      type: 'renameGroup',
      groupId: '1',
      name: '  데일리 귀걸이  ',
    })

    expect(renamed.groups[0]).toEqual({
      ...initial.groups[0],
      name: '데일리 귀걸이',
    })

    const updated = shopDemoReducer(renamed, {
      type: 'updateGroupProducts',
      groupId: '10',
      input: {
        name: '  새 스타일  ',
        campaignId: 'season-pick',
        productIds: ['knit-blue', 'knit-blue', 'knit-midnight', 'knit-blue'],
      },
    })

    expect(updated.groups.find(({ id }) => id === '10')).toEqual({
      id: '10',
      name: '새 스타일',
      createdAt: '2026.08.04',
      campaignId: 'season-pick',
      productIds: ['knit-blue', 'knit-midnight'],
    })
  })

  it('returns the identical state when a target group is missing', () => {
    const state = createInitialShopDemoState()
    const actions: ShopDemoAction[] = [
      { type: 'renameGroup', groupId: 'missing', name: '없는 그룹' },
      {
        type: 'updateGroupProducts',
        groupId: 'missing',
        input: { name: '없는 그룹', campaignId: null, productIds: [] },
      },
      { type: 'addProductsToGroup', groupId: 'missing', productIds: ['knit-blue'] },
      { type: 'deleteGroup', groupId: 'missing' },
    ]

    for (const action of actions) {
      expect(shopDemoReducer(state, action)).toBe(state)
    }
  })

  it('creates sequential demo groups with trimmed names and deduplicated membership', () => {
    const initial = createInitialShopDemoState()
    const first = shopDemoReducer(initial, {
      type: 'createGroup',
      input: {
        name: '  첫 데모 그룹  ',
        campaignId: 'season-pick',
        productIds: ['knit-ivory', 'knit-blue', 'knit-ivory'],
      },
    })
    const second = shopDemoReducer(first, {
      type: 'createGroup',
      input: {
        name: '  두 번째 데모 그룹  ',
        campaignId: null,
        productIds: ['earring-essence', 'earring-essence'],
      },
    })

    expect(first.groups[first.groups.length - 1]).toEqual({
      id: 'demo-14',
      name: '첫 데모 그룹',
      createdAt: '2026.08.04',
      campaignId: 'season-pick',
      productIds: ['knit-ivory', 'knit-blue'],
    })
    expect(first.nextGroupSerial).toBe(15)
    expect(second.groups[second.groups.length - 1]).toEqual({
      id: 'demo-15',
      name: '두 번째 데모 그룹',
      createdAt: '2026.08.04',
      campaignId: null,
      productIds: ['earring-essence'],
    })
    expect(second.nextGroupSerial).toBe(16)
  })

  it('adds products while preserving first-occurrence order', () => {
    const state = shopDemoReducer(createInitialShopDemoState(), {
      type: 'addProductsToGroup',
      groupId: '10',
      productIds: ['knit-blue', 'knit-ivory', 'knit-midnight', 'knit-blue'],
    })

    expect(state.groups.find(({ id }) => id === '10')?.productIds).toEqual([
      'knit-ivory',
      'earring-essence',
      'knit-blue',
      'knit-midnight',
    ])
  })

  it('deletes an existing group', () => {
    const initial = createInitialShopDemoState()
    const state = shopDemoReducer(initial, { type: 'deleteGroup', groupId: '7' })

    expect(state).not.toBe(initial)
    expect(state.groups).toHaveLength(12)
    expect(state.groups.some(({ id }) => id === '7')).toBe(false)
  })

  it('clones quick-add membership before setting and clears the draft', () => {
    const draft = {
      campaignId: 'season-pick',
      productIds: ['knit-ivory'],
    }
    const withDraft = shopDemoReducer(createInitialShopDemoState(), {
      type: 'setQuickAddDraft',
      draft,
    })

    expect(withDraft.quickAddDraft).toEqual(draft)
    expect(withDraft.quickAddDraft).not.toBe(draft)
    expect(withDraft.quickAddDraft?.productIds).not.toBe(draft.productIds)

    draft.productIds.push('knit-blue')

    expect(withDraft.quickAddDraft?.productIds).toEqual(['knit-ivory'])
    expect(shopDemoReducer(withDraft, { type: 'clearQuickAddDraft' }).quickAddDraft).toBeNull()
  })

  it('sets and clears status', () => {
    const withStatus = shopDemoReducer(createInitialShopDemoState(), {
      type: 'setStatus',
      status: '상품을 그룹에 담았어요.',
    })

    expect(withStatus.status).toBe('상품을 그룹에 담았어요.')
    expect(shopDemoReducer(withStatus, { type: 'setStatus', status: null }).status).toBeNull()
  })
})

type ProbeSnapshot = {
  state: ShopDemoState
  profileName: string
  productCount: number
  campaignCount: number
  group10: ShopDemoState['groups'][number] | null
  resolvedProductIds: string[]
}

function StateProbe() {
  const shop = useShopDemo()
  const snapshot: ProbeSnapshot = {
    state: shop.state,
    profileName: shop.profile.name,
    productCount: shop.products.length,
    campaignCount: shop.campaigns.length,
    group10: shop.getGroup('10') ?? null,
    resolvedProductIds: shop
      .getProducts(['knit-midnight', 'missing', 'knit-ivory'])
      .map(({ id }) => id),
  }

  return (
    <>
      <output data-testid="shop-state">{JSON.stringify(snapshot)}</output>
      <button type="button" onClick={() => shop.renameGroup('1', '  프로바이더 이름  ')}>
        rename
      </button>
      <button
        type="button"
        onClick={() => shop.updateGroupProducts('2', {
          name: '  프로바이더 수정  ',
          campaignId: 'fragrance-note',
          productIds: ['cologne-pear', 'cologne-pear'],
        })}
      >
        update
      </button>
      <button
        type="button"
        onClick={() => shop.createGroup({
          name: '  프로바이더 생성  ',
          campaignId: null,
          productIds: ['knit-blue', 'knit-blue'],
        })}
      >
        create
      </button>
      <button
        type="button"
        onClick={() => shop.addProductsToGroup('10', [
          'knit-blue',
          'knit-ivory',
          'knit-midnight',
        ])}
      >
        add products
      </button>
      <button type="button" onClick={() => shop.deleteGroup('13')}>
        delete
      </button>
      <button
        type="button"
        onClick={() => shop.setQuickAddDraft({
          campaignId: 'season-pick',
          productIds: ['knit-ivory'],
        })}
      >
        set draft
      </button>
      <button type="button" onClick={shop.clearQuickAddDraft}>
        clear draft
      </button>
      <button type="button" onClick={() => shop.setStatus('저장했어요.')}>
        set status
      </button>
      <button type="button" onClick={() => shop.setStatus(null)}>
        clear status
      </button>
    </>
  )
}

function readProbe(): ProbeSnapshot {
  return JSON.parse(screen.getByTestId('shop-state').textContent ?? '') as ProbeSnapshot
}

function OwnedDataProbe() {
  const { profile, selectorsCode, state } = useShopDemo()
  return (
    <output data-testid="owned-shop-state">
      {JSON.stringify({ profileName: profile.name, selectorsCode, groupCount: state.groups.length })}
    </output>
  )
}

function readOwnedDataProbe() {
  return JSON.parse(screen.getByTestId('owned-shop-state').textContent ?? '') as {
    profileName: string
    selectorsCode: string | null
    groupCount: number
  }
}

describe('shop provider', () => {
  it('exposes live getters and all eight public actions', () => {
    render(
      <ShopDemoProvider>
        <StateProbe />
      </ShopDemoProvider>,
    )

    expect(readProbe()).toMatchObject({
      state: {
        groups: expect.arrayContaining([expect.objectContaining({ id: '10' })]),
        status: null,
        quickAddDraft: null,
        nextGroupSerial: 14,
      },
      profileName: 'byunjjii',
      productCount: 11,
      campaignCount: 3,
      resolvedProductIds: ['knit-midnight', 'knit-ivory'],
    })
    expect(readProbe().state.groups).toHaveLength(13)

    fireEvent.click(screen.getByRole('button', { name: 'rename' }))
    expect(readProbe().state.groups.find(({ id }) => id === '1')?.name).toBe('프로바이더 이름')

    fireEvent.click(screen.getByRole('button', { name: 'update' }))
    expect(readProbe().state.groups.find(({ id }) => id === '2')).toMatchObject({
      name: '프로바이더 수정',
      campaignId: 'fragrance-note',
      productIds: ['cologne-pear'],
    })

    fireEvent.click(screen.getByRole('button', { name: 'create' }))
    expect(readProbe().state.groups.find(({ id }) => id === 'demo-14')).toMatchObject({
      name: '프로바이더 생성',
      productIds: ['knit-blue'],
    })
    expect(readProbe().state.nextGroupSerial).toBe(15)

    fireEvent.click(screen.getByRole('button', { name: 'add products' }))
    expect(readProbe().group10?.productIds).toEqual([
      'knit-ivory',
      'earring-essence',
      'knit-blue',
      'knit-midnight',
    ])

    fireEvent.click(screen.getByRole('button', { name: 'delete' }))
    expect(readProbe().state.groups.some(({ id }) => id === '13')).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: 'set draft' }))
    expect(readProbe().state.quickAddDraft).toEqual({
      campaignId: 'season-pick',
      productIds: ['knit-ivory'],
    })
    fireEvent.click(screen.getByRole('button', { name: 'clear draft' }))
    expect(readProbe().state.quickAddDraft).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'set status' }))
    expect(readProbe().state.status).toBe('저장했어요.')
    fireEvent.click(screen.getByRole('button', { name: 'clear status' }))
    expect(readProbe().state.status).toBeNull()
  })

  it('resets reducer and transient state on a fresh mount', () => {
    const firstMount = render(
      <ShopDemoProvider>
        <StateProbe />
      </ShopDemoProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'create' }))
    fireEvent.click(screen.getByRole('button', { name: 'set draft' }))
    fireEvent.click(screen.getByRole('button', { name: 'set status' }))
    expect(readProbe().state).toMatchObject({
      status: '저장했어요.',
      quickAddDraft: {
        campaignId: 'season-pick',
        productIds: ['knit-ivory'],
      },
      nextGroupSerial: 15,
    })
    expect(readProbe().state.groups).toHaveLength(14)

    firstMount.unmount()
    render(
      <ShopDemoProvider>
        <StateProbe />
      </ShopDemoProvider>,
    )

    expect(readProbe().state).toMatchObject({
      status: null,
      quickAddDraft: null,
      nextGroupSerial: 14,
    })
    expect(readProbe().state.groups).toHaveLength(13)
    expect(readProbe().state.groups.some(({ id }) => id === 'demo-14')).toBe(false)
  })

  it('clears loaded owned shop data when selector access is revoked', async () => {
    vi.stubEnv('MODE', 'production')
    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'CURRENT',
    }))
    window.location.hash = '#/home'
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const url = String(input)
      if (url.endsWith('/api/product-groups/me/shop')) {
        return Promise.resolve(new Response(JSON.stringify({
          data: {
            selectorsCode: 'SEL-001',
            nickname: 'loaded-selector',
            profileImageUrl: null,
            generationName: '1기',
            userName: '셀렉터',
            snsId: 'selector-sns',
            groups: [{
              id: 1,
              selectorsId: 1,
              campaignId: 1,
              groupNo: 1,
              title: '소유 상품 그룹',
              createdAt: '2026-08-20T00:00:00',
              products: [],
            }],
          },
        }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
      }
      if (url.endsWith('/api/campaigns')) {
        return Promise.resolve(new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }))
      }
      return Promise.resolve(new Response('{}', { status: 404 }))
    })

    render(<ShopDemoProvider><OwnedDataProbe /></ShopDemoProvider>)

    await waitFor(() => expect(readOwnedDataProbe()).toEqual({
      profileName: 'loaded-selector',
      selectorsCode: 'SEL-001',
      groupCount: 1,
    }))

    localStorage.setItem('selectors-auth', JSON.stringify({
      accessToken: 'selector.jwt', tokenType: 'Bearer', role: 'USER', loginId: 'selector-user',
      selectorAccessLevel: 'BLACKLIST',
    }))
    window.dispatchEvent(new CustomEvent('auth:changed'))

    await waitFor(() => expect(readOwnedDataProbe()).toEqual({
      profileName: '',
      selectorsCode: null,
      groupCount: 0,
    }))
    expect(fetchSpy.mock.calls.filter(([input]) => String(input).endsWith('/api/product-groups/me/shop'))).toHaveLength(1)
  })

  it('throws a clear error when the hook is used outside the provider', () => {
    function OutsideProviderProbe() {
      useShopDemo()
      return null
    }

    expect(() => render(<OutsideProviderProbe />)).toThrowError(
      'useShopDemo must be used within a ShopDemoProvider',
    )
  })
})
