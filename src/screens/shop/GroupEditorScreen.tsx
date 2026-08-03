import BottomAction from '../../components/BottomAction'
import { CheckIcon, ChevronDownIcon } from '../../components/Icons'
import PanelHeader from '../../components/PanelHeader'
import { useShopDemo } from '../../shop/ShopDemoContext'

export type GroupEditorMode =
  | { kind: 'create'; backHref: '#/shop/groups'; initialCampaignId: null }
  | { kind: 'edit'; groupId: '1'; backHref: '#/shop/RC000003200T/1' }
  | {
    kind: 'campaign-create'
    backHref: '#/campaigns/detail'
    initialCampaignId: 'season-pick'
  }

export function MissingShopGroup({ title }: { title: '셀렉터스샵' | '상품 그룹 편집' }) {
  return (
    <>
      <PanelHeader backHref="#/shop/RC000003200T" title={title} />
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

  const editorTitle = mode.kind === 'edit' ? '상품 그룹 편집' : '상품 그룹 만들기'
  const groupId = mode.kind === 'edit' ? mode.groupId : ''
  const initialCampaign = mode.kind === 'campaign-create'
    ? mode.initialCampaignId
    : ''
  const initialName = group?.name ?? ''
  const pickerProducts = shop.products.slice(0, 5)

  return (
    <div
      className="panel-page"
      data-editor-mode={mode.kind}
      data-group-id={groupId}
      data-initial-campaign={initialCampaign}
    >
      <PanelHeader backHref={mode.backHref} title={editorTitle} />
      <div className="screen-scroll group-editor-screen">
        <section className="editor-section">
          <label className="field-label" htmlFor="group-name">상품 그룹 이름</label>
          <input defaultValue={initialName} id="group-name" maxLength={30} />
          <span className="character-count">{initialName.length} / 30</span>
        </section>

        <section className="editor-section campaign-select-section">
          <h2>캠페인 선택</h2>
          <button className="campaign-select-button" type="button">
            <span><small>선택한 캠페인</small><strong>여름의 결을 고르는 시즌 픽</strong></span>
            <ChevronDownIcon size={19} />
          </button>
        </section>

        <section className="editor-section product-picker-section">
          <div className="picker-heading">
            <div><h2>캠페인 상품 선택</h2><p>셀렉터스샵에 소개할 상품을 선택해 주세요.</p></div>
            <span>3개 선택</span>
          </div>
          <div className="picker-list">
            {pickerProducts.map((product, index) => (
              <label className="picker-row" key={product.name}>
                <input defaultChecked={index < 3} type="checkbox" />
                <span className="product-check"><CheckIcon size={17} /></span>
                <img alt={product.name} src={product.image} />
                <span className="picker-product-copy">
                  <small>{product.brand}</small>
                  <strong>{product.name}</strong>
                  <span>{product.salePrice}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <BottomAction label="상품 그룹 저장하기" />
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
  return (
    <GroupEditorScreen
      mode={{
        kind: 'edit',
        groupId: '1',
        backHref: '#/shop/RC000003200T/1',
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
