import { useRef, useState } from 'react'

import { ShareIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import ShopGroupSection from './ShopGroupSection'
import { useShopDemo } from './ShopDemoContext'
import ShopProfile from './ShopProfile'
import ShopStatus from './ShopStatus'
import { MissingShopGroup } from './GroupEditorScreen'

const disclosure = '셀렉터스샵에서 상품을 구매하는 경우, 상품 구매로 발생한 수익의 일부가 셀렉터스에게 제공됩니다.'
const shareUrl = 'https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T/1'

export default function OwnerShopGroupScreen() {
  const { deleteGroup, getGroup, renameGroup, setStatus, state } = useShopDemo()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const activeShareInvokerRef = useRef<HTMLElement>(null)
  const headerShareTriggerRef = useRef<HTMLButtonElement>(null)
  const menuTriggerRef = useRef<HTMLButtonElement>(null)
  const group = getGroup('1')

  if (!group) {
    return <MissingShopGroup title="셀렉터스샵" />
  }

  return (
    <div className="panel-page">
      <ScreenHeader
        action={(
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
        )}
        backHref="#/shop/RC000003200T"
        title="셀렉터스샵"
      />
      <div className="screen-scroll owner-shop-group-screen">
        <ShopProfile manageHref="#/shop/groups/1/edit" />
        <ShopGroupSection
          group={group}
          ownerAction={(
            <ShopGroupMenu
              onDelete={() => setDeleteOpen(true)}
              onRename={() => setRenameOpen(true)}
              onShare={() => {
                activeShareInvokerRef.current = menuTriggerRef.current
                setShareOpen(true)
              }}
              triggerRef={menuTriggerRef}
            />
          )}
        />
        <p className="shop-disclosure">{disclosure}</p>
        <ShopStatus status={state.status} />
      </div>
      {shareOpen ? (
        <ShareShopSheet
          invokerRef={activeShareInvokerRef}
          onClose={() => setShareOpen(false)}
          title="상품 그룹 공유"
          url={shareUrl}
        />
      ) : null}
      {renameOpen ? (
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
      {deleteOpen ? (
        <DeleteGroupDialog
          groupName={group.name}
          invokerRef={menuTriggerRef}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            deleteGroup(group.id)
            setStatus('상품 그룹을 삭제했어요.')
            setDeleteOpen(false)
            window.location.hash = '#/shop/RC000003200T'
          }}
        />
      ) : null}
    </div>
  )
}
