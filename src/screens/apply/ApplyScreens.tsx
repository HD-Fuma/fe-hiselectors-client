import { useEffect, useState } from 'react'

import {
  API_BASE_URL,
  authFetch,
  hasValidUserSession,
  readAuthSession,
  redirectToLoginScreen,
  redirectToMainScreen,
} from '../../auth'
import BottomActionBar from '../../components/BottomActionBar'
import { ArrowRightIcon, CartIcon, CheckIcon, ChevronDownIcon, CloseIcon, CoinIcon, GiftIcon, LinkIcon, PersonIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import { navigate } from '../../navigation'
import {
  startOAuthAuthorization,
  type OAuthProvider,
  type YouTubeOAuthChannel,
  YOUTUBE_CHANNELS_STORAGE_KEY,
} from '../../oauth'
import { selectorsTermsFor } from './selectorsTerms'

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
      <ScreenHeader backHref="/login" title="셀렉터스 신청하기" />
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
          <a className="detail-link" href="/apply/form">자세히 알아보기 <ArrowRightIcon size={14} /></a>
        </section>
      </div>
      <BottomActionBar href="/apply/form" label="셀렉터스 신청하기" />
    </div>
  )
}

const privacyItems = [
  '① 수집 목적: 셀렉터스 접수 처리',
  '② 수집 항목 : SNS 계정 연결 정보',
  '③ 보유 및 이용기간: 셀렉터스 신청 철회 시 또는 서비스 종료 시까지',
] as const

const snsChannels = [
  { label: '유튜브', oauthLabel: 'YouTube', provider: 'youtube' },
  { label: '인스타그램', oauthLabel: 'Instagram', provider: 'instagram' },
  { label: '페이스북', oauthLabel: 'Facebook', provider: 'facebook' },
] as const

type ConnectedAccount = {
  provider: Exclude<OAuthProvider, 'facebook'>
  accountId: string
  verificationToken?: string
  followerCount: number | null
  contentCount?: number | null
  label: string
}

const DUPLICATE_APPLICATION_MESSAGE = '이미 해당 기수에 신청하셨습니다.'

const consentDetails = {
  hyundai: {
    title: '현대백화점 이용약관',
    content: selectorsTermsFor('㈜현대백화점'),
  },
  hanmoo: {
    title: '한무쇼핑 이용약관',
    content: selectorsTermsFor('한무쇼핑㈜'),
  },
  contentCollection: {
    title: 'SNS 콘텐츠 자동 수집 및 활용 동의',
    content: '본인은 셀렉터스 활동 검증 및 성과 관리를 위해, 본인이 등록한 SNS 계정(유튜브·인스타그램 등)의 공개 게시물과 관련 정보(게시물 내용, 이미지·영상, 조회수·좋아요·댓글 수 등 성과 지표)를 현대백화점이 주기적으로 자동 수집·저장·이용하는 것에 동의합니다.',
  },
  copyright: {
    title: '게시물 저작권 및 제3자 정보 확인',
    content: '본인은 수집 대상 게시물이 본인의 저작물이거나 정당한 이용 권한을 보유하고 있으며, 게시물에 포함된 제3자의 정보에 대해 필요한 동의를 확보했음을 확인합니다.',
  },
  alimtalk: {
    title: '카카오 알림톡 수신 동의',
    content: `셀렉터스 서비스 운영을 위한 카카오 알림톡 수신 동의

① 수신 목적: 셀렉터스 신청 접수 및 심사 결과, 활동 및 캠페인, 정산 등 서비스 운영에 필요한 안내
② 수신 채널: 카카오 알림톡(알림톡 발송이 어려운 경우 동일한 내용이 SMS 또는 LMS로 발송될 수 있습니다.)
③ 이용 정보: 회원정보에 등록된 휴대전화번호
④ 동의 기간: 동의 철회 또는 셀렉터스 서비스 이용 종료 시까지

본 동의는 셀렉터스 서비스 제공에 필요한 필수 안내를 위한 것으로, 광고성 정보 수신 동의와는 별개입니다. 동의를 거부할 권리가 있으나, 거부 시 셀렉터스 신청 및 서비스 이용이 제한될 수 있습니다.`,
  },
} as const

