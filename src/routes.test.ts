import { describe, expect, it } from 'vitest'

import { routes, selectRouteByHash } from './routes'

const expectedScreens = [
  { id: 'login', path: '#/login', title: '로그인' },
  { id: 'apply-intro', path: '#/apply', title: '셀렉터스 신청하기' },
  { id: 'apply-form', path: '#/apply/form', title: '셀렉터스 신청하기' },
  { id: 'apply-status', path: '#/apply/status', title: '신청 완료' },
  { id: 'campaign-list', path: '#/campaigns', title: '캠페인' },
  { id: 'campaign-detail', path: '#/campaigns/detail', title: '시즌 픽 캠페인' },
  { id: 'public-shop', path: '#/shop/RC000003200T', title: '셀렉터스샵' },
  { id: 'owner-shop-group', path: '#/shop/RC000003200T/1', title: '셀렉터스샵' },
  { id: 'shop-groups', path: '#/shop/groups', title: '상품 그룹' },
  { id: 'group-create', path: '#/shop/groups/new', title: '상품 그룹 만들기' },
  { id: 'group-edit', path: '#/shop/groups/1/edit', title: '상품 그룹 편집' },
  {
    id: 'group-campaign-create',
    path: '#/shop/groups/new/season-pick',
    title: '상품 그룹 만들기',
  },
  { id: 'performance-summary', path: '#/performance', title: '성과 요약' },
  { id: 'product-performance', path: '#/performance/products', title: '상품별 성과' },
  { id: 'settlement-info', path: '#/settlement/info', title: '정산 정보' },
  { id: 'settlement', path: '#/settlement', title: '정산 내역' },
] as const

describe('routes', () => {
  it('defines every required route once', () => {
    expect(
      routes.map(({ id, path, title }) => ({ id, path, title })),
    ).toEqual(expectedScreens)

    const paths = routes.map((route) => route.path)

    expect(paths.every((path) => path.startsWith('#/'))).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('does not expose a screen catalog', () => {
    expect(routes.map(({ path }) => String(path))).not.toContain('#/screens')
  })

  it.each(routes)('selects $id for $path', ({ id, path }) => {
    expect(selectRouteByHash(path).id).toBe(id)
  })

  it('falls back to login for an unknown hash', () => {
    expect(selectRouteByHash('#/not-a-screen').id).toBe('login')
  })
})
