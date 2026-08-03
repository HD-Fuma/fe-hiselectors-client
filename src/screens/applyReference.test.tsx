import { cleanup, render, screen, within } from '@testing-library/react'
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

  it('matches the supplied representative SNS form contract', () => {
    window.location.hash = '#/apply/form'
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '셀렉터스 신청하기' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: '나의 대표 SNS' })).toBeTruthy()
    expect(screen.getByText('본인 소유의 공개된 대표 SNS를 입력해주세요.')).toBeTruthy()
    expect(screen.getByRole('option', { name: '대표 SNS 선택' })).toBeTruthy()
    expect(screen.getByPlaceholderText('URL 주소 입력')).toBeTruthy()
    expect(screen.queryByText('SNS 채널', { exact: true })).toBeNull()

    expect(screen.getByRole('heading', { name: '서비스 신청을 위한 필수 개인정보 수집/이용 안내' })).toBeTruthy()
    ;[
      '① 수집 목적: 셀렉터스 접수 처리',
      '② 수집 항목 : SNS URL 주소',
      '③ 보유 및 이용기간: 셀렉터스 신청 철회 시 또는 서비스 종료 시까지',
      '필수적 개인정보 수집/이용을 거부하실 권리가 있으나, 거부 시 셀렉터스 신청이 불가합니다.',
    ].forEach((copy) => expect(screen.getByText(copy)).toBeTruthy())
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
