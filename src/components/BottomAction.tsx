import type { JSX, MouseEventHandler } from 'react'

type BottomActionButtonProps = {
  disabled?: boolean
  href?: undefined
  label: string
  onClick?: MouseEventHandler<HTMLButtonElement>
}

type BottomActionTarget<Disabled extends boolean> = boolean extends Disabled
  ? HTMLAnchorElement | HTMLButtonElement
  : Disabled extends true
    ? HTMLButtonElement
    : HTMLAnchorElement

type BottomActionHrefProps<Disabled extends boolean> = {
  disabled?: Disabled
  href: string
  label: string
  onClick?: MouseEventHandler<BottomActionTarget<Disabled>>
}

type BottomActionImplementationProps = {
  disabled?: boolean
  href?: string
  label: string
  onClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>
}

function BottomAction<Disabled extends boolean = false>(
  props: BottomActionButtonProps | BottomActionHrefProps<Disabled>,
): JSX.Element
function BottomAction({
  disabled = false,
  href,
  label,
  onClick,
}: BottomActionImplementationProps) {
  return (
    <div className="bottom-action">
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

export default BottomAction
