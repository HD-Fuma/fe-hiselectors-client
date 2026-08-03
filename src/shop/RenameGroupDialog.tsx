import { useId, useRef, useState, type FormEvent, type RefObject } from 'react'

import useModalFocus from './useModalFocus'

type RenameGroupDialogProps = {
  groupName: string
  invokerRef: RefObject<HTMLElement | null>
  onClose: () => void
  onSave: (name: string) => void
}

export default function RenameGroupDialog({
  groupName,
  invokerRef,
  onClose,
  onSave,
}: RenameGroupDialogProps) {
  const [name, setName] = useState(groupName)
  const containerRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const inputId = useId()
  const countId = useId()
  const errorId = useId()
  const trimmedName = name.trim()
  const valid = trimmedName.length > 0 && trimmedName.length <= 30
  useModalFocus({ containerRef, invokerRef, onClose })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (valid) {
      onSave(trimmedName)
    }
  }

  return (
    <div className="group-dialog-backdrop">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="group-dialog rename-group-dialog"
        ref={containerRef}
        role="dialog"
      >
        <h2 id={titleId}>그룹명 수정</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor={inputId}>상품 그룹 이름</label>
          <input
            aria-describedby={`${countId}${valid ? '' : ` ${errorId}`}`}
            aria-invalid={!valid}
            id={inputId}
            maxLength={30}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <span className="group-dialog-count" id={countId}>{name.length} / 30</span>
          {!valid ? (
            <p className="group-dialog-error" id={errorId} role="alert">
              상품 그룹 이름을 입력해 주세요.
            </p>
          ) : null}
          <div className="group-dialog-actions">
            <button onClick={onClose} type="button">취소</button>
            <button disabled={!valid} type="submit">저장</button>
          </div>
        </form>
      </section>
    </div>
  )
}
