import { ChevronDownIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import MainNavigation from '../../components/layout/MainNavigation'

const settlementRows = [
  { month: '2026년 7월', period: '2026.07.01 - 2026.07.31', amount: '986,400원', status: '지급 완료', paidAt: '2026.08.20 지급' },
  { month: '2026년 6월', period: '2026.06.01 - 2026.06.30', amount: '742,800원', status: '지급 완료', paidAt: '2026.07.20 지급' },
  { month: '2026년 5월', period: '2026.05.01 - 2026.05.31', amount: '615,300원', status: '지급 완료', paidAt: '2026.06.20 지급' },
] as const

export default function SettlementScreen() {
  return (
    <>
      <ScreenHeader
        action={<a className="panel-text-action" href="#/settlement/info">정보 수정</a>}
        title="정산 내역"
      />
      <MainNavigation current="settlement" />
      <div className="screen-scroll settlement-screen">
        <section className="settlement-summary">
          <span>8월 예상 정산 금액</span>
          <strong>1,284,600<small>원</small></strong>
          <div><span>구매 확정 386건</span><span>정산 예정일 2026.09.20</span></div>
        </section>

        <div className="month-selector-row">
          <div><h2>월별 정산 내역</h2><p>구매 확정일 기준으로 집계됩니다.</p></div>
          <button type="button">2026년 <ChevronDownIcon size={17} /></button>
        </div>

        <article className="pending-settlement-card">
          <div><span className="settlement-status pending">정산 예정</span><strong>2026년 8월</strong><small>2026.08.01 - 2026.08.31</small></div>
          <strong>1,284,600원</strong>
        </article>

        <div className="settlement-history-list">
          {settlementRows.map((row) => (
            <article className="settlement-row" key={row.month}>
              <div><span className="settlement-status paid">{row.status}</span><strong>{row.month}</strong><small>{row.period}</small></div>
              <div><strong>{row.amount}</strong><small>{row.paidAt}</small></div>
            </article>
          ))}
        </div>

        <aside className="settlement-note">
          <strong>Toss Payments 정산 안내</strong>
          <p>정산 금액은 구매 확정 및 취소 내역 반영 후 Toss Payments를 통해 지급됩니다. 지급 처리 상황에 따라 영업일 기준 1~2일이 소요될 수 있습니다.</p>
        </aside>
      </div>
    </>
  )
}
