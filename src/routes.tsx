import type { ComponentType } from 'react'

import { ApplyFormScreen, ApplyIntroScreen, ApplyStatusScreen } from './screens/apply/ApplyScreens'
import { CampaignDetailScreen, CampaignListScreen } from './screens/campaigns/CampaignScreens'
import LoginScreen from './screens/login/LoginScreen'
import { PerformanceSummaryScreen, ProductPerformanceScreen } from './screens/performance/PerformanceScreens'
import SettlementInfoScreen from './screens/settlement/SettlementInfoScreen'
import SettlementScreen from './screens/settlement/SettlementScreen'
import {
  GroupCampaignCreateScreen,
  GroupCreateScreen,
  GroupEditScreen,
} from './screens/shop/GroupEditorScreen'
import OwnerShopGroupScreen from './screens/shop/OwnerShopGroupScreen'
import PublicShopScreen from './screens/shop/PublicShopScreen'
import ShopGroupsScreen from './screens/shop/ShopGroupsScreen'

export type HashPath = `#/${string}`

type RouteDefinition = {
  id: string
  path: HashPath
  title: string
  Screen: ComponentType
}

export const routes = [
  { id: 'login', path: '#/login', title: '로그인', Screen: LoginScreen },
  { id: 'apply-intro', path: '#/apply', title: '셀렉터스 신청하기', Screen: ApplyIntroScreen },
  { id: 'apply-form', path: '#/apply/form', title: '셀렉터스 신청하기', Screen: ApplyFormScreen },
  { id: 'apply-status', path: '#/apply/status', title: '신청 완료', Screen: ApplyStatusScreen },
  {
    id: 'campaign-list',
    path: '#/campaigns',
    title: '캠페인',
    Screen: CampaignListScreen,
  },
  {
    id: 'campaign-detail',
    path: '#/campaigns/detail',
    title: '시즌 픽 캠페인',
    Screen: CampaignDetailScreen,
  },
  {
    id: 'public-shop',
    path: '#/shop/RC000003200T',
    title: '셀렉터스샵',
    Screen: PublicShopScreen,
  },
  {
    id: 'owner-shop-group',
    path: '#/shop/RC000003200T/1',
    title: '셀렉터스샵',
    Screen: OwnerShopGroupScreen,
  },
  {
    id: 'shop-groups',
    path: '#/shop/groups',
    title: '상품 그룹',
    Screen: ShopGroupsScreen,
  },
  {
    id: 'group-create',
    path: '#/shop/groups/new',
    title: '상품 그룹 만들기',
    Screen: GroupCreateScreen,
  },
  {
    id: 'group-edit',
    path: '#/shop/groups/1/edit',
    title: '상품 그룹 편집',
    Screen: GroupEditScreen,
  },
  {
    id: 'group-campaign-create',
    path: '#/shop/groups/new/season-pick',
    title: '상품 그룹 만들기',
    Screen: GroupCampaignCreateScreen,
  },
  {
    id: 'performance-summary',
    path: '#/performance',
    title: '성과 요약',
    Screen: PerformanceSummaryScreen,
  },
  {
    id: 'product-performance',
    path: '#/performance/products',
    title: '상품별 성과',
    Screen: ProductPerformanceScreen,
  },
  {
    id: 'settlement-info',
    path: '#/settlement/info',
    title: '정산 정보',
    Screen: SettlementInfoScreen,
  },
  {
    id: 'settlement',
    path: '#/settlement',
    title: '정산 내역',
    Screen: SettlementScreen,
  },
] as const satisfies readonly RouteDefinition[]

export type AppRoute = (typeof routes)[number]
export type RouteId = AppRoute['id']

export function routeMatchesHash(route: AppRoute, hash: string): boolean {
  return route.path === hash
    || (route.id === 'owner-shop-group' && /^#\/shop\/RC000003200T\/[^/]+$/.test(hash))
    || (route.id === 'group-edit' && /^#\/shop\/groups\/[^/]+\/edit$/.test(hash))
}

export function selectRouteByHash(hash: string): AppRoute {
  return routes.find((route) => routeMatchesHash(route, hash)) ?? routes[0]
}
