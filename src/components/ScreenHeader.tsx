import type { MouseEventHandler, ReactNode } from 'react'

import { ArrowLeftIcon } from './Icons'

type ScreenHeaderProps = {
  action?: ReactNode
  backHref?: string
  onBack?: MouseEventHandler<HTMLAnchorElement>
  title: string
}

export default function ScreenHeader({ action, backHref, onBack, title }: ScreenHeaderProps) {
  return (
    <header className="screen-header">
      <div className="screen-header-side">
        {backHref ? (
          <a
            aria-label="뒤로 가기"
            className="icon-link"
            href={backHref}
            onClick={onBack}
          >
            <ArrowLeftIcon size={24} />
          </a>
        ) : null}
      </div>
      <h1 tabIndex={-1}>{title}</h1>
      <div className="screen-header-side screen-header-action">{action}</div>
    </header>
  )
}
