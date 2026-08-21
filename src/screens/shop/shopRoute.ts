export type PublicShopLocation = {
  selectorsCode: string
  groupId: string | null
  productId: string | null
}

export type ProductDetailLocation = {
  productCode: string
  selectorsCode: string
}

const SHOP_CODE_STORAGE_KEY = 'selectors-shop-code'
export const DEFAULT_SELECTORS_CODE = 'SEL-2602-005'
const managementSegments = new Set(['groups', 'profile'])

function decodeSegment(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function parsePublicShopHash(hash: string): PublicShopLocation | null {
  const productMatch = hash.match(/^#\/shop\/([^/]+)\/products\/([^/]+)$/)
  if (productMatch && !managementSegments.has(productMatch[1])) {
    return {
      selectorsCode: decodeSegment(productMatch[1]),
      groupId: null,
      productId: decodeSegment(productMatch[2]),
    }
  }
  const match = hash.match(/^#\/shop\/([^/]+)(?:\/([^/]+))?$/)
  if (!match || managementSegments.has(match[1])) return null

  return {
    selectorsCode: decodeSegment(match[1]),
    groupId: match[2] ? decodeSegment(match[2]) : null,
    productId: null,
  }
}

export function buildPublicShopHash(selectorsCode: string, groupId?: string): `#/shop/${string}` {
  const base = `#/shop/${encodeURIComponent(selectorsCode)}` as const
  return groupId ? `${base}/${encodeURIComponent(groupId)}` : base
}

export function rememberSelectorsCode(selectorsCode: string) {
  sessionStorage.setItem(SHOP_CODE_STORAGE_KEY, selectorsCode)
}

export function readRememberedSelectorsCode(): string {
  return sessionStorage.getItem(SHOP_CODE_STORAGE_KEY) ?? DEFAULT_SELECTORS_CODE
}

export function getPublicShopShareUrl(selectorsCode: string, groupId?: string): string {
  const url = new URL(window.location.href)
  url.hash = buildPublicShopHash(selectorsCode, groupId)
  return url.toString()
}

export function getPublicProductShareUrl(selectorsCode: string, productCode: string): string {
  return buildPublicProductUrl(productCode, selectorsCode)
}

export function buildPublicProductUrl(productCode: string, selectorsCode: string): string {
  const url = new URL(`/product/${encodeURIComponent(productCode)}`, window.location.origin)
  url.searchParams.set('ptrsRefCd', selectorsCode)
  return url.toString()
}

export function parseProductDetailLocation(): ProductDetailLocation | null {
  const pathMatch = window.location.pathname.match(/\/product\/([^/]+)\/?$/)
  if (pathMatch) {
    const selectorsCode = new URLSearchParams(window.location.search).get('ptrsRefCd')
    return selectorsCode ? { productCode: decodeSegment(pathMatch[1]), selectorsCode } : null
  }

  const hashMatch = window.location.hash.match(/^#\/product\/([^?]+)(?:\?(.*))?$/)
  if (!hashMatch) return null
  const selectorsCode = new URLSearchParams(hashMatch[2] ?? '').get('ptrsRefCd')
  return selectorsCode ? { productCode: decodeSegment(hashMatch[1]), selectorsCode } : null
}
