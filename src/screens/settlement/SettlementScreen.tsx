import { useCallback, useEffect, useMemo, useState } from 'react'

import { redirectToLoginScreen } from '../../auth'
import ScreenHeader from '../../components/ScreenHeader'
import {
  getSettlementErrorMessage,
  getSettlementEstimate,
  getSettlementHistories,
  isSettlementNotCalculated,
  isSettlementUnauthorized,
  type SettlementEstimate,
  type SettlementStatus,
} from './settlementApi'

const currencyFormatter = new Intl.NumberFormat('ko-KR')

const statusLabels: Record<SettlementStatus, string> = {
  CALCULATING: '정산 예정',
  PAYMENT_PENDING: '지급 대기',
  PAYMENT_HOLD_INFO: '지급 정보 보류',
  PAYMENT_HOLD_BLACK: '정산 보류',
  SETTLED: '지급 완료',
  EXPIRED: '정산 만료',
}

const activeStatuses: SettlementStatus[] = [
  'CALCULATING',
  'PAYMENT_PENDING',
  'PAYMENT_HOLD_INFO',
  'PAYMENT_HOLD_BLACK',
]

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
  return `${year}.${String(value).padStart(2, '0')}.20`
}

function formatNumber(value: number | null | undefined): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? currencyFormatter.format(value)
    : '-'
}

function formatCurrency(amount: number | null | undefined): string {
  return `${formatNumber(amount)}원`
}

function statusClass(status: SettlementStatus): string {
  return status.toLowerCase().replaceAll('_', '-')
}

function paymentText(history: SettlementEstimate): string {
  if (history.status === 'PAYMENT_HOLD_INFO') return '지급 정보 확인 필요'
  if (history.status === 'PAYMENT_HOLD_BLACK') return '지급이 보류되었습니다.'
  if (history.status === 'EXPIRED') return '정산 기한이 만료되었습니다.'
  if (history.status === 'SETTLED') return `${formatPaymentDate(history.paymentMonth)} 지급`
  return `정산 예정일 ${formatPaymentDate(history.paymentMonth)}`
}

function SettlementHistoryRow({ history }: { history: SettlementEstimate }) {
  return (
    <article className="settlement-row">
      <div>
        <span className={`settlement-status ${statusClass(history.status)}`}>{statusLabels[history.status]}</span>
        <strong>{formatSettlementMonth(history.activityMonth)}</strong>
        <small>{formatSettlementPeriod(history.activityMonth)}</small>
      </div>
      <div>
        <strong>{formatCurrency(history.settlementAmount)}</strong>
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
  const [summaryError, setSummaryError] = useState<unknown>(null)
  const [historyError, setHistoryError] = useState<unknown>(null)

  const loadSummary = useCallback(async () => {
    setIsSummaryLoading(true)
    setSummaryError(null)
    try {
      setEstimate(await getSettlementEstimate())
    } catch (error) {
      if (isSettlementNotCalculated(error)) {
        setEstimate(null)
      } else {
        setSummaryError(error)
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
      setHistoryError(error)
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
  const pendingHistory = histories.find((history) => activeStatuses.includes(history.status)) ?? null
  const listHistories = histories.filter((history) => history.settlementId !== pendingHistory?.settlementId)

  return (
    <>
      <ScreenHeader
        action={<a className="panel-text-action" href="#/settlement/info">정보 수정</a>}
        backHref="#/home"
        title="정산 내역"
      />
      <div className="screen-scroll settlement-screen">
        <section aria-busy={isSummaryLoading} className="settlement-summary">
          {isSummaryLoading ? <p className="settlement-feedback">정산 정보를 불러오는 중입니다.</p> : null}
          {!isSummaryLoading && summaryError ? (
            <div className="settlement-feedback settlement-feedback-error" role="alert">
              <p>{getSettlementErrorMessage(summaryError)}</p>
              <button
                onClick={() => {
                  if (isSettlementUnauthorized(summaryError)) {
                    redirectToLoginScreen()
                    return
                  }
                  void loadSummary()
                }}
                type="button"
              >
                {isSettlementUnauthorized(summaryError) ? '로그인하기' : '재요청'}
              </button>
            </div>
          ) : null}
          {!isSummaryLoading && !summaryError && estimate ? (
            <>
              <span>{formatSettlementMonth(estimate.activityMonth)} 활동 예상 수수료</span>
              <strong>{formatNumber(estimate.settlementAmount)}<small>원</small></strong>
              <div>
                <span>구매 확정 {formatNumber(estimate.confirmedPurchaseCount)}건</span>
                <span>정산 예정일 {formatPaymentDate(estimate.paymentMonth)}</span>
              </div>
            </>
          ) : null}
          {!isSummaryLoading && !summaryError && !estimate ? (
            <p className="settlement-feedback">아직 계산된 정산 내역이 없습니다.</p>
          ) : null}
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
            <p>{getSettlementErrorMessage(historyError)}</p>
            <button
              onClick={() => {
                if (isSettlementUnauthorized(historyError)) {
                  redirectToLoginScreen()
                  return
                }
                void loadHistories(selectedYear)
              }}
              type="button"
            >
              {isSettlementUnauthorized(historyError) ? '로그인하기' : '재요청'}
            </button>
          </div>
        ) : null}
        {!isHistoryLoading && !historyError && histories.length === 0 ? (
          <p className="settlement-content-feedback">선택한 연도에 정산 내역이 없습니다.</p>
        ) : null}
        {!isHistoryLoading && !historyError && pendingHistory ? (
          <article className="pending-settlement-card">
            <div>
              <span className={`settlement-status ${statusClass(pendingHistory.status)}`}>{statusLabels[pendingHistory.status]}</span>
              <strong>{formatSettlementMonth(pendingHistory.activityMonth)}</strong>
              <small>{formatSettlementPeriod(pendingHistory.activityMonth)}</small>
            </div>
            <strong>{formatCurrency(pendingHistory.settlementAmount)}</strong>
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
