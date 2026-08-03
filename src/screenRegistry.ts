export type HashPath = `#/${string}`

export const screenRegistry = [
  { id: 'catalog', path: '#/screens', title: '셀렉터스 클라이언트 화면' },
  { id: 'login', path: '#/login', title: '로그인' },
  { id: 'apply-intro', path: '#/apply', title: '셀렉터스 신청하기' },
  { id: 'apply-form', path: '#/apply/form', title: '셀렉터스 신청하기' },
  { id: 'campaign-list', path: '#/campaigns', title: '캠페인' },
  {
    id: 'campaign-detail',
    path: '#/campaigns/detail',
    title: '시즌 픽 캠페인',
  },
  {
    id: 'public-shop',
    path: '#/shop/RC000003200T',
    title: '셀렉터스샵',
  },
  {
    id: 'owner-shop-group',
    path: '#/shop/RC000003200T/1',
    title: '셀렉터스샵',
  },
  { id: 'shop-groups', path: '#/shop/groups', title: '상품 그룹' },
  {
    id: 'group-create',
    path: '#/shop/groups/new',
    title: '상품 그룹 만들기',
  },
  {
    id: 'group-edit',
    path: '#/shop/groups/1/edit',
    title: '상품 그룹 편집',
  },
  {
    id: 'group-campaign-create',
    path: '#/shop/groups/new/season-pick',
    title: '상품 그룹 만들기',
  },
  {
    id: 'performance-summary',
    path: '#/performance',
    title: '성과 요약',
  },
  {
    id: 'product-performance',
    path: '#/performance/products',
    title: '상품별 성과',
  },
  { id: 'settlement', path: '#/settlement', title: '정산 내역' },
] as const satisfies readonly {
  id: string
  path: HashPath
  title: string
}[]

export type ScreenDefinition = (typeof screenRegistry)[number]
export type ScreenId = ScreenDefinition['id']

const fallbackScreen = screenRegistry[0]

export function selectScreenByHash(hash: string): ScreenDefinition {
  return screenRegistry.find((screen) => screen.path === hash) ?? fallbackScreen
}
