import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../App'

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('apply reference contract', () => {
  it('matches the supplied apply intro copy and four-step flow', () => {
    window.location.hash = '#/apply'
    render(<App />)

    const main = screen.getByRole('main')
    expect(main.textContent).toContain('셀렉터스는 안목있는 선택을 통해 가치를 만들고성과로 연결하는 더현대Hi의 서비스입니다.')

    const expectedSteps = ['상품 큐레이션', '링크 공유', '판매 발생', '수익 창출']
    expectedSteps.forEach((label) => expect(screen.getByText(label)).toBeTruthy())
    expect(screen.getByText('링크 공유').closest('li')?.classList.contains('is-active')).toBe(true)
    expect(screen.queryByText('상품 선택')).toBeNull()
    expect(screen.queryByText('고객 구매')).toBeNull()
    expect(screen.queryByText('수익 정산')).toBeNull()
  })

  it('shows only the exact selector benefit copy', () => {
    window.location.hash = '#/apply'
    render(<App />)

    expect(screen.getByRole('heading', { name: '더현대 Hi 셀렉터스에게만 제공되는 전용 혜택' })).toBeTruthy()
    ;['최대 10%', '수수료 정산', '셀렉터스 전용', '쿠폰 증정', '우수 셀렉터스', '전용 혜택'].forEach((copy) => {
      expect(screen.getByText(copy)).toBeTruthy()
    })
    expect(screen.queryByText('현대백화점 상품을', { exact: false })).toBeNull()
    expect(screen.queryByText('좋아하는 상품으로', { exact: false })).toBeNull()
    expect(screen.queryByText('공유한 상품 판매 시', { exact: false })).toBeNull()
  })

  it('provides an accessible representative SNS OAuth selector', () => {
    window.location.hash = '#/apply/form'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스 신청하기' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '나의 대표 SNS' })).toBeTruthy()
    expect(screen.getByText('본인 소유의 공개된 대표 SNS를 연결해주세요.')).toBeTruthy()

    const trigger = screen.getByRole('button', { name: '대표 SNS 선택' })
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox')
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(trigger.getAttribute('aria-controls')).toBe('representative-sns-options')
    expect(screen.queryByRole('listbox', { name: '대표 SNS' })).toBeNull()

    const oauthButton = screen.getByRole('button', { name: 'SNS 계정 연결하기' })
    expect(oauthButton).toHaveProperty('disabled', true)
    expect(oauthButton.getAttribute('type')).toBe('button')
    const hashBeforeConnect = window.location.hash
    fireEvent.click(oauthButton)
    expect(window.location.hash).toBe(hashBeforeConnect)

    fireEvent.keyDown(trigger, { key: 'ArrowDown' })
    const listbox = screen.getByRole('listbox', { name: '대표 SNS' })
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(listbox.getAttribute('id')).toBe('representative-sns-options')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['인스타그램', '페이스북', '유튜브'])
    expect(screen.getAllByRole('option').every((option) => option.hasAttribute('aria-selected'))).toBe(true)
    expect(document.activeElement).toBe(screen.getByRole('option', { name: '인스타그램' }))

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(screen.getByRole('option', { name: '유튜브' }))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(screen.getByRole('option', { name: '인스타그램' }))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' })
    expect(trigger.textContent).toContain('인스타그램')
    expect(document.activeElement).toBe(trigger)
    expect(screen.queryByRole('listbox', { name: '대표 SNS' })).toBeNull()
    const instagramOAuthButton = screen.getByRole('button', { name: 'Instagram 계정 연결하기' })
    expect(instagramOAuthButton).toHaveProperty('disabled', false)
    fireEvent.click(instagramOAuthButton)
    expect(window.location.hash).toBe(hashBeforeConnect)

    fireEvent.keyDown(trigger, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(screen.getByRole('option', { name: '유튜브' }))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })
    expect(screen.queryByRole('listbox', { name: '대표 SNS' })).toBeNull()
    expect(document.activeElement).toBe(trigger)

    fireEvent.keyDown(trigger, { key: 'Enter' })
    expect(document.activeElement).toBe(screen.getByRole('option', { name: '인스타그램' }))
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' })

    fireEvent.keyDown(trigger, { key: ' ' })
    fireEvent.click(screen.getByRole('option', { name: '페이스북' }))
    expect(trigger.textContent).toContain('페이스북')
    expect(screen.getByRole('button', { name: 'Facebook 계정 연결하기' })).toHaveProperty('disabled', false)

    fireEvent.click(trigger)
    expect(document.activeElement).toBe(screen.getByRole('option', { name: '페이스북' }))
    expect(screen.getByRole('option', { name: '페이스북' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.click(screen.getByRole('option', { name: '유튜브' }))
    expect(screen.getByRole('button', { name: 'YouTube 계정 연결하기' })).toHaveProperty('disabled', false)
    expect(screen.queryByPlaceholderText(/URL|handle|account/i)).toBeNull()
    expect(screen.queryByText('SNS 채널', { exact: true })).toBeNull()

    expect(screen.getByRole('heading', { name: '서비스 신청을 위한 필수 개인정보 수집/이용 안내' })).toBeTruthy()
    ;[
      '① 수집 목적: 셀렉터스 접수 처리',
      '② 수집 항목 : SNS 계정 연결 정보',
      '③ 보유 및 이용기간: 셀렉터스 신청 철회 시 또는 서비스 종료 시까지',
      '필수적 개인정보 수집/이용을 거부하실 권리가 있으나, 거부 시 셀렉터스 신청이 불가합니다.',
    ].forEach((copy) => expect(screen.getByText(copy)).toBeTruthy())
  })

  it('dismisses the representative SNS listbox when focus or a pointer leaves the picker', () => {
    window.location.hash = '#/apply/form'
    render(<App />)

    const trigger = screen.getByRole('button', { name: '대표 SNS 선택' })
    const outsideTarget = screen.getAllByRole('checkbox')[0]

    fireEvent.click(trigger)
    expect(screen.getByRole('listbox', { name: '대표 SNS' })).toBeTruthy()
    outsideTarget.focus()
    fireEvent.focusIn(outsideTarget)
    expect(screen.queryByRole('listbox', { name: '대표 SNS' })).toBeNull()
    expect(document.activeElement).toBe(outsideTarget)

    fireEvent.click(trigger)
    expect(screen.getByRole('listbox', { name: '대표 SNS' })).toBeTruthy()
    fireEvent.pointerDown(document.body)
    expect(screen.queryByRole('listbox', { name: '대표 SNS' })).toBeNull()
    expect(document.activeElement).not.toBe(trigger)
  })

  it('shows only the three supplied agreement rows and disabled CTA', () => {
    window.location.hash = '#/apply/form'
    const { container } = render(<App />)

    expect(screen.getByRole('heading', { name: '셀렉터스 이용 약관 동의' })).toBeTruthy()
    expect(screen.queryByText('전체 동의')).toBeNull()

    const terms = container.querySelector('.terms-section')
    expect(terms).not.toBeNull()
    const termQueries = within(terms as HTMLElement)
    expect(termQueries.getByText('현대백화점 이용약관 (필수)')).toBeTruthy()
    expect(termQueries.getByText('한무쇼핑 이용약관 (필수)')).toBeTruthy()
    expect(termQueries.getByText('카카오 알림톡 수신 동의 (선택)')).toBeTruthy()
    expect(termQueries.getAllByRole('checkbox')).toHaveLength(3)

    expect(screen.getByRole('button', { name: '셀렉터스 신청하기' })).toHaveProperty('disabled', true)
  })
})
