import {
  canManageSelectorOperations,
  canViewSelectorShop,
  getSelectorAccessLevel,
  logout,
  readAuthSession,
} from '../../auth'
import { ArrowRightIcon, CartIcon, ChartIcon, CoinIcon, GiftIcon, PersonIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import { useShopDemo } from '../shop/ShopDemoContext'
import { buildPublicShopPath } from '../shop/shopRoute'

const staticHomeMenus = [
  { href: '/campaigns', label: '캠페인', description: '진행 중인 캠페인과 상품을 확인해요.', Icon: GiftIcon },
  { href: '/performance', label: '성과', description: '클릭과 구매 전환 성과를 확인해요.', Icon: ChartIcon },
  { href: '/settlement/check', label: '정산 관리', description: '정산 정보와 지급 내역을 관리해요.', Icon: CoinIcon },
] as const

const settlementHistoryMenu = {
  href: '/settlement',
  label: '정산 내역',
  description: '이전 활동의 정산 내역을 확인해요.',
  Icon: CoinIcon,
} as const

export default function HomeScreen() {
  const session = readAuthSession()
  const accessLevel = getSelectorAccessLevel(session)
  const canManage = canManageSelectorOperations(session)
  const canViewShop = canViewSelectorShop(session)
  const { isProductGroupLoading, ownedProfileMeta, productGroupError, profile, selectorsCode } = useShopDemo()
  const shopHref = selectorsCode ? buildPublicShopPath(selectorsCode) : null
  const generationName = ownedProfileMeta.generationName?.trim() || '기수 정보 없음'
  const userName = ownedProfileMeta.userName?.trim() || session?.userName?.trim() || '이름 정보 없음'
  const savedSnsId = ownedProfileMeta.snsId?.trim()
  const snsId = savedSnsId || 'SNS ID 없음'
  const homeMenus = [
    ...(canViewShop ? [{
      href: shopHref,
      label: '셀렉터스 샵',
      description: isProductGroupLoading
        ? '내 셀렉터스 샵을 불러오는 중이에요.'
        : productGroupError || (canManage
          ? '나만의 상품 그룹과 공유 링크를 관리해요.'
          : '이전 기수의 셀렉터스 샵을 조회해요.'),
      Icon: CartIcon,
    }] : []),
    ...(canManage ? staticHomeMenus : []),
    ...(accessLevel === 'PREVIOUS' || accessLevel === 'BLACKLIST' ? [settlementHistoryMenu] : []),
    { href: '/mypage/member', label: '회원정보 변경', description: '회원정보와 카카오 메시지 연결을 관리해요.', Icon: PersonIcon },
  ]
  return (
    <div className="panel-page selectors-home-page">
      <ScreenHeader
        action={(
          <button className="logout-button" onClick={logout} type="button">로그아웃</button>
        )}
        title="셀렉터스"
      />
      <div className="screen-scroll selectors-home-screen">
        <section
          aria-busy={isProductGroupLoading || undefined}
          aria-label="내 셀렉터스 프로필"
          className="selectors-home-profile-card"
        >
          <div className="selectors-home-profile-avatar">
            {profile.avatarImage ? (
              <img alt="셀렉터스 프로필" className="selector-avatar-image" src={profile.avatarImage} />
            ) : (
              <span aria-hidden="true" className="selector-avatar-placeholder" />
            )}
          </div>
          <div className="selectors-home-profile-copy">
            <span>{generationName}</span>
            <h2>{userName}</h2>
            <p>{savedSnsId ? <small>SNS ID</small> : null}<span>{snsId}</span></p>
          </div>
        </section>
        <nav aria-label="셀렉터스 메뉴" className="selectors-home-menu">
          {homeMenus.map(({ Icon, description, href, label }) => (
            <a
              aria-disabled={!href || undefined}
              href={href ?? '/home'}
              key={label}
              onClick={(event) => {
                if (!href) event.preventDefault()
              }}
            >
              <span className="selectors-home-icon"><Icon size={24} /></span>
              <span className="selectors-home-copy"><strong>{label}</strong><small>{description}</small></span>
              <ArrowRightIcon size={18} />
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
