import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SettlementEntryScreen from './SettlementEntryScreen'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  window.location.hash = ''
  vi.restoreAllMocks()
})

describe('SettlementEntryScreen', () => {
  it('opens settlement history when account information is registered', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({
      bankName: '국민은행', accountNumber: '123-456', accountHolder: '홍길동',
    }))

    render(<SettlementEntryScreen />)

    await waitFor(() => expect(window.location.hash).toBe('#/settlement'))
  })

  it('opens the information form when account information is not registered', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({
      code: 'RESOURCE_NOT_FOUND', message: '리소스를 찾을 수 없습니다.',
    }, 404))

    render(<SettlementEntryScreen />)

    await waitFor(() => expect(window.location.hash).toBe('#/settlement/info'))
  })

  it('opens the information form when the selectors account has not been created yet', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({
      code: 'SELECTORS_NOT_FOUND', message: '셀렉터스를 찾을 수 없습니다.',
    }, 404))

    render(<SettlementEntryScreen />)

    await waitFor(() => expect(window.location.hash).toBe('#/settlement/info'))
  })

  it('sends unauthorized retries to the login screen', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(json({ message: 'Unauthorized' }, 401))

    render(<SettlementEntryScreen />)

    fireEvent.click(await screen.findByRole('button', { name: '로그인하기' }))

    expect(window.location.hash).toBe('#/login')
  })
})
