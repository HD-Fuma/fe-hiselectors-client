import { useShopDemo } from './ShopDemoContext'

type ShopProductGridProps = {
  productIds: readonly string[]
}

export default function ShopProductGrid({ productIds }: ShopProductGridProps) {
  const { getProducts } = useShopDemo()

  return (
    <div className="shop-product-grid">
      {getProducts(productIds).map((product) => (
        <article className="shop-product" key={product.id}>
          <img alt={product.name} src={product.image} />
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
    </div>
  )
}
