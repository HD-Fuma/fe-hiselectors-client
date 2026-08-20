import { useRef, useState } from 'react'

import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import { useShopDemo, type ShopDemoGroup } from './ShopDemoContext'

const publicShopUrl = 'https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T'

export default function OwnerGroupControls({ group }: { group: ShopDemoGroup }) {
  const { deleteGroup, renameGroup, setStatus } = useShopDemo()
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
      {shareOpen ? (
        <ShareShopSheet
          invokerRef={triggerRef}
          onClose={() => setShareOpen(false)}
          title="상품 그룹 공유"
          url={`${publicShopUrl}/${group.id}`}
        />
      ) : null}
      {renameOpen ? (
        <RenameGroupDialog
          groupName={group.name}
          invokerRef={triggerRef}
          onClose={() => setRenameOpen(false)}
          onSave={(name) => {
            renameGroup(group.id, name)
            setStatus('상품 그룹을 수정했어요.')
            setRenameOpen(false)
          }}
        />
      ) : null}
      {deleteOpen ? (
        <DeleteGroupDialog
          groupName={group.name}
          invokerRef={triggerRef}
          onClose={() => setDeleteOpen(false)}
          onConfirm={() => {
            deleteGroup(group.id)
            setStatus('상품 그룹을 삭제했어요.')
            setDeleteOpen(false)
          }}
        />
      ) : null}
    </>
  )
}
