import PanelHeader from '../components/PanelHeader'

export default function LoginScreen() {
  return (
    <>
      <PanelHeader backHref="#/screens" title="로그인" />
      <div className="screen-scroll login-screen">
        <div className="login-copy">
          <span className="brand-wordmark">SELECTORS</span>
          <h2>나만의 셀렉션을<br />수익으로 연결해 보세요.</h2>
          <p>아이디와 비밀번호를 입력해 주세요.</p>
        </div>

        <form className="stack-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>아이디</span>
            <input autoComplete="username" name="userId" placeholder="아이디를 입력해 주세요" />
          </label>
          <label>
            <span>비밀번호</span>
            <input autoComplete="current-password" name="password" placeholder="비밀번호를 입력해 주세요" type="password" />
          </label>
          <button className="primary-action login-button" type="submit">로그인</button>
        </form>

        <p className="login-help">셀렉터스 활동을 위해 발급받은 계정으로 로그인해 주세요.</p>
      </div>
    </>
  )
}
