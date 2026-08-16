import { useCallback, useEffect, useMemo, useState } from 'react'

import ScreenHeader from '../../components/ScreenHeader'
import MainNavigation from '../../components/layout/MainNavigation'
import {
  getSettlementErrorMessage,
  getSettlementEstimate,
  getSettlementHistories,
  isSettlementNotCalculated,
  refreshSettlementEstimate,
  type SettlementEstimate,
  type SettlementStatus,
} from './settlementApi'

const currencyFormatter = new Intl.NumberFormat('ko-KR')

const statusLabels: Record<SettlementStatus, string> = {
  CALCULATING: '정산 예정',
  PAYMENT_PENDING: '지급 대기',
  PAYMENT_HOLD: '지급 보류',
  SETTLED: '지급 완료',
}

function getSeoulDatePart(part: Intl.DateTimeFormatPartTypes): number {
  const value = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    [part]: 'numeric',
  }).formatToParts(new Date()).find((item) => item.type === part)?.value
  return Number(value)
}

export function getCurrentSettlementYear(): number {
  return getSeoulDatePart('year')
}

export function isRefreshPeriodOpen(): boolean {
  const day = getSeoulDatePart('day')
  return day >= 1 && day <= 21
}

export function formatSettlementMonth(month: string): string {
  const [year, value] = month.split('-').map(Number)
  return `${year}년 ${value}월`
}

export function formatSettlementPeriod(month: string): string {
  const [year, value] = month.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, value, 0)).getUTCDate()
  return `${year}.${String(value).padStart(2, '0')}.01 - ${year}.${String(value).padStart(2, '0')}.${lastDay}`
}

export function formatPaymentDate(month: string): string {
  const [year, value] = month.split('-').map(Number)
  const paymentMonth = new Date(Date.UTC(year, value + 1, 20))
  return `${paymentMonth.getUTCFullYear()}.${String(paymentMonth.getUTCMonth() + 1).padStart(2, '0')}.20`
}

function formatCurrency(amount: number): string {
  return `${currencyFormatter.format(amount)}원`
}

function statusClass(status: SettlementStatus): string {
  return status.toLowerCase().replaceAll('_', '-')
}

function paymentText(history: SettlementEstimate): string {
  if (history.status === 'PAYMENT_HOLD') {
    return '지급 보류'
  }
  if (history.status === 'SETTLED') {
    return `${formatPaymentDate(history.settlementMonth)} 지급`
  }
  return `정산 예정일 ${formatPaymentDate(history.settlementMonth)}`
}

function SettlementHistoryRow({ history }: { history: SettlementEstimate }) {
  return (
    <article className="settlement-row">
      <div>
        <span className={`settlement-status ${statusClass(history.status)}`}>{statusLabels[history.status]}</span>
        <strong>{formatSettlementMonth(history.settlementMonth)}</strong>
        <small>{formatSettlementPeriod(history.settlementMonth)}</small>
      </div>
      <div>
        <strong>{formatCurrency(history.estimatedCommission)}</strong>
        <small>{paymentText(history)}</small>
      </div>
    </article>
  )
}

