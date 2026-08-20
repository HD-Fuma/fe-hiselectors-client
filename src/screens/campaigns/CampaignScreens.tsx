import { useRef, useState } from 'react'

import { ArrowRightIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import CampaignQuickAddSheet from '../shop/CampaignQuickAddSheet'
import { useShopDemo } from '../shop/ShopDemoContext'
import { shopProducts } from '../shop/shopData'
import ShopStatus from '../shop/ShopStatus'

const campaigns = [
  {
    title: '여름의 결을 고르는 시즌 픽',
    brand: '현대백화점 패션 · 뷰티',
    period: '2026.08.01 - 2026.08.31',
    status: '진행 중',
    image: shopProducts[0].image,
  },
  {
    title: '새로운 가을, 먼저 만나는 니트',
    brand: 'TIME · SYSTEM · MINE',
    period: '2026.08.17 - 2026.09.13',
    status: '예정',
    image: shopProducts[1].image,
  },
  {
    title: '나를 위한 프리미엄 뷰티 셀렉션',
    brand: 'LA MER · BYREDO',
    period: '2026.07.01 - 2026.07.31',
    status: '종료',
    image: shopProducts[4].image,
  },
] as const

export function CampaignListScreen() {
  return (
    <>
      <ScreenHeader backHref="#/home" title="캠페인" />
      <div className="screen-scroll campaigns-screen">
        <div className="screen-lead">
          <h2>지금 소개하기 좋은 캠페인</h2>
          <p>브랜드와 상품을 살펴보고 나만의 셀렉션을 만들어 보세요.</p>
        </div>
        <div className="campaign-list">
          {campaigns.map((campaign, index) => {
            const content = (
              <>
                <img alt="" src={campaign.image} />
                <div className="campaign-card-body">
                  <div className="campaign-card-topline">
                    <span className={`status-badge status-${index}`}>{campaign.status}</span>
                    <span>{campaign.period}</span>
                  </div>
                  <strong>{campaign.title}</strong>
                  <span className="campaign-brand">{campaign.brand}</span>
                </div>
                <ArrowRightIcon className="campaign-arrow" size={18} />
              </>
            )

            return index === 0 ? (
              <a className="campaign-card" href="#/campaigns/detail" key={campaign.title}>{content}</a>
            ) : (
              <article className="campaign-card" key={campaign.title}>{content}</article>
            )
          })}
        </div>
      </div>
    </>
  )
}

export function CampaignDetailScreen() {
  const shop = useShopDemo()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const quickAddTriggerRef = useRef<HTMLButtonElement>(null)
  const campaign = shop.campaigns.find(({ id }) => id === 'season-pick')
  const products = shop.getProducts(campaign?.productIds ?? [])

  return (
    <>
      <ScreenHeader backHref="#/campaigns" title="시즌 픽 캠페인" />
      <div className="screen-scroll campaign-detail-screen">
        <section className="campaign-hero-card">
          <img alt="크림색 재킷으로 완성한 여름 시즌 스타일" src={shopProducts[0].image} />
          <div className="campaign-hero-overlay">
            <span>SELECTORS SEASON PICK</span>
            <h2>여름의 결을<br />고르는 시간</h2>
            <p>가볍게 오래 입을 패션과<br />청량한 뷰티 아이템을 소개합니다.</p>
          </div>
        </section>

        <section className="campaign-info">
          <dl>
            <div><dt>캠페인 기간</dt><dd>2026.08.01 - 2026.08.31</dd></div>
          </dl>
          <div className="brand-chips" aria-label="참여 브랜드">
            {['TIME', 'SYSTEM', 'MINE', 'BYREDO'].map((brand) => <span key={brand}>{brand}</span>)}
          </div>
        </section>

        <button
          className="campaign-quick-add-trigger"
          onClick={() => setIsQuickAddOpen(true)}
          ref={quickAddTriggerRef}
          type="button"
        >
          상품 그룹에 담기
        </button>

        <section className="campaign-product-section">
          <div className="section-heading-row compact-heading">
            <h2>캠페인 상품</h2>
            <span>{products.length}개 상품</span>
          </div>
          <div className="two-column-products">
            {products.map((product) => (
              <article className="campaign-product" key={product.name}>
                <img alt={product.name} src={product.image} />
                <span>{product.brand}</span>
                <strong>{product.name}</strong>
                <b>{product.salePrice}</b>
              </article>
            ))}
          </div>
        </section>
      </div>
      <ShopStatus status={shop.state.status} />
      {isQuickAddOpen ? (
        <CampaignQuickAddSheet
          groups={shop.state.groups.filter(({ campaignId }) => campaignId === 'season-pick')}
          invokerRef={quickAddTriggerRef}
          onAddToGroup={(groupId, productIds) => {
            shop.addProductsToGroup(groupId, productIds)
            shop.setStatus('상품을 그룹에 담았어요.')
            setIsQuickAddOpen(false)
          }}
          onClose={() => setIsQuickAddOpen(false)}
          onCreateGroup={(productIds) => {
            shop.setQuickAddDraft({ campaignId: 'season-pick', productIds })
            setIsQuickAddOpen(false)
            window.location.hash = '#/shop/groups/new/season-pick'
          }}
          products={products}
        />
      ) : null}
    </>
  )
}
