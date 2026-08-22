import { useRef, useState } from 'react'

import { ShareIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import { navigate } from '../../navigation'
import { canManageSelectorOperations, readAuthSession } from '../../auth'
import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import ShopGroupSection from './ShopGroupSection'
import { useShopDemo } from './ShopDemoContext'
import ShopStatus from './ShopStatus'
import { MissingShopGroup } from './GroupEditorScreen'
import { buildPublicShopPath, getPublicProductShareUrl, getPublicShopShareUrl, parsePublicShopPath } from './shopRoute'
import { useShopViewLog } from './useShopViewLog'

const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
export default function OwnerShopGroupScreen() {
  const { campaigns, deleteGroup, getGroup, isProductGroupLoading, ownedSelectorsCode, productGroupError, renameGroup, selectorsCode: loadedSelectorsCode, setStatus, state } = useShopDemo()
  const location = parsePublicShopPath(window.location.pathname)
  const selectorsCode = location?.selectorsCode ?? ''
  const shopPath = buildPublicShopPath(selectorsCode)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const activeShareInvokerRef = useRef<HTMLElement>(null)
  const headerShareTriggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const group = getGroup(location?.groupId ?? '')
  const session = readAuthSession()
  const isOwnerView = canManageSelectorOperations(session)
    && Boolean(ownedSelectorsCode)
    && ownedSelectorsCode === selectorsCode
    && sessionStorage.getItem('selectors-shop-view-mode') === 'owner'
  useShopViewLog(selectorsCode, 'GROUP', group ? Number(group.id) : undefined, Boolean(group) && !productGroupError)

  if (productGroupError) {
    return <><ScreenHeader backHref={shopPath} title="셀렉터스샵" /><p className="shop-group-feedback shop-group-feedback-error">{productGroupError}</p></>
  }
  if (isProductGroupLoading || loadedSelectorsCode !== selectorsCode) {
    return <><ScreenHeader backHref={shopPath} title="셀렉터스샵" /><p className="shop-group-feedback">상품 그룹을 불러오는 중입니다.</p></>
  }
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
            ? (productId) => getPublicProductShareUrl(selectorsCode, productId)
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
        {isOwnerView ? <ShopStatus onClose={() => setStatus(null)} status={state.status} /> : null}
      </div>
      {isOwnerView && shareOpen ? (
        <ShareShopSheet
          invokerRef={activeShareInvokerRef}
          onClose={() => setShareOpen(false)}
          title="상품 그룹 공유"
          url={getPublicShopShareUrl(selectorsCode, group.id)}
        />
      ) : null}
      {isOwnerView && renameOpen ? (
        <RenameGroupDialog
          groupName={group.name}
          invokerRef={menuTriggerRef}
          onClose={() => setRenameOpen(false)}
          onSave={(name) => {
            void renameGroup(group.id, name).then(() => {
              setStatus('상품 그룹을 수정했어요.')
              setRenameOpen(false)
            }).catch((error) => setStatus(error instanceof Error ? error.message : '상품 그룹을 수정하지 못했습니다.'))
          }}
        />
      ) : null}
      {isOwnerView && deleteOpen ? (
        <DeleteGroupDialog
          groupName={group.name}
          invokerRef={menuTriggerRef}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            void deleteGroup(group.id).then(() => {
              setStatus('상품 그룹을 삭제했어요.')
              setDeleteOpen(false)
              navigate(shopPath)
            }).catch((error) => setStatus(error instanceof Error ? error.message : '상품 그룹을 삭제하지 못했습니다.'))
          }}
        />
      ) : null}
    </div>
  )
}
