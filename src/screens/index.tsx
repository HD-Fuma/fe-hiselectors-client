import type { ScreenId } from '../screenRegistry'
import { ApplyFormScreen, ApplyIntroScreen } from './ApplyScreens'
import { CampaignDetailScreen, CampaignListScreen } from './CampaignScreens'
import CatalogScreen from './CatalogScreen'
import LoginScreen from './LoginScreen'
import { PerformanceSummaryScreen, ProductPerformanceScreen } from './PerformanceScreens'
import SettlementScreen from './SettlementScreen'
import {
  GroupCampaignCreateScreen,
  GroupCreateScreen,
  GroupEditScreen,
  OwnerShopGroupScreen,
  PublicShopScreen,
  ShopGroupsScreen,
} from './ShopScreens'

const screens: Record<ScreenId, () => React.JSX.Element> = {
  catalog: CatalogScreen,
  login: LoginScreen,
  'apply-intro': ApplyIntroScreen,
  'apply-form': ApplyFormScreen,
  'campaign-list': CampaignListScreen,
  'campaign-detail': CampaignDetailScreen,
  'public-shop': PublicShopScreen,
  'owner-shop-group': OwnerShopGroupScreen,
  'shop-groups': ShopGroupsScreen,
  'group-create': GroupCreateScreen,
  'group-edit': GroupEditScreen,
  'group-campaign-create': GroupCampaignCreateScreen,
  'performance-summary': PerformanceSummaryScreen,
  'product-performance': ProductPerformanceScreen,
  settlement: SettlementScreen,
}

export function getScreenComponent(id: ScreenId) {
  return screens[id]
}
