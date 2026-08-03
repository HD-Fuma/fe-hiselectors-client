import { useState } from 'react'

import { EyeIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'

const simpleLoginMethods = [
  ['휴대폰 인증 로그인', 'phone'],
  ['네이버 로그인', 'naver'],
  ['카카오 로그인', 'kakao'],
  ['토스 로그인', 'toss'],
  ['QR 코드 로그인', 'qr'],
  ['H.Point APP 로그인', 'hpoint'],
] as const

export default function LoginScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  return (
    <>
      <PanelHeader backHref="#/screens" title="로그인" />
      <div className="screen-scroll login-screen">
        <section className="login-member-section" aria-labelledby="member-login-heading">
          <h2 id="member-login-heading">H.Point 통합회원 로그인</h2>
          <form className="login-form" onSubmit={(event) => event.preventDefault()}>
            <label className="login-field" htmlFor="login-user-id">
              <span className="sr-only">아이디</span>
              <input autoComplete="username" id="login-user-id" name="userId" placeholder="아이디" />
            </label>
            <label className="login-field login-password-field" htmlFor="login-password">
              <span className="sr-only">비밀번호</span>
              <span className="login-password-input">
                <input autoComplete="current-password" id="login-password" name="password" placeholder="비밀번호" type={isPasswordVisible ? 'text' : 'password'} />
                <button aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'} className="login-password-toggle" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button">
                  <EyeIcon size={20} />
                </button>
              </span>
            </label>
            <div className="login-options">
              <label><input name="rememberId" type="checkbox" />아이디 저장</label>
              <label><input name="autoLogin" type="checkbox" />자동 로그인</label>
            </div>
            <div className="login-submit-wrap">
              <button className="primary-action login-button" type="submit">로그인</button>
              <span className="login-recent-badge">최근에 로그인 했어요.</span>
            </div>
          </form>
          <div className="login-link-row">
            <button type="button">통합회원 가입하기</button>
            <button type="button">아이디/비밀번호 찾기</button>
          </div>
        </section>

        <section className="login-simple-section" aria-label="간편 로그인" role="group">
          {simpleLoginMethods.map(([method, provider]) => (
            <button key={method} type="button"><span aria-hidden="true" className={`login-provider-mark login-provider-${provider}`} />{method}</button>
          ))}
        </section>

        <section className="login-info-section" aria-labelledby="biz-login-heading">
          <h2 id="biz-login-heading">BIZ회원 로그인</h2>
          <p>BIZ회원으로 가입하시는 경우 BIZ회원 로그인 화면에서 로그인 해주세요.</p>
          <button type="button">BIZ회원 로그인 페이지로</button>
        </section>

        <section className="login-info-section" aria-labelledby="member-conversion-heading">
          <h2 id="member-conversion-heading">통합회원 전환</h2>
          <p>기존 더현대닷컴 회원이라면 H.Point 통합회원으로 전환해 주세요.</p>
          <button type="button">통합회원 전환하기</button>
        </section>
      </div>
    </>
  )
}
