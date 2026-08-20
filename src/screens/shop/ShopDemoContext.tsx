import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  initialShopGroups,
  selectorProducts,
  selectorProfile,
  shopCampaigns,
  type SelectorProfile,
  type ShopCampaign,
  type ShopGroup,
  type ShopProduct,
} from './shopData'
import { getCampaignDetail, getCampaigns } from '../campaigns/campaignApi'
import { canManageSelectorOperations, canViewSelectorShop, readAuthSession } from '../../auth'
import {
  addProductGroupItems,
  createProductGroup,
  deleteProductGroup,
  getMyShop,
  getPublicShop,
  updateProductGroup,
  type MyShopApiResponse,
  type ProductGroupApiResponse,
} from './productGroupApi'
import { parsePublicShopHash, readRememberedSelectorsCode, rememberSelectorsCode } from './shopRoute'

export type ShopDemoGroup = Omit<ShopGroup, 'productIds'> & { productIds: string[] }

export type QuickAddDraft = {
  campaignId: string
  productIds: string[]
}

export type ShopDemoState = {
  profile: SelectorProfile
  groups: ShopDemoGroup[]
  status: string | null
  quickAddDraft: QuickAddDraft | null
  nextGroupSerial: number
}

export type GroupInput = {
  name: string
  campaignId: string | null
  productIds: string[]
}

export type OwnedShopProfileMeta = {
  readonly generationName: string | null
  readonly userName: string | null
  readonly snsId: string | null
}

export type ShopDemoAction =
  | { type: 'hydrateGroups'; groups: ShopDemoGroup[] }
  | { type: 'hydrateProfile'; profile: SelectorProfile }
  | { type: 'upsertGroup'; group: ShopDemoGroup }
  | { type: 'updateProfile'; name: string; avatarImage: string }
  | { type: 'renameGroup'; groupId: string; name: string }
  | { type: 'updateGroupProducts'; groupId: string; input: GroupInput }
  | { type: 'createGroup'; input: GroupInput }
  | { type: 'addProductsToGroup'; groupId: string; productIds: string[] }
  | { type: 'deleteGroup'; groupId: string }
  | { type: 'setQuickAddDraft'; draft: QuickAddDraft }
  | { type: 'clearQuickAddDraft' }
  | { type: 'setStatus'; status: string | null }

export type ShopDemoContextValue = {
  readonly state: ShopDemoState
  readonly profile: SelectorProfile
  readonly selectorsCode: string | null
  readonly ownedSelectorsCode: string | null
  readonly ownedProfileMeta: OwnedShopProfileMeta
  readonly products: readonly ShopProduct[]
  readonly campaigns: readonly ShopCampaign[]
  readonly isCampaignCatalogLoading: boolean
  readonly campaignCatalogError: string | null
  readonly isProductGroupLoading: boolean
  readonly productGroupError: string | null
  readonly getGroup: (groupId: string) => ShopDemoGroup | undefined
  readonly getProducts: (productIds: readonly string[]) => readonly ShopProduct[]
  readonly renameGroup: (groupId: string, name: string) => Promise<void>
  readonly updateGroupProducts: (groupId: string, input: GroupInput) => Promise<void>
  readonly createGroup: (input: GroupInput) => Promise<void>
  readonly addProductsToGroup: (groupId: string, productIds: string[]) => Promise<void>
  readonly deleteGroup: (groupId: string) => Promise<void>
  readonly setQuickAddDraft: (draft: QuickAddDraft) => void
  readonly clearQuickAddDraft: () => void
  readonly setStatus: (status: string | null) => void
  readonly updateProfile: (name: string, avatarImage: string) => void
}

function deduplicate(productIds: readonly string[]): string[] {
  return [...new Set(productIds)]
}

function canViewOwnedSelectorShop(): boolean {
  return canViewSelectorShop(readAuthSession())
}

function canManageOwnedSelectorShop(): boolean {
  return canManageSelectorOperations(readAuthSession())
}

