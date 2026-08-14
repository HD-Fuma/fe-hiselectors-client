import { CheckIcon } from '../../components/Icons'
import type { ShopProduct } from './shopData'

type GroupProductPickerProps = {
  onSelectedProductIdsChange: (productIds: string[]) => void
  products: readonly ShopProduct[]
  selectedProductIds: readonly string[]
}

export default function GroupProductPicker({
  onSelectedProductIdsChange,
  products,
  selectedProductIds,
}: GroupProductPickerProps) {
  const selected = new Set(selectedProductIds)

  const toggleProduct = (productId: string) => {
    onSelectedProductIdsChange(
      selected.has(productId)
        ? selectedProductIds.filter((selectedId) => selectedId !== productId)
        : [...selectedProductIds, productId],
    )
  }

  return (
    <section className="editor-section product-picker-section">
      <div className="picker-heading">
        <div>
          <h2>캠페인 상품 선택</h2>
          <p>셀렉터스샵에 소개할 상품을 선택해 주세요.</p>
        </div>
        <span>{selectedProductIds.length}개 선택</span>
      </div>
      <div className="picker-list">
        {products.length === 0 ? (
          <p className="picker-empty">이 캠페인에서 선택할 수 있는 상품이 없습니다.</p>
        ) : (
          products.map((product) => (
            <label className="picker-row" key={product.id}>
              <input
                aria-label={product.name}
                checked={selected.has(product.id)}
                onChange={() => toggleProduct(product.id)}
                type="checkbox"
              />
              <span className="product-check"><CheckIcon size={17} /></span>
              <img alt="" src={product.image} />
              <span className="picker-product-copy">
                {product.brand ? <small>{product.brand}</small> : null}
                <strong>{product.name}</strong>
                <span>{product.salePrice}</span>
              </span>
            </label>
          ))
        )}
      </div>
    </section>
  )
}
