import { useRef, useState } from 'react'

import { ExternalLinkIcon, ShareIcon } from '../../components/Icons'
import PanelHeader from '../../components/PanelHeader'
import ShareShopSheet from '../../shop/ShareShopSheet'
import ShopGroupSection from '../../shop/ShopGroupSection'
import { useShopDemo } from '../../shop/ShopDemoContext'
import ShopStatus from '../../shop/ShopStatus'

const initialGroupCount = 6
const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
const shareUrl = 'https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T'

export default function PublicShopScreen() {
  const { profile, state } = useShopDemo()
  const [visibleGroupCount, setVisibleGroupCount] = useState(initialGroupCount)
  const [shareOpen, setShareOpen] = useState(false)
  const shareTriggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="panel-page">
      <PanelHeader
        action={(
          <button
            aria-label="셀렉터스샵 공유"
            className="icon-button"
            onClick={() => setShareOpen(true)}
            ref={shareTriggerRef}
            type="button"
          >
            <ShareIcon size={22} />
          </button>
        )}
        backHref="#/screens"
        title="셀렉터스샵"
      />
      <div className="screen-scroll public-shop-screen">
        <section aria-labelledby="selector-handle" className="selector-profile">
          <img
            alt={profile.badgeAlt}
            className="selector-badge"
            height="32"
            src={profile.badgeImage}
            width="32"
          />
          <h2 id="selector-handle">{profile.name}</h2>
        </section>

        <button className="me-space-button" type="button">
          {profile.meSpaceLabel}
          <ExternalLinkIcon size={17} />
        </button>

        <div className="shop-group-list">
          {state.groups.slice(0, visibleGroupCount).map((group) => (
            <ShopGroupSection group={group} key={group.id} />
          ))}
        </div>

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
        <ShopStatus status={state.status} />
      </div>
      {shareOpen ? (
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
