import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import {
  hasValidUserSession,
  readAuthSession,
  redirectToLoginScreen,
} from '../../auth'
import BottomActionBar from '../../components/BottomActionBar'
import { ArrowRightIcon, CheckIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import ShopStatus from '../shop/ShopStatus'
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

export default function MemberInfoScreen() {
  const session = readAuthSession()
  const canView = hasValidUserSession(session) && session?.role === 'USER'
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [kakao, setKakao] = useState<KakaoConnectionState>(unlinkedKakaoState())
  const [kakaoError, setKakaoError] = useState<unknown>(null)
  const [isMasked, setIsMasked] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(true)
  const [emailMarketing, setEmailMarketing] = useState(false)
  const [pushMarketing, setPushMarketing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<unknown>(null)
  const connectLock = useRef(false)

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
  const kakaoButtonLabel = isConnecting
    ? '연결 중...'
    : kakao.status === 'REAUTH_REQUIRED' || kakao.status === 'INACTIVE'
      ? '다시 연결하기'
      : '카카오 인증하기'

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('회원정보를 저장했어요.')
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

        <form aria-busy={isLoading || undefined} onSubmit={handleSubmit}>
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
                aria-label="휴대폰번호 변경하기"
                className="member-info-change-button"
                onClick={handleDummyChange}
                type="button"
              >
                변경하기
              </button>
            </div>
            <p className="member-info-help">본인 명의의 휴대폰번호일 경우에만 변경하실 수 있습니다.</p>
          </div>

          <section aria-labelledby="kakao-message-heading" className="member-info-kakao">
            <h2 className="field-label" id="kakao-message-heading">카카오 메시지</h2>
            <div className="member-info-field-row">
              <p
                aria-live="polite"
                className="member-info-kakao-status"
                role="status"
              >
                {kakaoBusy && !isConnecting
                  ? '연결 상태 확인 중'
                  : kakaoError
                    ? '확인 실패'
                    : getKakaoStatusLabel(kakao.status)}
              </p>
              <button
                aria-label={kakaoButtonLabel}
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
            {kakaoError ? (
              <div className="member-info-help member-info-kakao-error" role="alert">
                <p>{getKakaoErrorMessage(kakaoError)}</p>
                <button onClick={() => void load()} type="button">재요청</button>
              </div>
            ) : (
              <p className="member-info-help">{getKakaoStatusHelp(kakao.status)}</p>
            )}
          </section>

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
        </form>
      </div>
      <BottomActionBar label="저장하기" onClick={(event) => {
        event.preventDefault()
        setStatus('회원정보를 저장했어요.')
      }} />
      <ShopStatus onClose={() => setStatus(null)} status={status} />
    </div>
  )
}
