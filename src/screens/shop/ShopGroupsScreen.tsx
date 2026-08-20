import { useRef, useState } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'
import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import { useShopDemo, type ShopDemoGroup } from './ShopDemoContext'
import ShopStatus from './ShopStatus'

const publicShopUrl = 'https://hi.thehyundai.com/sellectors/manage/shop/RC000003200T'

function ManagedGroupCard({ group, index }: { group: ShopDemoGroup; index: number }) {
  const { deleteGroup, getProducts, renameGroup, setStatus } = useShopDemo()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <article className="group-card">
      <div className="group-thumbnails">
        {getProducts(group.productIds).slice(0, 3).map((product) => (
          <img alt="" key={product.image} src={product.image} />
        ))}
      </div>
      <div className="group-card-body">
        <span>GROUP {String(index + 1).padStart(2, '0')}</span>
        <strong><a href={`#/shop/RC000003200T/${group.id}`}>{group.name}</a></strong>
        <p>상품 {group.productIds.length}개 · {group.createdAt} 생성</p>
      </div>
      <ShopGroupMenu
        groupId={group.id}
        onDelete={() => setDeleteOpen(true)}
        onRename={() => setRenameOpen(true)}
        onShare={() => setShareOpen(true)}
        triggerRef={triggerRef}
      />
      {shareOpen ? (
        <ShareShopSheet invokerRef={triggerRef} onClose={() => setShareOpen(false)} title="상품 그룹 공유" url={`${publicShopUrl}/${group.id}`} />
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
    </article>
  )
}

export default function ShopGroupsScreen() {
  const { profile, state } = useShopDemo()

  return (
    <div className="panel-page">
      <ScreenHeader backHref="#/shop/RC000003200T" title="셀렉터스 샵 관리하기" />
      <div className="screen-scroll shop-groups-screen">
        <section className="shop-profile-manage-card">
          <div className="shop-profile-manage-avatar">
            {profile.avatarImage ? <img alt="" src={profile.avatarImage} /> : <span aria-hidden="true" />}
          </div>
          <div><span>셀렉터스 프로필</span><strong>{profile.name}</strong></div>
          <a href="#/shop/profile/edit">프로필 수정</a>
        </section>
        <div className="group-list-heading">
          <div><h2>상품 그룹</h2><p>한 그룹에는 하나의 캠페인 상품만 담을 수 있어요.</p></div>
          <span>{state.groups.length}개</span>
        </div>
        <div className="group-list">
          {state.groups.map((group, index) => <ManagedGroupCard group={group} index={index} key={group.id} />)}
        </div>
        <ShopStatus status={state.status} />
      </div>
      <BottomActionBar href="#/shop/groups/new" label="상품 그룹 만들기" />
    </div>
  )
}