type ConsentDetailKey = keyof typeof consentDetails

function ConsentDocument({ content }: { content: string }) {
  return content.split('\n').filter((line) => line.trim()).map((line, index) => {
    if (line === '더현대Hi 셀렉터스 프로그램 이용약관') {
      return <strong className="terms-document-lead" key={line}>{line}</strong>
    }
    if (/^(제\d+조|\[부칙\])/.test(line)) {
      return <h3 key={`${index}-${line}`}>{line}</h3>
    }
    if (/^\(\d+\)/.test(line)) {
      return <p className="terms-document-list-item" key={`${index}-${line}`}>{line}</p>
    }
    if (/^\d+\)/.test(line)) {
      return <p className="terms-document-nested-item" key={`${index}-${line}`}>{line}</p>
    }
    return <p key={`${index}-${line}`}>{line}</p>
  })
}

function InlineConsentDetail({ detailKey, onClose }: { detailKey: ConsentDetailKey, onClose: () => void }) {
  const detail = consentDetails[detailKey]

  return (
    <section
      aria-labelledby={`${detailKey}-consent-detail-title`}
      className="consent-detail-inline"
      id={`${detailKey}-consent-detail`}
      role="region"
    >
      <div className="consent-detail-header">
        <h2 id={`${detailKey}-consent-detail-title`}>{detail.title}</h2>
        <button aria-label={`${detail.title} 닫기`} onClick={onClose} type="button"><CloseIcon size={24} /></button>
      </div>
      <div className="consent-detail-body">
        <ConsentDocument content={detail.content} />
      </div>
    </section>
  )
}

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
  const [isSnsMenuOpen, setIsSnsMenuOpen] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)
  const [shopTermsAgreed, setShopTermsAgreed] = useState(false)
  const [contentCollectionAgreed, setContentCollectionAgreed] = useState(false)
  const [copyrightConfirmed, setCopyrightConfirmed] = useState(false)
  const [openConsentDetail, setOpenConsentDetail] = useState<ConsentDetailKey | null>(null)
  const [alarmAgreed, setAlarmAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [oauthError, setOauthError] = useState('')
  const [oauthStatus, setOauthStatus] = useState('')
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null)
  const [youtubeChannels, setYoutubeChannels] = useState<YouTubeOAuthChannel[]>([])
  const session = readAuthSession()
  const isUserSessionValid = hasValidUserSession(session)
  const hasAlimtalkConsent = session?.alimtalk === 'Y'

  const selectChannel = (index: number | null) => {
    const nextChannel = index === null ? null : snsChannels[index]
    if (nextChannel) {
      sessionStorage.setItem('selectedSnsProvider', nextChannel.provider)
    } else {
      sessionStorage.removeItem('selectedSnsProvider')
    }
    if (connectedAccount || youtubeChannels.length > 0) {
      setConnectedAccount(null)
      setYoutubeChannels([])
      setOauthStatus('')
      sessionStorage.removeItem('oauthVerified')
      sessionStorage.removeItem(YOUTUBE_CHANNELS_STORAGE_KEY)
    }
    setSelectedIndex(index)
    setIsSnsMenuOpen(false)
  }

  const selectedChannel = selectedIndex === null ? null : snsChannels[selectedIndex]
  const isCurrentChannelConnected = Boolean(
    selectedChannel && connectedAccount && connectedAccount.provider === selectedChannel.provider,
  )
  const isWaitingForYoutubeChannel = selectedChannel?.provider === 'youtube' && youtubeChannels.length > 0
  const shouldShowConnectedBadge = Boolean(
    selectedChannel && connectedAccount && connectedAccount.provider === selectedChannel.provider,
  )
  const allTermsAgreed =
    privacyAgreed &&
    shopTermsAgreed &&
    contentCollectionAgreed &&
    copyrightConfirmed &&
    (hasAlimtalkConsent || alarmAgreed)

  const setAllTermsAgreed = (checked: boolean) => {
    setPrivacyAgreed(checked)
    setShopTermsAgreed(checked)
    setContentCollectionAgreed(checked)
    setCopyrightConfirmed(checked)
    setAlarmAgreed(checked)
  }

  useEffect(() => {
    if (!isUserSessionValid) {
      sessionStorage.setItem('postLoginRedirect', '/apply/form')
      window.dispatchEvent(new CustomEvent('auth:required'))
    }
  }, [isUserSessionValid])

  const canSubmit =
    !isSubmitting &&
    isCurrentChannelConnected &&
    privacyAgreed &&
    shopTermsAgreed &&
    contentCollectionAgreed &&
    copyrightConfirmed &&
    (hasAlimtalkConsent || alarmAgreed)

  const hydrateVerifiedAccount = () => {
    const verifiedJson = sessionStorage.getItem('oauthVerified')
    const youtubeChannelsJson = sessionStorage.getItem(YOUTUBE_CHANNELS_STORAGE_KEY)
    if (!verifiedJson && !youtubeChannelsJson) {
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
      if (youtubeChannelsJson) {
        const channels = JSON.parse(youtubeChannelsJson) as YouTubeOAuthChannel[]
        if (Array.isArray(channels) && channels.length > 0) {
          setYoutubeChannels(channels)
          setSelectedIndex(snsChannels.findIndex((channel) => channel.provider === 'youtube'))
        }
      }
      if (!verifiedJson) {
        setConnectedAccount(null)
        setOauthStatus('')
        return
      }
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
      sessionStorage.removeItem(YOUTUBE_CHANNELS_STORAGE_KEY)
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

    window.addEventListener('popstate', handleOAuthCallback)
    window.addEventListener('oauth-verified', handleVerifiedEvent)
    window.addEventListener('oauth-verification-failed', handleVerificationFailedEvent)
    return () => {
      window.removeEventListener('popstate', handleOAuthCallback)
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

  useEffect(() => {
    if (!openConsentDetail) {
      return undefined
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenConsentDetail(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [openConsentDetail])

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
      return
    }

    setOauthError('')
    setOauthStatus('')
    setSubmitError('')
    setYoutubeChannels([])
    sessionStorage.removeItem(YOUTUBE_CHANNELS_STORAGE_KEY)

    try {
      sessionStorage.setItem('oauthProvider', selectedChannel.provider)
      const authorizationUrl = await startOAuthAuthorization(selectedChannel.provider)
      if (window.location.assign) {
        window.location.assign(authorizationUrl)
        return
      }
      window.location.href = authorizationUrl
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

  const selectYoutubeChannel = (channelId: string) => {
    const channel = youtubeChannels.find((candidate) => candidate.channelId === channelId)
    if (!channel) {
      setConnectedAccount(null)
      setOauthStatus('')
      sessionStorage.removeItem('oauthVerified')
      return
    }

    const account = {
      provider: 'youtube' as const,
      accountId: channel.channelId,
      verificationToken: channel.verificationToken,
      followerCount: channel.followerCount ?? null,
      contentCount: channel.contentCount ?? null,
      label: channel.channelTitle?.trim() || channel.channelId,
    }
    setConnectedAccount(account)
    setOauthStatus(`YouTube 채널 선택이 완료되었습니다. ${account.label}`)
    sessionStorage.setItem('oauthVerified', JSON.stringify(account))
  }

  const handleSubmit = async () => {
    if (!selectedChannel || !connectedAccount || !session || !isUserSessionValid) {
      redirectToLoginScreen()
      return
    }

    if (!connectedAccount.verificationToken?.trim()) {
      setConnectedAccount(null)
      setOauthStatus('')
      sessionStorage.removeItem('oauthVerified')
      setSubmitError('SNS 계정을 다시 인증해 주세요.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const snsCode = connectedAccount.provider === 'instagram' ? 'INSTAGRAM' : 'YOUTUBE'
      const payload = {
        snsCode,
        snsAccountId: connectedAccount.accountId,
        verificationToken: connectedAccount.verificationToken,
        followerCount: connectedAccount.followerCount ?? null,
        contentCount: connectedAccount.contentCount ?? null,
        privacyAgreed,
        alarmAgreed: hasAlimtalkConsent || alarmAgreed,
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

      navigate('/apply/status')
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '지원서 제출 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="panel-page">
      <ScreenHeader backHref="/apply" title="셀렉터스 신청하기" />
      <div className="screen-scroll apply-form-screen">
        <section className="form-intro">
          <h2>나의 대표 SNS</h2>
          <p>본인 소유의 공개된 대표 SNS를 입력해주세요.</p>
        </section>

        <form className="application-form" onSubmit={(event) => event.preventDefault()}>
          <div
            className={`select-wrap${isSnsMenuOpen ? ' is-open' : ''}`}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsSnsMenuOpen(false)
              }
            }}
          >
            <button
              aria-controls="sns-options"
              aria-expanded={isSnsMenuOpen}
              aria-haspopup="listbox"
              aria-label="대표 SNS"
              className={`sns-trigger${selectedChannel ? ' is-selected' : ''}`}
              onClick={() => setIsSnsMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault()
                  setIsSnsMenuOpen(true)
                }
                if (event.key === 'Escape') {
                  setIsSnsMenuOpen(false)
                }
              }}
              role="combobox"
              type="button"
            >
              <span>{selectedChannel?.label ?? '대표 SNS 선택'}</span>
              <ChevronDownIcon size={18} />
            </button>
            {isSnsMenuOpen ? (
              <div aria-label="대표 SNS 선택 목록" className="sns-options" id="sns-options" role="listbox">
                {snsChannels.map(({ label, provider }, index) => (
                  <button
                    aria-selected={selectedIndex === index}
                    className="sns-option"
                    key={provider}
                    onClick={() => selectChannel(index)}
                    role="option"
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            className={`oauth-connect-button${isCurrentChannelConnected ? ' is-connected' : ''}`}
            disabled={!selectedChannel || isCurrentChannelConnected || isWaitingForYoutubeChannel}
            onClick={handleOAuthConnect}
            type="button"
          >
            {isCurrentChannelConnected
              ? '인증 완료'
              : isWaitingForYoutubeChannel
                ? '채널을 선택해 주세요'
                : selectedChannel
                  ? `${selectedChannel.oauthLabel} 계정 연결하기`
                  : 'SNS 계정 연결하기'}
          </button>
          {isWaitingForYoutubeChannel ? (
            <div className="youtube-channel-picker">
              <label htmlFor="youtube-channel">지원할 YouTube 채널</label>
              <select
                id="youtube-channel"
                onChange={(event) => selectYoutubeChannel(event.target.value)}
                value={connectedAccount?.provider === 'youtube' ? connectedAccount.accountId : ''}
              >
                <option value="">채널을 선택해 주세요</option>
                {youtubeChannels.map((channel) => (
                  <option key={channel.channelId} value={channel.channelId}>
                    {channel.channelTitle?.trim() || channel.channelId}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
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
          <label className="all-terms-row">
            <input checked={allTermsAgreed} onChange={(event) => setAllTermsAgreed(event.target.checked)} type="checkbox" />
            <span className="custom-check"><CheckIcon size={16} /></span>
            <span>모두 동의</span>
          </label>
          <div className="term-row">
            <label>
              <input checked={privacyAgreed} onChange={(event) => setPrivacyAgreed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>현대백화점 이용약관 (필수)</span>
            </label>
            <button aria-label="현대백화점 이용약관 내용 보기" onClick={() => setOpenConsentDetail('hyundai')} type="button"><ArrowRightIcon size={24} /></button>
          </div>
          <div className="term-row">
            <label>
              <input checked={shopTermsAgreed} onChange={(event) => setShopTermsAgreed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>한무쇼핑 이용약관 (필수)</span>
            </label>
            <button aria-label="한무쇼핑 이용약관 내용 보기" onClick={() => setOpenConsentDetail('hanmoo')} type="button"><ArrowRightIcon size={24} /></button>
          </div>
          <div className="term-row consent-term-row">
            <label>
              <input checked={contentCollectionAgreed} onChange={(event) => setContentCollectionAgreed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>SNS 콘텐츠 자동 수집 및 활용 동의 (필수)</span>
            </label>
            <button
              aria-controls="contentCollection-consent-detail"
              aria-expanded={openConsentDetail === 'contentCollection'}
              aria-label="SNS 콘텐츠 자동 수집 및 활용 동의 내용 보기"
              onClick={() => setOpenConsentDetail((current) => current === 'contentCollection' ? null : 'contentCollection')}
              type="button"
            ><ArrowRightIcon size={24} /></button>
          </div>
          {openConsentDetail === 'contentCollection' ? (
            <InlineConsentDetail detailKey="contentCollection" onClose={() => setOpenConsentDetail(null)} />
          ) : null}
          <div className="term-row consent-term-row">
            <label>
              <input checked={copyrightConfirmed} onChange={(event) => setCopyrightConfirmed(event.target.checked)} type="checkbox" />
              <span className="custom-check"><CheckIcon size={16} /></span>
              <span>게시물 저작권 및 제3자 정보 확인 (필수)</span>
            </label>
            <button
              aria-controls="copyright-consent-detail"
              aria-expanded={openConsentDetail === 'copyright'}
              aria-label="게시물 저작권 및 제3자 정보 확인 내용 보기"
              onClick={() => setOpenConsentDetail((current) => current === 'copyright' ? null : 'copyright')}
              type="button"
            ><ArrowRightIcon size={24} /></button>
          </div>
          {openConsentDetail === 'copyright' ? (
            <InlineConsentDetail detailKey="copyright" onClose={() => setOpenConsentDetail(null)} />
          ) : null}
          {hasAlimtalkConsent ? null : (
            <div className="term-row">
              <label>
                <input checked={alarmAgreed} onChange={(event) => setAlarmAgreed(event.target.checked)} type="checkbox" />
                <span className="custom-check"><CheckIcon size={16} /></span>
                <span>카카오 알림톡 수신 동의 (필수)</span>
              </label>
              <button aria-label="카카오 알림톡 수신 동의 내용 보기" onClick={() => setOpenConsentDetail('alimtalk')} type="button"><ArrowRightIcon size={24} /></button>
            </div>
          )}
        </section>

      </div>
      <BottomActionBar disabled={!canSubmit} label="셀렉터스 신청하기" onClick={handleSubmit} />
      {openConsentDetail && openConsentDetail !== 'contentCollection' && openConsentDetail !== 'copyright' ? (
        <div className="consent-detail-backdrop">
          <section
            aria-labelledby="consent-detail-title"
            aria-modal="true"
            className="consent-detail-modal"
            role="dialog"
          >
            <div className="consent-detail-header">
              <h2 id="consent-detail-title">{consentDetails[openConsentDetail].title}</h2>
              <button autoFocus aria-label="닫기" onClick={() => setOpenConsentDetail(null)} type="button"><CloseIcon size={24} /></button>
            </div>
            <div className="consent-detail-body">
              <ConsentDocument content={consentDetails[openConsentDetail].content} />
            </div>
          </section>
        </div>
      ) : null}
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
    </div>
  )
}

export function ApplyStatusScreen() {
  return (
    <div className="panel-page">
      <ScreenHeader backHref="/campaigns" title="신청 완료" />
      <div className="screen-scroll apply-status-screen">
        <span aria-hidden="true">✓</span>
        <h2>셀렉터스 신청을 완료했어요.</h2>
        <p>심사가 끝나면 결과를 안내해 드릴게요.<br />승인 후 캠페인부터 시작할 수 있어요.</p>
      </div>
      <BottomActionBar href="/campaigns" label="캠페인으로 이동" />
    </div>
  )
}
