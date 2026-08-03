import PanelHeader from '../components/PanelHeader'
import { ArrowRightIcon } from '../components/Icons'
import { screenRegistry, type ScreenId } from '../screenRegistry'

const catalogMeta: Record<Exclude<ScreenId, 'catalog'>, { label: string; description: string; group: string }> = {
  login: { label: '일반 로그인', description: '아이디와 비밀번호로 시작하는 로그인 화면', group: '시작' },
  'apply-intro': { label: '신청 인트로', description: '셀렉터스 활동 방식과 혜택 안내', group: '신청' },
  'apply-form': { label: '신청서 작성', description: '활동 채널과 필수 약관 입력 상태', group: '신청' },
  'campaign-list': { label: '캠페인 목록', description: '진행 상태별 브랜드 캠페인 탐색', group: '캠페인' },
  'campaign-detail': { label: '캠페인 상세', description: '캠페인 기간과 참여 상품 안내', group: '캠페인' },
  'shop-groups': { label: '상품 그룹 관리', description: '셀렉터스샵에 노출할 상품 묶음 관리', group: '셀렉터스샵' },
  'group-editor-product-picker': { label: '상품 그룹 만들기', description: '캠페인을 고르고 상품을 담는 편집 상태', group: '셀렉터스샵' },
  'public-shop': { label: '공유 셀렉터스샵', description: '고객에게 공유되는 공개 상품 큐레이션', group: '셀렉터스샵' },
  'performance-summary': { label: '성과 요약', description: '클릭·전환·예상 수수료 대시보드', group: '성과' },
  'product-performance': { label: '상품별 성과', description: '상품 단위 전환 성과 목록', group: '성과' },
  settlement: { label: '월별 정산', description: '월별 지급 및 정산 예정 내역', group: '정산' },
}

export default function CatalogScreen() {
  const screens = screenRegistry.filter((screen) => screen.id !== 'catalog')

  return (
    <>
      <PanelHeader title="셀렉터스 클라이언트 화면" />
      <div className="screen-scroll catalog-screen">
        <div className="catalog-intro">
          <span className="catalog-kicker">SELECTORS CLIENT UI</span>
          <p>셀렉터스가 신청하고, 상품을 고르고, 성과와 정산을 확인하는 전체 화면입니다.</p>
          <span className="catalog-count">총 {screens.length}개 화면</span>
        </div>

        <nav className="catalog-list" aria-label="셀렉터스 화면 목록">
          {screens.map((item, index) => {
            const meta = catalogMeta[item.id]
            return (
              <a className="catalog-card" href={item.path} key={item.id}>
                <span className="catalog-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="catalog-card-copy">
                  <span className="catalog-group">{meta.group}</span>
                  <strong>{meta.label}</strong>
                  <span>{meta.description}</span>
                </span>
                <ArrowRightIcon className="catalog-arrow" size={20} />
              </a>
            )
          })}
        </nav>
      </div>
    </>
  )
}
