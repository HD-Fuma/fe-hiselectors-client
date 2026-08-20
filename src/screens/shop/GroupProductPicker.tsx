import { CheckIcon } from '../../components/Icons'
import type { ShopProduct } from './shopData'

type GroupProductPickerProps = {
  disabled?: boolean
  error?: string | null
  hasCampaign?: boolean
  isEditing?: boolean
  isLoading?: boolean
  maxSelectedProducts?: number
  onSelectedProductIdsChange: (productIds: string[]) => void
  products: readonly ShopProduct[]
  selectedProductIds: readonly string[]
}

export default function GroupProductPicker({
  disabled = false,
  error = null,
  hasCampaign = true,
  isEditing = false,
  isLoading = false,
  maxSelectedProducts = 100,
  onSelectedProductIdsChange,
  products,
  selectedProductIds,
}: GroupProductPickerProps) {
  const selected = new Set(selectedProductIds)
  const remainingSelectionCount = Math.max(0, maxSelectedProducts - selected.size)
  const availableProductCount = Math.min(
    remainingSelectionCount,
    products.filter(({ id }) => !selected.has(id)).length,
  )
  const isSelectionLimitReached = remainingSelectionCount === 0

  const toggleProduct = (productId: string) => {
    if (!selected.has(productId) && isSelectionLimitReached) return

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
          <p>{isEditing
            ? '같은 캠페인의 상품을 추가하거나 선택 해제할 수 있어요.'
            : '셀렉터스샵에 소개할 상품을 선택해 주세요.'}</p>
        </div>
        <div aria-live="polite" className="picker-selection-summary">
          <strong>{selectedProductIds.length}개 선택</strong>
          <span>{isLoading
            ? '추가 상품 확인 중'
            : error
              ? '추가 상품 확인 실패'
              : isSelectionLimitReached
                ? `최대 ${maxSelectedProducts}개 선택 가능`
                : `${availableProductCount}개 추가 가능 · 최대 ${maxSelectedProducts}개`}</span>
        </div>
      </div>
      <div className="picker-list">
        {isLoading ? (
          <p className="picker-empty">캠페인 상품을 불러오는 중입니다.</p>
        ) : error ? (
          <p className="picker-empty picker-error" role="alert">{error}</p>
        ) : !hasCampaign ? (
          <p className="picker-empty">캠페인을 선택하면 추가할 수 있는 상품이 표시됩니다.</p>
        ) : products.length === 0 ? (
          <p className="picker-empty">이 캠페인에서 선택할 수 있는 상품이 없습니다.</p>
        ) : (
          products.map((product) => {
            const isSelected = selected.has(product.id)
            const isProductDisabled = disabled || (!isSelected && isSelectionLimitReached)

            return (
              <label className={`picker-row${isProductDisabled ? ' is-disabled' : ''}`} key={product.id}>
                <input
                  aria-label={product.name}
                  checked={isSelected}
                  disabled={isProductDisabled}
                  onChange={() => toggleProduct(product.id)}
                  type="checkbox"
                />
                <span className="product-check"><CheckIcon size={17} /></span>
                <span aria-hidden="true" className={`picker-product-state${isSelected ? ' is-selected' : ''}`}>
                  {isSelected ? '선택됨' : '추가 가능'}
                </span>
                <img alt="" src={product.image} />
                <span className="picker-product-copy">
                  {product.brand ? <small>{product.brand}</small> : null}
                  <strong>{product.name}</strong>
                  <span>{product.salePrice}</span>
                </span>
              </label>
            )
          })
        )}
      </div>
    </section>
  )
}
