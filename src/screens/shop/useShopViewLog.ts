import { useEffect, useRef } from 'react'

import { recordShopView, type ShopViewPageType } from './shopAnalyticsApi'

const skipNextViewStorageKey = 'selectors-shop-skip-next-view'

function buildViewKey(selectorsCode: string, pageType: ShopViewPageType, referenceId?: number) {
  return `${selectorsCode}:${pageType}:${referenceId ?? ''}`
}

export function skipNextShopViewLog(
  selectorsCode: string,
  pageType: ShopViewPageType,
  referenceId?: number,
) {
  sessionStorage.setItem(skipNextViewStorageKey, buildViewKey(selectorsCode, pageType, referenceId))
}

export function useShopViewLog(
  selectorsCode: string,
  pageType: ShopViewPageType,
  referenceId?: number,
  enabled = true,
) {
  const recordedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !selectorsCode) return
    const key = buildViewKey(selectorsCode, pageType, referenceId)
    if (recordedKeyRef.current === key) return
    recordedKeyRef.current = key
    if (sessionStorage.getItem(skipNextViewStorageKey) === key) {
      sessionStorage.removeItem(skipNextViewStorageKey)
      return
    }
    void recordShopView(selectorsCode, pageType, referenceId).catch(() => {
      // Analytics must never make a public shop page unusable.
    })
  }, [enabled, pageType, referenceId, selectorsCode])
}
