import { API_BASE_URL, authFetch } from '../../auth'

export type PurchaseResult = {
  purchaseHistoryId: number
  orderNo: string
  paidAmount: number
  status: string
}

export async function purchaseProduct(
  selectorsCode: string,
  productCode: string,
  quantity: number,
): Promise<PurchaseResult> {
  const response = await authFetch(`${API_BASE_URL}/api/purchases/me`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selectorsCode, productCode, quantity }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.message || '구매를 기록하지 못했습니다.')
  }
  return (payload?.data ?? payload) as PurchaseResult
}