export default function SettlementScreen() {
  const [selectedYear, setSelectedYear] = useState(getCurrentSettlementYear)
  const [estimate, setEstimate] = useState<SettlementEstimate | null>(null)
  const [histories, setHistories] = useState<SettlementEstimate[]>([])
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [isSummaryLoading, setIsSummaryLoading] = useState(true)
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true)
    setSummaryError(null)
    try {
      setEstimate(await getSettlementEstimate())
    } catch (error) {
      if (isSettlementNotCalculated(error)) {
        setEstimate(null)
      } else {
        setSummaryError(getSettlementErrorMessage(error))
      }
    } finally {
      setIsSummaryLoading(false)
    }
  }, [])

  const loadHistories = useCallback(async (year: number) => {
    setIsHistoryLoading(true)
    setHistoryError(null)
    try {
      const result = await getSettlementHistories(year)
      setHistories(result.histories)
      setAvailableYears(result.availableYears)
    } catch (error) {
      setHistoryError(getSettlementErrorMessage(error))
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSummary()
  }, [loadSummary])

  useEffect(() => {
    void loadHistories(selectedYear)
  }, [loadHistories, selectedYear])

  const yearOptions = useMemo(() => {
    const years = new Set([selectedYear, ...availableYears])
    return [...years].sort((left, right) => right - left)
  }, [availableYears, selectedYear])
  const pendingHistory = histories.find((history) => history.status !== 'SETTLED') ?? null
  const listHistories = histories.filter((history) => history.settlementId !== pendingHistory?.settlementId)
  const canRefresh = isRefreshPeriodOpen()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshError(null)
    try {
      const refreshed = await refreshSettlementEstimate()
      const refreshedYear = Number(refreshed.settlementMonth.slice(0, 4))
      setEstimate(refreshed)
      setSelectedYear(refreshedYear)
      if (refreshedYear === selectedYear) {
        await loadHistories(refreshedYear)
      }
    } catch (error) {
      setRefreshError(getSettlementErrorMessage(error))
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <>
      <ScreenHeader
        action={<a className="panel-text-action" href="#/settlement/info">정보 수정</a>}
        title="정산 내역"
      />
      <MainNavigation current="settlement" />
      <div className="screen-scroll settlement-screen">
        <section className="settlement-summary" aria-busy={isSummaryLoading}>
          {isSummaryLoading ? <p className="settlement-feedback">정산 정보를 불러오는 중입니다.</p> : null}
          {!isSummaryLoading && summaryError ? (
            <div className="settlement-feedback settlement-feedback-error" role="alert">
              <p>{summaryError}</p>
              <button onClick={() => void loadSummary()} type="button">다시 시도</button>
            </div>
          ) : null}
          {!isSummaryLoading && !summaryError && estimate ? (
            <>
              <span>{formatSettlementMonth(estimate.settlementMonth)} 예상 정산 금액</span>
              <strong>{currencyFormatter.format(estimate.estimatedCommission)}<small>원</small></strong>
              <div>
                <span>구매 확정 {currencyFormatter.format(estimate.confirmedPurchaseCount)}건</span>
                <span>정산 예정일 {formatPaymentDate(estimate.settlementMonth)}</span>
              </div>
            </>
          ) : null}
          {!isSummaryLoading && !summaryError && !estimate ? (
            <p className="settlement-feedback">아직 계산된 정산 내역이 없습니다.</p>
          ) : null}
        </section>

        <section className="settlement-refresh-section" aria-label="예상 수수료 새로고침">
          <div>
            <strong>예상 수수료 새로고침</strong>
            <p>매월 1~21일에 전월 활동월 기준으로 다시 계산할 수 있습니다.</p>
          </div>
          <button disabled={!canRefresh || isRefreshing} onClick={() => void handleRefresh()} type="button">
            {isRefreshing ? '새로고침 중' : '새로고침'}
          </button>
          {refreshError ? <p className="settlement-inline-error" role="alert">{refreshError}</p> : null}
        </section>

        <div className="month-selector-row">
          <div><h2>월별 정산 내역</h2><p>구매 확정일 기준으로 집계됩니다.</p></div>
          <label className="sr-only" htmlFor="settlement-history-year">정산 이력 연도</label>
          <select
            id="settlement-history-year"
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            value={selectedYear}
          >
            {yearOptions.map((year) => <option key={year} value={year}>{year}년</option>)}
          </select>
        </div>

        {isHistoryLoading ? <p className="settlement-content-feedback">정산 이력을 불러오는 중입니다.</p> : null}
        {!isHistoryLoading && historyError ? (
          <div className="settlement-content-feedback settlement-content-error" role="alert">
            <p>{historyError}</p>
            <button onClick={() => void loadHistories(selectedYear)} type="button">다시 시도</button>
          </div>
        ) : null}
        {!isHistoryLoading && !historyError && histories.length === 0 ? (
          <p className="settlement-content-feedback">선택한 연도에 정산 내역이 없습니다.</p>
        ) : null}
        {!isHistoryLoading && !historyError && pendingHistory ? (
          <article className="pending-settlement-card">
            <div>
              <span className={`settlement-status ${statusClass(pendingHistory.status)}`}>{statusLabels[pendingHistory.status]}</span>
              <strong>{formatSettlementMonth(pendingHistory.settlementMonth)}</strong>
              <small>{formatSettlementPeriod(pendingHistory.settlementMonth)}</small>
            </div>
            <strong>{formatCurrency(pendingHistory.estimatedCommission)}</strong>
          </article>
        ) : null}

        {!isHistoryLoading && !historyError && listHistories.length > 0 ? (
          <div className="settlement-history-list">
            {listHistories.map((history) => <SettlementHistoryRow history={history} key={history.settlementId} />)}
          </div>
        ) : null}

        <aside className="settlement-note">
          <strong>Toss Payments 정산 안내</strong>
          <p>정산 금액은 구매 확정 및 취소 내역 반영 후 Toss Payments를 통해 지급됩니다. 지급 처리 상황에 따라 영업일 기준 1~2일이 소요될 수 있습니다.</p>
        </aside>
      </div>
    </>
  )
}
