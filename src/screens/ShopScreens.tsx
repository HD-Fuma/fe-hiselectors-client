import BottomAction from '../components/BottomAction'
import { CheckIcon, ChevronDownIcon, CopyIcon, ExternalLinkIcon, ShareIcon } from '../components/Icons'
import PanelHeader from '../components/PanelHeader'
import { shopProducts } from './productData'

const groups = [
  { name: '지금 입기 좋은 여름의 결', count: 6, date: '2026.08.03', images: shopProducts.slice(0, 3) },
  { name: '은은하게 오래 남는 향', count: 3, date: '2026.08.01', images: shopProducts.slice(3, 6) },
  { name: '매일을 빛내는 작은 주얼리', count: 3, date: '2026.07.28', images: shopProducts.slice(6, 9) },
] as const

export function ShopGroupsScreen() {
  return (
    <div className="panel-page">
      <PanelHeader backHref="#/screens" title="상품 그룹" />
      <div className="screen-scroll shop-groups-screen">
        <section className="shop-link-card">
          <span>내 셀렉터스샵</span>
          <strong>thehyundai.com/shop/RC000004900T</strong>
          <button aria-label="셀렉터스샵 링크 복사" type="button"><CopyIcon size={19} /> 링크 복사</button>
        </section>

        <div className="group-list-heading">
          <div><h2>상품 그룹</h2><p>생성 순서대로 셀렉터스샵에 노출됩니다.</p></div>
          <span>{groups.length}개</span>
        </div>

        <div className="group-list">
          {groups.map((group, index) => (
            <article className="group-card" key={group.name}>
              <div className="group-thumbnails">
                {group.images.map((product) => <img alt="" key={product.image} src={product.image} />)}
              </div>
              <div className="group-card-body">
                <span>GROUP {String(index + 1).padStart(2, '0')}</span>
                <strong>{group.name}</strong>
                <p>상품 {group.count}개 · {group.date} 생성</p>
              </div>
              <button aria-label={`${group.name} 메뉴`} type="button">•••</button>
            </article>
          ))}
        </div>
      </div>
      <BottomAction href="#/shop/groups/edit" label="상품 그룹 만들기" />
    </div>
  )
}

export function GroupEditorScreen() {
  const pickerProducts = shopProducts.slice(0, 5)

  return (
    <div className="panel-page">
      <PanelHeader backHref="#/shop/groups" title="상품 그룹 만들기" />
      <div className="screen-scroll group-editor-screen">
        <section className="editor-section">
          <label className="field-label" htmlFor="group-name">상품 그룹 이름</label>
          <input defaultValue="지금 입기 좋은 여름의 결" id="group-name" maxLength={30} />
          <span className="character-count">15 / 30</span>
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
                  <span>{product.price}</span>
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
