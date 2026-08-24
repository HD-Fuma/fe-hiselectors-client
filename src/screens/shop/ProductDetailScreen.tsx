import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'

import ScreenHeader from '../../components/ScreenHeader'
import { navigate } from '../../navigation'
import { hasValidUserSession, readAuthSession } from '../../auth'
import { getPublicProduct } from './productGroupApi'
import { purchaseProduct } from './purchaseApi'
import { useShopDemo } from './ShopDemoContext'
import type { ShopProduct } from './shopData'
import { buildPublicShopPath, parseProductDetailLocation } from './shopRoute'
import useModalFocus from './useModalFocus'
import { useShopViewLog } from './useShopViewLog'

function mapProduct(product: Awaited<ReturnType<typeof getPublicProduct>>): ShopProduct {
  const regularPrice = Number(product.regularPrice)
  const salePrice = Number(product.salePrice)
  return {
    id: String(product.id),
    code: product.code,
    category: product.category || '',
    brand: product.brand || '',
    name: product.name,
    originalPrice: `${regularPrice.toLocaleString('ko-KR')}원`,
    discountRate: regularPrice > 0
      ? `${Math.max(0, Math.round((1 - salePrice / regularPrice) * 100))}%`
      : '0%',
    salePrice: `${salePrice.toLocaleString('ko-KR')}원`,
    image: product.thumbnailUrl,
    detailUrl: product.detailUrl,
    campaignIds: [],
  }
}

type PurchaseOptionSheetProps = {
  invokerRef: RefObject<HTMLButtonElement | null>
  onClose: () => void
  onPurchase: () => void
  product: ShopProduct
  purchaseMessage: string | null
  purchasing: boolean
  quantity: number
  setQuantity: (quantity: number) => void
}

function PurchaseOptionSheet({
  invokerRef,
  onClose,
  onPurchase,
  product,
  purchaseMessage,
  purchasing,
  quantity,
  setQuantity,
}: PurchaseOptionSheetProps) {
  const containerRef = useRef<HTMLElement>(null)
  const unitPrice = Number(product.salePrice.replace(/[^0-9]/g, ''))
  const totalPrice = `${(unitPrice * quantity).toLocaleString('ko-KR')}원`
  useModalFocus({ containerRef, invokerRef, onClose })

  return (
    <div className="product-option-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section
        aria-label="구매 옵션"
        aria-modal="true"
        className="product-option-sheet"
        ref={containerRef}
        role="dialog"
      >
        <button aria-label="구매 옵션 닫기" className="product-option-close" onClick={onClose} type="button">
          <span />
        </button>
        <div className="product-option-card">
          <strong>{product.name}</strong>
          <div className="product-option-row">
            <div className="product-quantity-stepper">
              <button
                aria-label="수량 줄이기"
                disabled={quantity === 1 || purchasing}
                onClick={() => setQuantity(quantity - 1)}
                type="button"
              >
                −
              </button>
              <output aria-label="수량">{quantity}</output>
              <button
                aria-label="수량 늘리기"
                disabled={quantity === 5 || purchasing}
                onClick={() => setQuantity(quantity + 1)}
                type="button"
              >
                +
              </button>
            </div>
            <strong>{totalPrice}</strong>
          </div>
        </div>
        <div className="product-option-total">
          <span>총</span>
          <strong>{totalPrice}</strong>
        </div>
        {purchaseMessage ? <p aria-live="polite" className="product-purchase-message">{purchaseMessage}</p> : null}
        <button className="product-option-purchase" disabled={purchasing} onClick={onPurchase} type="button">
          {purchasing ? '처리 중…' : '구매하기'}
        </button>
      </section>
    </div>
  )
}

export default function ProductDetailScreen() {
  const location = parseProductDetailLocation()
  const selectorsCode = location?.selectorsCode ?? ''
  const productCode = location?.productCode ?? ''
  const { products } = useShopDemo()
  const contextProduct = products.find((item) => (item.code ?? item.id) === productCode)
  const [product, setProduct] = useState<ShopProduct | null>(contextProduct ?? null)
  const [loading, setLoading] = useState(!contextProduct)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null)
  const purchaseTriggerRef = useRef<HTMLButtonElement>(null)
  const numericProductId = Number(product?.id)
  const canRecordView = Boolean(product) && Number.isFinite(numericProductId)
  useShopViewLog(selectorsCode, 'PRODUCT', numericProductId, canRecordView)

  useEffect(() => {
    if (contextProduct) {
      setProduct(contextProduct)
      setError(null)
      setLoading(false)
      return
    }
    if (!selectorsCode || !productCode) {
      setError('상품을 찾을 수 없습니다.')
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    getPublicProduct(selectorsCode, productCode)
      .then((response) => {
        if (!cancelled) setProduct(mapProduct(response))
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError instanceof Error ? requestError.message : '상품을 찾을 수 없습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [contextProduct, productCode, selectorsCode])

  const backHref = useMemo(() => buildPublicShopPath(selectorsCode), [selectorsCode])

  const handlePurchase = async () => {
    if (!product) return
    const session = readAuthSession()
    if (!hasValidUserSession(session) || session?.role !== 'USER') {
      sessionStorage.setItem(
        'postLoginRedirect',
        `/product/${encodeURIComponent(productCode)}?ptrsRefCd=${encodeURIComponent(selectorsCode)}`,
      )
      navigate('/login')
      return
    }

    setPurchasing(true)
    setPurchaseMessage(null)
    try {
      const result = await purchaseProduct(selectorsCode, product.code ?? product.id, quantity)
      window.alert(`구매 완료되었습니다. 주문번호 ${result.orderNo}`)
    } catch (purchaseError) {
      setPurchaseMessage(purchaseError instanceof Error ? purchaseError.message : '구매를 기록하지 못했습니다.')
    } finally {
      setPurchasing(false)
    }
  }

  return (
    <div className="panel-page">
      <ScreenHeader backHref={backHref} title="상품 상세" />
      <div className="screen-scroll product-detail-screen">
        {loading ? <p className="shop-group-feedback">상품을 불러오는 중입니다.</p> : null}
        {error ? <p className="shop-group-feedback shop-group-feedback-error">{error}</p> : null}
        {!loading && product ? (
          <>
            <img alt={product.name} className="product-detail-image" src={product.image} />
            <section className="product-detail-summary">
              {product.brand ? <p className="product-detail-brand">{product.brand}</p> : null}
              <h2>{product.name}</h2>
              <div className="product-detail-price">
                <del>{product.originalPrice}</del>
                <span>{product.discountRate}</span>
                <strong>{product.salePrice}</strong>
              </div>
              <p className="product-detail-delivery">등록된 판매 상품 정보를 기준으로 제공됩니다.</p>
            </section>
            <div className="product-purchase-bar">
              <button onClick={() => setPurchaseOpen(true)} ref={purchaseTriggerRef} type="button">
                구매하기
              </button>
            </div>
            {purchaseOpen ? (
              <PurchaseOptionSheet
                invokerRef={purchaseTriggerRef}
                onClose={() => setPurchaseOpen(false)}
                onPurchase={() => void handlePurchase()}
                product={product}
                purchaseMessage={purchaseMessage}
                purchasing={purchasing}
                quantity={quantity}
                setQuantity={setQuantity}
              />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
