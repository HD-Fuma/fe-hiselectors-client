import BottomActionBar from '../../components/BottomActionBar'
import { CopyIcon, MoreIcon } from '../../components/Icons'
import ScreenHeader from '../../components/ScreenHeader'
import MainNavigation from '../../components/layout/MainNavigation'
import { useShopDemo } from './ShopDemoContext'

export default function ShopGroupsScreen() {
  const { getProducts, state } = useShopDemo()

  return (
    <div className="panel-page">
      <ScreenHeader title="상품 그룹" />
      <MainNavigation current="shop" />
      <div className="screen-scroll shop-groups-screen">
        <section className="shop-link-card">
          <span>내 셀렉터스샵</span>
          <strong>thehyundai.com/shop/RC000003200T</strong>
          <button aria-label="셀렉터스샵 링크 복사" type="button">
            <CopyIcon size={19} /> 링크 복사
          </button>
        </section>

        <div className="group-list-heading">
          <div>
            <h2>상품 그룹</h2>
            <p>생성 순서대로 셀렉터스샵에 노출됩니다.</p>
          </div>
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
                  <a href={`#/shop/RC000003200T/${group.id}`}>{group.name}</a>
                </strong>
                <p>상품 {group.productIds.length}개 · {group.createdAt} 생성</p>
              </div>
              <button aria-label={`${group.name} 메뉴`} type="button"><MoreIcon size={24} /></button>
            </article>
          ))}
        </div>
      </div>
      <BottomActionBar href="#/shop/groups/new" label="상품 그룹 만들기" />
    </div>
  )
}
