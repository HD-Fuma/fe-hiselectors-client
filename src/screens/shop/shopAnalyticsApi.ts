import { API_BASE_URL, authFetch } from '../../auth'

export type ShopViewPageType = 'SHOP' | 'GROUP' | 'PRODUCT'

export async function recordShopView(
  selectorsCode: string,
  pageType: ShopViewPageType,
  referenceId?: number,
): Promise<void> {
  await authFetch(`${API_BASE_URL}/api/view-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectorsCode,
      pageType,
      referenceId: referenceId ?? null,
    }),
    keepalive: true,
  })
}
