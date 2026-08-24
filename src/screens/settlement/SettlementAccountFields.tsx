import { useCallback, useEffect, useState } from 'react'

import { redirectToLoginScreen } from '../../auth'
import {
  getSettlementAccount,
  getSettlementErrorMessage,
  isSettlementAccountNotRegistered,
  isSettlementUnauthorized,
  upsertSettlementAccount,
  type SettlementAccount,
} from './settlementApi'

const settlementTypes = [
  { apiValue: 'INDIVIDUAL', label: '개인', value: 'personal' },
  { apiValue: 'SOLE_PROPRIETOR', label: '개인사업자', value: 'sole-proprietor' },
  { apiValue: 'CORPORATION', label: '법인사업자', value: 'corporation' },
] as const

type SettlementType = (typeof settlementTypes)[number]['value']
type AccountMode = 'loading' | 'create' | 'edit' | 'legacy' | 'error'

function getSettlementType(account: SettlementAccount): SettlementType {
  const matchedType = settlementTypes.find(({ apiValue }) => apiValue === account.settlementType)
  if (matchedType) return matchedType.value

  return account.businessNumber ? 'sole-proprietor' : 'personal'
}

export function useSettlementAccountForm(enabled = true) {
  const [settlementType, setSettlementType] = useState<SettlementType>('personal')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [residentRegistrationNumber, setResidentRegistrationNumber] = useState('')
  const [businessNumber, setBusinessNumber] = useState('')
  const [accountMode, setAccountMode] = useState<AccountMode>('loading')
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<unknown>(null)
  const [saveError, setSaveError] = useState<unknown>(null)

  const loadAccount = useCallback(async () => {
    setAccountMode('loading')
    setLoadError(null)
    try {
      const account = await getSettlementAccount()
      setSettlementType(getSettlementType(account))
      setBankName(account.bankName)
      setAccountNumber(account.accountNumber)
      setAccountHolder(account.accountHolder)
      setResidentRegistrationNumber(account.residentRegistrationNumber ?? '')
      setBusinessNumber(account.businessNumber ?? '')
      setAccountMode(account.settlementType ? 'edit' : 'legacy')
    } catch (error) {
      if (isSettlementAccountNotRegistered(error)) {
        setAccountMode('create')
        return
      }
      setLoadError(error)
      setAccountMode('error')
    }
  }, [])

  useEffect(() => {
    if (enabled) void loadAccount()
  }, [enabled, loadAccount])

  const isPersonal = settlementType === 'personal'
  const isEditMode = accountMode === 'edit' || accountMode === 'legacy'
  const isFormUnavailable = accountMode === 'loading' || accountMode === 'error'

  const save = async () => {
    if (isSaving || isFormUnavailable) return false

    setIsSaving(true)
    setSaveError(null)
    try {
      const common = { bankName, accountNumber, accountHolder }
      await upsertSettlementAccount(isPersonal
        ? {
          ...common,
          residentRegistrationNumber,
          settlementType: 'INDIVIDUAL',
        }
        : {
          ...common,
          businessNumber,
          settlementType: settlementType === 'sole-proprietor'
            ? 'SOLE_PROPRIETOR'
            : 'CORPORATION',
        })
      setAccountMode('edit')
      return true
    } catch (error) {
      setSaveError(error)
      return false
    } finally {
      setIsSaving(false)
    }
  }

  return {
    accountHolder,
    accountMode,
    accountNumber,
    bankName,
    businessNumber,
    isEditMode,
    isFormUnavailable,
    isPersonal,
    isSaving,
    loadAccount,
    loadError,
    residentRegistrationNumber,
    save,
    saveError,
    settlementType,
    setAccountHolder,
    setAccountNumber,
    setBankName,
    setBusinessNumber,
    setResidentRegistrationNumber,
    setSettlementType,
  }
}

type SettlementAccountFieldsProps = {
  form: ReturnType<typeof useSettlementAccountForm>
}