export function createInitialShopDemoState(): ShopDemoState {
  return {
    profile: { ...selectorProfile },
    groups: initialShopGroups.map((group) => ({
      ...group,
      productIds: [...group.productIds],
    })),
    status: null,
    quickAddDraft: null,
    nextGroupSerial: 14,
  }
}

export function shopDemoReducer(
  state: ShopDemoState,
  action: ShopDemoAction,
): ShopDemoState {
  switch (action.type) {
    case 'hydrateGroups':
      return { ...state, groups: action.groups }

    case 'hydrateProfile':
      return { ...state, profile: action.profile }

    case 'upsertGroup':
      return {
        ...state,
        groups: state.groups.some(({ id }) => id === action.group.id)
          ? state.groups.map((group) => group.id === action.group.id ? action.group : group)
          : [...state.groups, action.group],
      }

    case 'updateProfile':
      return {
        ...state,
        profile: {
          ...state.profile,
          name: action.name.trim(),
          avatarImage: action.avatarImage,
          meSpaceLabel: `${action.name.trim()}의 ME스페이스`,
        },
      }

    case 'renameGroup': {
      if (!state.groups.some(({ id }) => id === action.groupId)) {
        return state
      }

      return {
        ...state,
        groups: state.groups.map((group) => (
          group.id === action.groupId
            ? { ...group, name: action.name.trim() }
            : group
        )),
      }
    }

    case 'updateGroupProducts': {
      if (!state.groups.some(({ id }) => id === action.groupId)) {
        return state
      }

      return {
        ...state,
        groups: state.groups.map((group) => (
          group.id === action.groupId
            ? {
                ...group,
                name: action.input.name.trim(),
                campaignId: action.input.campaignId,
                productIds: deduplicate(action.input.productIds),
              }
            : group
        )),
      }
    }

    case 'createGroup':
      return {
        ...state,
        groups: [
          ...state.groups,
          {
            id: `demo-${state.nextGroupSerial}`,
            name: action.input.name.trim(),
            createdAt: '2026.08.04',
            campaignId: action.input.campaignId,
            productIds: deduplicate(action.input.productIds),
          },
        ],
        nextGroupSerial: state.nextGroupSerial + 1,
      }

    case 'addProductsToGroup': {
      if (!state.groups.some(({ id }) => id === action.groupId)) {
        return state
      }

      return {
        ...state,
        groups: state.groups.map((group) => (
          group.id === action.groupId
            ? {
                ...group,
                productIds: deduplicate([...group.productIds, ...action.productIds]),
              }
            : group
        )),
      }
    }

    case 'deleteGroup':
      if (!state.groups.some(({ id }) => id === action.groupId)) {
        return state
      }

      return {
        ...state,
        groups: state.groups.filter(({ id }) => id !== action.groupId),
      }

    case 'setQuickAddDraft':
      return {
        ...state,
        quickAddDraft: {
          ...action.draft,
          productIds: [...action.draft.productIds],
        },
      }

    case 'clearQuickAddDraft':
      return {
        ...state,
        quickAddDraft: null,
      }

    case 'setStatus':
      return {
        ...state,
        status: action.status,
      }
  }
}

const ShopDemoContext = createContext<ShopDemoContextValue | null>(null)

const emptyOwnedProfileMeta: OwnedShopProfileMeta = {
  generationName: null,
  userName: null,
  snsId: null,
}

function createApiShopState(): ShopDemoState {
  return {
    ...createInitialShopDemoState(),
    profile: { ...selectorProfile, name: '', avatarImage: '', meSpaceLabel: '' },
    groups: [],
  }
}

function ApiShopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    shopDemoReducer,
    undefined,
    createApiShopState,
  )
  const [campaigns, setCampaigns] = useState<readonly ShopCampaign[]>([])
  const [products, setProducts] = useState<readonly ShopProduct[]>([])
  const [isCampaignCatalogLoading, setIsCampaignCatalogLoading] = useState(true)
  const [campaignCatalogError, setCampaignCatalogError] = useState<string | null>(null)
  const [isProductGroupLoading, setIsProductGroupLoading] = useState(true)
  const [productGroupError, setProductGroupError] = useState<string | null>(null)
  const [ownedSelectorsCode, setOwnedSelectorsCode] = useState<string | null>(null)
  const [ownedProfileMeta, setOwnedProfileMeta] = useState<OwnedShopProfileMeta>(emptyOwnedProfileMeta)
  const [authRevision, setAuthRevision] = useState(0)
  const shopDataRequestRef = useRef(0)
  const ownedIdentityRequestRef = useRef(0)
  const [shopHash, setShopHash] = useState(window.location.hash)
  const publicShopLocation = parsePublicShopHash(shopHash)
  const publicSelectorsCode = publicShopLocation?.selectorsCode ?? null
  const isManagementShopRoute = /^#\/shop\/(?:groups|profile)(?:\/|$)/.test(shopHash)
  const isCampaignRoute = /^#\/campaigns(?:\/|$)/.test(shopHash)
  const isHomeRoute = shopHash === '#/home'
  const needsOwnedGroups = isHomeRoute || isManagementShopRoute || isCampaignRoute
  const shopRequestKey = publicSelectorsCode
    ? `public:${publicSelectorsCode}`
    : needsOwnedGroups ? 'owned' : 'none'
  const [selectorsCode, setSelectorsCode] = useState<string | null>(
    publicShopLocation?.selectorsCode ?? null,
  )

  useEffect(() => {
    const refreshAuth = () => {
      setOwnedSelectorsCode(null)
      setOwnedProfileMeta(emptyOwnedProfileMeta)
      if (!canViewOwnedSelectorShop()) {
        shopDataRequestRef.current += 1
        ownedIdentityRequestRef.current += 1
        setSelectorsCode(null)
        setProducts([])
        setProductGroupError(null)
        setIsProductGroupLoading(false)
        dispatch({ type: 'hydrateGroups', groups: [] })
        dispatch({
          type: 'hydrateProfile',
          profile: { ...selectorProfile, name: '', avatarImage: '', meSpaceLabel: '' },
        })
      }
      setAuthRevision((current) => current + 1)
    }
    window.addEventListener('auth:changed', refreshAuth)
    window.addEventListener('storage', refreshAuth)
    return () => {
      window.removeEventListener('auth:changed', refreshAuth)
      window.removeEventListener('storage', refreshAuth)
    }
  }, [])

  useEffect(() => {
    const refreshHash = () => setShopHash(window.location.hash)
    window.addEventListener('hashchange', refreshHash)
    return () => window.removeEventListener('hashchange', refreshHash)
  }, [])

  const mergeProducts = useCallback((incoming: readonly ShopProduct[]) => {
    setProducts((current) => [...[...current, ...incoming].reduce((productMap, product) => {
      const existing = productMap.get(product.id)
      productMap.set(product.id, existing
        ? {
            ...existing,
            ...product,
            campaignIds: [...new Set([...existing.campaignIds, ...product.campaignIds])],
          }
        : product)
      return productMap
    }, new Map<string, ShopProduct>()).values()])
  }, [])

  const mapApiProduct = useCallback((product: ProductGroupApiResponse['products'][number], campaignId?: string): ShopProduct => {
    const regularPrice = Number(product.regularPrice)
    const salePrice = Number(product.salePrice)
    return {
      id: String(product.id),
      code: product.code,
      category: product.category || '',
      brand: product.brand || '',
      name: product.name,
      originalPrice: `${regularPrice.toLocaleString('ko-KR')}원`,
      discountRate: regularPrice > 0 ? `${Math.max(0, Math.round((1 - salePrice / regularPrice) * 100))}%` : '0%',
      salePrice: `${salePrice.toLocaleString('ko-KR')}원`,
      image: product.thumbnailUrl,
      detailUrl: product.detailUrl,
      campaignIds: campaignId ? [campaignId] : [],
    }
  }, [])

  const mapApiGroup = useCallback((group: ProductGroupApiResponse): ShopDemoGroup => ({
    id: String(group.id),
    name: group.title,
    createdAt: group.createdAt?.slice(0, 10).replaceAll('-', '.') || '',
    campaignId: String(group.campaignId),
    productIds: group.products.map(({ id }) => String(id)),
  }), [])

  const applyApiGroup = useCallback((group: ProductGroupApiResponse) => {
    mergeProducts(group.products.map((product) => mapApiProduct(product, String(group.campaignId))))
    dispatch({ type: 'upsertGroup', group: mapApiGroup(group) })
  }, [mapApiGroup, mapApiProduct, mergeProducts])

  useEffect(() => {
    let cancelled = false
    const requestId = ++shopDataRequestRef.current
    const isCurrentRequest = () => !cancelled && shopDataRequestRef.current === requestId

    if (!publicSelectorsCode && (!needsOwnedGroups || !canViewOwnedSelectorShop())) {
      setIsProductGroupLoading(false)
      setProductGroupError(null)
      return () => { cancelled = true }
    }

    setIsProductGroupLoading(true)
    setProductGroupError(null)
    dispatch({ type: 'hydrateGroups', groups: [] })
    const isOwnedRequest = !publicSelectorsCode && canViewOwnedSelectorShop()
    const isSelectorSession = canViewOwnedSelectorShop()
    if (isOwnedRequest) {
      setOwnedSelectorsCode(null)
      setOwnedProfileMeta(emptyOwnedProfileMeta)
    }
    if (publicSelectorsCode || needsOwnedGroups) {
      if (!publicSelectorsCode) setSelectorsCode(null)
      dispatch({ type: 'hydrateProfile', profile: { ...selectorProfile, name: '', avatarImage: '', meSpaceLabel: '' } })
    }

    const request = publicSelectorsCode
      ? getPublicShop(publicSelectorsCode)
      : isOwnedRequest
        ? getMyShop()
        : isManagementShopRoute
          ? getPublicShop(readRememberedSelectorsCode())
          : Promise.reject(new Error('상품 그룹에 담으려면 로그인이 필요합니다.'))

    request.then((shop) => {
      if (!isCurrentRequest()) return

      if (isOwnedRequest) {
        const ownedShop = shop as MyShopApiResponse
        setOwnedSelectorsCode(shop.selectorsCode)
        setOwnedProfileMeta({
          generationName: ownedShop.generationName,
          userName: ownedShop.userName,
          snsId: ownedShop.snsId,
        })
        rememberSelectorsCode(shop.selectorsCode)
      } else if (!isSelectorSession) {
        rememberSelectorsCode(shop.selectorsCode)
      }
      setSelectorsCode(shop.selectorsCode)
      dispatch({
        type: 'hydrateProfile',
        profile: {
          ...selectorProfile,
          name: shop.nickname,
          avatarImage: shop.profileImageUrl ?? '',
          meSpaceLabel: `${shop.nickname}의 ME스페이스`,
        },
      })

      const groups = shop.groups
      mergeProducts(groups.flatMap((group) => group.products.map((product) => mapApiProduct(product, String(group.campaignId)))))
      dispatch({ type: 'hydrateGroups', groups: groups.map(mapApiGroup) })
      setProductGroupError(null)
    }).catch((error) => {
      if (isCurrentRequest()) setProductGroupError(error instanceof Error ? error.message : '상품 그룹을 불러오지 못했습니다.')
    }).finally(() => {
      if (isCurrentRequest()) setIsProductGroupLoading(false)
    })

    return () => { cancelled = true }
  }, [authRevision, isManagementShopRoute, mapApiGroup, mapApiProduct, mergeProducts, needsOwnedGroups, publicSelectorsCode, shopRequestKey])

  useEffect(() => {
    let cancelled = false
    const requestId = ++ownedIdentityRequestRef.current
    const isCurrentRequest = () => !cancelled && ownedIdentityRequestRef.current === requestId

    const hasUserSession = canViewOwnedSelectorShop()
    if (!publicSelectorsCode || !hasUserSession) {
      if (!hasUserSession) {
        setOwnedSelectorsCode(null)
        setOwnedProfileMeta(emptyOwnedProfileMeta)
      }
      return () => { cancelled = true }
    }

    setOwnedSelectorsCode(null)
    setOwnedProfileMeta(emptyOwnedProfileMeta)
    getMyShop()
      .then((shop) => {
        if (!isCurrentRequest()) return
        setOwnedSelectorsCode(shop.selectorsCode)
        setOwnedProfileMeta({
          generationName: shop.generationName,
          userName: shop.userName,
          snsId: shop.snsId,
        })
        rememberSelectorsCode(shop.selectorsCode)
      })
      .catch(() => {
        if (!isCurrentRequest()) return
        setOwnedSelectorsCode(null)
        setOwnedProfileMeta(emptyOwnedProfileMeta)
      })

    return () => { cancelled = true }
  }, [authRevision, publicSelectorsCode])

  useEffect(() => {
    let cancelled = false
    setIsCampaignCatalogLoading(true)
    setCampaignCatalogError(null)
    setCampaigns([])

    if (!canManageOwnedSelectorShop()) {
      setIsCampaignCatalogLoading(false)
      return () => { cancelled = true }
    }

    getCampaigns()
      .then(async (summaries) => {
        const details = await Promise.all(summaries.map(({ id }) => getCampaignDetail(id)))
        if (cancelled) return

        const apiCampaigns: ShopCampaign[] = details.map((campaign) => ({
          id: String(campaign.id),
          name: campaign.title,
          description: campaign.description,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          thumbnailUrl: campaign.thumbnailUrl,
          status: campaign.status,
          brands: [...new Set(campaign.products.map(({ brand }) => brand).filter(Boolean))],
          productIds: campaign.products.map(({ id }) => String(id)),
        }))
        const apiProducts = details.flatMap((campaign) => campaign.products.map((product) => {
          const regularPrice = Number(product.regularPrice)
          const salePrice = Number(product.salePrice)
          const discountRate = regularPrice > 0
            ? `${Math.max(0, Math.round((1 - salePrice / regularPrice) * 100))}%`
            : '0%'

          return {
            id: String(product.id),
            code: product.code,
            category: product.category || '',
            brand: product.brand || '',
            name: product.name,
            originalPrice: `${regularPrice.toLocaleString('ko-KR')}원`,
            discountRate,
            salePrice: `${salePrice.toLocaleString('ko-KR')}원`,
            image: product.thumbnailUrl,
            detailUrl: product.detailUrl,
            campaignIds: [String(campaign.id)],
          } satisfies ShopProduct
        }))
        const uniqueApiProducts = [...apiProducts.reduce((productMap, product) => {
          const existing = productMap.get(product.id)
          productMap.set(product.id, existing
            ? { ...existing, campaignIds: [...new Set([...existing.campaignIds, ...product.campaignIds])] }
            : product)
          return productMap
        }, new Map<string, ShopProduct>()).values()]

        setCampaigns(apiCampaigns)
        mergeProducts(uniqueApiProducts)
        setCampaignCatalogError(null)
      })
      .catch((error) => {
        if (!cancelled) {
          setCampaignCatalogError(error instanceof Error ? error.message : '캠페인 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setIsCampaignCatalogLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authRevision, mergeProducts])

  const getGroup = useCallback(
    (groupId: string) => state.groups.find(({ id }) => id === groupId),
    [state.groups],
  )
  const getProducts = useCallback((productIds: readonly string[]) => {
    return productIds.flatMap((productId) => {
      const product = products.find(({ id }) => id === productId)
      return product ? [product] : []
    })
  }, [products])
  const renameGroup = useCallback(async (groupId: string, name: string) => {
    const group = state.groups.find(({ id }) => id === groupId)
    if (!canManageOwnedSelectorShop()) throw new Error('현재 기수 셀렉터스만 상품 그룹을 관리할 수 있습니다.')
    if (!group?.campaignId) throw new Error('상품 그룹의 캠페인 정보를 찾을 수 없습니다.')
    applyApiGroup(await updateProductGroup(groupId, {
      campaignId: Number(group.campaignId), title: name, productIds: group.productIds.map(Number),
    }))
  }, [applyApiGroup, state.groups])
  const updateGroupProducts = useCallback(async (groupId: string, input: GroupInput) => {
    if (!canManageOwnedSelectorShop()) throw new Error('현재 기수 셀렉터스만 상품 그룹을 관리할 수 있습니다.')
    if (!input.campaignId) throw new Error('캠페인을 선택해 주세요.')
    applyApiGroup(await updateProductGroup(groupId, {
      campaignId: Number(input.campaignId), title: input.name, productIds: input.productIds.map(Number),
    }))
  }, [applyApiGroup])
  const createGroup = useCallback(async (input: GroupInput) => {
    if (!canManageOwnedSelectorShop()) throw new Error('현재 기수 셀렉터스만 상품 그룹을 관리할 수 있습니다.')
    if (!input.campaignId) throw new Error('캠페인을 선택해 주세요.')
    applyApiGroup(await createProductGroup({
      campaignId: Number(input.campaignId), title: input.name, productIds: input.productIds.map(Number),
    }))
  }, [applyApiGroup])
  const addProductsToGroup = useCallback(async (groupId: string, productIds: string[]) => {
    if (!canManageOwnedSelectorShop()) throw new Error('현재 기수 셀렉터스만 상품 그룹을 관리할 수 있습니다.')
    applyApiGroup(await addProductGroupItems(groupId, productIds.map(Number)))
  }, [applyApiGroup])
  const deleteGroup = useCallback(async (groupId: string) => {
    if (!canManageOwnedSelectorShop()) throw new Error('현재 기수 셀렉터스만 상품 그룹을 관리할 수 있습니다.')
    await deleteProductGroup(groupId)
    dispatch({ type: 'deleteGroup', groupId })
  }, [])
  const setQuickAddDraft = useCallback((draft: QuickAddDraft) => {
    dispatch({ type: 'setQuickAddDraft', draft })
  }, [])
  const clearQuickAddDraft = useCallback(() => {
    dispatch({ type: 'clearQuickAddDraft' })
  }, [])
  const setStatus = useCallback((status: string | null) => {
    dispatch({ type: 'setStatus', status })
  }, [])
  const updateProfile = useCallback((name: string, avatarImage: string) => {
    dispatch({ type: 'updateProfile', name, avatarImage })
  }, [])

  const value = useMemo<ShopDemoContextValue>(() => ({
    state,
    profile: state.profile,
    selectorsCode,
    ownedSelectorsCode,
    ownedProfileMeta,
    products,
    campaigns,
    isCampaignCatalogLoading,
    campaignCatalogError,
    isProductGroupLoading,
    productGroupError,
    getGroup,
    getProducts,
    renameGroup,
    updateGroupProducts,
    createGroup,
    addProductsToGroup,
    deleteGroup,
    setQuickAddDraft,
    clearQuickAddDraft,
    setStatus,
    updateProfile,
  }), [
    state,
    selectorsCode,
    ownedSelectorsCode,
    ownedProfileMeta,
    getGroup,
    getProducts,
    renameGroup,
    updateGroupProducts,
    createGroup,
    addProductsToGroup,
    deleteGroup,
    setQuickAddDraft,
    clearQuickAddDraft,
    setStatus,
    updateProfile,
    products,
    campaigns,
    isCampaignCatalogLoading,
    campaignCatalogError,
    isProductGroupLoading,
    productGroupError,
  ])

  return (
    <ShopDemoContext.Provider value={value}>
      {children}
    </ShopDemoContext.Provider>
  )
}

function DemoShopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    shopDemoReducer,
    undefined,
    createInitialShopDemoState,
  )
  const session = readAuthSession()
  const selectorsCode = parsePublicShopHash(window.location.hash)?.selectorsCode ?? 'RC000003200T'
  const ownedSelectorsCode = canViewSelectorShop(session)
    ? 'RC000003200T'
    : null
  const getGroup = useCallback(
    (groupId: string) => state.groups.find(({ id }) => id === groupId),
    [state.groups],
  )
  const getProducts = useCallback((productIds: readonly string[]) => productIds.flatMap((productId) => {
    const product = selectorProducts.find(({ id }) => id === productId)
    return product ? [product] : []
  }), [])
  const renameGroup = useCallback(async (groupId: string, name: string) => {
    dispatch({ type: 'renameGroup', groupId, name })
  }, [])
  const updateGroupProducts = useCallback(async (groupId: string, input: GroupInput) => {
    dispatch({ type: 'updateGroupProducts', groupId, input })
  }, [])
  const createGroup = useCallback(async (input: GroupInput) => {
    dispatch({ type: 'createGroup', input })
  }, [])
  const addProductsToGroup = useCallback(async (groupId: string, productIds: string[]) => {
    dispatch({ type: 'addProductsToGroup', groupId, productIds })
  }, [])
  const deleteGroup = useCallback(async (groupId: string) => {
    dispatch({ type: 'deleteGroup', groupId })
  }, [])
  const setQuickAddDraft = useCallback((draft: QuickAddDraft) => {
    dispatch({ type: 'setQuickAddDraft', draft })
  }, [])
  const clearQuickAddDraft = useCallback(() => {
    dispatch({ type: 'clearQuickAddDraft' })
  }, [])
  const setStatus = useCallback((status: string | null) => {
    dispatch({ type: 'setStatus', status })
  }, [])
  const updateProfile = useCallback((name: string, avatarImage: string) => {
    dispatch({ type: 'updateProfile', name, avatarImage })
  }, [])
  const value = useMemo<ShopDemoContextValue>(() => ({
    state,
    profile: state.profile,
    selectorsCode,
    ownedSelectorsCode,
    ownedProfileMeta: emptyOwnedProfileMeta,
    products: selectorProducts,
    campaigns: shopCampaigns,
    isCampaignCatalogLoading: false,
    campaignCatalogError: null,
    isProductGroupLoading: false,
    productGroupError: null,
    getGroup,
    getProducts,
    renameGroup,
    updateGroupProducts,
    createGroup,
    addProductsToGroup,
    deleteGroup,
    setQuickAddDraft,
    clearQuickAddDraft,
    setStatus,
    updateProfile,
  }), [
    state,
    selectorsCode,
    ownedSelectorsCode,
    getGroup,
    getProducts,
    renameGroup,
    updateGroupProducts,
    createGroup,
    addProductsToGroup,
    deleteGroup,
    setQuickAddDraft,
    clearQuickAddDraft,
    setStatus,
    updateProfile,
  ])

  return <ShopDemoContext.Provider value={value}>{children}</ShopDemoContext.Provider>
}

export function ShopDemoProvider({ children }: { children: ReactNode }) {
  return import.meta.env.MODE === 'test'
    ? <DemoShopProvider>{children}</DemoShopProvider>
    : <ApiShopProvider>{children}</ApiShopProvider>
}

export function useShopDemo(): ShopDemoContextValue {
  const value = useContext(ShopDemoContext)

  if (value === null) {
    throw new Error('useShopDemo must be used within a ShopDemoProvider')
  }

  return value
}
