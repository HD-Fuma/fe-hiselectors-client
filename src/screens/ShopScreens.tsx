import BottomAction from '../components/BottomAction'
import { CopyIcon, ExternalLinkIcon, ShareIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'
import { useShopDemo } from '../shop/ShopDemoContext'
import { shopProducts } from './productData'
import {
  GroupCampaignCreateScreen,
  GroupCreateScreen,
  GroupEditScreen,
  MissingShopGroup,
} from './shop/GroupEditorScreen'

export { GroupCampaignCreateScreen, GroupCreateScreen, GroupEditScreen }

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

export function PublicShopScreen() {
  const categories = ['패션', '뷰티', '주얼리'] as const

  return (
    <>
      <PanelHeader
        action={<button aria-label="셀렉터스샵 공유" className="icon-button" type="button"><ShareIcon size={22} /></button>}
        backHref="#/screens"
        title="셀렉터스샵"
      />
      <div className="screen-scroll public-shop-screen">
        <section className="selector-profile">
          <div className="selector-avatar">Hi</div>
          <h2>오셀렉터스</h2>
        </section>

        <button className="me-space-button" type="button">ME스페이스에서 오셀렉터스 만나기 <ExternalLinkIcon size={17} /></button>

        {categories.map((category) => {
          const products = shopProducts.filter((product) => product.category === category)
          return (
            <section className="shop-category" key={category}>
              <div className="shop-category-heading"><h2>{category}</h2></div>
              <div className="public-product-grid">
                {products.map((product) => (
                  <article className="public-product" key={product.name}>
                    <img alt={product.name} src={product.image} />
                    <span>{product.brand}</span>
                    <strong>{product.name}</strong>
                    <b>{product.price}</b>
                  </article>
                ))}
              </div>
            </section>
          )
        })}

        <footer className="shop-footer">
          <strong>SELECTORS SHOP</strong>
          <p>본 페이지의 상품 정보와 가격은 판매처 사정에 따라 변경될 수 있습니다. 주문 및 배송은 현대백화점 공식 온라인몰에서 진행됩니다.</p>
          <span>© HYUNDAI DEPARTMENT STORE. ALL RIGHTS RESERVED.</span>
        </footer>
      </div>
    </>
  )
}
