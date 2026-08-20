import { useRef, useState } from 'react'

import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import { useShopDemo, type ShopDemoGroup } from './ShopDemoContext'
import { getPublicShopShareUrl } from './shopRoute'

export default function OwnerGroupControls({ group }: { group: ShopDemoGroup }) {
  const { deleteGroup, renameGroup, selectorsCode, setStatus } = useShopDemo()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      <ShopGroupMenu
        groupId={group.id}
        onDelete={() => setDeleteOpen(true)}
        onRename={() => setRenameOpen(true)}
        onShare={() => setShareOpen(true)}
        triggerRef={triggerRef}
      />
      {shareOpen && selectorsCode ? (
        <ShareShopSheet
          invokerRef={triggerRef}
          onClose={() => setShareOpen(false)}
          title="상품 그룹 공유"
          url={getPublicShopShareUrl(selectorsCode, group.id)}
        />
      ) : null}
      {renameOpen ? (
        <RenameGroupDialog
          groupName={group.name}
          invokerRef={triggerRef}
          onClose={() => setRenameOpen(false)}
          onSave={(name) => {
            void renameGroup(group.id, name).then(() => {
              setStatus('상품 그룹을 수정했어요.')
              setRenameOpen(false)
            }).catch((error) => setStatus(error instanceof Error ? error.message : '상품 그룹을 수정하지 못했습니다.'))
          }}
        />
      ) : null}
      {deleteOpen ? (
        <DeleteGroupDialog
          groupName={group.name}
          invokerRef={triggerRef}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            void deleteGroup(group.id).then(() => {
              setStatus('상품 그룹을 삭제했어요.')
              setDeleteOpen(false)
            }).catch((error) => setStatus(error instanceof Error ? error.message : '상품 그룹을 삭제하지 못했습니다.'))
          }}
        />
      ) : null}
    </>
  )
}
