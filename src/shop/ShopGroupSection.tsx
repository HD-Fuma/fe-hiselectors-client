import type { ReactNode } from 'react'

import type { ShopDemoGroup } from './ShopDemoContext'
import ShopProductGrid from './ShopProductGrid'

type ShopGroupSectionProps = {
  group: ShopDemoGroup
  ownerAction?: ReactNode
}

export default function ShopGroupSection({ group, ownerAction }: ShopGroupSectionProps) {
  const headingId = `shop-group-${group.id}-heading`

  return (
    <section
      aria-labelledby={headingId}
      className="shop-group-section"
      data-shop-group-id={group.id}
    >
      <div className="shop-group-heading-row">
        <h2 className="shop-group-heading" id={headingId}>{group.name}</h2>
        {ownerAction ? <div className="shop-group-owner-action">{ownerAction}</div> : null}
      </div>
      <ShopProductGrid productIds={group.productIds} />
    </section>
  )
}
