import { useId, useRef, type RefObject } from 'react'

import useModalFocus from './useModalFocus'

type DeleteGroupDialogProps = {
  groupName: string
  invokerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteGroupDialog({
  groupName,
  invokerRef,
  onClose,
  onConfirm,
}: DeleteGroupDialogProps) {
  const containerRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div className="group-dialog-backdrop">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="group-dialog delete-group-dialog"
        ref={containerRef}
        role="dialog"
      >
        <h2 id={titleId}>상품 그룹을 삭제할까요?</h2>
        <p id={descriptionId}>‘{groupName}’ 상품 그룹을 삭제하면 되돌릴 수 없습니다.</p>
        <div className="group-dialog-actions">
          <button onClick={onClose} type="button">취소</button>
          <button onClick={onConfirm} type="button">삭제</button>
        </div>
      </section>
    </div>
  )
}
