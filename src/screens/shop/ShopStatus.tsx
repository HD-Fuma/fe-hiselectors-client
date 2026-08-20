import { useId, useRef } from 'react'

import useModalFocus from './useModalFocus'

type ShopStatusProps = {
  status: string | null
  onClose: () => void
}

type ShopStatusDialogProps = {
  status: string
  onClose: () => void
}

function ShopStatusDialog({ onClose, status }: ShopStatusDialogProps) {
  const containerRef = useRef<HTMLElement>(null)
  const invokerRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  const titleId = useId()
  const descriptionId = useId()
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div className="group-dialog-backdrop shop-status-backdrop">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="group-dialog shop-status-dialog"
        ref={containerRef}
        role="alertdialog"
      >
        <h2 id={titleId}>알림</h2>
        <p id={descriptionId}>{status}</p>
        <div className="group-dialog-actions shop-status-actions">
          <button onClick={onClose} type="button">확인</button>
        </div>
      </section>
    </div>
  )
}

export default function ShopStatus({ onClose, status }: ShopStatusProps) {
  if (!status) {
    return null
  }

  return <ShopStatusDialog onClose={onClose} status={status} />
}
