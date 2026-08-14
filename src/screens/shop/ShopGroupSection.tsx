import type { ReactNode } from 'react'

import type { ShopDemoGroup } from './ShopDemoContext'
import ShopProductGrid from './ShopProductGrid'

type ShopGroupSectionProps = {
  description?: string
  group: ShopDemoGroup
  ownerAction?: ReactNode
}

export default function ShopGroupSection({ description, group, ownerAction }: ShopGroupSectionProps) {
  const headingId = `shop-group-${group.id}-heading`

  return (
    <section
      aria-labelledby={headingId}
      className="shop-group-section"
      data-shop-group-id={group.id}
    >
      <div className="shop-group-heading-row">
        <div className="shop-group-heading-copy">
          <h2 className="shop-group-heading" id={headingId}>{group.name}</h2>
          {description ? <p className="shop-group-description">{description}</p> : null}
        </div>
        {ownerAction ? <div className="shop-group-owner-action">{ownerAction}</div> : null}
      </div>
      <ShopProductGrid productIds={group.productIds} />
    </section>
  )
}
