import { useRef, useState } from 'react'

import { ShareIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import ShopGroupSection from './ShopGroupSection'
import { useShopDemo } from './ShopDemoContext'
import ShopStatus from './ShopStatus'
import { MissingShopGroup } from './GroupEditorScreen'

const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
const shopPath = '#/shop/RC000003200T'

function getGroupId() {
  return window.location.hash.match(/^#\/shop\/RC000003200T\/([^/]+)$/)?.[1] ?? ''
}

export default function OwnerShopGroupScreen() {
  const { campaigns, deleteGroup, getGroup, renameGroup, setStatus, state } = useShopDemo()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const activeShareInvokerRef = useRef<HTMLElement>(null)
  const headerShareTriggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const group = getGroup(getGroupId())
  const isOwnerView = sessionStorage.getItem('selectors-shop-view-mode') === 'owner'

  if (!group) {
    return <MissingShopGroup title="셀렉터스샵" />
  }

  return (
    <div className="panel-page">
      <ScreenHeader
        action={isOwnerView ? (
          <button
            aria-label="상품 그룹 공유"
            className="icon-button"
            onClick={() => {
              activeShareInvokerRef.current = headerShareTriggerRef.current
              setShareOpen(true)
            }}
            ref={headerShareTriggerRef}
            type="button"
          >
            <ShareIcon size={22} />
          </button>
        ) : undefined}
        backHref={shopPath}
        title="셀렉터스샵"
      />
      <div className="screen-scroll owner-shop-group-screen">
        <ShopGroupSection
          description={campaigns.find(({ id }) => id === group.campaignId)?.name}
          group={group}
          getProductShareUrl={isOwnerView
            ? (productId) => `https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T/products/${productId}`
            : undefined}
          ownerAction={isOwnerView ? (
            <ShopGroupMenu
              groupId={group.id}
              onDelete={() => setDeleteOpen(true)}
              onRename={() => setRenameOpen(true)}
              onShare={() => {
                activeShareInvokerRef.current = menuTriggerRef.current
                setShareOpen(true)
              }}
              triggerRef={menuTriggerRef}
            />
          ) : undefined}
        />
        <p className="shop-disclosure">{disclosure}</p>
        <ShopStatus status={state.status} />
      </div>
      {isOwnerView && shareOpen ? (
        <ShareShopSheet
          invokerRef={activeShareInvokerRef}
          onClose={() => setShareOpen(false)}
          title="상품 그룹 공유"
          url={`https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T/${group.id}`}
        />
      ) : null}
      {isOwnerView && renameOpen ? (
        <RenameGroupDialog
          groupName={group.name}
          invokerRef={menuTriggerRef}
          onClose={() => setRenameOpen(false)}
          onSave={(name) => {
            renameGroup(group.id, name)
            setRenameOpen(false)
          }}
        />
      ) : null}
      {isOwnerView && deleteOpen ? (
        <DeleteGroupDialog
          groupName={group.name}
          invokerRef={menuTriggerRef}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            deleteGroup(group.id)
            setStatus('상품 그룹을 삭제했어요.')
            setDeleteOpen(false)
            window.location.hash = shopPath
          }}
        />
      ) : null}
    </div>
  )
}
