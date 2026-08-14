import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
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

export type ShopDemoGroup = Omit<ShopGroup, 'productIds'> & { productIds: string[] }

export type QuickAddDraft = {
  campaignId: string
  productIds: string[]
}

export type ShopDemoState = {
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

export type ShopDemoAction =
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
  readonly products: readonly ShopProduct[]
  readonly campaigns: readonly ShopCampaign[]
  readonly getGroup: (groupId: string) => ShopDemoGroup | undefined
  readonly getProducts: (productIds: readonly string[]) => readonly ShopProduct[]
  readonly renameGroup: (groupId: string, name: string) => void
  readonly updateGroupProducts: (groupId: string, input: GroupInput) => void
  readonly createGroup: (input: GroupInput) => void
  readonly addProductsToGroup: (groupId: string, productIds: string[]) => void
  readonly deleteGroup: (groupId: string) => void
  readonly setQuickAddDraft: (draft: QuickAddDraft) => void
  readonly clearQuickAddDraft: () => void
  readonly setStatus: (status: string | null) => void
}

function deduplicate(productIds: readonly string[]): string[] {
  return [...new Set(productIds)]
}

export function createInitialShopDemoState(): ShopDemoState {
  return {
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

export function ShopDemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    shopDemoReducer,
    undefined,
    createInitialShopDemoState,
  )

  const getGroup = useCallback(
    (groupId: string) => state.groups.find(({ id }) => id === groupId),
    [state.groups],
  )
  const getProducts = useCallback((productIds: readonly string[]) => {
    return productIds.flatMap((productId) => {
      const product = selectorProducts.find(({ id }) => id === productId)
      return product ? [product] : []
    })
  }, [])
  const renameGroup = useCallback((groupId: string, name: string) => {
    dispatch({ type: 'renameGroup', groupId, name })
  }, [])
  const updateGroupProducts = useCallback((groupId: string, input: GroupInput) => {
    dispatch({ type: 'updateGroupProducts', groupId, input })
  }, [])
  const createGroup = useCallback((input: GroupInput) => {
    dispatch({ type: 'createGroup', input })
  }, [])
  const addProductsToGroup = useCallback((groupId: string, productIds: string[]) => {
    dispatch({ type: 'addProductsToGroup', groupId, productIds })
  }, [])
  const deleteGroup = useCallback((groupId: string) => {
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

  const value = useMemo<ShopDemoContextValue>(() => ({
    state,
    profile: selectorProfile,
    products: selectorProducts,
    campaigns: shopCampaigns,
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
  }), [
    state,
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
  ])

  return (
    <ShopDemoContext.Provider value={value}>
      {children}
    </ShopDemoContext.Provider>
  )
}

export function useShopDemo(): ShopDemoContextValue {
  const value = useContext(ShopDemoContext)

  if (value === null) {
    throw new Error('useShopDemo must be used within a ShopDemoProvider')
  }

  return value
}
