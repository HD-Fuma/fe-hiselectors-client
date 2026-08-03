export type HashPath = `#/${string}`

export const screenRegistry = [
  { id: 'catalog', path: '#/screens', title: 'Catalog' },
  { id: 'login', path: '#/login', title: 'Login' },
  { id: 'apply-intro', path: '#/apply', title: 'Apply' },
  { id: 'apply-form', path: '#/apply/form', title: 'Application form' },
  { id: 'campaign-list', path: '#/campaigns', title: 'Campaigns' },
  {
    id: 'campaign-detail',
    path: '#/campaigns/detail',
    title: 'Campaign detail',
  },
  { id: 'shop-groups', path: '#/shop/groups', title: 'Shop groups' },
  {
    id: 'group-editor-product-picker',
    path: '#/shop/groups/edit',
    title: 'Group editor and product picker',
  },
  {
    id: 'public-shop',
    path: '#/shop/RC000004900T',
    title: 'Public shop',
  },
  {
    id: 'performance-summary',
    path: '#/performance',
    title: 'Performance summary',
  },
  {
    id: 'product-performance',
    path: '#/performance/products',
    title: 'Product performance',
  },
  { id: 'settlement', path: '#/settlement', title: 'Settlement' },
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
