export type PublicShopLocation = {
  selectorsCode: string
  groupId: string | null
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
  const match = hash.match(/^#\/shop\/([^/]+)(?:\/([^/]+))?$/)
  if (!match || managementSegments.has(match[1])) return null

  return {
    selectorsCode: decodeSegment(match[1]),
    groupId: match[2] ? decodeSegment(match[2]) : null,
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

export function getPublicProductShareUrl(selectorsCode: string, productId: string): string {
  return `${getPublicShopShareUrl(selectorsCode)}/products/${encodeURIComponent(productId)}`
}
