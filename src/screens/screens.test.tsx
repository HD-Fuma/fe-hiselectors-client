import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import App from '../App'
import { screenRegistry } from '../screenRegistry'

const screenExpectations = [
  {
    path: '#/screens',
    heading: '셀렉터스 클라이언트 화면',
    content: '신청 인트로',
  },
  {
    path: '#/login',
    heading: '로그인',
    content: 'H.Point 통합회원 로그인',
  },
  {
    path: '#/apply',
    heading: '셀렉터스 신청하기',
    content: '당신의 감각을 보여주세요!',
  },
  {
    path: '#/apply/form',
    heading: '셀렉터스 신청하기',
    content: '카카오 알림톡 수신 동의 (선택)',
  },
  {
    path: '#/campaigns',
    heading: '캠페인',
    content: '진행 중',
  },
  {
    path: '#/campaigns/detail',
    heading: '시즌 픽 캠페인',
    content: '캠페인 상품',
  },
  {
    path: '#/shop/groups',
    heading: '상품 그룹',
    content: '생성 순서대로 셀렉터스샵에 노출됩니다.',
  },
  {
    path: '#/shop/groups/edit',
    heading: '상품 그룹 만들기',
    content: '캠페인 상품 선택',
  },
  {
    path: '#/shop/RC000004900T',
    heading: '셀렉터스샵',
    content: '오셀렉터스',
  },
  {
    path: '#/performance',
    heading: '성과 요약',
    content: '누적 클릭 수',
  },
  {
    path: '#/performance/products',
    heading: '상품별 성과',
    content: '구매 전환 수',
  },
  {
    path: '#/settlement',
    heading: '정산 내역',
    content: 'Toss Payments',
  },
] as const

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('Selectors client screen catalog', () => {
  it.each(screenExpectations)(
    'renders the unique heading and representative content for $path',
    ({ path, heading, content }) => {
      window.location.hash = path

      render(<App />)

      expect(
        screen.getByRole('heading', { level: 1, name: heading }),
      ).toBeTruthy()
      expect(
        screen.getAllByText(content, { exact: false }).length,
      ).toBeGreaterThan(0)
    },
  )

  it('links the catalog to every other registered screen', () => {
    window.location.hash = '#/screens'

    render(<App />)

    const catalog = screen.getByRole('main')
    const links = within(catalog).getAllByRole('link')
    const expectedPaths = screenRegistry
      .filter(({ id }) => id !== 'catalog')
      .map(({ path }) => path)

    expect(links).toHaveLength(expectedPaths.length)
    expect(links.map((link) => link.getAttribute('href'))).toEqual(expectedPaths)
  })
})
