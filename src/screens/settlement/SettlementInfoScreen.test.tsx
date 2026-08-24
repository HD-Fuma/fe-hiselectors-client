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
  it('saves a corporate account with its settlement type and business number', async () => {
    const fetchSpy = mockAccountFetch()
    window.history.replaceState({}, '', '/settlement/info')

    render(<SettlementInfoScreen />)

    await waitFor(() => expect(screen.getByRole('radio', { name: '개인' })).toHaveProperty('disabled', false))
    expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe('/home')
    expect(screen.getAllByRole('radio').map((radio) => radio.parentElement?.textContent)).toEqual([
      '개인',
      '개인사업자',
      '법인사업자',
    ])
    expect(screen.getByText('정산 유형을 선택하면 식별번호 입력란이 표시됩니다.')).toBeTruthy()
    expect(screen.queryByRole('textbox', { name: '주민등록번호' })).toBeNull()

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
      settlementType: 'CORPORATION',
      businessNumber: '123-45-67890',
    })
  })

  it('saves a personal account with its resident registration number', async () => {
    const fetchSpy = mockAccountFetch()

    render(<SettlementInfoScreen />)
    await waitFor(() => expect(screen.getByRole('radio', { name: '개인' })).toHaveProperty('disabled', false))
    fireEvent.click(screen.getByRole('radio', { name: '개인' }))

    fillAccountFields()
    fireEvent.change(screen.getByRole('textbox', { name: '주민등록번호' }), {
      target: { value: '900101-1234567' },
    })
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    await waitFor(() => expect(window.location.pathname).toBe('/settlement'))
    const putCall = fetchSpy.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(String(putCall?.[1]?.body))).toEqual({
      bankName: '테스트은행',
      accountNumber: '123-456-789',
      accountHolder: '테스트법인',
      settlementType: 'INDIVIDUAL',
      businessNumber: '900101-1234567',
    })
  })

  it('prefills registered account information and locks its type while editing', async () => {
    const fetchSpy = mockAccountFetch({
      get: {
        bankName: '국민은행',
        accountNumber: '123-456',
        accountHolder: '홍길동',
        settlementType: 'SOLE_PROPRIETOR',
        businessNumber: '123-45-67890',
      },
    })

    render(<SettlementInfoScreen />)

    expect(await screen.findByDisplayValue('국민은행')).toBeTruthy()
    expect(screen.getByDisplayValue('123-456')).toBeTruthy()
    expect(screen.getByDisplayValue('홍길동')).toBeTruthy()
    expect(screen.getByDisplayValue('123-45-67890')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: '정산 정보 수정' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe('/mypage/member')
    expect(screen.getByText('정산 유형은 최초 등록 후 변경할 수 없습니다.')).toBeTruthy()

    const radios = screen.getAllByRole('radio') as HTMLInputElement[]
    expect(radios.every((radio) => radio.disabled)).toBe(true)
    expect(screen.getByRole('radio', { name: '개인사업자' })).toHaveProperty('checked', true)
    expect(screen.getByRole('textbox', { name: '사업자등록번호' })).toHaveProperty('disabled', false)
    fireEvent.change(screen.getByRole('textbox', { name: '사업자등록번호' }), {
      target: { value: '987-65-43210' },
    })

    fireEvent.click(screen.getByRole('button', { name: '수정하기' }))
    await waitFor(() => expect(window.location.pathname).toBe('/mypage/member'))

    const putCall = fetchSpy.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(String(putCall?.[1]?.body))).toMatchObject({
      settlementType: 'SOLE_PROPRIETOR',
      businessNumber: '987-65-43210',
    })
  })

  it('shows a masked resident registration number without sending it during editing', async () => {
    const fetchSpy = mockAccountFetch({
      get: {
        bankName: '국민은행',
        accountNumber: '123-456',
        accountHolder: '홍길동',
        settlementType: 'INDIVIDUAL',
        businessNumber: '******-*******',
      },
      put: {
        bankName: '국민은행',
        accountNumber: '123-456',
        accountHolder: '홍길동',
        settlementType: 'INDIVIDUAL',
        businessNumber: '******-*******',
      },
    })

    render(<SettlementInfoScreen />)

    const identifier = await screen.findByRole('textbox', { name: '주민등록번호' })
    expect(identifier).toHaveProperty('value', '******-*******')
    expect(identifier).toHaveProperty('disabled', true)
    expect(screen.getByText('주민등록번호는 최초 등록 후 변경할 수 없습니다.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '수정하기' }))
    await waitFor(() => expect(window.location.pathname).toBe('/mypage/member'))

    const putCall = fetchSpy.mock.calls.find(([, init]) => init?.method === 'PUT')
    const payload = JSON.parse(String(putCall?.[1]?.body))
    expect(payload).toMatchObject({ settlementType: 'INDIVIDUAL' })
    expect(payload).not.toHaveProperty('businessNumber')
    expect(payload).not.toHaveProperty('residentRegistrationNumber')
  })

  it('keeps the type selectable for a legacy account response without settlement type', async () => {
    mockAccountFetch({
      get: { bankName: '국민은행', accountNumber: '123-456', accountHolder: '홍길동' },
    })

    render(<SettlementInfoScreen />)

    expect(await screen.findByText('정산 유형을 다시 확인한 후 저장해 주세요.')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1, name: '정산 정보 수정' })).toBeTruthy()
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).disabled)).toBe(true)
    expect(screen.getAllByRole('radio').every((radio) => !(radio as HTMLInputElement).checked)).toBe(true)
    expect(screen.queryByRole('textbox', { name: '주민등록번호' })).toBeNull()
    expect(screen.queryByRole('textbox', { name: '사업자등록번호' })).toBeNull()
  })

  it('requires an explicit settlement type selection before saving', async () => {
    const fetchSpy = mockAccountFetch()

    render(<SettlementInfoScreen />)
    await waitFor(() => expect(screen.getByRole('radio', { name: '개인' })).toHaveProperty('disabled', false))
    fillAccountFields()
    fireEvent.click(screen.getByRole('button', { name: '저장하기' }))

    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      expect.stringContaining('정산 유형을 선택해 주세요.'),
    )
    expect(fetchSpy.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(false)
  })

  it('keeps the form open when saving the account fails', async () => {
    mockAccountFetch({
      put: json({ message: '계좌 정보가 올바르지 않습니다.' }, 400),
    })

    render(<SettlementInfoScreen />)
    await screen.findByRole('textbox', { name: '은행명' })

    fireEvent.click(screen.getByRole('radio', { name: '개인' }))
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
