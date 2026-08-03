import { SearchIcon } from './Icons'
import QrMark from './QrMark'

const asideTiles = [
  { label: '선물하기', image: 'https://image.thehyundai.com/images/aside/img_aside_gift.png?SF=webp&AO=1' },
  { label: '라이브쇼핑', image: 'https://image.thehyundai.com/images/aside/img_aside_live.png?SF=webp&AO=1' },
  { label: '이벤트', image: 'https://image.thehyundai.com/images/aside/img_aside_event.png?SF=webp&AO=1' },
  { label: '웨이팅', image: 'https://image.thehyundai.com/images/aside/img_aside_waiting.png?SF=webp&AO=1' },
  { label: '콘텐츠', image: 'https://image.thehyundai.com/images/aside/img_aside_content.png?SF=webp&AO=1' },
  { label: 'ME스페이스', image: 'https://image.thehyundai.com/images/aside/img_aside_mespace.png?SF=webp&AO=1' },
] as const

export default function HiHiAside() {
  return (
    <aside className="hihi-aside" aria-label="HiHi 바로가기">
      <img
        alt="HiHi"
        className="hihi-logo"
        height="71"
        src="https://image.thehyundai.com/images/logo_hihi.svg?SF=webp&AO=1"
        width="180"
      />

      <div className="aside-search" role="search">
        <span>무엇을 찾고 계세요?</span>
        <SearchIcon size={22} />
      </div>

      <nav className="aside-tile-grid" aria-label="HiHi 서비스">
        {asideTiles.map((tile) => (
          <a className="aside-tile" href="#/screens" key={tile.label}>
            <span>{tile.label}</span>
            <img alt="" src={tile.image} />
          </a>
        ))}
      </nav>

      <div className="aside-install">
        <div>
          <strong>HiHi 앱에서 더 편하게</strong>
          <p>QR 코드를 스캔하고 현대백화점의<br />새로운 일상을 만나보세요.</p>
        </div>
        <QrMark />
      </div>
    </aside>
  )
}
