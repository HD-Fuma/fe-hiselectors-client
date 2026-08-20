import { useCallback, useEffect, useState } from 'react'

import { redirectToLoginScreen } from '../../auth'
import ScreenHeader from '../../components/ScreenHeader'
import MainNavigation from '../../components/layout/MainNavigation'
import {
  getSettlementAccount,
  getSettlementErrorMessage,
  isSettlementAccountNotRegistered,
  isSettlementUnauthorized,
} from './settlementApi'

export default function SettlementEntryScreen() {
  const [error, setError] = useState<unknown>(null)

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
      setError(requestError)
    }
  }, [])

  useEffect(() => {
    void checkSettlementAccount()
  }, [checkSettlementAccount])

  return (
    <>
      <ScreenHeader backHref="#/performance" title="정산" />
      <MainNavigation current="settlement" />
      <div className="screen-scroll settlement-screen">
        {error ? (
          <div className="settlement-content-feedback settlement-content-error" role="alert">
            <p>{getSettlementErrorMessage(error)}</p>
            <button
              onClick={() => {
                if (isSettlementUnauthorized(error)) {
                  redirectToLoginScreen()
                  return
                }
                void checkSettlementAccount()
              }}
              type="button"
            >
              {isSettlementUnauthorized(error) ? '로그인하기' : '재요청'}
            </button>
          </div>
        ) : (
          <p aria-live="polite" className="settlement-content-feedback">정산 정보를 확인하는 중입니다.</p>
        )}
      </div>
    </>
  )
}
