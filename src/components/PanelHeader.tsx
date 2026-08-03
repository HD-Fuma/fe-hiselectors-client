import type { MouseEventHandler, ReactNode } from 'react'

import { ArrowLeftIcon } from './Icons'

type PanelHeaderProps = {
  action?: ReactNode
  backHref?: string
  onBack?: MouseEventHandler<HTMLAnchorElement>
  title: string
}

export default function PanelHeader({ action, backHref, onBack, title }: PanelHeaderProps) {
  return (
    <header className="panel-header">
      <div className="panel-header-side">
        {backHref ? (
          <a
            aria-label="뒤로 가기"
            className="icon-link"
            href={backHref}
            onClick={onBack}
          >
            <ArrowLeftIcon />
          </a>
        ) : null}
      </div>
      <h1 tabIndex={-1}>{title}</h1>
      <div className="panel-header-side panel-header-action">{action}</div>
    </header>
  )
}
