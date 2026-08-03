import { useEffect, useRef, useState } from 'react'

import BottomAction from '../components/BottomAction'
import { ArrowRightIcon, CartIcon, CheckIcon, ChevronDownIcon, CoinIcon, GiftIcon, LinkIcon, PersonIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'

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
  { label: '인스타그램', oauthLabel: 'Instagram' },
  { label: '페이스북', oauthLabel: 'Facebook' },
  { label: '유튜브', oauthLabel: 'YouTube' },
] as const

const terms = [
  '현대백화점 이용약관 (필수)',
  '한무쇼핑 이용약관 (필수)',
  '카카오 알림톡 수신 동의 (선택)',
] as const

export function ApplyFormScreen() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (isOptionsOpen) {
      optionRefs.current[activeIndex]?.focus()
    }
  }, [activeIndex, isOptionsOpen])

  const openOptions = (index: number) => {
    setActiveIndex(index)
    setIsOptionsOpen(true)
  }

  const closeOptions = () => {
    setIsOptionsOpen(false)
    triggerRef.current?.focus()
  }

  const selectChannel = (index: number) => {
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
      openOptions(0)
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

  return (
    <div className="panel-page">
      <PanelHeader backHref="#/apply" title="셀렉터스 신청하기" />
      <div className="screen-scroll apply-form-screen">
        <section className="form-intro">
          <h2>나의 대표 SNS</h2>
          <p>본인 소유의 공개된 대표 SNS를 연결해주세요.</p>
        </section>

        <form className="application-form" onSubmit={(event) => event.preventDefault()}>
          <div className="select-wrap">
            <button
              aria-controls="representative-sns-options"
              aria-expanded={isOptionsOpen}
              aria-haspopup="listbox"
              className="sns-trigger"
              onClick={() => (isOptionsOpen ? closeOptions() : openOptions(0))}
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
          <button className="oauth-connect-button" disabled={!selectedChannel} type="button">
            {selectedChannel ? `${selectedChannel.oauthLabel} 계정 연결하기` : 'SNS 계정 연결하기'}
          </button>
        </form>

        <section className="privacy-section">
          <h2>서비스 신청을 위한 필수 개인정보 수집/이용 안내</h2>
          <div className="privacy-lines">
            {privacyItems.map((item) => <p key={item}>{item}</p>)}
          </div>
          <p className="privacy-note">필수적 개인정보 수집/이용을 거부하실 권리가 있으나, 거부 시 셀렉터스 신청이 불가합니다.</p>
        </section>

        <section className="terms-section">
          <h2>셀렉터스 이용 약관 동의</h2>
          {terms.map((term) => (
            <div className="term-row" key={term}>
              <label>
                <input type="checkbox" />
                <span className="custom-check"><CheckIcon size={16} /></span>
                <span>{term}</span>
              </label>
              <button aria-label={`${term} 내용 보기`} type="button"><ArrowRightIcon size={18} /></button>
            </div>
          ))}
        </section>
      </div>
      <BottomAction disabled label="셀렉터스 신청하기" />
    </div>
  )
}
