import { ArrowRightIcon, ChartIcon, ChevronDownIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'
import { shopProducts } from './productData'

const summaryMetrics = [
  { label: '누적 클릭 수', value: '12,840', unit: '회', change: '+18.2%' },
  { label: '구매 전환 수', value: '386', unit: '건', change: '+12.7%' },
  { label: '전환율', value: '3.01', unit: '%', change: '+0.4%p' },
  { label: '예상 정산 수수료', value: '1,284,600', unit: '원', change: '+21.5%' },
] as const

const topProducts = [
  { product: shopProducts[0], conversions: 92, commission: '324,800원' },
  { product: shopProducts[4], conversions: 68, commission: '286,400원' },
  { product: shopProducts[6], conversions: 55, commission: '175,600원' },
] as const

export function PerformanceSummaryScreen() {
  return (
    <>
      <PanelHeader backHref="#/screens" title="성과 요약" />
      <div className="screen-scroll performance-screen">
        <div className="period-row">
          <div><span>조회 기간</span><strong>2026.08.01 - 2026.08.31</strong></div>
          <button type="button">최근 30일 <ChevronDownIcon size={17} /></button>
        </div>

        <section className="metric-grid" aria-label="핵심 성과">
          {summaryMetrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}<small>{metric.unit}</small></strong>
              <em>{metric.change}</em>
            </article>
          ))}
        </section>

        <section className="trend-card">
          <div className="trend-heading">
            <div><span>클릭 추이</span><strong>최근 7일</strong></div>
            <span className="legend"><i /> 클릭 수</span>
          </div>
          <svg aria-label="최근 7일 클릭 수 추이" className="trend-chart" role="img" viewBox="0 0 488 166">
            <g className="chart-grid">
              <path d="M16 20H472M16 59H472M16 98H472M16 137H472" />
            </g>
            <polyline className="chart-line" points="16,122 92,103 168,110 244,69 320,78 396,42 472,27" />
            {[[16, 122], [92, 103], [168, 110], [244, 69], [320, 78], [396, 42], [472, 27]].map(([x, y]) => <circle className="chart-dot" cx={x} cy={y} key={`${x}-${y}`} r="3.5" />)}
            <g className="chart-labels">
              <text x="16" y="158">8/25</text><text x="92" y="158">8/26</text><text x="168" y="158">8/27</text><text x="244" y="158">8/28</text><text x="320" y="158">8/29</text><text x="396" y="158">8/30</text><text textAnchor="end" x="472" y="158">8/31</text>
            </g>
          </svg>
        </section>

        <section className="top-products-section">
          <div className="section-link-heading"><div><h2>전환 상위 상품</h2><p>구매 전환 수를 기준으로 정렬했어요.</p></div><a href="#/performance/products">전체 보기 <ArrowRightIcon size={14} /></a></div>
          <div className="top-product-list">
            {topProducts.map((item, index) => (
              <article className="top-product-row" key={item.product.name}>
                <b>{index + 1}</b>
                <img alt={item.product.name} src={item.product.image} />
                <div><span>{item.product.brand}</span><strong>{item.product.name}</strong><small>전환 {item.conversions}건</small></div>
                <em>{item.commission}</em>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

const productRows = [
  { product: shopProducts[0], clicks: '2,840', conversions: '92', rate: '3.24%', commission: '324,800원' },
  { product: shopProducts[4], clicks: '2,106', conversions: '68', rate: '3.23%', commission: '286,400원' },
  { product: shopProducts[6], clicks: '1,754', conversions: '55', rate: '3.14%', commission: '175,600원' },
  { product: shopProducts[3], clicks: '1,482', conversions: '43', rate: '2.90%', commission: '164,500원' },
  { product: shopProducts[1], clicks: '1,206', conversions: '38', rate: '3.15%', commission: '142,300원' },
] as const

export function ProductPerformanceScreen() {
  return (
    <>
      <PanelHeader backHref="#/performance" title="상품별 성과" />
      <div className="screen-scroll product-performance-screen">
        <div className="period-row product-period-row">
          <div><span>조회 기간</span><strong>2026년 8월</strong></div>
          <button type="button">이번 달 <ChevronDownIcon size={17} /></button>
        </div>

        <section className="product-performance-summary">
          <div><ChartIcon size={22} /><span>구매 전환 수</span><strong>386건</strong></div>
          <p>상품 이미지를 누르면 성과 세부 항목을 확인할 수 있어요.</p>
        </section>

        <section className="performance-table-section">
          <div className="performance-table-heading"><h2>상품 성과</h2><span>총 {productRows.length}개</span></div>
          <div className="performance-table" role="table" aria-label="상품별 성과 지표">
            <div className="performance-table-header" role="row">
              <span role="columnheader">상품</span><span role="columnheader">클릭</span><span role="columnheader">전환</span><span role="columnheader">전환율</span><span role="columnheader">예상 수수료</span>
            </div>
            {productRows.map((row) => (
              <div className="performance-table-row" key={row.product.name} role="row">
                <div className="table-product" role="cell"><img alt={row.product.name} src={row.product.image} /><span><small>{row.product.brand}</small><strong>{row.product.name}</strong></span></div>
                <span role="cell">{row.clicks}</span>
                <span role="cell">{row.conversions}</span>
                <span role="cell">{row.rate}</span>
                <strong role="cell">{row.commission}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
