import { useState } from 'react'

import { API_BASE_URL, persistAuthSession, redirectToMainScreen } from '../../auth'
import { EyeIcon, LoginProviderIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'

const simpleLoginMethods = [
  ['휴대폰 인증 로그인', 'phone'],
  ['네이버 로그인', 'naver'],
  ['카카오 로그인', 'kakao'],
  ['토스 로그인', 'toss'],
  ['QR 코드 로그인', 'qr'],
  ['H.Point APP 로그인', 'hpoint'],
] as const

type AuthTokenResponse = {
  accessToken: string
  tokenType: string
  role: string
  userName?: string
  name?: string
  username?: string
  memberName?: string
  alimtalk?: string
}

function extractAuthPayload(body: unknown): AuthTokenResponse {
  if (typeof body !== 'object' || body === null) {
    throw new Error('로그인 응답 형식이 올바르지 않습니다.')
  }

  const envelope = body as { data?: unknown }
  const candidate = 'data' in envelope ? envelope.data : body

  if (typeof candidate !== 'object' || candidate === null) {
    throw new Error('로그인 응답 형식이 올바르지 않습니다.')
  }

  const payload = candidate as Partial<AuthTokenResponse>
  if (typeof payload.accessToken !== 'string' || !payload.accessToken.trim()) {
    throw new Error('로그인 응답에 인증 토큰이 없습니다.')
  }

  return {
    accessToken: payload.accessToken,
    tokenType: payload.tokenType || 'Bearer',
    role: payload.role || 'USER',
    userName: payload.userName,
    name: payload.name,
    username: payload.username,
    memberName: payload.memberName,
    alimtalk: payload.alimtalk,
  }
}

function extractErrorMessage(payload: string): string {
  if (!payload.trim()) {
    return '로그인에 실패했습니다.'
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

function getLoginRequestError(error: unknown): string {
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return "로컬 백엔드에 연결할 수 없습니다. 주소창 왼쪽의 사이트 설정에서 '로컬 네트워크 접근'을 허용하고 백엔드가 실행 중인지 확인해주세요."
  }

  return error instanceof Error ? error.message : '로그인 요청 중 오류가 발생했습니다.'
}

async function isSelectorsMember(accessToken: string, tokenType: string): Promise<boolean | null> {
  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/api/product-groups/me/shop`, {
      headers: {
        Authorization: `${tokenType || 'Bearer'} ${accessToken}`,
      },
    })
  } catch (error) {
    console.warn('셀렉터스 회원 여부를 확인하지 못했습니다.', error)
    return null
  }

  if (response.ok) {
    return true
  }

  if (response.status === 403 || response.status === 404) {
    return false
  }

  console.warn(`셀렉터스 회원 여부 확인에 실패했습니다. (${response.status})`)
  return null
}

export default function LoginScreen() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showErrorModal, setShowErrorModal] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedLoginId = loginId.trim()

    if (!trimmedLoginId || !password.trim()) {
      setErrorMessage('아이디와 비밀번호를 입력해주세요.')
      setShowErrorModal(true)
      return
    }

    setErrorMessage('')
    setShowErrorModal(false)
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loginId: trimmedLoginId,
          password,
        }),
      })

      if (!response.ok) {
        const rawMessage = await response.text()
        throw new Error(extractErrorMessage(rawMessage))
      }

      const payload = extractAuthPayload(await response.json())
      const authState = {
        ...payload,
        loginId: trimmedLoginId,
        userName:
          payload.userName ||
          payload.name ||
          payload.username ||
          payload.memberName ||
          trimmedLoginId,
        issuedAt: Date.now(),
      }
      persistAuthSession(authState)
      window.dispatchEvent(new CustomEvent('auth:changed', { detail: authState }))
      setPassword('')

      const selectorsMember = await isSelectorsMember(payload.accessToken, payload.tokenType)
      const postLoginRedirect = sessionStorage.getItem('postLoginRedirect')
      const canUseRequestedRoute = postLoginRedirect
        && (selectorsMember !== false || postLoginRedirect.startsWith('#/apply'))

      sessionStorage.removeItem('postLoginRedirect')

      if (canUseRequestedRoute) {
        window.location.hash = postLoginRedirect
      } else if (selectorsMember === false) {
        window.location.hash = '#/apply'
      } else {
        redirectToMainScreen()
      }
    } catch (error) {
      setErrorMessage(getLoginRequestError(error))
      setShowErrorModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <ScreenHeader title="로그인" />
      <div className="screen-scroll login-screen">
        <section className="login-member-section" aria-labelledby="member-login-heading">
          <h2 id="member-login-heading">H.Point 통합회원 로그인</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field" htmlFor="login-user-id">
              <span className="sr-only">아이디</span>
              <input
                autoComplete="username"
                id="login-user-id"
                name="userId"
                onChange={(event) => setLoginId(event.target.value)}
                placeholder="아이디"
                value={loginId}
              />
            </label>
            <div className="login-field login-password-field">
              <label className="sr-only" htmlFor="login-password">비밀번호</label>
              <span className="login-password-input">
                <input
                  autoComplete="current-password"
                  id="login-password"
                  name="password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                />
                <button aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'} className="login-password-toggle" onClick={() => setIsPasswordVisible((visible) => !visible)} type="button">
                  <EyeIcon size={20} />
                </button>
              </span>
            </div>
            <div className="login-options">
              <label><input name="rememberId" type="checkbox" />아이디 저장</label>
              <label><input name="autoLogin" type="checkbox" />자동 로그인</label>
            </div>
            <div className="login-submit-wrap">
              <button className="primary-action login-button" disabled={isSubmitting} type="submit">로그인</button>
              <span className="login-recent-badge">최근에 로그인 했어요.</span>
            </div>
          </form>
          <div className="login-link-row">
            <a href="#/apply">셀렉터스 지원하기</a>
            <button type="button">아이디/비밀번호 찾기</button>
          </div>
        </section>

        <section className="login-simple-section" aria-label="간편 로그인" role="group">
          {simpleLoginMethods.map(([method, provider]) => (
            <button key={method} type="button"><LoginProviderIcon className="login-provider-mark" provider={provider} size={18} />{method}</button>
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

      {showErrorModal ? (
        <div aria-modal="true" className="login-error-backdrop" role="dialog" aria-labelledby="login-error-title">
          <div className="login-error-modal">
            <h3 id="login-error-title">로그인 실패</h3>
            <p>{errorMessage}</p>
            <button
              className="primary-action"
              onClick={() => setShowErrorModal(false)}
              type="button"
            >
              확인
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
