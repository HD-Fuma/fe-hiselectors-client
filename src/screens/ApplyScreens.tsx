import { useEffect, useRef, useState } from 'react'

import { API_BASE_URL, authFetch, hasValidUserSession, readAuthSession, redirectToLoginScreen, redirectToMainScreen } from '../auth'
import BottomAction from '../components/BottomAction'
import { ArrowRightIcon, CartIcon, CheckIcon, ChevronDownIcon, CoinIcon, GiftIcon, LinkIcon, PersonIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'
import { startOAuthAuthorization, type OAuthProvider } from '../oauth'

const flowSteps = [
  { label: '상품 큐레이션', icon: <CartIcon size={26} /> },
  { label: '링크 공유', icon: <LinkIcon size={26} /> },
  { label: '판매 발생', icon: <GiftIcon size={26} /> },
  { label: '수익 창출', icon: <CoinIcon size={26} /> },
] as const

const benefits = [
  { title: '최대 10%', copy: '수수료 정산', icon: <CoinIcon size={25} /> },
  { title: '셀렉터스 전용', copy: '쿠폰 증정', icon: <GiftIcon size={25} /> },
  { title: '우수 셀렉터스', copy: '전용 혜택', icon: <PersonIcon size={25} /> },
] as const

export function ApplyIntroScreen() {
  return (
    <div className="panel-page">
      <PanelHeader backHref="#/screens" title="셀렉터스 신청하기" />
      <div className="screen-scroll apply-intro-screen">
        <section className="apply-hero">
          <h2>당신의 감각을 보여주세요!<br />여러분의 큐레이션이<br />기분 좋은 수익으로 이어집니다.</h2>
          <p>셀렉터스는 안목있는 선택을 통해 가치를 만들고<br />성과로 연결하는 더현대Hi의 서비스입니다.</p>
        </section>

        <ol className="apply-flow" aria-label="셀렉터스 활동 순서">
          {flowSteps.map((step, index) => (
            <li className={index === 1 ? 'is-active' : undefined} key={step.label}>
              <span className="flow-icon">{step.icon}</span>
              <span>{step.label}</span>
              {index < flowSteps.length - 1 ? <ArrowRightIcon className="flow-arrow" size={14} /> : null}
            </li>
          ))}
        </ol>

        <section className="benefit-section">
          <h2>더현대 Hi 셀렉터스에게만 제공되는 전용 혜택</h2>
          <div className="benefit-grid">
            {benefits.map((benefit) => (
              <article className="benefit-card" key={benefit.title}>
                <span className="benefit-icon">{benefit.icon}</span>
                <strong>{benefit.title}</strong>
                <p>{benefit.copy}</p>
              </article>
            ))}
          </div>
          <a className="detail-link" href="#/campaigns">자세히 알아보기 <ArrowRightIcon size={14} /></a>
        </section>
      </div>
      <BottomAction href="#/apply/form" label="셀렉터스 신청하기" />
    </div>
  )
}

const privacyItems = [
  '① 수집 목적: 셀렉터스 접수 처리',
  '② 수집 항목 : SNS 계정 연결 정보',
  '③ 보유 및 이용기간: 셀렉터스 신청 철회 시 또는 서비스 종료 시까지',
] as const

const snsChannels = [
  { label: '인스타그램', oauthLabel: 'Instagram', provider: 'instagram' },
  { label: '페이스북', oauthLabel: 'Facebook', provider: 'facebook' },
  { label: '유튜브', oauthLabel: 'YouTube', provider: 'youtube' },
] as const

type ConnectedAccount = {
  provider: Exclude<OAuthProvider, 'facebook'>
  accountId: string
  followerCount: number | null
  label: string
}

const DUPLICATE_APPLICATION_MESSAGE = '이미 해당 기수에 신청하셨습니다.'

function extractErrorMessage(payload: string): string {
  if (!payload.trim()) {
    return '지원서 제출에 실패했습니다.'
  }

  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>
    const message =
      (typeof parsed.message === 'string' && parsed.message.trim()) ||
      (typeof parsed.error === 'string' && parsed.error.trim()) ||
      (typeof parsed.error === 'object' && parsed.error !== null && 'message' in parsed.error && typeof parsed.error.message === 'string' ? parsed.error.message.trim() : '')

    if (message) {
      return message
    }
  } catch {
    // ignore JSON parse failure and fall back to raw text
  }

  return payload
}

