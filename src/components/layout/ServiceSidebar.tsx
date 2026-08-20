import { SearchIcon } from '../Icons'
import QrMark from './QrMark'

const asideTiles = [
  { label: '더현대 기프트', image: 'https://image.thehyundai.com/images/aside/img_aside_gift.png?SF=webp&AO=1' },
  { label: '라이브', image: 'https://image.thehyundai.com/images/aside/img_aside_live.png?SF=webp&AO=1' },
  { label: '이벤트', image: 'https://image.thehyundai.com/images/aside/img_aside_event.png?SF=webp&AO=1' },
  { label: '예약/웨이팅', image: 'https://image.thehyundai.com/images/aside/img_aside_waiting.png?SF=webp&AO=1' },
  { label: '콘텐츠', image: 'https://image.thehyundai.com/images/aside/img_aside_content.png?SF=webp&AO=1' },
  { label: '셀렉터스', image: 'https://image.thehyundai.com/images/aside/img_aside_mespace.png?SF=webp&AO=1' },
] as const

export default function ServiceSidebar() {
  return (
    <aside className="service-sidebar" aria-label="서비스 바로가기">
      <img
        alt="서비스 로고"
        className="service-logo"
        height="71"
        src="https://image.thehyundai.com/images/logo_hihi.svg?SF=webp&AO=1"
        width="180"
      />

      <div className="aside-search">
        <span>검색어를 입력해 보세요.</span>
        <SearchIcon size={22} />
      </div>

      <nav className="aside-tile-grid" aria-label="서비스 메뉴">
        {asideTiles.map((tile) => (
          <a className="aside-tile" href={tile.label === '셀렉터스' ? '#/home' : '#/campaigns'} key={tile.label}>
            <span>{tile.label}</span>
            <img alt="" src={tile.image} />
          </a>
        ))}
      </nav>

      <div className="aside-install">
        <div>
          <strong>앱 설치하고</strong>
          <p>다양한 서비스를 만나보세요!</p>
        </div>
        <QrMark />
      </div>
    </aside>
  )
}
