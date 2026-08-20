import { useEffect, useState } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'
import GroupProductPicker from './GroupProductPicker'
import { useShopDemo, type ShopDemoGroup } from './ShopDemoContext'

export type GroupEditorMode =
  | { kind: 'create'; backHref: '#/shop/groups'; initialCampaignId: null }
  | { kind: 'edit'; groupId: string; backHref: `#/shop/RC000003200T/${string}` }
  | {
    kind: 'campaign-create'
    backHref: '#/campaigns/detail'
    initialCampaignId: 'season-pick'
  }

export function MissingShopGroup({ title }: { title: '셀렉터스샵' | '상품 그룹 편집' }) {
  const { clearQuickAddDraft } = useShopDemo()

  return (
    <>
      <ScreenHeader
        backHref="#/shop/RC000003200T"
        onBack={clearQuickAddDraft}
        title={title}
      />
      <div className="screen-scroll shop-missing-group">
        <p>상품 그룹을 찾을 수 없습니다.</p>
        <a href="#/shop/RC000003200T">셀렉터스샵으로 돌아가기</a>
      </div>
    </>
  )
}

export function GroupEditorScreen({ mode }: { mode: GroupEditorMode }) {
  const shop = useShopDemo()
  const group = mode.kind === 'edit' ? shop.getGroup(mode.groupId) : undefined

  if (mode.kind === 'edit' && !group) {
    return <MissingShopGroup title="상품 그룹 편집" />
  }

  return <GroupEditorForm group={group} mode={mode} />
}

function GroupEditorForm({
  group,
  mode,
}: {
  group: ShopDemoGroup | undefined
  mode: GroupEditorMode
}) {
  const shop = useShopDemo()
  const { clearQuickAddDraft } = shop
  const modeKind = mode.kind
  const campaignCreateId = mode.kind === 'campaign-create'
    ? mode.initialCampaignId
    : ''
  const [quickAddDraft] = useState(() => {
    const draft = shop.state.quickAddDraft

    if (
      mode.kind !== 'campaign-create'
      || draft?.campaignId !== mode.initialCampaignId
    ) {
      return null
    }

    return {
      campaignId: draft.campaignId,
      productIds: [...draft.productIds],
    }
  })
  const initialCampaignId = mode.kind === 'edit'
    ? group?.campaignId ?? ''
    : mode.kind === 'campaign-create'
      ? mode.initialCampaignId
      : ''
  const [name, setName] = useState(group?.name ?? '')
  const [campaignId, setCampaignId] = useState(initialCampaignId)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    group
      ? [...group.productIds]
      : quickAddDraft
        ? [...quickAddDraft.productIds]
        : [],
  )
  const [touched, setTouched] = useState(false)
  const editorTitle = mode.kind === 'edit' ? '상품 그룹 편집' : '상품 그룹 만들기'
  const groupId = mode.kind === 'edit' ? mode.groupId : ''
  const initialCampaign = mode.kind === 'campaign-create' ? mode.initialCampaignId : ''
  const visibleProducts = campaignId
    ? shop.products.filter((product) => product.campaignIds.includes(campaignId))
    : []
  const trimmedName = name.trim()
  const canSave = trimmedName.length >= 1
    && trimmedName.length <= 30
    && Boolean(campaignId)
    && selectedProductIds.length >= 1
  const nameError = touched && (trimmedName.length < 1 || trimmedName.length > 30)
    ? '상품 그룹 이름을 입력해 주세요.'
    : null
  const productError = touched && !nameError && selectedProductIds.length === 0
    ? '상품을 1개 이상 선택해 주세요.'
    : null
  const campaignError = touched && !nameError && !campaignId
    ? '캠페인을 선택해 주세요.'
    : null

  useEffect(() => {
    if (modeKind === 'campaign-create') {
      clearQuickAddDraft()
    }
  }, [campaignCreateId, clearQuickAddDraft, modeKind])

  const handleSave = () => {
    if (!canSave) {
      return
    }

    const input = {
      name: trimmedName,
      campaignId: campaignId || null,
      productIds: selectedProductIds,
    }

    if (mode.kind === 'edit') {
      shop.updateGroupProducts(mode.groupId, input)
      shop.setStatus('상품 그룹을 수정했어요.')
      shop.clearQuickAddDraft()
      window.location.hash = mode.backHref
      return
    }

    shop.createGroup(input)
    shop.setStatus('상품 그룹을 만들었어요.')
    shop.clearQuickAddDraft()
    window.location.hash = '#/shop/RC000003200T'
  }

  return (
    <div
      className="panel-page"
      data-editor-mode={mode.kind}
      data-group-id={groupId}
      data-initial-campaign={initialCampaign}
    >
      <ScreenHeader
        backHref={mode.backHref}
        onBack={shop.clearQuickAddDraft}
        title={editorTitle}
      />
      <div className="screen-scroll group-editor-screen">
        <section className="editor-section">
          <label className="field-label" htmlFor="group-name">상품 그룹 이름</label>
          <input
            aria-describedby={nameError
              ? 'group-name-count group-name-error'
              : 'group-name-count'}
            aria-invalid={nameError ? true : undefined}
            id="group-name"
            maxLength={30}
            onChange={(event) => {
              setName(event.target.value)
              setTouched(true)
            }}
            value={name}
          />
          <span className="character-count" id="group-name-count">{name.length} / 30</span>
          {nameError ? (
            <p className="editor-alert" id="group-name-error" role="alert">{nameError}</p>
          ) : null}
        </section>

        <section className="editor-section campaign-select-section">
          <label className="field-label" htmlFor="campaign-filter">캠페인 선택</label>
          <select
            id="campaign-filter"
            aria-invalid={campaignError ? true : undefined}
            onChange={(event) => {
              setCampaignId(event.target.value)
              setSelectedProductIds([])
              setTouched(true)
            }}
            value={campaignId}
          >
            <option value="">캠페인을 선택해 주세요</option>
            {shop.campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
          {campaignError ? <p className="editor-alert" role="alert">{campaignError}</p> : null}
        </section>

        <GroupProductPicker
          onSelectedProductIdsChange={(productIds) => {
            setSelectedProductIds(productIds)
            setTouched(true)
          }}
          products={visibleProducts}
          selectedProductIds={selectedProductIds}
        />
        {productError ? <p className="editor-alert" role="alert">{productError}</p> : null}
      </div>
      <BottomActionBar
        disabled={!canSave}
        label="상품 그룹 저장하기"
        onClick={handleSave}
      />
    </div>
  )
}

export function GroupCreateScreen() {
  return (
    <GroupEditorScreen
      mode={{
        kind: 'create',
        backHref: '#/shop/groups',
        initialCampaignId: null,
      }}
    />
  )
}

export function GroupEditScreen() {
  const groupId = window.location.hash.match(/^#\/shop\/groups\/([^/]+)\/edit$/)?.[1] ?? ''

  return (
    <GroupEditorScreen
      mode={{
        kind: 'edit',
        groupId,
        backHref: `#/shop/RC000003200T/${groupId}`,
      }}
    />
  )
}

export function GroupCampaignCreateScreen() {
  return (
    <GroupEditorScreen
      mode={{
        kind: 'campaign-create',
        backHref: '#/campaigns/detail',
        initialCampaignId: 'season-pick',
      }}
    />
  )
}
