import BottomAction from '../components/BottomAction'
import { CopyIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'
import { useShopDemo } from '../shop/ShopDemoContext'
import {
  GroupCampaignCreateScreen,
  GroupCreateScreen,
  GroupEditScreen,
  MissingShopGroup,
} from './shop/GroupEditorScreen'
import PublicShopScreen from './shop/PublicShopScreen'

export { GroupCampaignCreateScreen, GroupCreateScreen, GroupEditScreen, PublicShopScreen }

export function ShopGroupsScreen() {
  const { getProducts, state } = useShopDemo()

  return (
    <div className="panel-page">
      <PanelHeader backHref="#/screens" title="상품 그룹" />
      <div className="screen-scroll shop-groups-screen">
        <section className="shop-link-card">
          <span>내 셀렉터스샵</span>
          <strong>thehyundai.com/shop/RC000003200T</strong>
          <button aria-label="셀렉터스샵 링크 복사" type="button"><CopyIcon size={19} /> 링크 복사</button>
        </section>

        <div className="group-list-heading">
          <div><h2>상품 그룹</h2><p>생성 순서대로 셀렉터스샵에 노출됩니다.</p></div>
          <span>{state.groups.length}개</span>
        </div>

        <div className="group-list">
          {state.groups.map((group, index) => (
            <article className="group-card" key={group.id}>
              <div className="group-thumbnails">
                {getProducts(group.productIds).slice(0, 3).map((product) => (
                  <img alt="" key={product.image} src={product.image} />
                ))}
              </div>
              <div className="group-card-body">
                <span>GROUP {String(index + 1).padStart(2, '0')}</span>
                <strong>
                  {group.id === '1'
                    ? <a href="#/shop/RC000003200T/1">{group.name}</a>
                    : group.name}
                </strong>
                <p>상품 {group.productIds.length}개 · {group.createdAt} 생성</p>
              </div>
              <button aria-label={`${group.name} 메뉴`} type="button">•••</button>
            </article>
          ))}
        </div>
      </div>
      <BottomAction href="#/shop/groups/new" label="상품 그룹 만들기" />
    </div>
  )
}

export function OwnerShopGroupScreen() {
  const { getGroup, getProducts } = useShopDemo()
  const group = getGroup('1')

  if (!group) {
    return <MissingShopGroup title="셀렉터스샵" />
  }

  return (
    <>
      <PanelHeader backHref="#/shop/RC000003200T" title="셀렉터스샵" />
      <div className="screen-scroll owner-shop-group-screen">
        <section className="shop-category">
          <div className="shop-category-heading"><h2>{group.name}</h2></div>
          <div className="public-product-grid">
            {getProducts(group.productIds).map((product) => (
              <article className="public-product" key={product.id}>
                <img alt={product.name} src={product.image} />
                <span>{product.brand}</span>
                <strong>{product.name}</strong>
                <b>{product.salePrice}</b>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
