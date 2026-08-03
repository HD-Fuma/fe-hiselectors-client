import { useRef, useState, type RefObject } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import useModalFocus from './useModalFocus'

type FocusDialogProps = {
  invokerRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
}

function FocusDialog({ invokerRef, onClose }: FocusDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div aria-label="테스트 모달" ref={containerRef} role="dialog">
      <button type="button">첫 번째</button>
      <button type="button">마지막</button>
    </div>
  )
}

function ModalFocusHarness() {
  const [open, setOpen] = useState(false)
  const invokerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button onClick={() => setOpen(true)} ref={invokerRef} type="button">
        모달 열기
      </button>
      {open ? (
        <FocusDialog invokerRef={invokerRef} onClose={() => setOpen(false)} />
      ) : null}
    </>
  )
}

afterEach(() => {
  cleanup()
})

describe('useModalFocus', () => {
  it('traps focus, closes on Escape, and restores the outside invoker', () => {
    render(<ModalFocusHarness />)

    const invoker = screen.getByRole('button', { name: '모달 열기' })
    fireEvent.click(invoker)

    const first = screen.getByRole('button', { name: '첫 번째' })
    const last = screen.getByRole('button', { name: '마지막' })
    expect(document.activeElement).toBe(first)

    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)

    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    fireEvent.keyDown(first, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '테스트 모달' })).toBeNull()
    expect(document.activeElement).toBe(invoker)
  })
})
