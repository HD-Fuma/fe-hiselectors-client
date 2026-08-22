import { useRef, useState } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'
import DeleteGroupDialog from './DeleteGroupDialog'
import RenameGroupDialog from './RenameGroupDialog'
import ShareShopSheet from './ShareShopSheet'
import ShopGroupMenu from './ShopGroupMenu'
import { useShopDemo, type ShopDemoGroup } from './ShopDemoContext'
import ShopStatus from './ShopStatus'
import { buildPublicShopPath, getPublicShopShareUrl } from './shopRoute'

function ManagedGroupCard({ group, index }: { group: ShopDemoGroup; index: number }) {
  const { deleteGroup, getProducts, renameGroup, selectorsCode, setStatus } = useShopDemo()
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
        <strong>{selectorsCode ? <a href={buildPublicShopPath(selectorsCode, group.id)}>{group.name}</a> : group.name}</strong>
        <p>상품 {group.productIds.length}개 · {group.createdAt} 생성</p>
      </div>
      <ShopGroupMenu
        groupId={group.id}
        onDelete={() => setDeleteOpen(true)}
        onRename={() => setRenameOpen(true)}
        onShare={() => setShareOpen(true)}
        triggerRef={triggerRef}
      />
      {shareOpen && selectorsCode ? (
        <ShareShopSheet invokerRef={triggerRef} onClose={() => setShareOpen(false)} title="상품 그룹 공유" url={getPublicShopShareUrl(selectorsCode, group.id)} />
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
    </article>
  )
}

export default function ShopGroupsScreen() {
  const { isProductGroupLoading, productGroupError, profile, selectorsCode, setStatus, state } = useShopDemo()

  return (
    <div className="panel-page">
      <ScreenHeader backHref={selectorsCode ? buildPublicShopPath(selectorsCode) : '/home'} title="셀렉터스 샵 관리하기" />
      <div className="screen-scroll shop-groups-screen">
        <section className="shop-profile-manage-card">
          <div className="shop-profile-manage-avatar">
            {profile.avatarImage ? <img alt="" src={profile.avatarImage} /> : <span aria-hidden="true" />}
          </div>
          <div><span>셀렉터스 프로필</span><strong>{profile.name}</strong></div>
          <a href="/shop/profile/edit">프로필 수정</a>
        </section>
        {isProductGroupLoading ? <p className="shop-group-feedback">저장된 상품 그룹을 불러오는 중입니다.</p> : null}
        {productGroupError ? <p className="shop-group-feedback shop-group-feedback-error">{productGroupError}</p> : null}
        <div className="group-list-heading">
          <div><h2>상품 그룹</h2><p>한 그룹에는 하나의 캠페인 상품만 담을 수 있어요.</p></div>
          <span>{state.groups.length}개</span>
        </div>
        <div className="group-list">
          {state.groups.map((group, index) => <ManagedGroupCard group={group} index={index} key={group.id} />)}
        </div>
        {!isProductGroupLoading && !productGroupError && state.groups.length === 0 ? <p className="shop-group-feedback">등록된 상품 그룹이 없습니다.</p> : null}
        <ShopStatus onClose={() => setStatus(null)} status={state.status} />
      </div>
      <BottomActionBar href="/shop/groups/new" label="상품 그룹 만들기" />
    </div>
  )
}
