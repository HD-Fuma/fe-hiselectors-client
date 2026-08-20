import type { ReactNode } from 'react'

import type { ShopDemoGroup } from './ShopDemoContext'
import ShopProductGrid from './ShopProductGrid'

type ShopGroupSectionProps = {
  description?: string
  getProductShareUrl?: (productId: string) => string
  group: ShopDemoGroup
  ownerAction?: ReactNode
  titleHref?: string
}

export default function ShopGroupSection({ description, getProductShareUrl, group, ownerAction, titleHref }: ShopGroupSectionProps) {
  const headingId = `shop-group-${group.id}-heading`

  return (
    <section
      aria-labelledby={headingId}
      className="shop-group-section"
      data-shop-group-id={group.id}
    >
      <div className="shop-group-heading-row">
        <div className="shop-group-heading-copy">
          <h2 className="shop-group-heading" id={headingId}>
            {titleHref ? <a href={titleHref}>{group.name}</a> : group.name}
          </h2>
          {description ? <p className="shop-group-description">{description}</p> : null}
        </div>
        {ownerAction ? <div className="shop-group-owner-action">{ownerAction}</div> : null}
      </div>
      <ShopProductGrid getProductShareUrl={getProductShareUrl} productIds={group.productIds} />
    </section>
  )
}
