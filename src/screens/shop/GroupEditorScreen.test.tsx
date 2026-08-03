import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '../../App'
import BottomAction from '../../components/BottomAction'
import GroupProductPicker from '../../shop/GroupProductPicker'
import { useShopDemo } from '../../shop/ShopDemoContext'

const earringNames = [
  '에센스 실버(W) 모이사나이트 쁘띠 원터치 귀걸이 HL4E54406W9XXX',
  '[이에르로르] 수브니 플로우 실버(W) 원터치 귀걸이 S HL6E64607W9XXX',
] as const

function EditorStateProbe() {
  const { state } = useShopDemo()

  return (
    <output aria-label="테스트 그룹 상태">
      {JSON.stringify({ count: state.groups.length, status: state.status })}
    </output>
  )
}

function GroupSaveProbe() {
  const { deleteGroup, setQuickAddDraft, state } = useShopDemo()
  const createdGroup = state.groups.find(({ id }) => id === 'demo-14')

  return (
    <>
      <button
        onClick={() => setQuickAddDraft({
          campaignId: 'season-pick',
          productIds: ['knit-blue'],
        })}
        type="button"
      >
        테스트 드래프트 설정
      </button>
      <button onClick={() => deleteGroup('1')} type="button">테스트 그룹 삭제</button>
      <output aria-label="생성한 그룹">{JSON.stringify(createdGroup ?? null)}</output>
      <output aria-label="편집한 그룹">
        {JSON.stringify(state.groups.find(({ id }) => id === '1') ?? null)}
      </output>
      <output aria-label="빠른 추가 드래프트">
        {JSON.stringify(state.quickAddDraft)}
      </output>
    </>
  )
}

function RuntimeDisabledAction({
  disabled,
  onActivate,
}: {
  disabled: boolean
  onActivate: (tagName: string) => void
}) {
  return (
    <BottomAction
      disabled={disabled}
      href="#/shop/groups"
      label="동적 액션"
      onClick={(event) => {
        event.preventDefault()
        onActivate(event.currentTarget.tagName)
      }}
    />
  )
}

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

