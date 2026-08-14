import { ArrowRightIcon } from '../../components/Icons'
import { useShopDemo } from './ShopDemoContext'

type ShopProfileProps = {
  manageHref?: string
}

export default function ShopProfile({ manageHref }: ShopProfileProps) {
  const { profile } = useShopDemo()

  return (
    <>
      <section aria-labelledby="selector-handle" className="selector-profile">
        <div className="selector-profile-thumb">
          <span aria-hidden="true" className="selector-avatar-placeholder" />
          <img
            alt={profile.badgeAlt}
            className="selector-badge"
            height="32"
            src={profile.badgeImage}
            width="32"
          />
        </div>
        <h2 id="selector-handle">{profile.name}</h2>
      </section>

      <button className="me-space-button" type="button">
        {profile.meSpaceLabel}
        <ArrowRightIcon size={14} />
      </button>

      {manageHref ? (
        <a className="shop-manage-button" href={manageHref}>관리하기</a>
      ) : null}
    </>
  )
}
