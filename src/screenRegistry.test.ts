import { describe, expect, it } from 'vitest'

import { screenRegistry, selectScreenByHash } from './screenRegistry'

const expectedScreenIds = [
  'catalog',
  'login',
  'apply-intro',
  'apply-form',
  'campaign-list',
  'campaign-detail',
  'shop-groups',
  'group-editor-product-picker',
  'public-shop',
  'performance-summary',
  'product-performance',
  'settlement',
] as const

describe('screenRegistry', () => {
  it('registers every required screen at a unique hash path', () => {
    expect(screenRegistry.map((screen) => screen.id)).toEqual(expectedScreenIds)

    const paths = screenRegistry.map((screen) => screen.path)

    expect(paths.every((path) => path.startsWith('#/'))).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('selects a registered screen by hash and falls back to the catalog', () => {
    expect(selectScreenByHash('#/campaigns/detail').id).toBe('campaign-detail')
    expect(selectScreenByHash('#/not-a-screen').id).toBe('catalog')
  })
})
