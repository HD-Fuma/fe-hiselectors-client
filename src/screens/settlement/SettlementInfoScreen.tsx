import { useRef, useState, type FormEvent } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'

const settlementTypes = [
  { label: '개인', value: 'personal' },
  { label: '개인사업자', value: 'sole-proprietor' },
  { label: '법인사업자', value: 'corporation' },
] as const

type SettlementType = (typeof settlementTypes)[number]['value']

export default function SettlementInfoScreen() {
  const [settlementType, setSettlementType] = useState<SettlementType>('personal')
  const formRef = useRef<HTMLFormElement>(null)
  const isPersonal = settlementType === 'personal'

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    window.location.hash = '#/settlement'
  }

  return (
    <div className="panel-page">
      <ScreenHeader backHref="#/performance" title="정산 정보 입력" />
      <div className="screen-scroll settlement-info-screen">
        <section className="settlement-info-intro">
          <h2>정산 정보를 입력해 주세요</h2>
          <p>정산 유형에 맞는 정보를 정확하게 입력해 주세요.</p>
        </section>

        <form
          autoComplete="off"
          className="settlement-info-form"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <fieldset className="settlement-type-fieldset">
            <legend className="field-label">정산 유형</legend>
            <div className="settlement-type-options">
              {settlementTypes.map(({ label, value }) => (
                <label key={value}>
                  <input
                    checked={settlementType === value}
                    name="settlement-type"
                    onChange={() => setSettlementType(value)}
                    type="radio"
                    value={value}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="settlement-info-field">
            <label className="field-label" htmlFor="settlement-bank">은행명</label>
            <input
              autoComplete="off"
              id="settlement-bank"
              placeholder="은행명을 입력해 주세요"
              required
              type="text"
            />
          </div>
          <div className="settlement-info-field">
            <label className="field-label" htmlFor="settlement-account">계좌번호</label>
            <input
              autoComplete="off"
              id="settlement-account"
              inputMode="numeric"
              pattern="[0-9-]+"
              placeholder="숫자만 입력해 주세요"
              required
              type="text"
            />
          </div>
          <div className="settlement-info-field">
            <label className="field-label" htmlFor="settlement-holder">예금주</label>
            <input
              autoComplete="off"
              id="settlement-holder"
              placeholder="예금주명을 입력해 주세요"
              required
              type="text"
            />
          </div>

          <div className="settlement-info-field" key={settlementType}>
            <label
              className="field-label"
              htmlFor={isPersonal ? 'resident-registration-number' : 'business-registration-number'}
            >
              {isPersonal ? '주민등록번호' : '사업자등록번호'}
            </label>
            <input
              autoComplete="off"
              id={isPersonal ? 'resident-registration-number' : 'business-registration-number'}
              inputMode="numeric"
              pattern={isPersonal ? '[0-9]{6}-?[0-9]{7}' : '[0-9]{3}-?[0-9]{2}-?[0-9]{5}'}
              placeholder={isPersonal ? '000000-0000000' : '000-00-00000'}
              required
              type="text"
            />
          </div>

          <p className="settlement-security-note">
            입력한 정보는 이 데모에서 저장하거나 전송하지 않습니다.
          </p>
        </form>
      </div>
      <BottomActionBar
        label="저장하기"
        onClick={() => formRef.current?.requestSubmit()}
      />
    </div>
  )
}
