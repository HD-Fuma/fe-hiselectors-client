type BottomActionProps = {
  disabled?: boolean
  href?: string
  label: string
}

export default function BottomAction({ disabled = false, href, label }: BottomActionProps) {
  return (
    <div className="bottom-action">
      {href && !disabled ? (
        <a className="primary-action" href={href}>{label}</a>
      ) : (
        <button className="primary-action" disabled={disabled} type="button">{label}</button>
      )}
    </div>
  )
}
