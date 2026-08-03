import { selectorProducts } from '../shop/shopData'

export const shopProducts = selectorProducts.slice(0, 9).map((product) => ({
  ...product,
  price: product.salePrice,
}))

export type ShopProduct = (typeof shopProducts)[number]