describe('group editor', () => {
  it('supports runtime disabled href actions', () => {
    const onActivate = vi.fn()
    const { rerender } = render(
      <RuntimeDisabledAction disabled={false} onActivate={onActivate} />,
    )

    const link = screen.getByRole('link', { name: '동적 액션' })
    expect(link.getAttribute('href')).toBe('#/shop/groups')
    fireEvent.click(link)
    expect(onActivate).toHaveBeenLastCalledWith('A')

    rerender(<RuntimeDisabledAction disabled onActivate={onActivate} />)

    const button = screen.getByRole('button', { name: '동적 액션' }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(onActivate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('link', { name: '동적 액션' })).toBeNull()
  })

  it('initializes all editor modes', () => {
    const cases = [
      {
        path: '#/shop/groups/new',
        mode: 'create',
        groupId: '',
        initialCampaign: '',
        title: '상품 그룹 만들기',
        name: '',
        campaignId: '',
        selectedCount: 0,
        backHref: '#/shop/groups',
        saveDisabled: true,
      },
      {
        path: '#/shop/groups/1/edit',
        mode: 'edit',
        groupId: '1',
        initialCampaign: '',
        title: '상품 그룹 편집',
        name: '귀걸이',
        campaignId: 'jewelry-focus',
        selectedCount: 2,
        backHref: '#/shop/RC000003200T/1',
        saveDisabled: false,
      },
      {
        path: '#/shop/groups/new/season-pick',
        mode: 'campaign-create',
        groupId: '',
        initialCampaign: 'season-pick',
        title: '상품 그룹 만들기',
        name: '',
        campaignId: 'season-pick',
        selectedCount: 0,
        backHref: '#/campaigns/detail',
        saveDisabled: true,
      },
    ] as const

    for (const editorCase of cases) {
      window.location.hash = editorCase.path
      const { container, unmount } = render(<App />)

      const editor = container.querySelector<HTMLElement>('[data-editor-mode]')
      expect(editor?.dataset.editorMode).toBe(editorCase.mode)
      expect(editor?.dataset.groupId).toBe(editorCase.groupId)
      expect(editor?.dataset.initialCampaign).toBe(editorCase.initialCampaign)
      expect(screen.getByRole('heading', { level: 1, name: editorCase.title })).toBeTruthy()

      const name = screen.getByRole('textbox', { name: '상품 그룹 이름' }) as HTMLInputElement
      expect(name.value).toBe(editorCase.name)

      const campaign = screen.getByRole('combobox', { name: '캠페인 선택' }) as HTMLSelectElement
      expect(campaign.value).toBe(editorCase.campaignId)
      expect(screen.getByText(`${editorCase.selectedCount}개 선택`)).toBeTruthy()

      const save = screen.getByRole('button', { name: '상품 그룹 저장하기' }) as HTMLButtonElement
      expect(save.disabled).toBe(editorCase.saveDisabled)
      expect(screen.getByRole('link', { name: '뒤로 가기' }).getAttribute('href')).toBe(
        editorCase.backHref,
      )

      if (editorCase.mode === 'edit') {
        const checked = screen.getAllByRole('checkbox').filter((checkbox) => (
          (checkbox as HTMLInputElement).checked
        ))
        expect(checked).toHaveLength(2)
        expect(earringNames.map((productName) => (
          (screen.getByRole('checkbox', { name: productName }) as HTMLInputElement).checked
        ))).toEqual([true, true])
      }

      unmount()
    }
  })

  it('preserves off-filter selection', () => {
    const knitName = '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)'
    const earringName = earringNames[0]
    window.location.hash = '#/shop/groups/new'
    const { unmount } = render(<App />)

    fireEvent.click(screen.getByRole('checkbox', { name: knitName }))
    fireEvent.click(screen.getByRole('checkbox', { name: earringName }))
    expect(screen.getByText('2개 선택')).toBeTruthy()

    const campaign = screen.getByRole('combobox', { name: '캠페인 선택' })
    fireEvent.change(campaign, { target: { value: 'fragrance-note' } })

    expect(screen.getByText('2개 선택')).toBeTruthy()
    expect(screen.queryByRole('checkbox', { name: knitName })).toBeNull()
    expect(screen.queryByRole('checkbox', { name: earringName })).toBeNull()

    fireEvent.change(campaign, { target: { value: '' } })

    expect((screen.getByRole('checkbox', { name: knitName }) as HTMLInputElement).checked).toBe(true)
    expect((screen.getByRole('checkbox', { name: earringName }) as HTMLInputElement).checked).toBe(true)

    unmount()
    render(
      <GroupProductPicker
        onSelectedProductIdsChange={() => undefined}
        products={[]}
        selectedProductIds={[]}
      />,
    )
    expect(screen.getByText('이 캠페인에서 선택할 수 있는 상품이 없습니다.')).toBeTruthy()
  })

  it('requires valid name and one product', () => {
    window.location.hash = '#/shop/groups/new'
    render(<App shopProbe={<EditorStateProbe />} />)

    const input = screen.getByRole('textbox', { name: '상품 그룹 이름' }) as HTMLInputElement
    const save = screen.getByRole('button', { name: '상품 그룹 저장하기' }) as HTMLButtonElement
    const initialState = screen.getByRole('status', { name: '테스트 그룹 상태' }).textContent
    expect(input.maxLength).toBe(30)
    const initialCount = screen.getByText('0 / 30')
    expect(initialCount.id).toBe('group-name-count')
    expect(input.getAttribute('aria-describedby')).toBe('group-name-count')

    fireEvent.change(input, { target: { value: '   ' } })

    const nameAlert = screen.getByRole('alert')
    expect(nameAlert.textContent).toBe('상품 그룹 이름을 입력해 주세요.')
    expect(nameAlert.id).toBe('group-name-error')
    expect(input.getAttribute('aria-describedby')).toBe('group-name-count group-name-error')
    expect(save.disabled).toBe(true)

    fireEvent.change(input, { target: { value: '새 그룹' } })

    expect(screen.getByRole('alert').textContent).toBe('상품을 1개 이상 선택해 주세요.')
    expect(input.getAttribute('aria-describedby')).toBe('group-name-count')
    fireEvent.click(save)
    expect(window.location.hash).toBe('#/shop/groups/new')
    expect(screen.getByRole('status', { name: '테스트 그룹 상태' }).textContent).toBe(
      initialState,
    )
  })

  it('creates a trimmed group', async () => {
    const productName = '[더현대Hi 단독] Cale ribbed half sleeve KN (Ivory)'
    window.location.hash = '#/shop/groups/new'
    render(<App shopProbe={<GroupSaveProbe />} />)

    fireEvent.click(screen.getByRole('button', { name: '테스트 드래프트 설정' }))
    expect(screen.getByRole('status', { name: '빠른 추가 드래프트' }).textContent).not.toBe('null')
    fireEvent.change(screen.getByRole('textbox', { name: '상품 그룹 이름' }), {
      target: { value: ' 새 그룹 ' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: productName }))
    fireEvent.click(screen.getByRole('button', { name: '상품 그룹 저장하기' }))

    await waitFor(() => expect(window.location.hash).toBe('#/shop/RC000003200T'))
    expect(JSON.parse(
      screen.getByRole('status', { name: '생성한 그룹' }).textContent ?? 'null',
    )).toEqual({
      id: 'demo-14',
      name: '새 그룹',
      createdAt: '2026.08.04',
      campaignId: null,
      productIds: ['knit-ivory'],
    })
    expect(screen.getByRole('status', { name: '빠른 추가 드래프트' }).textContent).toBe('null')
    expect(screen.getByText('상품 그룹을 만들었어요.').getAttribute('role')).toBe('status')
  })

  it('updates an existing group', async () => {
    const knitName = '[더현대Hi 단독] Cale ribbed half sleeve KN (Soft blue)'
    window.location.hash = '#/shop/groups/1/edit'
    render(<App shopProbe={<GroupSaveProbe />} />)

    fireEvent.click(screen.getByRole('button', { name: '테스트 드래프트 설정' }))
    fireEvent.change(screen.getByRole('textbox', { name: '상품 그룹 이름' }), {
      target: { value: ' 시즌 스타일 ' },
    })
    for (const earringName of earringNames) {
      fireEvent.click(screen.getByRole('checkbox', { name: earringName }))
    }
    fireEvent.change(screen.getByRole('combobox', { name: '캠페인 선택' }), {
      target: { value: 'season-pick' },
    })
    fireEvent.click(screen.getByRole('checkbox', { name: knitName }))
    fireEvent.click(screen.getByRole('button', { name: '상품 그룹 저장하기' }))

    await waitFor(() => expect(window.location.hash).toBe('#/shop/RC000003200T/1'))
    expect(JSON.parse(
      screen.getByRole('status', { name: '편집한 그룹' }).textContent ?? 'null',
    )).toEqual({
      id: '1',
      name: '시즌 스타일',
      createdAt: '2026.08.04',
      campaignId: 'season-pick',
      productIds: ['knit-blue'],
    })
    const group = screen.getByRole('region', { name: '시즌 스타일' })
    expect(within(group).getByRole('heading', { level: 2, name: '시즌 스타일' })).toBeTruthy()
    expect(within(group).getAllByRole('article')).toHaveLength(1)
    expect(within(group).getByText(knitName)).toBeTruthy()
    expect(screen.getByRole('status', { name: '빠른 추가 드래프트' }).textContent).toBe('null')
    expect(screen.getByText('상품 그룹을 수정했어요.').getAttribute('role')).toBe('status')
  })

  it('Back clears draft and follows each mode destination', async () => {
    const cases = [
      ['#/shop/groups/new', '#/shop/groups'],
      ['#/shop/groups/1/edit', '#/shop/RC000003200T/1'],
      ['#/shop/groups/new/season-pick', '#/campaigns/detail'],
    ] as const

    for (const [path, destination] of cases) {
      window.location.hash = path
      const { unmount } = render(<App shopProbe={<GroupSaveProbe />} />)
      fireEvent.click(screen.getByRole('button', { name: '테스트 드래프트 설정' }))
      expect(screen.getByRole('status', { name: '빠른 추가 드래프트' }).textContent).not.toBe('null')

      fireEvent.click(screen.getByRole('link', { name: '뒤로 가기' }))

      await waitFor(() => expect(window.location.hash).toBe(destination))
      expect(screen.getByRole('status', { name: '빠른 추가 드래프트' }).textContent).toBe('null')
      unmount()
    }

    window.location.hash = '#/shop/groups/1/edit'
    const { container } = render(<App shopProbe={<GroupSaveProbe />} />)
    fireEvent.click(screen.getByRole('button', { name: '테스트 그룹 삭제' }))

    expect(screen.getByRole('heading', { level: 1, name: '상품 그룹 편집' })).toBeTruthy()
    expect(screen.getByText('상품 그룹을 찾을 수 없습니다.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: '셀렉터스샵으로 돌아가기' }).getAttribute('href'),
    ).toBe('#/shop/RC000003200T')
    expect(container.querySelector('.group-editor-screen')).toBeNull()
    expect(container.querySelector('#group-name')).toBeNull()
    expect(container.querySelector('.picker-list')).toBeNull()
  })
})
