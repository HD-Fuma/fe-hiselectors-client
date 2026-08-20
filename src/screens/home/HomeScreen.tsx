import { ArrowRightIcon, CartIcon, ChartIcon, CoinIcon, GiftIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'

const homeMenus = [
  { href: '#/shop/RC000003200T', label: '셀렉터스 샵', description: '나만의 상품 그룹과 공유 링크를 관리해요.', Icon: CartIcon },
  { href: '#/campaigns', label: '캠페인', description: '진행 중인 캠페인과 상품을 확인해요.', Icon: GiftIcon },
  { href: '#/performance', label: '성과', description: '클릭과 구매 전환 성과를 확인해요.', Icon: ChartIcon },
  { href: '#/settlement/check', label: '정산 관리', description: '정산 정보와 지급 내역을 관리해요.', Icon: CoinIcon },
] as const

export default function HomeScreen() {
  return (
    <div className="panel-page">
      <ScreenHeader title="셀렉터스" />
      <div className="screen-scroll selectors-home-screen">
        <div className="selectors-home-lead">
          <span>HI SELECTORS</span>
          <h2>셀렉터스 활동을<br />한곳에서 관리해요.</h2>
        </div>
        <nav aria-label="셀렉터스 메뉴" className="selectors-home-menu">
          {homeMenus.map(({ Icon, description, href, label }) => (
            <a href={href} key={href}>
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
