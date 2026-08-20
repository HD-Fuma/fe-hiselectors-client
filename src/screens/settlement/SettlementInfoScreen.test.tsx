import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SettlementInfoScreen from './SettlementInfoScreen'

afterEach(() => {
  cleanup()
  window.location.hash = ''
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('SettlementInfoScreen', () => {
  it('switches identifier fields and navigates without persisting or sending input', () => {
    const fetchSpy = vi.fn()
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    vi.stubGlobal('fetch', fetchSpy)
    window.location.hash = '#/settlement/info'

    render(<SettlementInfoScreen />)

    expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe('#/home')
    expect(screen.getAllByRole('radio').map((radio) => radio.parentElement?.textContent)).toEqual([
      '개인',
      '개인사업자',
      '법인사업자',
    ])
    expect(screen.getByRole('textbox', { name: '주민등록번호' })).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: '법인사업자' }))
    expect(screen.queryByRole('textbox', { name: '주민등록번호' })).toBeNull()
    expect(screen.getByRole('textbox', { name: '사업자등록번호' })).toBeTruthy()

    fireEvent.change(screen.getByRole('textbox', { name: '은행명' }), {
      target: { value: '테스트은행' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '계좌번호' }), {
      target: { value: '123-456-789' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '예금주' }), {
      target: { value: '테스트법인' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: '사업자등록번호' }), {
      target: { value: '123-45-67890' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(window.location.hash).toBe('#/settlement')
    expect(storageSpy).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
