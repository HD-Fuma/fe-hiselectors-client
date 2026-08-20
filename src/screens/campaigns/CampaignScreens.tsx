import { useRef, useState } from 'react'

import { hasValidUserSession, readAuthSession } from '../../auth'
import { ArrowRightIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import CampaignQuickAddSheet from '../shop/CampaignQuickAddSheet'
import { useShopDemo } from '../shop/ShopDemoContext'
import ShopStatus from '../shop/ShopStatus'

const statusLabels = {
  ACTIVE: '진행 중',
  SCHEDULED: '예정',
  ENDED: '종료',
} as const

function formatPeriod(startDate?: string, endDate?: string) {
  if (!startDate || !endDate) return ''
  return `${startDate.replaceAll('-', '.')} - ${endDate.replaceAll('-', '.')}`
}

function getCampaignId() {
  return decodeURIComponent(window.location.hash.match(/^#\/campaigns\/([^/]+)$/)?.[1] ?? '')
}

function CampaignLoginRequired({ backHref, redirect }: { backHref: string; redirect: string }) {
  return (
    <>
      <ScreenHeader backHref={backHref} title="캠페인" />
      <div className="screen-scroll campaigns-screen">
        <p className="campaign-feedback">캠페인은 셀렉터스 로그인 후 확인할 수 있습니다.</p>
        <a
          className="primary-action"
          href="#/login"
          onClick={() => sessionStorage.setItem('postLoginRedirect', redirect)}
        >
          로그인하기
        </a>
      </div>
    </>
  )
}

export function CampaignListScreen() {
  const shop = useShopDemo()
  const session = readAuthSession()
  const canViewCampaigns = hasValidUserSession(session) && session?.role === 'USER'

  if (!canViewCampaigns) {
    return <CampaignLoginRequired backHref="#/home" redirect="#/campaigns" />
  }

  return (
    <>
      <ScreenHeader backHref="#/home" title="캠페인" />
      <div className="screen-scroll campaigns-screen">
        <div className="screen-lead">
          <h2>지금 소개하기 좋은 캠페인</h2>
          <p>브랜드와 상품을 살펴보고 나만의 셀렉션을 만들어 보세요.</p>
        </div>
        {shop.isCampaignCatalogLoading ? <p className="campaign-feedback">캠페인을 불러오는 중입니다.</p> : null}
        {shop.campaignCatalogError ? <p className="campaign-feedback campaign-feedback-error">{shop.campaignCatalogError}</p> : null}
        <div className="campaign-list">
          {shop.campaigns.map((campaign, index) => (
            <a className="campaign-card" href={`#/campaigns/${campaign.id}`} key={campaign.id}>
              {campaign.thumbnailUrl ? <img alt="" src={campaign.thumbnailUrl} /> : null}
              <div className="campaign-card-body">
                <div className="campaign-card-topline">
                  <span className={`status-badge status-${index}`}>{campaign.status ? statusLabels[campaign.status] : '진행 중'}</span>
                  <span>{formatPeriod(campaign.startDate, campaign.endDate)}</span>
                </div>
                <strong>{campaign.name}</strong>
                <span className="campaign-brand">{campaign.brands?.join(' · ') || campaign.description || '셀렉터스 캠페인'}</span>
              </div>
              <ArrowRightIcon className="campaign-arrow" size={18} />
            </a>
          ))}
        </div>
      </div>
    </>
  )
}

export function CampaignDetailScreen() {
  const shop = useShopDemo()
  const session = readAuthSession()
  const canManageProductGroups = hasValidUserSession(session) && session?.role === 'USER'
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const quickAddTriggerRef = useRef<HTMLButtonElement>(null)
  const campaignId = getCampaignId()
  const campaign = shop.campaigns.find(({ id }) => id === campaignId)
  const products = shop.getProducts(campaign?.productIds ?? [])

  if (!canManageProductGroups) {
    return <CampaignLoginRequired backHref="#/campaigns" redirect={window.location.hash} />
  }

  if (!campaign && !shop.isCampaignCatalogLoading) {
    return (
      <>
        <ScreenHeader backHref="#/campaigns" title="캠페인 상세" />
        <div className="screen-scroll campaign-detail-screen"><p className="campaign-feedback">캠페인을 찾을 수 없습니다.</p></div>
      </>
    )
  }

  return (
    <>
      <ScreenHeader backHref="#/campaigns" title={campaign?.name ?? '캠페인 상세'} />
      <div className="screen-scroll campaign-detail-screen">
        {campaign ? (
          <>
            <section className="campaign-hero-card">
              {campaign.thumbnailUrl || products[0]?.image ? <img alt="" src={campaign.thumbnailUrl || products[0]?.image} /> : null}
              <div className="campaign-hero-overlay">
                <span>HI SELECTORS CAMPAIGN</span>
                <h2>{campaign.name}</h2>
                <p>{campaign.description}</p>
              </div>
            </section>

            <section className="campaign-info">
              <dl><div><dt>캠페인 기간</dt><dd>{formatPeriod(campaign.startDate, campaign.endDate)}</dd></div></dl>
              {campaign.brands?.length ? (
                <div className="brand-chips" aria-label="참여 브랜드">
                  {campaign.brands.map((brand) => <span key={brand}>{brand}</span>)}
                </div>
              ) : null}
            </section>

            <button
              className="campaign-quick-add-trigger"
              disabled={shop.isProductGroupLoading || Boolean(shop.productGroupError) || products.length === 0}
              onClick={() => setIsQuickAddOpen(true)}
              ref={quickAddTriggerRef}
              type="button"
            >
              {shop.isProductGroupLoading ? '상품 그룹 불러오는 중' : '상품 그룹에 담기'}
            </button>
            {shop.productGroupError ? <p className="campaign-feedback campaign-feedback-error">{shop.productGroupError}</p> : null}

            <section className="campaign-product-section">
              <div className="section-heading-row compact-heading"><h2>캠페인 상품</h2><span>{products.length}개 상품</span></div>
              <div className="two-column-products">
                {products.map((product) => (
                  <a className="campaign-product" href={product.detailUrl} key={product.id} rel="noreferrer" target="_blank">
                    <img alt={product.name} src={product.image} />
                    <span>{product.brand}</span><strong>{product.name}</strong><b>{product.salePrice}</b>
                  </a>
                ))}
              </div>
            </section>
          </>
        ) : <p className="campaign-feedback">캠페인을 불러오는 중입니다.</p>}
      </div>
      <ShopStatus onClose={() => shop.setStatus(null)} status={shop.state.status} />
      {campaign && isQuickAddOpen ? (
        <CampaignQuickAddSheet
          groups={shop.state.groups.filter((group) => group.campaignId === campaign.id)}
          invokerRef={quickAddTriggerRef}
          onAddToGroup={async (groupId, productIds) => {
            await shop.addProductsToGroup(groupId, productIds)
            shop.setStatus('상품을 그룹에 담았어요.')
            setIsQuickAddOpen(false)
          }}
          onClose={() => setIsQuickAddOpen(false)}
          onCreateGroup={(productIds) => {
            shop.setQuickAddDraft({ campaignId: campaign.id, productIds })
            setIsQuickAddOpen(false)
            window.location.hash = `#/shop/groups/new/campaign/${campaign.id}`
          }}
          products={products}
        />
      ) : null}
    </>
  )
}
