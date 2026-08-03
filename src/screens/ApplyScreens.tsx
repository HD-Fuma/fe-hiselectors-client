import BottomAction from '../components/BottomAction'
import { ArrowRightIcon, CartIcon, CheckIcon, ChevronDownIcon, CoinIcon, GiftIcon, LinkIcon, PersonIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'

const flowSteps = [
  { label: '상품 선택', icon: <CartIcon size={26} /> },
  { label: '링크 공유', icon: <LinkIcon size={26} /> },
  { label: '고객 구매', icon: <GiftIcon size={26} /> },
  { label: '수익 정산', icon: <CoinIcon size={26} /> },
] as const

const benefits = [
  { title: '간편한 시작', copy: '현대백화점 상품을\n바로 골라보세요.', icon: <CheckIcon size={25} /> },
  { title: '나만의 큐레이션', copy: '좋아하는 상품으로\n감각을 보여주세요.', icon: <PersonIcon size={25} /> },
  { title: '기분 좋은 수익', copy: '공유한 상품 판매 시\n수수료를 드려요.', icon: <CoinIcon size={25} /> },
] as const

export function ApplyIntroScreen() {
  return (
    <div className="panel-page">
      <PanelHeader backHref="#/screens" title="셀렉터스 신청하기" />
      <div className="screen-scroll apply-intro-screen">
        <section className="apply-hero">
          <h2>당신의 감각을 보여주세요!<br />여러분의 큐레이션이<br />기분 좋은 수익으로 이어집니다.</h2>
          <p>마음에 드는 상품을 소개하고, 공유한 링크를 통해<br />상품이 판매되면 활동 수수료를 받을 수 있어요.</p>
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
          <div className="section-heading-row">
            <h2>셀렉터스라서 더 좋아요</h2>
            <span>SELECTORS BENEFIT</span>
          </div>
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
  '수집·이용 목적: 셀렉터스 신청 접수 및 활동 안내',
  '수집 항목: 활동 SNS 채널 및 채널 주소',
  '보유·이용 기간: 신청일로부터 1년',
] as const

const terms = [
  { label: '셀렉터스 이용약관 동의 (필수)', required: true },
  { label: '개인정보 수집 및 이용 동의 (필수)', required: true },
  { label: '카카오 알림톡 수신 동의 (선택)', required: false },
] as const

export function ApplyFormScreen() {
  return (
    <div className="panel-page">
      <PanelHeader backHref="#/apply" title="셀렉터스 신청서" />
      <div className="screen-scroll apply-form-screen">
        <section className="form-intro">
          <h2>활동할 SNS 채널을 알려주세요.</h2>
          <p>선택한 채널과 입력한 주소는 셀렉터스 활동 심사를 위해 사용됩니다.</p>
        </section>

        <form className="application-form" onSubmit={(event) => event.preventDefault()}>
          <label className="field-label" htmlFor="channel-type">SNS 채널</label>
          <div className="select-wrap">
            <select defaultValue="" id="channel-type" name="channelType">
              <option disabled value="">채널을 선택해 주세요</option>
              <option value="instagram">인스타그램</option>
              <option value="youtube">유튜브</option>
              <option value="blog">블로그</option>
            </select>
            <ChevronDownIcon size={18} />
          </div>
          <label className="sr-only" htmlFor="channel-url">SNS 채널 주소</label>
          <input id="channel-url" name="channelUrl" placeholder="SNS 채널 URL을 입력해 주세요" type="url" />
        </form>

        <section className="privacy-section">
          <h2>개인정보 수집 및 이용 안내</h2>
          <ol>
            {privacyItems.map((item) => <li key={item}>{item}</li>)}
          </ol>
          <p>동의를 거부할 권리가 있으며, 거부 시 셀렉터스 신청이 제한됩니다.</p>
        </section>

        <section className="terms-section">
          <h2>약관 동의</h2>
          <label className="all-terms-row">
            <input type="checkbox" />
            <span className="custom-check"><CheckIcon size={16} /></span>
            <strong>전체 동의</strong>
          </label>
          {terms.map((term) => (
            <div className="term-row" key={term.label}>
              <label>
                <input type="checkbox" />
                <span className="custom-check"><CheckIcon size={16} /></span>
                <span>{term.label}</span>
              </label>
              <button aria-label={`${term.label} 내용 보기`} type="button"><ArrowRightIcon size={18} /></button>
            </div>
          ))}
        </section>
      </div>
      <BottomAction disabled label="신청하기" />
    </div>
  )
}
