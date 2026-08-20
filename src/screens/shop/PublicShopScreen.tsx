import { useEffect, useRef, useState } from 'react'

import { ArrowRightIcon, ShareIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import { hasValidUserSession, readAuthSession } from '../../auth'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupSection from './ShopGroupSection'
import { useShopDemo } from './ShopDemoContext'
import ShopStatus from './ShopStatus'
import OwnerGroupControls from './OwnerGroupControls'
import { buildPublicShopHash, getPublicProductShareUrl, getPublicShopShareUrl, parsePublicShopHash } from './shopRoute'

const initialGroupCount = 6
const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
const viewModeStorageKey = 'selectors-shop-view-mode'
type ShopViewMode = 'public' | 'owner'

function getInitialViewMode(): ShopViewMode {
  const wantsOwnerView = sessionStorage.getItem(viewModeStorageKey) === 'owner'
  const session = readAuthSession()
  if (wantsOwnerView && hasValidUserSession(session) && session?.role === 'USER') return 'owner'

  if (wantsOwnerView) sessionStorage.setItem(viewModeStorageKey, 'public')
  return 'public'
}

export default function PublicShopScreen() {
  const { isProductGroupLoading, ownedSelectorsCode, productGroupError, profile, setStatus, state } = useShopDemo()
  const selectorsCode = parsePublicShopHash(window.location.hash)?.selectorsCode ?? ''
  const shareUrl = selectorsCode ? getPublicShopShareUrl(selectorsCode) : ''
  const [visibleGroupCount, setVisibleGroupCount] = useState(initialGroupCount)
  const [shareOpen, setShareOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ShopViewMode>(getInitialViewMode)
  const shareTriggerRef = useRef<HTMLButtonElement>(null)
  const session = readAuthSession()
  const hasUserSession = hasValidUserSession(session) && session?.role === 'USER'
  const canUseOwnerView = hasUserSession
    && Boolean(ownedSelectorsCode)
    && ownedSelectorsCode === selectorsCode
  const isOwner = canUseOwnerView && viewMode === 'owner'

  useEffect(() => {
    if (canUseOwnerView) return
    setViewMode('public')
    sessionStorage.setItem(viewModeStorageKey, 'public')
  }, [canUseOwnerView])

  const changeViewMode = (mode: ShopViewMode) => {
    if (mode === 'owner' && !canUseOwnerView) return
    setViewMode(mode)
    sessionStorage.setItem(viewModeStorageKey, mode)
  }

  return (
    <div className="panel-page">
      <ScreenHeader
        action={isOwner ? (
          <button
            aria-label="셀렉터스샵 공유"
            className="icon-button"
            onClick={() => setShareOpen(true)}
            ref={shareTriggerRef}
            type="button"
          >
            <ShareIcon size={22} />
          </button>
        ) : undefined}
        backHref="#/home"
        title="셀렉터스샵"
      />
      <div className="screen-scroll public-shop-screen">
        <section aria-labelledby="selector-handle" className="selector-profile">
          <div className="selector-profile-thumb">
            {profile.avatarImage ? (
              <img alt={`${profile.name} 프로필`} className="selector-avatar-image" src={profile.avatarImage} />
            ) : (
              <span aria-hidden="true" className="selector-avatar-placeholder" />
            )}
            <img
              alt={profile.badgeAlt}
              className="selector-badge"
              height="32"
              src={profile.badgeImage}
              width="32"
            />
          </div>
          <h2 id="selector-handle">{profile.name}</h2>
        </section>

        {isProductGroupLoading ? <p className="shop-group-feedback">셀렉터스샵을 불러오는 중입니다.</p> : null}
        {productGroupError ? <p className="shop-group-feedback shop-group-feedback-error">{productGroupError}</p> : null}

        {canUseOwnerView ? (
          <div aria-label="셀렉터스샵 보기 모드" className="shop-view-toggle" role="group">
            <button
              aria-pressed={viewMode === 'public'}
              onClick={() => changeViewMode('public')}
              type="button"
            >
              일반
            </button>
            <button
              aria-pressed={viewMode === 'owner'}
              onClick={() => changeViewMode('owner')}
              type="button"
            >
              관리자
            </button>
          </div>
        ) : null}

        <button className="me-space-button" type="button">
          {profile.meSpaceLabel}
          <ArrowRightIcon size={14} />
        </button>

        {isOwner ? (
          <a className="shop-manage-button" href="#/shop/groups">관리하기</a>
        ) : null}

        <div className="shop-group-list">
          {state.groups.slice(0, visibleGroupCount).map((group) => (
            <ShopGroupSection
              group={group}
              key={group.id}
              getProductShareUrl={isOwner ? (productId) => getPublicProductShareUrl(selectorsCode, productId) : undefined}
              ownerAction={isOwner ? <OwnerGroupControls group={group} /> : undefined}
              titleHref={buildPublicShopHash(selectorsCode, group.id)}
            />
          ))}
        </div>

        {!isProductGroupLoading && !productGroupError && state.groups.length === 0 ? (
          <p className="shop-group-feedback">등록된 상품 그룹이 없습니다.</p>
        ) : null}

        {visibleGroupCount < state.groups.length ? (
          <button
            className="shop-more-button"
            onClick={() => setVisibleGroupCount((count) => (
              Math.min(count + initialGroupCount, state.groups.length)
            ))}
            type="button"
          >
            더보기
          </button>
        ) : null}

        <p className="shop-disclosure">{disclosure}</p>
        {isOwner ? <ShopStatus onClose={() => setStatus(null)} status={state.status} /> : null}
      </div>
      {isOwner && shareOpen ? (
        <ShareShopSheet
          invokerRef={shareTriggerRef}
          onClose={() => setShareOpen(false)}
          title="셀렉터스샵 공유"
          url={shareUrl}
        />
      ) : null}
    </div>
  )
}
