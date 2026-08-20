import { API_BASE_URL, authFetch } from '../../auth'
import type { CampaignApiProduct } from '../campaigns/campaignApi'

export type ProductGroupApiResponse = {
  id: number
  selectorsId: number
  campaignId: number
  groupNo: number
  title: string
  createdAt: string
  products: CampaignApiProduct[]
}

export type ProductGroupSavePayload = {
  campaignId: number
  title: string
  productIds: number[]
}

export type PublicShopApiResponse = {
  selectorsCode: string
  nickname: string
  profileImageUrl: string | null
  groups: ProductGroupApiResponse[]
}

export type MyShopApiResponse = PublicShopApiResponse & {
  generationName: string | null
  userName: string | null
  snsId: string | null
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new Error(payload?.message || '상품 그룹 요청을 처리하지 못했습니다.')
  }
  if (response.status === 204) return undefined as T
  return unwrap<T>(await response.json())
}

const jsonHeaders = { 'Content-Type': 'application/json' }

export function getMyProductGroups() {
  return request<ProductGroupApiResponse[]>('/api/product-groups/me')
}

export function getMyShop() {
  return request<MyShopApiResponse>('/api/product-groups/me/shop')
}

export function getPublicProductGroups(selectorsCode: string) {
  return request<ProductGroupApiResponse[]>(`/api/shops/${encodeURIComponent(selectorsCode)}/product-groups`)
}

export async function getPublicShop(selectorsCode: string): Promise<PublicShopApiResponse> {
  try {
    return await request<PublicShopApiResponse>(`/api/shops/${encodeURIComponent(selectorsCode)}`)
  } catch (error) {
    // Older backend deployments expose the group endpoint only. Keep it usable,
    // but do not invent profile or product-group data when both requests fail.
    const groups = await getPublicProductGroups(selectorsCode).catch(() => { throw error })
    return { selectorsCode, nickname: selectorsCode, profileImageUrl: null, groups }
  }
}

export function createProductGroup(payload: ProductGroupSavePayload) {
  return request<ProductGroupApiResponse>('/api/product-groups', {
    method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload),
  })
}

export function updateProductGroup(groupId: string, payload: ProductGroupSavePayload) {
  return request<ProductGroupApiResponse>(`/api/product-groups/${groupId}`, {
    method: 'PUT', headers: jsonHeaders, body: JSON.stringify(payload),
  })
}

export function addProductGroupItems(groupId: string, productIds: number[]) {
  return request<ProductGroupApiResponse>(`/api/product-groups/${groupId}/items`, {
    method: 'POST', headers: jsonHeaders, body: JSON.stringify({ productIds }),
  })
}

export function deleteProductGroup(groupId: string) {
  return request<void>(`/api/product-groups/${groupId}`, { method: 'DELETE' })
}
