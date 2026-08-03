import { describe, expect, it } from 'vitest'

import {
  initialShopGroups,
  selectorProducts,
  selectorProfile,
  shopCampaigns,
} from './shopData'

describe('shop fixture contract', () => {
  it('locks the exact selector profile', () => {
    expect(selectorProfile).toEqual({
      name: 'byunjjii',
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
