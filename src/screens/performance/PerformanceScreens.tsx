import { useCallback, useEffect, useState } from 'react'

import { ArrowRightIcon, ChartIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import {
  getPerformanceErrorMessage,
  getPerformanceSummary,
  getProductPerformance,
  type PerformanceMetrics,
  type PerformanceSummary,
  type PerformanceTrend,
  type ProductPerformanceList,
} from './performanceApi'

const numberFormatter = new Intl.NumberFormat('ko-KR')
const zeroMetrics: PerformanceMetrics = {
  estimatedSettlementAmount: 0,
  conversionAmount: 0,
  conversionCount: 0,
  clickCount: 0,
  conversionRate: 0,
}

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(month: string) {
  const [year, value] = month.split('-')
  return `${year}년 ${Number(value)}월`
}

function monthOptions(count = 24) {
  const now = new Date()
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? '0.0%' : '신규'
  const value = ((current - previous) / previous) * 100
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function pointChange(current: number, previous: number) {
  const value = current - previous
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%p`
}

type TrendKey = 'clickCount' | 'conversionCount' | 'conversionAmount'

function chartPoints(trends: PerformanceTrend[], key: TrendKey) {
  const max = Math.max(...trends.map((trend) => trend[key]), 1)
  return trends.map((trend, index) => {
    const x = trends.length <= 1 ? 16 : 16 + (index * 456 / (trends.length - 1))
    const y = 137 - ((trend[key] / max) * 110)
    return [x, y] as const
  })
}

function sampledIndexes(length: number, count = 7) {
  if (length <= count) return Array.from({ length }, (_, index) => index)
  return Array.from(new Set(Array.from({ length: count }, (_, index) => Math.round(index * (length - 1) / (count - 1)))))
}

function MonthSelect({ value, onChange }: { value: string; onChange: (month: string) => void }) {
  return (
    <select aria-label="조회 월 선택" onChange={(event) => onChange(event.target.value)} value={value}>
      {monthOptions().map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}
    </select>
  )
}

export function PerformanceSummaryScreen() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [summary, setSummary] = useState<PerformanceSummary | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSummary(await getPerformanceSummary(selectedMonth))
    } catch (requestError) {
      setError(getPerformanceErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => { void load() }, [load])

  const metrics = summary?.metrics ?? zeroMetrics
  const previous = summary?.previousMonthMetrics ?? zeroMetrics
  const summaryMetrics = [
    { label: '예상 정산 수수료', value: metrics.estimatedSettlementAmount, unit: '원', change: percentChange(metrics.estimatedSettlementAmount, previous.estimatedSettlementAmount), featured: true },
    { label: '구매 전환 금액', value: metrics.conversionAmount, unit: '원', change: percentChange(metrics.conversionAmount, previous.conversionAmount) },
    { label: '구매 전환 수', value: metrics.conversionCount, unit: '건', change: percentChange(metrics.conversionCount, previous.conversionCount) },
    { label: '누적 클릭 수', value: metrics.clickCount, unit: '회', change: percentChange(metrics.clickCount, previous.clickCount) },
    { label: '전환율', value: metrics.conversionRate, unit: '%', change: pointChange(metrics.conversionRate, previous.conversionRate), decimal: true },
  ]
  const trends = summary?.trends ?? []
  const trendSeries = [
    { label: '클릭 수', value: `${numberFormatter.format(metrics.clickCount)}회`, key: 'clickCount', lineClassName: 'chart-line chart-line-clicks', dotClassName: 'chart-dot chart-dot-clicks' },
    { label: '구매 전환 수', value: `${numberFormatter.format(metrics.conversionCount)}건`, key: 'conversionCount', lineClassName: 'chart-line chart-line-conversions', dotClassName: 'chart-dot chart-dot-conversions' },
    { label: '구매 전환 금액', value: `${numberFormatter.format(metrics.conversionAmount)}원`, key: 'conversionAmount', lineClassName: 'chart-line chart-line-amount', dotClassName: 'chart-dot chart-dot-amount' },
  ] as const
  const labelIndexes = sampledIndexes(trends.length)

  return (
    <>
      <ScreenHeader backHref="/home" title="셀렉터스 성과" />
      <div className="screen-scroll performance-screen" aria-busy={loading}>
        <div className="period-row">
          <MonthSelect onChange={setSelectedMonth} value={selectedMonth} />
        </div>

        {error && <div className="performance-feedback performance-feedback-error" role="alert"><span>{error}</span><button onClick={() => void load()} type="button">다시 시도</button></div>}

        <section className="metric-grid" aria-label="핵심 성과">
          {summaryMetrics.map((metric) => (
            <article className={`metric-card${metric.featured ? ' metric-card-featured' : ''}`} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.decimal ? metric.value.toFixed(2) : numberFormatter.format(metric.value)}<small>{metric.unit}</small></strong>
              <em><span>전월 대비</span>{metric.change}</em>
            </article>
          ))}
        </section>

        <section className="trend-card">
          <div className="trend-heading">
            <div><span>월별 집계</span><strong>성과 추이</strong></div>
            <span>{monthLabel(selectedMonth)}</span>
          </div>
          <div className="trend-legend" aria-label="성과 추이 범례">
            {trendSeries.map((series, index) => (
              <div className={`trend-legend-item trend-legend-item-${index + 1}`} key={series.label}>
                <span><i />{series.label}</span><strong>{series.value}</strong>
              </div>
            ))}
          </div>
          {trends.length ? (
            <svg aria-label={`${monthLabel(selectedMonth)} 클릭, 구매 전환 수, 구매 전환 금액 추이`} className="trend-chart" role="img" viewBox="0 0 488 166">
              <g className="chart-grid"><path d="M16 20H472M16 59H472M16 98H472M16 137H472" /></g>
              {trendSeries.map((series) => {
                const points = chartPoints(trends, series.key)
                return <g key={series.label}>
                  <polyline className={series.lineClassName} points={points.map(([x, y]) => `${x},${y}`).join(' ')} />
                  {labelIndexes.map((index) => <circle className={series.dotClassName} cx={points[index][0]} cy={points[index][1]} key={`${series.label}-${index}`} r="3" />)}
                </g>
              })}
              <g className="chart-labels">
                {labelIndexes.map((index, position) => <text key={trends[index].date} textAnchor={position === labelIndexes.length - 1 ? 'end' : undefined} x={trends.length <= 1 ? 16 : 16 + (index * 456 / (trends.length - 1))} y="158">{Number(trends[index].date.slice(5, 7))}/{Number(trends[index].date.slice(8, 10))}</text>)}
              </g>
            </svg>
          ) : <div className="performance-empty">표시할 성과 추이가 없습니다.</div>}
        </section>

        <section className="top-products-section">
          <div className="section-link-heading"><div><h2>전환 상위 상품</h2><p>구매 전환 수를 기준으로 정렬했어요.</p></div><a href="/performance/products">전체 보기 <ArrowRightIcon size={14} /></a></div>
          <div className="top-product-list">
            {summary?.topProducts.length ? summary.topProducts.map((product, index) => (
              <a className="top-product-row" href={product.detailUrl ?? undefined} key={product.productId} rel="noreferrer" target="_blank">
                <b>{index + 1}</b><img alt={product.productName} src={product.thumbnailUrl} />
                <div><span>{product.brandName}</span><strong>{product.productName}</strong><small>전환 {numberFormatter.format(product.conversionCount)}건</small></div>
                <em>{numberFormatter.format(product.estimatedSettlementAmount)}원</em>
              </a>
            )) : <div className="performance-empty">전환 상품이 없습니다.</div>}
          </div>
        </section>
      </div>
    </>
  )
}

export function ProductPerformanceScreen() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [result, setResult] = useState<ProductPerformanceList | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResult(await getProductPerformance(selectedMonth))
    } catch (requestError) {
      setError(getPerformanceErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [selectedMonth])

  useEffect(() => { void load() }, [load])
  const products = result?.products ?? []

  return (
    <>
      <ScreenHeader backHref="/performance" title="상품별 성과" />
      <div className="screen-scroll product-performance-screen" aria-busy={loading}>
        <div className="period-row product-period-row">
          <MonthSelect onChange={setSelectedMonth} value={selectedMonth} />
        </div>

        {error && <div className="performance-feedback performance-feedback-error" role="alert"><span>{error}</span><button onClick={() => void load()} type="button">다시 시도</button></div>}

        <section className="product-performance-summary">
          <div><ChartIcon size={22} /><span>구매 전환 수</span><strong>{numberFormatter.format(result?.conversionCount ?? 0)}건</strong></div>
          <p>상품별 클릭과 구매 전환 성과를 확인할 수 있어요.</p>
        </section>

        <section className="performance-table-section">
          <div className="performance-table-heading"><h2>상품 성과</h2><span>총 {numberFormatter.format(result?.totalProductCount ?? 0)}개</span></div>
          <div className="performance-table" role="table" aria-label="상품별 성과 지표">
            <div className="performance-table-header" role="row">
              <span role="columnheader">상품</span><span role="columnheader">클릭</span><span role="columnheader">전환</span><span role="columnheader">전환율</span><span role="columnheader">예상 수수료</span>
            </div>
            {products.map((product) => {
              const clicks = numberFormatter.format(product.clickCount)
              const conversions = numberFormatter.format(product.conversionCount)
              const rate = `${product.conversionRate.toFixed(2)}%`
              const commission = `${numberFormatter.format(product.estimatedSettlementAmount)}원`
              return <div className="performance-table-row" key={product.productId} role="row">
                <div className="table-product" role="cell"><a href={product.detailUrl ?? undefined} rel="noreferrer" target="_blank"><img alt={product.productName} src={product.thumbnailUrl} /><span><small>{product.brandName}</small><strong>{product.productName}</strong></span></a></div>
                <span aria-label={`클릭 ${clicks}`} role="cell">{clicks}</span>
                <span aria-label={`전환 ${conversions}`} role="cell">{conversions}</span>
                <span aria-label={`전환율 ${rate}`} role="cell">{rate}</span>
                <strong aria-label={`예상 수수료 ${commission}`} role="cell">{commission}</strong>
              </div>
            })}
            {!products.length && !loading && <div className="performance-empty">표시할 상품 성과가 없습니다.</div>}
          </div>
        </section>
      </div>
    </>
  )
}
