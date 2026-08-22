import { useEffect, useId, useRef, useState, type RefObject } from 'react'

import { MoreIcon } from '../../components/Icons'

type ShopGroupMenuProps = {
  groupId: string
  triggerRef: RefObject<HTMLButtonElement | null>
  onShare: () => void
  onRename: () => void
  onDelete: () => void
}

const menuItemSelector = '[role="menuitem"]'

export default function ShopGroupMenu({
  groupId,
  triggerRef,
  onShare,
  onRename,
  onDelete,
}: ShopGroupMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) {
      return undefined
    }

    menuRef.current?.querySelector<HTMLElement>(menuItemSelector)?.focus()

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const closeAndRun = (action: () => void) => {
    setOpen(false)
    action()
  }

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }

    const activeItem = document.activeElement
    if (
      event.key === ' '
      && activeItem instanceof HTMLAnchorElement
      && menuRef.current?.contains(activeItem)
    ) {
      event.preventDefault()
      activeItem.click()
      return
    }

    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>(menuItemSelector) ?? [])]
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    let nextIndex: number | null = null

    if (event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % items.length
    } else if (event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + items.length) % items.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = items.length - 1
    } else if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }

    if (nextIndex !== null && items[nextIndex]) {
      event.preventDefault()
      items[nextIndex].focus()
    }
  }

  return (
    <div className="shop-group-menu-root" ref={rootRef}>
      <button
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="옵션 열기"
        className="shop-group-menu-trigger"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <MoreIcon size={24} />
      </button>
      {open ? (
        <div
          className="shop-group-menu"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          <button onClick={() => closeAndRun(onShare)} role="menuitem" tabIndex={-1} type="button">
            그룹 공유
          </button>
          <button onClick={() => closeAndRun(onRename)} role="menuitem" tabIndex={-1} type="button">
            그룹명 수정
          </button>
          <a href={`/shop/groups/${groupId}/edit`} onClick={() => setOpen(false)} role="menuitem" tabIndex={-1}>
            상품 추가·편집
          </a>
          <button onClick={() => closeAndRun(onDelete)} role="menuitem" tabIndex={-1} type="button">
            그룹 삭제
          </button>
        </div>
      ) : null}
    </div>
  )
}
