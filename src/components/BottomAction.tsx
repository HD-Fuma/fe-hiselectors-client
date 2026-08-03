import type { MouseEventHandler } from 'react'

type BottomActionButtonProps = {
  disabled?: boolean
  href?: undefined
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

type BottomActionLinkProps = {
  disabled?: false
  href: string
  label: string
  onClick?: MouseEventHandler<HTMLAnchorElement>
}

type DisabledBottomActionLinkProps = {
  disabled: true
  href: string
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

type BottomActionProps =
  | BottomActionButtonProps
  | BottomActionLinkProps
  | DisabledBottomActionLinkProps

function isActiveLink(props: BottomActionProps): props is BottomActionLinkProps {
  return typeof props.href === 'string' && !props.disabled
}

export default function BottomAction(props: BottomActionProps) {
  if (isActiveLink(props)) {
    return (
      <div className="bottom-action">
        <a className="primary-action" href={props.href} onClick={props.onClick}>
          {props.label}
        </a>
      </div>
    )
  }

  return (
    <div className="bottom-action">
      <button
        className="primary-action"
        disabled={props.disabled ?? false}
        onClick={props.onClick}
        type="button"
      >
        {props.label}
      </button>
    </div>
  )
}
