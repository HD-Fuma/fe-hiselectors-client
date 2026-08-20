import { useEffect, useRef } from 'react'

import { recordShopView, type ShopViewPageType } from './shopAnalyticsApi'

export function useShopViewLog(
  selectorsCode: string,
  pageType: ShopViewPageType,
  referenceId?: number,
  enabled = true,
) {
  const recordedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled || !selectorsCode) return
    const key = `${selectorsCode}:${pageType}:${referenceId ?? ''}`
    if (recordedKeyRef.current === key) return
    recordedKeyRef.current = key
    void recordShopView(selectorsCode, pageType, referenceId).catch(() => {
      // Analytics must never make a public shop page unusable.
    })
  }, [enabled, pageType, referenceId, selectorsCode])
}