export function SettlementAccountFields({ form }: SettlementAccountFieldsProps) {
  const {
    accountHolder,
    accountMode,
    accountNumber,
    bankName,
    businessNumber,
    isFormUnavailable,
    isPersonal,
    loadAccount,
    loadError,
    residentRegistrationNumber,
    saveError,
    settlementType,
    setAccountHolder,
    setAccountNumber,
    setBankName,
    setBusinessNumber,
    setResidentRegistrationNumber,
    setSettlementType,
  } = form

  return (
    <>
      {loadError ? (
        <div className="settlement-content-feedback settlement-content-error" role="alert">
          <p>{getSettlementErrorMessage(loadError)}</p>
          <button
            onClick={() => {
              if (isSettlementUnauthorized(loadError)) {
                redirectToLoginScreen()
                return
              }
              void loadAccount()
            }}
            type="button"
          >
            {isSettlementUnauthorized(loadError) ? '로그인하기' : '재요청'}
          </button>
        </div>
      ) : null}

      {saveError ? (
        <div className="settlement-content-feedback settlement-content-error" role="alert">
          <p>{getSettlementErrorMessage(saveError)}</p>
        </div>
      ) : null}

      <fieldset className="settlement-type-fieldset">
        <legend className="field-label">정산 유형</legend>
        <div className="settlement-type-options">
          {settlementTypes.map(({ label, value }) => (
            <label className={accountMode === 'edit' ? 'is-locked' : undefined} key={value}>
              <input
                checked={settlementType === value}
                disabled={accountMode !== 'create' && accountMode !== 'legacy'}
                name="settlement-type"
                onChange={() => setSettlementType(value)}
                type="radio"
                value={value}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        {accountMode === 'edit' ? (
          <p className="settlement-type-help">정산 유형은 최초 등록 후 변경할 수 없습니다.</p>
        ) : accountMode === 'legacy' ? (
          <p className="settlement-type-help">정산 유형을 다시 확인한 후 저장해 주세요.</p>
        ) : null}
      </fieldset>

      <div className="settlement-info-field">
        <label className="field-label" htmlFor="settlement-bank">은행명</label>
        <input
          autoComplete="off"
          disabled={isFormUnavailable}
          id="settlement-bank"
          name="bankName"
          onChange={(event) => setBankName(event.target.value)}
          placeholder="은행명을 입력해 주세요"
          required
          type="text"
          value={bankName}
        />
      </div>
      <div className="settlement-info-field">
        <label className="field-label" htmlFor="settlement-account">계좌번호</label>
        <input
          autoComplete="off"
          disabled={isFormUnavailable}
          id="settlement-account"
          inputMode="numeric"
          name="accountNumber"
          onChange={(event) => setAccountNumber(event.target.value)}
          pattern="[0-9-]+"
          placeholder="숫자만 입력해 주세요"
          required
          type="text"
          value={accountNumber}
        />
      </div>
      <div className="settlement-info-field">
        <label className="field-label" htmlFor="settlement-holder">예금주</label>
        <input
          autoComplete="off"
          disabled={isFormUnavailable}
          id="settlement-holder"
          name="accountHolder"
          onChange={(event) => setAccountHolder(event.target.value)}
          placeholder="예금주명을 입력해 주세요"
          required
          type="text"
          value={accountHolder}
        />
      </div>

      <div className="settlement-info-field">
        <label
          className="field-label"
          htmlFor={isPersonal ? 'resident-registration-number' : 'business-registration-number'}
        >
          {isPersonal ? '주민등록번호' : '사업자등록번호'}
        </label>
        <input
          autoComplete="off"
          disabled={isFormUnavailable}
          id={isPersonal ? 'resident-registration-number' : 'business-registration-number'}
          inputMode="numeric"
          maxLength={isPersonal ? 14 : 12}
          name={isPersonal ? 'residentRegistrationNumber' : 'businessNumber'}
          onChange={(event) => {
            if (isPersonal) {
              setResidentRegistrationNumber(event.target.value)
              return
            }
            setBusinessNumber(event.target.value)
          }}
          pattern={isPersonal ? '[0-9]{6}-?[0-9]{7}' : '[0-9]{3}-?[0-9]{2}-?[0-9]{5}'}
          placeholder={isPersonal ? '000000-0000000' : '000-00-00000'}
          required
          type="text"
          value={isPersonal ? residentRegistrationNumber : businessNumber}
        />
      </div>

      <p className="settlement-security-note">
        입력한 정보는 정산 지급과 세무 처리를 위해 안전하게 사용됩니다.
      </p>
    </>
  )
}