export function ApplyFormScreen() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [shopTermsAgreed, setShopTermsAgreed] = useState(false)
  const [alarmAgreed, setAlarmAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [oauthError, setOauthError] = useState('')
  const [oauthStatus, setOauthStatus] = useState('')
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const session = readAuthSession()
  const isUserSessionValid = hasValidUserSession(session)

  useEffect(() => {
    if (isOptionsOpen) {
      optionRefs.current[activeIndex]?.focus()
    }
  }, [activeIndex, isOptionsOpen])

  useEffect(() => {
    if (!isOptionsOpen) return

    const dismissWhenOutside = (event: Event) => {
      if (event.target instanceof Node && !pickerRef.current?.contains(event.target)) {
        setIsOptionsOpen(false)
      }
    }

    document.addEventListener('focusin', dismissWhenOutside)
    document.addEventListener('pointerdown', dismissWhenOutside)
    return () => {
      document.removeEventListener('focusin', dismissWhenOutside)
      document.removeEventListener('pointerdown', dismissWhenOutside)
    }
  }, [isOptionsOpen])

  const openOptions = (index: number) => {
    setActiveIndex(index)
    setIsOptionsOpen(true)
  }

  const dismissOptions = () => {
    setIsOptionsOpen(false)
  }

  const closeOptions = () => {
    dismissOptions()
    triggerRef.current?.focus()
  }

  const selectChannel = (index: number) => {
    const nextChannel = snsChannels[index]
    if (nextChannel) {
      sessionStorage.setItem('selectedSnsProvider', nextChannel.provider)
      if (connectedAccount && connectedAccount.provider !== nextChannel.provider) {
        setConnectedAccount(null)
        setOauthStatus('')
        sessionStorage.removeItem('oauthVerified')
      }
      if (connectedAccount && connectedAccount.provider === nextChannel.provider) {
        setConnectedAccount(null)
        setOauthStatus('')
        sessionStorage.removeItem('oauthVerified')
      }
    }
    setSelectedIndex(index)
    closeOptions()
  }

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      openOptions(0)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      openOptions(snsChannels.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openOptions(selectedIndex ?? 0)
    }
  }

  const handleOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index + 1) % snsChannels.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index - 1 + snsChannels.length) % snsChannels.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      selectChannel(index)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeOptions()
    }
  }

  const selectedChannel = selectedIndex === null ? null : snsChannels[selectedIndex]
  const isCurrentChannelConnected = Boolean(
    selectedChannel && connectedAccount && connectedAccount.provider === selectedChannel.provider,
  )
  const shouldShowConnectedBadge = Boolean(
    selectedChannel && connectedAccount && connectedAccount.provider === selectedChannel.provider,
  )

  useEffect(() => {
    if (!isUserSessionValid) {
      sessionStorage.setItem('postLoginRedirect', '#/apply/form')
      window.dispatchEvent(new CustomEvent('auth:required'))
    }
  }, [isUserSessionValid])

  const canSubmit = !isSubmitting && isCurrentChannelConnected && privacyAgreed && shopTermsAgreed && alarmAgreed

  const hydrateVerifiedAccount = () => {
    const verifiedJson = sessionStorage.getItem('oauthVerified')
    if (!verifiedJson) {
      const storedProvider = sessionStorage.getItem('selectedSnsProvider') as OAuthProvider | null
      if (storedProvider) {
        const providerIndex = snsChannels.findIndex((channel) => channel.provider === storedProvider)
        if (providerIndex >= 0) {
          setSelectedIndex(providerIndex)
        }
      }
      return
    }

    try {
      const verified = JSON.parse(verifiedJson) as ConnectedAccount
      const providerIndex = snsChannels.findIndex((channel) => channel.provider === verified.provider)
      if (providerIndex >= 0) {
        setSelectedIndex(providerIndex)
        sessionStorage.setItem('selectedSnsProvider', verified.provider)
      }
      setConnectedAccount(verified)
      setOauthStatus(
        `${verified.provider === 'instagram' ? 'Instagram' : 'YouTube'} 계정 연결이 완료되었습니다. ${verified.label}`,
      )
    } catch (error) {
      console.error('Failed to parse OAuth verified data:', error)
    }
  }

  useEffect(() => {
    hydrateVerifiedAccount()

    return () => {
      sessionStorage.removeItem('oauthVerified')
      sessionStorage.removeItem('selectedSnsProvider')
      sessionStorage.removeItem('oauthProvider')
    }
  }, [])

  useEffect(() => {
    const handleOAuthCallback = () => {
      hydrateVerifiedAccount()
    }

    const handleVerifiedEvent = () => {
      hydrateVerifiedAccount()
    }

    const handleVerificationFailedEvent = () => {
      const message = sessionStorage.getItem('oauthVerificationError')
      sessionStorage.removeItem('oauthVerificationError')
      setOauthError(message || 'SNS 계정 연동에 실패했습니다.')
    }

    window.addEventListener('hashchange', handleOAuthCallback)
    window.addEventListener('oauth-verified', handleVerifiedEvent)
    window.addEventListener('oauth-verification-failed', handleVerificationFailedEvent)
    return () => {
      window.removeEventListener('hashchange', handleOAuthCallback)
      window.removeEventListener('oauth-verified', handleVerifiedEvent)
      window.removeEventListener('oauth-verification-failed', handleVerificationFailedEvent)
    }
  }, [])

  useEffect(() => {
    if (!selectedChannel || !connectedAccount) {
      return
    }

    if (connectedAccount.provider !== selectedChannel.provider) {
      setOauthStatus('')
    }
  }, [selectedChannel, connectedAccount])

  if (!isUserSessionValid) {
    return null
  }

  const handleOAuthConnect = async () => {
    if (!selectedChannel) {
      return
    }

    if (selectedChannel.provider === 'facebook') {
      setOauthError('')
      setOauthStatus('')
      setSubmitError('')
      setSubmitSuccess('')
      return
    }

    setOauthError('')
    setOauthStatus('')
    setSubmitError('')
    setSubmitSuccess('')

    try {
      sessionStorage.setItem('oauthProvider', selectedChannel.provider)
      const authorizationUrl = await startOAuthAuthorization(selectedChannel.provider)
      const callbackUrl = `${window.location.origin}${import.meta.env.BASE_URL}`
      const redirectUrl = new URL(authorizationUrl)
      redirectUrl.searchParams.set('redirect_uri', callbackUrl)
      if (window.location.assign) {
        window.location.assign(redirectUrl.toString())
        return
      }
      window.location.href = redirectUrl.toString()
    } catch (error) {
      const message = error instanceof Error ? error.message : '계정 연결에 실패했습니다.'
      if (message === '인증이 필요합니다.') {
        sessionStorage.removeItem('oauthProvider')
        window.dispatchEvent(new CustomEvent('auth:required'))
        return
      }
      setOauthError(message)
    }
  }

  const handleSubmit = async () => {
    if (!selectedChannel || !session || !isUserSessionValid) {
      redirectToLoginScreen()
      return
    }

    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      const snsCode = connectedAccount?.provider === 'instagram' ? 'INSTAGRAM' : connectedAccount?.provider === 'youtube' ? 'YOUTUBE' : selectedChannel.provider === 'instagram' ? 'INSTAGRAM' : 'YOUTUBE'
      const payload = {
        snsCode,
        snsAccountId: connectedAccount?.label || session.loginId || selectedChannel.label,
        followerCount: connectedAccount?.followerCount ?? 0,
        privacyAgreed,
        alarmAgreed,
      }

      const response = await authFetch(`${API_BASE_URL}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error(DUPLICATE_APPLICATION_MESSAGE)
        }
        const rawMessage = await response.text()
        throw new Error(extractErrorMessage(rawMessage))
      }

      setSubmitSuccess('지원서가 정상적으로 제출되었습니다.')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '지원서 제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="panel-page">
      <PanelHeader backHref="#/apply" title="셀렉터스 신청하기" />
      <div className="screen-scroll apply-form-screen">
        <section className="form-intro">
          <h2>나의 대표 SNS</h2>
          <p>본인 소유의 공개된 대표 SNS를 연결해주세요.</p>
        </section>

        <form className="application-form" onSubmit={(event) => event.preventDefault()}>
          <div className="select-wrap" ref={pickerRef}>
            <button
              aria-controls="representative-sns-options"
              aria-expanded={isOptionsOpen}
              aria-haspopup="listbox"
              className={`sns-trigger${selectedChannel ? ' is-selected' : ''}`}
              onClick={() => (isOptionsOpen ? dismissOptions() : openOptions(selectedIndex ?? 0))}
              onKeyDown={handleTriggerKeyDown}
              ref={triggerRef}
              type="button"
            >
              {selectedChannel?.label ?? '대표 SNS 선택'}
            </button>
            <ChevronDownIcon size={18} />
            {isOptionsOpen ? (
              <div aria-label="대표 SNS" className="sns-options" id="representative-sns-options" role="listbox">
                {snsChannels.map((channel, index) => (
                  <button
                    aria-selected={selectedIndex === index}
                    className="sns-option"
                    key={channel.label}
                    onClick={() => selectChannel(index)}
                    onKeyDown={(event) => handleOptionKeyDown(event, index)}
                    ref={(element) => { optionRefs.current[index] = element }}
                    role="option"
                    tabIndex={index === activeIndex ? 0 : -1}
                    type="button"
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            className={`oauth-connect-button${isCurrentChannelConnected ? ' is-connected' : ''}`}
            disabled={!selectedChannel || isCurrentChannelConnected}
            onClick={handleOAuthConnect}
            type="button"
          >
            {isCurrentChannelConnected ? '인증 완료' : selectedChannel ? `${selectedChannel.oauthLabel} 계정 연결하기` : 'SNS 계정 연결하기'}
          </button>
        </form>

        {shouldShowConnectedBadge && oauthStatus ? (
          <div className="oauth-status-card" role="status" aria-live="polite">
            <span className="oauth-status-badge">연동 완료</span>
            <div className="oauth-status-content">
              <strong>{connectedAccount?.label ?? '연동된 계정'}</strong>
            </div>
          </div>
        ) : null}

        <section className="privacy-section">
          <h2>서비스 신청을 위한 필수 개인정보 수집/이용 안내</h2>
          <div className="privacy-lines">
            {privacyItems.map((item) => <p key={item}>{item}</p>)}
          </div>
          <p className="privacy-note">필수적 개인정보 수집/이용을 거부하실 권리가 있으나, 거부 시 셀렉터스 신청이 불가합니다.</p>
        </section>

        <section className="terms-section">
          <h2>셀렉터스 이용 약관 동의</h2>
          <div className="term-row">
            <label>
              <input checked={privacyAgreed} onChange={(event) => setPrivacyAgreed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>현대백화점 이용약관 (필수)</span>
            </label>
            <button aria-label="현대백화점 이용약관 내용 보기" type="button"><ArrowRightIcon size={18} /></button>
          </div>
          <div className="term-row">
            <label>
              <input checked={shopTermsAgreed} onChange={(event) => setShopTermsAgreed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>한무쇼핑 이용약관 (필수)</span>
            </label>
            <button aria-label="한무쇼핑 이용약관 내용 보기" type="button"><ArrowRightIcon size={18} /></button>
          </div>
          <div className="term-row">
            <label>
              <input checked={alarmAgreed} onChange={(event) => setAlarmAgreed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>카카오 알림톡 수신 동의 (필수)</span>
            </label>
            <button aria-label="카카오 알림톡 수신 동의 내용 보기" type="button"><ArrowRightIcon size={18} /></button>
          </div>
        </section>

      </div>
      <BottomAction disabled={!canSubmit} label="셀렉터스 신청하기" onClick={handleSubmit} />
      {oauthError ? (
        <div aria-modal="true" className="auth-gate-backdrop" role="dialog" aria-labelledby="oauth-error-title">
          <div className="auth-gate-modal">
            <h3 id="oauth-error-title">계정 연결 실패</h3>
            <p>{oauthError}</p>
            <div className="auth-gate-actions">
              <button className="primary-action" onClick={() => setOauthError('')} type="button">확인</button>
            </div>
          </div>
        </div>
      ) : null}
      {submitError ? (
        <div aria-modal="true" className="auth-gate-backdrop" role="dialog" aria-labelledby="submit-error-title">
          <div className="auth-gate-modal">
            <h3 id="submit-error-title">제출 실패</h3>
            <p>{submitError}</p>
            <div className="auth-gate-actions">
              <button
                className="primary-action"
                onClick={submitError === DUPLICATE_APPLICATION_MESSAGE ? redirectToMainScreen : () => setSubmitError('')}
                type="button"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {submitSuccess ? (
        <div aria-modal="true" className="auth-gate-backdrop" role="dialog" aria-labelledby="submit-success-title">
          <div className="auth-gate-modal">
            <h3 id="submit-success-title">제출 완료</h3>
            <p>{submitSuccess}</p>
            <div className="auth-gate-actions">
              <button className="primary-action" onClick={redirectToMainScreen} type="button">확인</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
