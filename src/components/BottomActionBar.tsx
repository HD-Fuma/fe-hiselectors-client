import type { MouseEventHandler } from 'react'

type BottomActionBarProps = {
  disabled?: boolean
  href?: string
  label: string
  onClick?: MouseEventHandler<HTMLElement>
}

export default function BottomActionBar({
  disabled = false,
  href,
  label,
  onClick,
}: BottomActionBarProps) {
  return (
    <div className="bottom-action-bar">
      {href && !disabled ? (
        <a className="primary-action" href={href} onClick={onClick}>{label}</a>
      ) : (
        <button
          className="primary-action"
          disabled={disabled}
          onClick={onClick}
          type="button"
        >
          {label}
        </button>
      )}
    </div>
  )
}
