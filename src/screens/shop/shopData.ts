export type SelectorProfile = {
  readonly name: string
  readonly avatarImage?: string
  readonly meSpaceLabel: string
  readonly badgeAlt: string
  readonly badgeImage: string
  readonly verified: boolean
}

export type ShopProduct = {
  readonly id: string
  readonly category: string
  readonly brand: string
  readonly name: string
  readonly originalPrice: string
  readonly discountRate: string
  readonly salePrice: string
  readonly image: string
  readonly detailUrl?: string
  readonly campaignIds: readonly string[]
}

export type ShopCampaign = {
  readonly id: string
  readonly name: string
  readonly productIds: readonly string[]
  readonly description?: string
  readonly startDate?: string
  readonly endDate?: string
  readonly thumbnailUrl?: string
  readonly status?: 'ACTIVE' | 'SCHEDULED' | 'ENDED'
  readonly brands?: readonly string[]
}

export type ShopGroup = {
  readonly id: string
  readonly name: string
  readonly createdAt: string
  readonly campaignId: string | null
  readonly productIds: readonly string[]
}

export const selectorProfile = {
  name: 'byunjjii',
  avatarImage: '',
  meSpaceLabel: 'byunjjii의 ME스페이스',
  badgeAlt: '인플루언서 뱃지',
  badgeImage: 'https://image.thehyundai.com/images/badge/badge_manager_large.png?SF=webp&AO=1',
  verified: true,
} as const satisfies SelectorProfile

export const selectorProducts = [
  {
    id: 'knit-ivory',
    category: '패션',
    brand: '알투더블유',
    name: '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)',
    originalPrice: '189,000원',
    discountRate: '20%',
    salePrice: '151,200원',
    image: 'https://image.thehyundai.com/7/6/2/34/B1/40B1342672_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['season-pick'],
  },
  {
    id: 'knit-blue',
    category: '패션',
    brand: '알투더블유',
    name: '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)',
    originalPrice: '189,000원',
    discountRate: '20%',
    salePrice: '151,200원',
    image: 'https://image.thehyundai.com/1/7/2/34/B1/40B1342714_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['season-pick'],
  },
  {
    id: 'knit-midnight',
    category: '패션',
    brand: '알투더블유',
    name: '[더현대Hi 단독] Cale ribbed half sleeve KN (Midnight blue)',
    originalPrice: '189,000원',
    discountRate: '20%',
    salePrice: '151,200원',
    image: 'https://image.thehyundai.com/3/7/2/34/B1/40B1342730_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['season-pick'],
  },
  {
    id: 'cologne-blackberry',
    category: '뷰티',
    brand: '조 말론 런던',
    name: '[단독] 블랙베리 앤 베이 코롱 100ml (+바디 워시 30ml 증정)',
    originalPrice: '245,000원',
    discountRate: '5%',
    salePrice: '232,750원',
    image: 'https://image.thehyundai.com/4/7/0/25/A2/40A2250746_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['season-pick', 'fragrance-note'],
  },
  {
    id: 'cologne-pear',
    category: '뷰티',
    brand: '조 말론 런던',
    name: '잉글리쉬 페어 앤 프리지아 코롱 30ml (+코롱 1.5ml 1종 +바디 사쉐 1종 증정)',
    originalPrice: '110,000원',
    discountRate: '5%',
    salePrice: '104,500원',
    image: 'https://image.thehyundai.com/5/8/0/25/A2/40A2250850_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['fragrance-note'],
  },
  {
    id: 'cologne-frangipani',
    category: '뷰티',
    brand: '조 말론 런던',
    name: '프랑지파니 플라워 코롱 30ml',
    originalPrice: '114,000원',
    discountRate: '5%',
    salePrice: '108,300원',
    image: 'https://image.thehyundai.com/6/4/0/32/A2/40A2320469_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['fragrance-note'],
  },
  {
    id: 'jewelry-fullmoon',
    category: '주얼리',
    brand: '이에르로르',
    name: '샴페인 풀문 (Y) 빅 보울 귀걸이 HL2E53215YBXXX',
    originalPrice: '70,000원',
    discountRate: '15%',
    salePrice: '59,500원',
    image: 'https://image.thehyundai.com/6/3/4/08/A2/60A2084362_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['jewelry-focus'],
  },
  {
    id: 'jewelry-flower',
    category: '주얼리',
    brand: '이에르로르',
    name: '에센스 실버(W) 모이사나이트 플라워 스테이션 팔찌 HL4B61404W9175',
    originalPrice: '140,000원',
    discountRate: '15%',
    salePrice: '119,000원',
    image: 'https://image.thehyundai.com/0/6/5/28/A2/60A2285600_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['jewelry-focus'],
  },
  {
    id: 'jewelry-hlink',
    category: '주얼리',
    brand: '이에르로르',
    name: '[이에르로르] [Premium Plating] H링크 AB(W) 듀오 라인 파베 뱅글 HL3B63304WB',
    originalPrice: '110,000원',
    discountRate: '15%',
    salePrice: '93,500원',
    image: 'https://image.thehyundai.com/8/4/3/12/B1/60B1123482_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['jewelry-focus'],
  },
  {
    id: 'earring-essence',
    category: '주얼리',
    brand: '이에르로르',
    name: '에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX',
    originalPrice: '90,000원',
    discountRate: '15%',
    salePrice: '76,500원',
    image: 'https://image.thehyundai.com/4/3/9/09/A2/60A2099341_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['jewelry-focus'],
  },
  {
    id: 'earring-souvenir',
    category: '주얼리',
    brand: '',
    name: '[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX',
    originalPrice: '150,000원',
    discountRate: '15%',
    salePrice: '127,500원',
    image: 'https://image.thehyundai.com/0/6/3/12/B1/60B1123606_0.jpg?RS=375x375&AR=0&SF=webp&AO=1',
    campaignIds: ['jewelry-focus'],
  },
] as const satisfies readonly ShopProduct[]

export const shopProducts = selectorProducts.slice(0, 9)

export const shopCampaigns = [
  {
    id: 'season-pick',
    name: '여름의 결을 고르는 시즌 픽',
    description: '여름의 결을 고르는 시즌 픽',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    status: 'ACTIVE',
    brands: ['TIME'],
    productIds: ['knit-ivory', 'knit-blue', 'knit-midnight', 'cologne-blackberry'],
  },
  {
    id: 'fragrance-note',
    name: '은은하게 오래 남는 향',
    productIds: ['cologne-blackberry', 'cologne-pear', 'cologne-frangipani'],
  },
  {
    id: 'jewelry-focus',
    name: '매일을 빛내는 작은 주얼리',
    productIds: [
      'jewelry-fullmoon',
      'jewelry-flower',
      'jewelry-hlink',
      'earring-essence',
      'earring-souvenir',
    ],
  },
] as const satisfies readonly ShopCampaign[]

export const initialShopGroups = [
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
] as const satisfies readonly ShopGroup[]
