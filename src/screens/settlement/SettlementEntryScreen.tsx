import { useCallback, useEffect, useState } from 'react'

import ScreenHeader from '../../components/ScreenHeader'
import {
  getSettlementAccount,
  getSettlementErrorMessage,
  isSettlementAccountNotRegistered,
} from './settlementApi'

export default function SettlementEntryScreen() {
  const [error, setError] = useState<string | null>(null)

  const checkSettlementAccount = useCallback(async () => {
    setError(null)
    try {
      await getSettlementAccount()
      window.location.hash = '#/settlement'
    } catch (requestError) {
      if (isSettlementAccountNotRegistered(requestError)) {
        window.location.hash = '#/settlement/info'
        return
      }
      setError(getSettlementErrorMessage(requestError))
    }
  }, [])

  useEffect(() => {
    void checkSettlementAccount()
  }, [checkSettlementAccount])

  return (
    <>
      <ScreenHeader backHref="#/home" title="정산" />
      <div className="screen-scroll settlement-screen">
        {error ? (
          <div className="settlement-content-feedback settlement-content-error" role="alert">
            <p>{error}</p>
            <button onClick={() => void checkSettlementAccount()} type="button">다시 시도</button>
          </div>
        ) : (
          <p aria-live="polite" className="settlement-content-feedback">정산 정보를 확인하는 중입니다.</p>
        )}
      </div>
    </>
  )
}
