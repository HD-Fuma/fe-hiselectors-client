import { useState } from 'react'

import BottomActionBar from '../../components/BottomActionBar'
import ScreenHeader from '../../components/ScreenHeader'
import GroupProductPicker from './GroupProductPicker'
import { useShopDemo, type ShopDemoGroup } from './ShopDemoContext'
import { buildPublicShopHash } from './shopRoute'
import ShopStatus from './ShopStatus'

const maxGroupProductCount = 100

export type GroupEditorMode =
  | { kind: 'create'; backHref: '#/shop/groups'; initialCampaignId: null }
  | { kind: 'edit'; groupId: string; backHref: `#/shop/${string}` }
  | {
    kind: 'campaign-create'
    backHref: `#/campaigns/${string}`
    initialCampaignId: string
  }

export function MissingShopGroup({ title }: { title: '셀렉터스샵' | '상품 그룹 편집' }) {
  const { clearQuickAddDraft, selectorsCode } = useShopDemo()
  const shopPath = selectorsCode ? buildPublicShopHash(selectorsCode) : '#/home'

  return (
    <>
      <ScreenHeader
        backHref={shopPath}
        onBack={clearQuickAddDraft}
        title={title}
      />
      <div className="screen-scroll shop-missing-group">
        <p>상품 그룹을 찾을 수 없습니다.</p>
        <a href={shopPath}>셀렉터스샵으로 돌아가기</a>
      </div>
    </>
  )
}

export function GroupEditorScreen({ mode }: { mode: GroupEditorMode }) {
  const shop = useShopDemo()
  const group = mode.kind === 'edit' ? shop.getGroup(mode.groupId) : undefined

  if (mode.kind === 'edit' && shop.isProductGroupLoading) {
    return (
      <div className="panel-page">
        <ScreenHeader backHref={mode.backHref} title="상품 그룹 편집" />
        <p className="shop-group-feedback">상품 그룹을 불러오는 중입니다.</p>
      </div>
    )
  }

  if (mode.kind === 'edit' && shop.productGroupError) {
    return (
      <div className="panel-page">
        <ScreenHeader backHref={mode.backHref} title="상품 그룹 편집" />
        <p className="shop-group-feedback shop-group-feedback-error">{shop.productGroupError}</p>
      </div>
    )
  }

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
  const [isSaving, setIsSaving] = useState(false)
  const editorTitle = mode.kind === 'edit' ? '상품 그룹 편집' : '상품 그룹 만들기'
  const groupId = mode.kind === 'edit' ? mode.groupId : ''
  const initialCampaign = mode.kind === 'campaign-create' ? mode.initialCampaignId : ''
  const selectedCampaignId = group?.campaignId || initialCampaign
  const campaignOptions = selectedCampaignId
    && !shop.campaigns.some(({ id }) => id === selectedCampaignId)
    ? [{ id: selectedCampaignId, name: `캠페인 #${selectedCampaignId}` }, ...shop.campaigns]
    : shop.campaigns
  const visibleProducts = campaignId
    ? shop.products.filter((product) => product.campaignIds.includes(campaignId))
    : []
  const visibleProductIds = new Set(visibleProducts.map(({ id }) => id))
  const selectedProductCountIsValid = selectedProductIds.length > 0
    && selectedProductIds.length <= maxGroupProductCount
  const selectedProductsBelongToCampaign = selectedProductIds.every((productId) => visibleProductIds.has(productId))
  const isCampaignCatalogReady = !shop.isCampaignCatalogLoading && !shop.campaignCatalogError
  const isCampaignLocked = mode.kind !== 'create'
  const trimmedName = name.trim()
  const canSave = !isSaving
    && isCampaignCatalogReady
    && trimmedName.length >= 1
    && trimmedName.length <= 30
    && Boolean(campaignId)
    && selectedProductCountIsValid
    && selectedProductsBelongToCampaign
  const nameError = touched && (trimmedName.length < 1 || trimmedName.length > 30)
    ? '상품 그룹 이름을 입력해 주세요.'
    : null
  const productError = touched && !nameError
    ? selectedProductIds.length === 0
      ? '상품을 1개 이상 선택해 주세요.'
      : selectedProductIds.length > maxGroupProductCount
        ? `상품은 최대 ${maxGroupProductCount}개까지 선택할 수 있어요.`
        : !selectedProductsBelongToCampaign
          ? '선택한 캠페인에 포함된 상품만 저장할 수 있어요.'
          : null
    : null
  const campaignError = touched && !nameError && !campaignId
    ? '캠페인을 선택해 주세요.'
    : null

  const handleSave = async () => {
    if (!canSave) {
      return
    }

    const input = {
      name: trimmedName,
      campaignId: campaignId || null,
      productIds: selectedProductIds,
    }

    setIsSaving(true)
    try {
      if (mode.kind === 'edit') {
        await shop.updateGroupProducts(mode.groupId, input)
        shop.setStatus('상품 그룹을 수정했어요.')
        shop.clearQuickAddDraft()
        window.location.hash = mode.backHref
        return
      }

      await shop.createGroup(input)
      shop.setStatus('상품 그룹을 만들었어요.')
      shop.clearQuickAddDraft()
      window.location.hash = mode.kind === 'campaign-create'
        ? mode.backHref
        : shop.selectorsCode ? buildPublicShopHash(shop.selectorsCode) : '#/shop/groups'
    } catch (error) {
      shop.setStatus(error instanceof Error ? error.message : '상품 그룹을 저장하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
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
            disabled={isSaving || isCampaignLocked}
            onChange={(event) => {
              setCampaignId(event.target.value)
              setSelectedProductIds([])
              setTouched(true)
            }}
            value={campaignId}
          >
            <option value="">캠페인을 선택해 주세요</option>
            {campaignOptions.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
            ))}
          </select>
          {isCampaignLocked ? (
            <p className="editor-helper">상품 그룹에는 하나의 캠페인 상품만 담을 수 있어 캠페인을 변경할 수 없어요.</p>
          ) : null}
          {campaignError ? <p className="editor-alert" role="alert">{campaignError}</p> : null}
        </section>

        <GroupProductPicker
          disabled={isSaving}
          error={shop.campaignCatalogError}
          hasCampaign={Boolean(campaignId)}
          isEditing={mode.kind === 'edit'}
          isLoading={shop.isCampaignCatalogLoading}
          maxSelectedProducts={maxGroupProductCount}
          onSelectedProductIdsChange={(productIds) => {
            setSelectedProductIds(productIds)
            setTouched(true)
          }}
          products={visibleProducts}
          selectedProductIds={selectedProductIds}
        />
        {productError ? <p className="editor-alert" role="alert">{productError}</p> : null}
        <ShopStatus onClose={() => shop.setStatus(null)} status={shop.state.status} />
      </div>
      <BottomActionBar
        disabled={!canSave}
        label={isSaving ? '저장 중' : '상품 그룹 저장하기'}
        onClick={() => void handleSave()}
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
  const { selectorsCode } = useShopDemo()

  return (
    <GroupEditorScreen
      mode={{
        kind: 'edit',
        groupId,
        backHref: selectorsCode ? buildPublicShopHash(selectorsCode, groupId) : '#/shop/groups',
      }}
    />
  )
}

export function GroupCampaignCreateScreen() {
  const campaignId = window.location.hash.match(/^#\/shop\/groups\/new\/campaign\/([^/]+)$/)?.[1] ?? ''

  return (
    <GroupEditorScreen
      mode={{
        kind: 'campaign-create',
        backHref: `#/campaigns/${campaignId}`,
        initialCampaignId: campaignId,
      }}
    />
  )
}
