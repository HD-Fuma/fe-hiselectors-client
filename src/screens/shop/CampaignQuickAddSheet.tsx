import { useId, useRef, useState, type RefObject } from 'react'

import { CheckIcon } from '../../components/Icons'
import type { ShopDemoGroup } from './ShopDemoContext'
import type { ShopProduct } from './shopData'
import ShopStatus from './ShopStatus'
import useModalFocus from './useModalFocus'

type CampaignQuickAddSheetProps = {
  groups: readonly ShopDemoGroup[]
  invokerRef: RefObject<HTMLElement | null>
  onAddToGroup: (groupId: string, productIds: string[]) => Promise<void>
  onClose: () => void
  onCreateGroup: (productIds: string[]) => void
  products: readonly ShopProduct[]
}

export default function CampaignQuickAddSheet({
  groups,
  invokerRef,
  onAddToGroup,
  onClose,
  onCreateGroup,
  products,
}: CampaignQuickAddSheetProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    () => products.map(({ id }) => id),
  )
  const [savingGroupId, setSavingGroupId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const containerRef = useRef<HTMLElement>(null)
  const titleId = useId()
  const selected = new Set(selectedProductIds)
  useModalFocus({ containerRef, invokerRef, onClose })

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((current) => {
      if (current.includes(productId)) {
        return current.length === 1
          ? current
          : current.filter((selectedId) => selectedId !== productId)
      }

      return [...current, productId]
    })
  }

  const addToGroup = async (groupId: string) => {
    setSavingGroupId(groupId)
    setSaveError(null)
    try {
      await onAddToGroup(groupId, selectedProductIds)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '상품을 추가하지 못했습니다.')
      setSavingGroupId(null)
    }
  }

  return (
    <>
      <div className="campaign-quick-add-backdrop">
        <section
          aria-labelledby={titleId}
          aria-modal="true"
          className="campaign-quick-add-sheet"
          ref={containerRef}
          role="dialog"
        >
        <div className="campaign-quick-add-heading">
          <h2 id={titleId}>상품 그룹에 담기</h2>
          <button
            aria-label="닫기"
            className="campaign-quick-add-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="campaign-quick-add-summary">
          <strong>캠페인 상품</strong>
          <span>{selectedProductIds.length}개 선택</span>
        </div>
        <div className="campaign-quick-add-products">
          {products.map((product) => {
            const isSelected = selected.has(product.id)
            const isLastSelected = isSelected && selectedProductIds.length === 1

            return (
              <label className="campaign-quick-add-product" key={product.id}>
                <input
                  aria-label={product.name}
                  checked={isSelected}
                  disabled={isLastSelected}
                  onChange={() => toggleProduct(product.id)}
                  type="checkbox"
                />
                <span className="campaign-quick-add-check"><CheckIcon size={15} /></span>
                <img alt="" src={product.image} />
                <span className="campaign-quick-add-product-copy">
                  <small>{product.brand}</small>
                  <strong>{product.name}</strong>
                </span>
              </label>
            )
          })}
        </div>

        <div className="campaign-quick-add-groups">
          <strong>상품 그룹 선택</strong>
          <button
            className="campaign-quick-add-new"
            disabled={selectedProductIds.length === 0 || savingGroupId !== null}
            onClick={() => onCreateGroup(selectedProductIds)}
            type="button"
          >
            새 상품 그룹 만들기
          </button>
          <div className="campaign-quick-add-group-list">
            {groups.length === 0 ? <p className="campaign-feedback">이 캠페인으로 만든 상품 그룹이 없습니다.</p> : null}
            {groups.map((group) => (
              <button
                aria-label={group.name}
                className="campaign-quick-add-group"
                disabled={savingGroupId !== null}
                key={group.id}
                onClick={() => void addToGroup(group.id)}
                type="button"
              >
                <strong>{group.name}</strong>
                <span>{savingGroupId === group.id ? '저장 중' : `${group.productIds.length}개 상품`}</span>
              </button>
            ))}
          </div>
          </div>
        </section>
      </div>
      <ShopStatus onClose={() => setSaveError(null)} status={saveError} />
    </>
  )
}
