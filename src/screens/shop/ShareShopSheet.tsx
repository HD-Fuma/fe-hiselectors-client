import { useId, useRef, useState, type RefObject } from 'react'

import useModalFocus from './useModalFocus'
import { copyText } from './copyText'

type ShareShopSheetProps = {
  title: string
  url: string
  onClose: () => void
  invokerRef: RefObject<HTMLElement | null>
}

export default function ShareShopSheet({
  title,
  url,
  onClose,
  invokerRef,
}: ShareShopSheetProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const containerRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const urlId = useId()
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div className="share-shop-backdrop">
      <section
        aria-labelledby={titleId}
        aria-modal="true"
        className="share-shop-sheet"
        ref={containerRef}
        role="dialog"
      >
        <div className="share-shop-heading">
          <h2 id={titleId}>{title}</h2>
          <button aria-label="닫기" className="share-shop-close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <label htmlFor={urlId}>공유 링크</label>
        <input id={urlId} readOnly type="text" value={url} />
        <button
          className="share-shop-copy"
          onClick={() => {
            void copyText(url).then(() => setCopyStatus('링크를 복사했어요.'))
          }}
          type="button"
        >
          링크 복사
        </button>
        {copyStatus ? <p role="status">{copyStatus}</p> : null}
      </section>
    </div>
  )
}
