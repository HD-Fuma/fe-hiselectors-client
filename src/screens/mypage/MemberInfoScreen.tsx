import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react'

import {
  canManageSettlement,
  canManageSelectorOperations,
  clearAuthSession,
  endSelectorActivity,
  fetchSelectorAccessLevel,
  hasValidUserSession,
  persistAuthSession,
  readAuthSession,
  redirectToLoginScreen,
  SelectorAccessRequestError,
} from '../../auth'
import BottomActionBar from '../../components/BottomActionBar'
import { ArrowRightIcon, CheckIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import {
  SettlementAccountFields,
  useSettlementAccountForm,
} from '../settlement/SettlementAccountFields'
import ShopStatus from '../shop/ShopStatus'
import useModalFocus from '../shop/useModalFocus'
import {
  KAKAO_OAUTH_PENDING_KEY,
  connectKakaoAccount,
  getKakaoAuthorizationUrl,
  getKakaoConnectionStatus,
  getKakaoErrorMessage,
  getKakaoStatusHelp,
  getKakaoStatusLabel,
  isKakaoUnauthorized,
  unlinkedKakaoState,
  type KakaoConnectionState,
} from './kakaoApi'
import {
  getMemberErrorMessage,
  getMemberProfile,
  isMemberUnauthorized,
  type MemberProfile,
} from './memberApi'

function maskLoginId(value: string) {
  if (value.length <= 3) return `${value}****`
  return `${value.slice(0, 3)}****`
}

function maskName(value: string) {
  if (value.length <= 1) return value
  if (value.length === 2) return `${value[0]}*`
  return `${value[0]}${'*'.repeat(value.length - 2)}${value[value.length - 1]}`
}

function maskEmail(value: string) {
  const [local, domain] = value.split('@')
  if (!domain) return maskLoginId(value)
  const visible = local.slice(0, Math.min(3, local.length))
  return `${visible}****@${'*'.repeat(Math.min(9, Math.max(domain.length, 1)))}`
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 7) return value
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`
}

type SelectorActivityEndDialogProps = {
  invokerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
}

function SelectorActivityEndDialog({
  invokerRef,
  onClose,
  onConfirm,
}: SelectorActivityEndDialogProps) {
  const containerRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div className="group-dialog-backdrop">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="group-dialog selector-activity-end-dialog"
        ref={containerRef}
        role="dialog"
      >
        <h2 id={titleId}>셀렉터스 활동을 종료할까요?</h2>
        <p id={descriptionId}>{'종료 즉시 셀렉터스 자격이 사라지며 이 작업은 되돌릴 수 없습니다.\n미정산 금액은 예정대로 정산됩니다.'}</p>
        <div className="group-dialog-actions">
          <button onClick={onClose} type="button">취소</button>
          <button onClick={onConfirm} type="button">활동 종료</button>
        </div>
      </section>
    </div>
  )
}

export default function MemberInfoScreen() {
  const session = readAuthSession()
  const canView = hasValidUserSession(session) && session?.role === 'USER'
  const canEditSettlement = canManageSettlement(session)
  const settlementForm = useSettlementAccountForm(canEditSettlement)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [kakao, setKakao] = useState<KakaoConnectionState>(unlinkedKakaoState())
  const [kakaoError, setKakaoError] = useState<unknown>(null)
  const [isMasked, setIsMasked] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isEndingActivity, setIsEndingActivity] = useState(false)
  const [isEndActivityDialogOpen, setIsEndActivityDialogOpen] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(true)
  const [emailMarketing, setEmailMarketing] = useState(false)
  const [pushMarketing, setPushMarketing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const connectLock = useRef(false)
  const endActivityButtonRef = useRef<HTMLButtonElement>(null)
  const memberFormRef = useRef<HTMLFormElement>(null)

  const hasKakaoCallback = () => {
    const params = new URLSearchParams(window.location.search)
    return Boolean(params.get('code') && params.get('state') && sessionStorage.getItem(KAKAO_OAUTH_PENDING_KEY))
  }

  const load = useCallback(async () => {
    setLoadError(null)
    setKakaoError(null)
    setIsLoading(true)
    try {
      const nextProfile = await getMemberProfile()
      setProfile(nextProfile)
      if (!hasKakaoCallback()) {
        try {
          setKakao(await getKakaoConnectionStatus())
        } catch (error) {
          setKakaoError(error)
        }
      }
    } catch (error) {
      setLoadError(error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!canView) return
    void load()
  }, [canView, load])

  useEffect(() => {
    if (!canView || connectLock.current) return

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state || !sessionStorage.getItem(KAKAO_OAUTH_PENDING_KEY)) {
      return
    }

    connectLock.current = true
    setIsConnecting(true)

    const clearCallback = () => {
      sessionStorage.removeItem(KAKAO_OAUTH_PENDING_KEY)
      window.history.replaceState(window.history.state, '', window.location.pathname)
    }

    void connectKakaoAccount(code, state)
      .then((nextKakao) => {
        setKakao(nextKakao)
        setStatus(nextKakao.status === 'READY' ? '카카오 메시지 연결이 완료되었습니다.' : '카카오 계정을 다시 연결해 주세요.')
      })
      .catch((error) => {
        setStatus(getKakaoErrorMessage(error))
      })
      .finally(() => {
        clearCallback()
        connectLock.current = false
        setIsConnecting(false)
      })
  }, [canView])

  if (!canView) {
    return (
      <div className="panel-page">
        <ScreenHeader backHref="/home" title="회원정보 변경" />
        <div className="screen-scroll member-info-screen">
          <p className="member-info-feedback">회원정보는 로그인 후 확인할 수 있습니다.</p>
          <a
            className="primary-action"
            href="/login"
            onClick={() => sessionStorage.setItem('postLoginRedirect', '/mypage/member')}
          >
            로그인하기
          </a>
        </div>
      </div>
    )
  }

  const displayed = profile ?? {
    hiId: session?.loginId || '',
    name: session?.userName || '',
    email: '',
    phone: '',
    alimtalk: session?.alimtalk === 'Y' ? 'Y' : 'N',
  }
  const loginIdValue = isMasked ? maskLoginId(displayed.hiId) : displayed.hiId
  const nameValue = isMasked ? maskName(displayed.name) : displayed.name
  const emailValue = isMasked ? maskEmail(displayed.email) : displayed.email
  const phoneValue = isMasked ? maskPhone(displayed.phone) : displayed.phone
  const smsMarketing = displayed.alimtalk === 'Y'
  const kakaoBusy = isConnecting || isLoading
  const kakaoButtonLabel = isConnecting ? '인증 중...' : '인증하기'

  const handleDummyChange = () => {
    setStatus('시연 화면에서는 조회만 가능합니다.')
  }

  const handleKakaoAuthorize = async () => {
    if (kakaoBusy) return
    setIsConnecting(true)
    sessionStorage.setItem(KAKAO_OAUTH_PENDING_KEY, '1')
    try {
      const authorizationUrl = await getKakaoAuthorizationUrl()
      window.location.assign(authorizationUrl)
    } catch (error) {
      sessionStorage.removeItem(KAKAO_OAUTH_PENDING_KEY)
      setIsConnecting(false)
      if (isKakaoUnauthorized(error)) {
        redirectToLoginScreen()
        return
      }
      setStatus(getKakaoErrorMessage(error))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (canEditSettlement && !(await settlementForm.save())) return
    setStatus('회원정보를 저장했어요.')
  }

  const handleEndActivity = async () => {
    if (isEndingActivity) return

    const requestSession = readAuthSession()
    if (!requestSession) {
      redirectToLoginScreen()
      return
    }
    const isSameSession = () => {
      const latestSession = readAuthSession()
      return latestSession?.accessToken === requestSession.accessToken
        && latestSession.selectorAccessLevel === requestSession.selectorAccessLevel
    }
    setIsEndingActivity(true)
    try {
      let endError: unknown = null
      try {
        await endSelectorActivity()
      } catch (error) {
        endError = error
      }
      if (!isSameSession()) return
      if (endError instanceof SelectorAccessRequestError && endError.status === 401) {
        clearAuthSession()
        redirectToLoginScreen()
        return
      }

      try {
        const selectorAccessLevel = await fetchSelectorAccessLevel(
          requestSession.accessToken,
          requestSession.tokenType,
        )
        if (!isSameSession()) return
        const latestSession = readAuthSession()
        if (!latestSession) return
        const nextSession = { ...latestSession, selectorAccessLevel }
        persistAuthSession(nextSession)
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: nextSession }))
        if (selectorAccessLevel !== 'CURRENT') {
          setStatus(selectorAccessLevel === 'PREVIOUS'
            ? '셀렉터스 활동이 종료되었습니다.\n미정산 금액은 예정대로 정산됩니다.'
            : '셀렉터스 활동 상태가 갱신되었습니다.')
          return
        }
      } catch (error) {
        if (!isSameSession()) return
        if (error instanceof SelectorAccessRequestError && [401, 403].includes(error.status)) {
          clearAuthSession()
          redirectToLoginScreen()
          return
        }
        const latestSession = readAuthSession()
        if (!latestSession) return
        const nextSession = { ...latestSession, selectorAccessLevel: 'NONE' as const }
        persistAuthSession(nextSession)
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: nextSession }))
        setStatus(endError
          ? '활동 종료 결과를 확인하지 못했습니다. 네트워크 연결 후 다시 확인해 주세요.'
          : '셀렉터스 활동이 종료되었습니다.\n미정산 금액은 예정대로 정산됩니다.')
        return
      }

      if (!isSameSession()) return
      setStatus(endError instanceof SelectorAccessRequestError
        ? endError.message
        : '셀렉터스 활동 종료에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setIsEndingActivity(false)
    }
  }

  return (
    <div className="panel-page">
      <ScreenHeader backHref="/home" title="회원정보 변경" />
      <div className="screen-scroll member-info-screen">
        {loadError ? (
          <div className="member-info-feedback member-info-feedback-error" role="alert">
            <p>{getMemberErrorMessage(loadError)}</p>
            <button
              onClick={() => {
                if (isMemberUnauthorized(loadError) || isKakaoUnauthorized(loadError)) {
                  redirectToLoginScreen()
                  return
                }
                void load()
              }}
              type="button"
            >
              {isMemberUnauthorized(loadError) || isKakaoUnauthorized(loadError) ? '로그인하기' : '재요청'}
            </button>
          </div>
        ) : null}

        <form
          aria-busy={isLoading || (canEditSettlement && settlementForm.accountMode === 'loading') || undefined}
          onSubmit={handleSubmit}
          ref={memberFormRef}
        >
          <section className="member-info-intro">
            <h2>고객님의 정보를 안전하게 보호합니다</h2>
            <button
              aria-pressed={!isMasked}
              className="member-info-mask-toggle"
              onClick={() => setIsMasked((current) => !current)}
              type="button"
            >
              {isMasked ? '마스킹 해제' : '마스킹'}
            </button>
          </section>

          <div className="member-info-field">
            <label className="field-label" htmlFor="member-email">이메일주소</label>
            <div className="member-info-field-row">
              <input
                id="member-email"
                name="email"
                readOnly
                type="text"
                value={emailValue}
              />
              <button
                aria-label="이메일주소 변경하기"
                className="member-info-change-button"
                onClick={handleDummyChange}
                type="button"
              >
                변경하기
              </button>
            </div>
          </div>

          <div className="member-info-field">
            <label className="field-label" htmlFor="member-login-id">아이디</label>
            <input
              className="member-info-readonly"
              id="member-login-id"
              name="loginId"
              readOnly
              type="text"
              value={loginIdValue}
            />
          </div>

          <div className="member-info-field">
            <label className="field-label" htmlFor="member-name">이름</label>
            <input
              className="member-info-readonly"
              id="member-name"
              name="name"
              readOnly
              type="text"
              value={nameValue}
            />
          </div>

          <div className="member-info-field">
            <span className="field-label" id="member-password-label">비밀번호</span>
            <button
              aria-labelledby="member-password-label"
              className="member-info-change-button member-info-change-button-outline"
              onClick={handleDummyChange}
              type="button"
            >
              변경하기
            </button>
          </div>

          <div className="member-info-field">
            <label className="field-label" htmlFor="member-phone">휴대폰번호</label>
            <div className="member-info-field-row">
              <input
                id="member-phone"
                name="phone"
                readOnly
                type="text"
                value={phoneValue}
              />
              <button
                aria-describedby="member-phone-kakao-status member-phone-kakao-help"
                aria-label="휴대폰번호 인증하기"
                className="member-info-change-button"
                disabled={kakaoBusy}
                onClick={() => {
                  void handleKakaoAuthorize()
                }}
                type="button"
              >
                {kakaoButtonLabel}
              </button>
            </div>
            <p
              aria-live="polite"
              className="member-info-help member-info-kakao-inline-status"
              id="member-phone-kakao-status"
              role="status"
            >
              카카오 메시지: <strong>
                {kakaoBusy && !isConnecting
                  ? '연결 상태 확인 중'
                  : kakaoError
                    ? '확인 실패'
                    : getKakaoStatusLabel(kakao.status)}
              </strong>
            </p>
            {kakaoError ? (
              <div
                className="member-info-help member-info-kakao-error"
                id="member-phone-kakao-help"
                role="alert"
              >
                <p>{getKakaoErrorMessage(kakaoError)}</p>
                <button onClick={() => void load()} type="button">재요청</button>
              </div>
            ) : (
              <p className="member-info-help" id="member-phone-kakao-help">{getKakaoStatusHelp(kakao.status)}</p>
            )}
          </div>

          {canEditSettlement ? (
            <section aria-labelledby="settlement-info-heading" className="member-info-settlement">
              <h2 id="settlement-info-heading">정산 정보</h2>
              <SettlementAccountFields form={settlementForm} />
            </section>
          ) : null}

          <section className="member-info-consent" aria-labelledby="privacy-notice-heading">
            <div className="member-info-consent-row">
              <div>
                <h2 className="field-label" id="privacy-notice-heading">개인정보 이용내역 통지 수신 여부</h2>
                <div className="member-info-choice-group" role="radiogroup" aria-labelledby="privacy-notice-heading">
                  <label>
                    <input
                      checked={privacyAgreed}
                      name="privacy-notice"
                      onChange={() => setPrivacyAgreed(true)}
                      type="radio"
                      value="agree"
                    />
                    <span className="custom-check"><CheckIcon size={16} /></span>
                    <span>동의</span>
                  </label>
                  <label>
                    <input
                      checked={!privacyAgreed}
                      name="privacy-notice"
                      onChange={() => setPrivacyAgreed(false)}
                      type="radio"
                      value="disagree"
                    />
                    <span className="custom-check"><CheckIcon size={16} /></span>
                    <span>해제</span>
                  </label>
                </div>
              </div>
              <button aria-label="개인정보 이용내역 통지 수신 여부 자세히 보기" onClick={handleDummyChange} type="button">
                <ArrowRightIcon size={18} />
              </button>
            </div>

            <div className="member-info-consent-row">
              <div>
                <h2 className="field-label" id="marketing-heading">광고성 정보 수신동의 (선택)</h2>
                <div className="member-info-choice-group" role="group" aria-labelledby="marketing-heading">
                  <label>
                    <input
                      checked={smsMarketing}
                      disabled
                      name="alimtalk"
                      type="checkbox"
                    />
                    <span className="custom-check"><CheckIcon size={16} /></span>
                    <span>SMS/카카오톡</span>
                  </label>
                  <label>
                    <input
                      checked={emailMarketing}
                      name="email-marketing"
                      onChange={(event) => setEmailMarketing(event.target.checked)}
                      type="checkbox"
                    />
                    <span className="custom-check"><CheckIcon size={16} /></span>
                    <span>이메일</span>
                  </label>
                  <label>
                    <input
                      checked={pushMarketing}
                      name="push-marketing"
                      onChange={(event) => setPushMarketing(event.target.checked)}
                      type="checkbox"
                    />
                    <span className="custom-check"><CheckIcon size={16} /></span>
                    <span>PUSH</span>
                  </label>
                </div>
              </div>
              <button aria-label="광고성 정보 수신동의 자세히 보기" onClick={handleDummyChange} type="button">
                <ArrowRightIcon size={18} />
              </button>
            </div>
          </section>

          {canManageSelectorOperations(session) ? (
            <section aria-labelledby="selector-activity-heading" className="member-info-activity-end">
              <h2 className="field-label" id="selector-activity-heading">셀렉터스 활동</h2>
              <p>활동 종료 즉시 셀렉터스 자격이 사라집니다. 미정산 금액은 예정대로 정산됩니다.</p>
              <button
                disabled={isEndingActivity}
                onClick={() => setIsEndActivityDialogOpen(true)}
                ref={endActivityButtonRef}
                type="button"
              >
                {isEndingActivity ? '종료 처리 중...' : '셀렉터스 활동 종료하기'}
              </button>
            </section>
          ) : null}
        </form>
      </div>
      <BottomActionBar
        disabled={canEditSettlement && (settlementForm.isSaving || settlementForm.isFormUnavailable)}
        label={settlementForm.isSaving ? '저장 중...' : '저장하기'}
        onClick={() => memberFormRef.current?.requestSubmit()}
      />
      {isEndActivityDialogOpen ? (
        <SelectorActivityEndDialog
          invokerRef={endActivityButtonRef}
          onClose={() => setIsEndActivityDialogOpen(false)}
          onConfirm={() => {
            setIsEndActivityDialogOpen(false)
            void handleEndActivity()
          }}
        />
      ) : null}
      <ShopStatus onClose={() => setStatus(null)} status={status} />
    </div>
  )
}
