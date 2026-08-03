import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../App'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('The Hyundai login reference contract', () => {
  it('renders the complete H.Point member login form with native controls', () => {
    window.location.hash = '#/login'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '로그인' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'H.Point 통합회원 로그인' })).toBeTruthy()

    const userId = screen.getByLabelText('아이디')
    const password = screen.getByLabelText('비밀번호')
    expect(userId.getAttribute('placeholder')).toBe('아이디를 입력해 주세요')
    expect(password.getAttribute('placeholder')).toBe('비밀번호를 입력해 주세요')
    expect(password.getAttribute('type')).toBe('password')

    const reveal = screen.getByRole('button', { name: '비밀번호 보기' })
    expect(reveal.getAttribute('type')).toBe('button')
    fireEvent.click(reveal)
    expect(password.getAttribute('type')).toBe('text')
    expect(screen.getByRole('button', { name: '비밀번호 숨기기' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '비밀번호 숨기기' }))
    expect(password.getAttribute('type')).toBe('password')

    const rememberedId = screen.getByRole('checkbox', { name: '아이디 저장' })
    const autoLogin = screen.getByRole('checkbox', { name: '자동 로그인' })
    expect(rememberedId.tagName).toBe('INPUT')
    expect(autoLogin.tagName).toBe('INPUT')
    expect(screen.getByText('최근에 로그인 했어요.')).toBeTruthy()
  })

  it('keeps every login action inert while exposing the required alternatives in order', () => {
    window.location.hash = '#/login'
    render(<App />)

    const expectedMethods = [
      '휴대폰 인증 로그인',
      '네이버 로그인',
      '카카오 로그인',
      '토스 로그인',
      'QR 코드 로그인',
      'H.Point APP 로그인',
    ]
    const methods = within(screen.getByRole('group', { name: '간편 로그인' })).getAllByRole('button')
    expect(methods.map((method) => method.textContent)).toEqual(expectedMethods)
    expect(methods).toHaveLength(6)

    expect(screen.getByRole('heading', { name: 'BIZ회원 로그인' })).toBeTruthy()
    expect(screen.getByText('BIZ회원으로 가입하시는 경우 BIZ회원 로그인 화면에서 로그인 해주세요.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'BIZ회원 로그인 페이지로' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '통합회원 전환' })).toBeTruthy()
    expect(screen.getByText('기존 더현대닷컴 회원이라면 H.Point 통합회원으로 전환해 주세요.')).toBeTruthy()
    expect(screen.getByRole('button', { name: '통합회원 전환하기' })).toBeTruthy()

    const actions = screen.getAllByRole('button').concat(screen.getByRole('button', { name: '로그인' }))
    const uniqueActions = [...new Set(actions)]
    uniqueActions.forEach((action) => expect(action.getAttribute('type')).toBe(action.textContent === '로그인' ? 'submit' : 'button'))

    const hashBeforeAction = window.location.hash
    uniqueActions.forEach((action) => fireEvent.click(action))
    expect(window.location.hash).toBe(hashBeforeAction)
  })
})
