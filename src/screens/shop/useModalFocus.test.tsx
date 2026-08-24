import { useRef, useState, type RefObject } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import useModalFocus from './useModalFocus'

type FocusDialogProps = {
  includeExcludedControls?: boolean
  invokerRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

function FocusDialog({
  includeExcludedControls = false,
  invokerRef,
  onClose,
}: FocusDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div aria-label="테스트 모달" ref={containerRef} role="dialog">
      {includeExcludedControls ? (
        <>
          <a href="#건너뜀" tabIndex={-1}>음수 탭 링크</a>
          <fieldset disabled>
            <button type="button">비활성 필드셋 버튼</button>
          </fieldset>
        </>
      ) : null}
      <button type="button">첫 번째</button>
      <button type="button">마지막</button>
    </div>
  )
}

function ModalFocusHarness({ includeExcludedControls = false }: {
  includeExcludedControls?: boolean
}) {
  const [open, setOpen] = useState(false)
  const invokerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button onClick={() => setOpen(true)} ref={invokerRef} type="button">
        모달 열기
      </button>
      {open ? (
        <FocusDialog
          includeExcludedControls={includeExcludedControls}
          invokerRef={invokerRef}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}

function CallbackIdentityHarness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  const invokerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button onClick={() => setOpen(true)} ref={invokerRef} type="button">
        콜백 모달 열기
      </button>
      {open ? (
        <FocusDialog
          invokerRef={invokerRef}
          onClose={() => {
            onClose()
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

afterEach(() => {
  cleanup()
})

describe('useModalFocus', () => {
  it('traps focus, closes on Escape, and restores the outside invoker', () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')
    render(<ModalFocusHarness />)

    const invoker = screen.getByRole('button', { name: '모달 열기' })
    fireEvent.click(invoker)

    const first = screen.getByRole('button', { name: '첫 번째' })
    const last = screen.getByRole('button', { name: '마지막' })
    expect(document.activeElement).toBe(first)
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)

    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    fireEvent.keyDown(first, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '테스트 모달' })).toBeNull()
    expect(document.activeElement).toBe(invoker)
    focusSpy.mockRestore()
  })

  it('keeps focus when the close callback identity changes and invokes the latest callback', () => {
    const firstClose = vi.fn()
    const latestClose = vi.fn()
    const view = render(<CallbackIdentityHarness onClose={firstClose} />)

    const invoker = screen.getByRole('button', { name: '콜백 모달 열기' })
    fireEvent.click(invoker)

    const last = screen.getByRole('button', { name: '마지막' })
    last.focus()
    expect(document.activeElement).toBe(last)

    view.rerender(<CallbackIdentityHarness onClose={latestClose} />)

    expect(document.activeElement).toBe(last)

    fireEvent.keyDown(last, { key: 'Escape' })

    expect(firstClose).not.toHaveBeenCalled()
    expect(latestClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog', { name: '테스트 모달' })).toBeNull()
    expect(document.activeElement).toBe(invoker)
  })

  it('skips negative-tab and fieldset-disabled controls when setting initial focus', () => {
    render(<ModalFocusHarness includeExcludedControls />)

    fireEvent.click(screen.getByRole('button', { name: '모달 열기' }))

    const negativeTabLink = screen.getByRole('link', { name: '음수 탭 링크' })
    expect(negativeTabLink.tabIndex).toBe(-1)
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '첫 번째' }))
  })
})
