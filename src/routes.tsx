import type { ComponentType } from 'react'

import {
  canManageSelectorOperations,
  canViewSettlementHistory,
  getSelectorAccessLevel,
  hasValidUserSession,
  isSelectorAccessPending,
  type AuthSession,
} from './auth'
import { ApplyFormScreen, ApplyIntroScreen, ApplyStatusScreen } from './screens/apply/ApplyScreens'
import { CampaignDetailScreen, CampaignListScreen } from './screens/campaigns/CampaignScreens'
import LoginScreen from './screens/login/LoginScreen'
import HomeScreen from './screens/home/HomeScreen'
import MemberInfoScreen from './screens/mypage/MemberInfoScreen'
import { PerformanceSummaryScreen, ProductPerformanceScreen } from './screens/performance/PerformanceScreens'
import SettlementEntryScreen from './screens/settlement/SettlementEntryScreen'
import SettlementInfoScreen from './screens/settlement/SettlementInfoScreen'
import SettlementScreen from './screens/settlement/SettlementScreen'
import {
  GroupCampaignCreateScreen,
  GroupCreateScreen,
  GroupEditScreen,
} from './screens/shop/GroupEditorScreen'
import OwnerShopGroupScreen from './screens/shop/OwnerShopGroupScreen'
import PublicShopScreen from './screens/shop/PublicShopScreen'
import ProductDetailScreen from './screens/shop/ProductDetailScreen'
import ProfileEditScreen from './screens/shop/ProfileEditScreen'
import ShopGroupsScreen from './screens/shop/ShopGroupsScreen'

export type HashPath = `#/${string}`

type RouteDefinition = {
  id: string
  path: HashPath
  title: string
  Screen: ComponentType
  access: RouteAccess
}

export type RouteAccess = 'public' | 'applicant' | 'selector' | 'current' | 'settlement-history'

export const routes = [
  { id: 'login', path: '#/login', title: '로그인', Screen: LoginScreen, access: 'public' },
  { id: 'home', path: '#/home', title: '셀렉터스', Screen: HomeScreen, access: 'selector' },
  { id: 'member-info', path: '#/mypage/member', title: '회원정보 변경', Screen: MemberInfoScreen, access: 'public' },
  { id: 'apply-intro', path: '#/apply', title: '셀렉터스 신청하기', Screen: ApplyIntroScreen, access: 'applicant' },
  { id: 'apply-form', path: '#/apply/form', title: '셀렉터스 신청하기', Screen: ApplyFormScreen, access: 'applicant' },
  { id: 'apply-status', path: '#/apply/status', title: '신청 완료', Screen: ApplyStatusScreen, access: 'applicant' },
  {
    id: 'campaign-list',
    path: '#/campaigns',
    title: '캠페인',
    Screen: CampaignListScreen,
    access: 'current',
  },
  {
    id: 'campaign-detail',
    path: '#/campaigns/1',
    title: '캠페인 상세',
    Screen: CampaignDetailScreen,
    access: 'current',
  },
  {
    id: 'public-shop',
    path: '#/shop/example',
    title: '셀렉터스샵',
    Screen: PublicShopScreen,
    access: 'public',
  },
  {
    id: 'owner-shop-group',
    path: '#/shop/example/1',
    title: '셀렉터스샵',
    Screen: OwnerShopGroupScreen,
    access: 'public',
  },
  {
    id: 'shop-product-detail',
    path: '#/product/example',
    title: '상품 상세',
    Screen: ProductDetailScreen,
    access: 'public',
  },
  {
    id: 'shop-groups',
    path: '#/shop/groups',
    title: '셀렉터스 샵 관리하기',
    Screen: ShopGroupsScreen,
    access: 'current',
  },
  {
    id: 'shop-profile-edit',
    path: '#/shop/profile/edit',
    title: '프로필 수정',
    Screen: ProfileEditScreen,
    access: 'current',
  },
  {
    id: 'group-create',
    path: '#/shop/groups/new',
    title: '상품 그룹 만들기',
    Screen: GroupCreateScreen,
    access: 'current',
  },
  {
    id: 'group-edit',
    path: '#/shop/groups/1/edit',
    title: '상품 그룹 편집',
    Screen: GroupEditScreen,
    access: 'current',
  },
  {
    id: 'group-campaign-create',
    path: '#/shop/groups/new/campaign/1',
    title: '상품 그룹 만들기',
    Screen: GroupCampaignCreateScreen,
    access: 'current',
  },
  {
    id: 'performance-summary',
    path: '#/performance',
    title: '성과 요약',
    Screen: PerformanceSummaryScreen,
    access: 'current',
  },
  {
    id: 'product-performance',
    path: '#/performance/products',
    title: '상품별 성과',
    Screen: ProductPerformanceScreen,
    access: 'current',
  },
  {
    id: 'settlement-entry',
    path: '#/settlement/check',
    title: '정산',
    Screen: SettlementEntryScreen,
    access: 'current',
  },
  {
    id: 'settlement-info',
    path: '#/settlement/info',
    title: '정산 정보',
    Screen: SettlementInfoScreen,
    access: 'current',
  },
  {
    id: 'settlement',
    path: '#/settlement',
    title: '정산 내역',
    Screen: SettlementScreen,
    access: 'settlement-history',
  },
] as const satisfies readonly RouteDefinition[]

export type AppRoute = (typeof routes)[number]
export type RouteId = AppRoute['id']

export function routeMatchesHash(route: AppRoute, hash: string): boolean {
  return route.path === hash
    || (route.id === 'campaign-detail' && /^#\/campaigns\/[^/]+$/.test(hash))
    || (route.id === 'public-shop' && /^#\/shop\/(?!groups(?:\/|$)|profile(?:\/|$))[^/]+$/.test(hash))
    || (route.id === 'shop-product-detail' && /^#\/product\/[^/?]+/.test(hash))
    || (route.id === 'owner-shop-group' && /^#\/shop\/(?!groups(?:\/|$)|profile(?:\/|$))[^/]+\/(?!products(?:\/|$))[^/]+$/.test(hash))
    || (route.id === 'group-edit' && /^#\/shop\/groups\/[^/]+\/edit$/.test(hash))
    || (route.id === 'group-campaign-create' && /^#\/shop\/groups\/new\/campaign\/[^/]+$/.test(hash))
}

export function selectRouteByHash(hash: string): AppRoute {
  return routes.find((route) => routeMatchesHash(route, hash)) ?? routes[0]
}

export function canAccessRoute(route: AppRoute, session: AuthSession | null): boolean {
  if (route.access === 'public') return true
  if (route.access === 'applicant') return !hasValidUserSession(session) || getSelectorAccessLevel(session) === 'NONE'
  if (route.access === 'current') return canManageSelectorOperations(session)
  if (route.access === 'settlement-history') return canViewSettlementHistory(session)
  return canViewSettlementHistory(session)
}

export function getRouteRedirect(route: AppRoute, session: AuthSession | null): HashPath | null {
  if (canAccessRoute(route, session)) return null
  if (isSelectorAccessPending(session)) return null
  if (!hasValidUserSession(session)) return '#/login'
  if (getSelectorAccessLevel(session) === 'NONE') return '#/apply'
  return '#/home'
}
