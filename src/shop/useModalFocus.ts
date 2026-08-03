import { useEffect, type RefObject } from 'react'

type UseModalFocusOptions = {
  containerRef: RefObject<HTMLElement | null>
  invokerRef: RefObject<HTMLElement | null>
  onClose: () => void
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableControls(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(focusableSelector)]
    .filter((control) => (
      !control.hasAttribute('hidden')
      && control.getAttribute('aria-disabled') !== 'true'
    ))
}

export default function useModalFocus({
  containerRef,
  invokerRef,
  onClose,
}: UseModalFocusOptions) {
  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return undefined
    }

    getFocusableControls(container)[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        invokerRef.current?.focus()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const controls = getFocusableControls(container)
      const first = controls[0]
      const last = controls[controls.length - 1]

      if (!first || !last) {
        event.preventDefault()
        return
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)
      invokerRef.current?.focus()
    }
  }, [containerRef, invokerRef, onClose])
}
