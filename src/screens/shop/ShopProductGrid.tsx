import { useRef, useState } from 'react'

import { useShopDemo } from './ShopDemoContext'
import { CopyIcon } from '../../components/Icons'
import ShareShopSheet from './ShareShopSheet'
import { buildPublicProductUrl, parsePublicShopPath } from './shopRoute'

type ShopProductGridProps = {
  productIds: readonly string[]
  getProductShareUrl?: (productId: string) => string
}

export default function ShopProductGrid({ getProductShareUrl, productIds }: ShopProductGridProps) {
  const { getProducts } = useShopDemo()
  const [shareProductCode, setShareProductCode] = useState<string | null>(null)
  const shareInvokerRef = useRef<HTMLElement>(null)

  return (
    <div className="shop-product-grid">
      {getProducts(productIds).map((product) => {
        const selectorsCode = parsePublicShopPath(window.location.pathname)?.selectorsCode ?? ''
        const productCode = product.code ?? product.id
        const productUrl = buildPublicProductUrl(productCode, selectorsCode)

        return (
        <article className="shop-product" key={product.id}>
          <div className="shop-product-media">
            <a aria-label={`${product.name} 상품 페이지 열기`} href={productUrl}>
              <img alt={product.name} src={product.image} />
            </a>
            {getProductShareUrl ? (
              <button
                aria-label={`${product.name} 상품 링크 복사`}
                className="shop-product-copy"
                onClick={(event) => {
                  shareInvokerRef.current = event.currentTarget
                  setShareProductCode(productCode)
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
          <p className="shop-product-name"><a href={productUrl}>{product.name}</a></p>
          <div className="shop-product-pricing">
            <del>{product.originalPrice}</del>
            <span>{product.discountRate}</span>
            <strong>{product.salePrice}</strong>
          </div>
        </article>
        )
      })}
      {shareProductCode && getProductShareUrl ? (
        <ShareShopSheet
          invokerRef={shareInvokerRef}
          onClose={() => setShareProductCode(null)}
          title="상품 공유"
          url={getProductShareUrl(shareProductCode)}
        />
      ) : null}
    </div>
  )
}
