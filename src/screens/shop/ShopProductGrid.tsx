import { useRef, useState } from 'react'

import { useShopDemo } from './ShopDemoContext'
import { CopyIcon } from '../../components/Icons'
import ShareShopSheet from './ShareShopSheet'

type ShopProductGridProps = {
  productIds: readonly string[]
  getProductShareUrl?: (productId: string) => string
}

export default function ShopProductGrid({ getProductShareUrl, productIds }: ShopProductGridProps) {
  const { getProducts } = useShopDemo()
  const [shareProductId, setShareProductId] = useState<string | null>(null)
  const shareInvokerRef = useRef<HTMLElement>(null)

  return (
    <div className="shop-product-grid">
      {getProducts(productIds).map((product) => (
        <article className="shop-product" key={product.id}>
          <div className="shop-product-media">
            <img alt={product.name} src={product.image} />
            {getProductShareUrl ? (
              <button
                aria-label={`${product.name} 상품 링크 복사`}
                className="shop-product-copy"
                onClick={(event) => {
                  shareInvokerRef.current = event.currentTarget
                  setShareProductId(product.id)
                }}
                title="상품 링크 복사"
                type="button"
              >
                <CopyIcon size={17} />
              </button>
            ) : null}
          </div>
          {product.brand ? (
            <span className="shop-product-brand">{product.brand}</span>
          ) : null}
          <p className="shop-product-name">{product.name}</p>
          <div className="shop-product-pricing">
            <del>{product.originalPrice}</del>
            <span>{product.discountRate}</span>
            <strong>{product.salePrice}</strong>
          </div>
        </article>
      ))}
      {shareProductId && getProductShareUrl ? (
        <ShareShopSheet
          invokerRef={shareInvokerRef}
          onClose={() => setShareProductId(null)}
          title="상품 공유"
          url={getProductShareUrl(shareProductId)}
        />
      ) : null}
    </div>
  )
}
