import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SettlementInfoScreen from './SettlementInfoScreen'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function requestUrl(input: RequestInfo | URL): string {
  return typeof input === 'string' ? input : input.toString()
}

function notRegistered() {
  return json({ code: 'RESOURCE_NOT_FOUND', message: '리소스를 찾을 수 없습니다.' }, 404)
}

function mockAccountFetch(options?: {
  get?: unknown | Response
  put?: unknown | Response
}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((_input, init) => {
    if ((init?.method ?? 'GET').toUpperCase() === 'PUT') {
      const put = options?.put ?? { bankName: '테스트은행', accountNumber: '123-456-789', accountHolder: '테스트법인' }
      return Promise.resolve(put instanceof Response ? put : json({ data: put }))
    }

    const get = options?.get ?? notRegistered()
    return Promise.resolve(get instanceof Response ? get : json({ data: get }))
  })
}

function fillAccountFields() {
  fireEvent.change(screen.getByRole('textbox', { name: '은행명' }), {
    target: { value: '테스트은행' },
  })
  fireEvent.change(screen.getByRole('textbox', { name: '계좌번호' }), {
    target: { value: '123-456-789' },
  })
  fireEvent.change(screen.getByRole('textbox', { name: '예금주' }), {
    target: { value: '테스트법인' },
  })
}

afterEach(() => {
  cleanup()
  window.history.replaceState({}, '', '/')
  vi.restoreAllMocks()
})

describe('SettlementInfoScreen', () => {
  it('switches identifier fields without sending them to the account API', async () => {
    const fetchSpy = mockAccountFetch()
    window.history.replaceState({}, '', '/settlement/info')

    render(<SettlementInfoScreen />)

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
    expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe('/home')
    expect(screen.getAllByRole('radio').map((radio) => radio.parentElement?.textContent)).toEqual([
      '개인',
      '개인사업자',
      '법인사업자',
    ])
    expect(screen.getByRole('textbox', { name: '주민등록번호' })).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: '법인사업자' }))
    expect(screen.queryByRole('textbox', { name: '주민등록번호' })).toBeNull()
    expect(screen.getByRole('textbox', { name: '사업자등록번호' })).toBeTruthy()

    fillAccountFields()
    fireEvent.change(screen.getByRole('textbox', { name: '사업자등록번호' }), {
      target: { value: '123-45-67890' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => expect(window.location.pathname).toBe('/settlement'))

    const putCall = fetchSpy.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(requestUrl(putCall?.[0] as RequestInfo | URL)).toContain('/api/settlements/account')
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual({
      bankName: '테스트은행',
      accountNumber: '123-456-789',
      accountHolder: '테스트법인',
    })
  })

  it('prefills registered account information for editing', async () => {
    mockAccountFetch({
      get: { bankName: '국민은행', accountNumber: '123-456', accountHolder: '홍길동' },
    })

    render(<SettlementInfoScreen />)

    expect(await screen.findByDisplayValue('국민은행')).toBeTruthy()
    expect(screen.getByDisplayValue('123-456')).toBeTruthy()
    expect(screen.getByDisplayValue('홍길동')).toBeTruthy()
  })

  it('keeps the form open when saving the account fails', async () => {
    mockAccountFetch({
      put: json({ message: '계좌 정보가 올바르지 않습니다.' }, 400),
    })

    render(<SettlementInfoScreen />)
    await screen.findByRole('textbox', { name: '은행명' })

    fillAccountFields()
    fireEvent.change(screen.getByRole('textbox', { name: '주민등록번호' }), {
      target: { value: '900101-1234567' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('계좌 정보가 올바르지 않습니다.'),
    )
    expect(window.location.hash).toBe('')
  })

  it('sends unauthorized retries to the login screen', async () => {
    mockAccountFetch({
      get: json({ message: 'Unauthorized' }, 401),
    })

    render(<SettlementInfoScreen />)
    fireEvent.click(await screen.findByRole('button', { name: '로그인하기' }))

    expect(window.location.pathname).toBe('/login')
  })
})
