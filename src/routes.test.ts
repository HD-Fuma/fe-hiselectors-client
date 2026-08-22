import { describe, expect, it } from 'vitest'

import type { AuthSession, SelectorAccessLevel } from './auth'
import { getRouteRedirect, routes, selectRouteByPath } from './routes'

const expectedScreens = [
  { id: 'login', path: '/login', title: '로그인' },
  { id: 'home', path: '/home', title: '셀렉터스' },
  { id: 'member-info', path: '/mypage/member', title: '회원정보 변경' },
  { id: 'apply-intro', path: '/apply', title: '셀렉터스 신청하기' },
  { id: 'apply-form', path: '/apply/form', title: '셀렉터스 신청하기' },
  { id: 'apply-status', path: '/apply/status', title: '신청 완료' },
  { id: 'campaign-list', path: '/campaigns', title: '캠페인' },
  { id: 'campaign-detail', path: '/campaigns/1', title: '캠페인 상세' },
  { id: 'public-shop', path: '/shop/example', title: '셀렉터스샵' },
  { id: 'owner-shop-group', path: '/shop/example/1', title: '셀렉터스샵' },
  { id: 'shop-product-detail', path: '/product/example', title: '상품 상세' },
  { id: 'shop-groups', path: '/shop/groups', title: '셀렉터스 샵 관리하기' },
  { id: 'shop-profile-edit', path: '/shop/profile/edit', title: '프로필 수정' },
  { id: 'group-create', path: '/shop/groups/new', title: '상품 그룹 만들기' },
  { id: 'group-edit', path: '/shop/groups/1/edit', title: '상품 그룹 편집' },
  {
    id: 'group-campaign-create',
    path: '/shop/groups/new/campaign/1',
    title: '상품 그룹 만들기',
  },
  { id: 'performance-summary', path: '/performance', title: '셀렉터스 성과' },
  { id: 'product-performance', path: '/performance/products', title: '상품별 성과' },
  { id: 'settlement-entry', path: '/settlement/check', title: '정산' },
  { id: 'settlement-info', path: '/settlement/info', title: '정산 정보' },
  { id: 'settlement', path: '/settlement', title: '정산 내역' },
] as const

describe('routes', () => {
  it('defines every required route once', () => {
    expect(
      routes.map(({ id, path, title }) => ({ id, path, title })),
    ).toEqual(expectedScreens)

    const paths = routes.map((route) => route.path)

    expect(paths.every((path) => path.startsWith('/'))).toBe(true)
    expect(paths.every((path) => !path.includes('#'))).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('does not expose a screen catalog', () => {
    expect(routes.map(({ path }) => String(path))).not.toContain('/screens')
  })

  it.each(routes)('selects $id for $path', ({ id, path }) => {
    expect(selectRouteByPath(path).id).toBe(id)
  })

  it('falls back to login for an unknown hash', () => {
    expect(selectRouteByPath('/not-a-screen').id).toBe('login')
  })

  it('selects dynamic shop group detail and edit routes', () => {
    expect(selectRouteByPath('/shop/RC000003200T/13').id).toBe('owner-shop-group')
    expect(selectRouteByPath('/product/60A2099341?ptrsRefCd=RC000003200T').id).toBe('shop-product-detail')
    expect(selectRouteByPath('/shop/groups/13/edit').id).toBe('group-edit')
  })

  it.each([
    ['CURRENT', '/campaigns', null],
    ['CURRENT', '/shop/groups/new', null],
    ['PREVIOUS', '/campaigns', '/home'],
    ['PREVIOUS', '/shop/groups/new', '/home'],
    ['PREVIOUS', '/settlement', null],
    ['BLACKLIST', '/settlement', null],
    ['BLACKLIST', '/shop/example', null],
    ['BLACKLIST', '/home', null],
    ['NONE', '/home', '/apply'],
    ['NONE', '/settlement', '/apply'],
    ['NONE', '/apply', null],
  ] as const)('guards %s access to %s', (accessLevel, hash, expectedRedirect) => {
    const session: AuthSession = {
      accessToken: 'test.jwt',
      tokenType: 'Bearer',
      role: 'USER',
      loginId: 'user',
      selectorAccessLevel: accessLevel as SelectorAccessLevel,
    }

    expect(getRouteRedirect(selectRouteByPath(hash), session)).toBe(expectedRedirect)
  })

  it('sends an anonymous protected-route request to login', () => {
    expect(getRouteRedirect(selectRouteByPath('/campaigns'), null)).toBe('/login')
  })

  it('treats a non-user role as having no selector access', () => {
    const session: AuthSession = {
      accessToken: 'admin.jwt',
      tokenType: 'Bearer',
      role: 'ADMIN',
      loginId: 'admin',
      selectorAccessLevel: 'CURRENT',
    }

    expect(getRouteRedirect(selectRouteByPath('/home'), session)).toBe('/apply')
    expect(getRouteRedirect(selectRouteByPath('/apply'), session)).toBeNull()
  })
})
