import { API_BASE_URL, authFetch } from '../../auth'

export type CampaignApiSummary = {
  id: number
  title: string
  description: string
  startDate: string
  endDate: string
  thumbnailUrl: string
  status: 'ACTIVE' | 'SCHEDULED' | 'ENDED'
  brands: string[]
}

export type CampaignApiProduct = {
  id: number
  code: string
  name: string
  brand: string
  category: string
  regularPrice: number
  salePrice: number
  status: string
  thumbnailUrl: string
  detailUrl: string
}

export type CampaignApiDetail = Omit<CampaignApiSummary, 'brands'> & {
  products: CampaignApiProduct[]
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

async function request<T>(path: string): Promise<T> {
  const response = await authFetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error('캠페인 정보를 불러오지 못했습니다.')
  }
  return unwrap<T>(await response.json())
}

export function getCampaigns(): Promise<CampaignApiSummary[]> {
  return request('/api/campaigns')
}

export function getCampaignDetail(campaignId: number): Promise<CampaignApiDetail> {
  return request(`/api/campaigns/${campaignId}`)
}
