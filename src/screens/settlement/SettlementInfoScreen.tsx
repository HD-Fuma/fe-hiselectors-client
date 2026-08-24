import { useRef, type FormEvent } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'
import { navigate } from '../../navigation'
import {
  SettlementAccountFields,
  useSettlementAccountForm,
} from './SettlementAccountFields'

export default function SettlementInfoScreen() {
  const accountForm = useSettlementAccountForm()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const returnPath = accountForm.isEditMode ? '/mypage/member' : '/settlement'
    if (await accountForm.save()) navigate(returnPath)
  }

  return (
    <div className="panel-page">
      <ScreenHeader
        backHref={accountForm.isEditMode ? '/mypage/member' : '/home'}
        title={accountForm.isEditMode ? '정산 정보 수정' : '정산 정보 입력'}
      />
      <div className="screen-scroll settlement-info-screen">
        <section className="settlement-info-intro">
          <h2>{accountForm.isEditMode ? '정산 정보를 수정해 주세요' : '정산 정보를 입력해 주세요'}</h2>
          <p>정산 유형에 맞는 정보를 정확하게 입력해 주세요.</p>
        </section>

        <form
          aria-busy={accountForm.accountMode === 'loading' || undefined}
          autoComplete="off"
          className="settlement-info-form"
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <SettlementAccountFields form={accountForm} />
        </form>
      </div>
      <BottomActionBar
        disabled={accountForm.isSaving || accountForm.isFormUnavailable}
        label={accountForm.isSaving ? '저장 중...' : accountForm.isEditMode ? '수정하기' : '저장하기'}
        onClick={() => formRef.current?.requestSubmit()}
      />
    </div>
  )
}
