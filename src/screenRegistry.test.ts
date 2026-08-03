import { describe, expect, it } from 'vitest'

import { screenRegistry, selectScreenByHash } from './screenRegistry'

const expectedScreens = [
  { id: 'catalog', path: '#/screens' },
  { id: 'login', path: '#/login' },
  { id: 'apply-intro', path: '#/apply' },
  { id: 'apply-form', path: '#/apply/form' },
  { id: 'campaign-list', path: '#/campaigns' },
  { id: 'campaign-detail', path: '#/campaigns/detail' },
  { id: 'shop-groups', path: '#/shop/groups' },
  { id: 'group-editor-product-picker', path: '#/shop/groups/edit' },
  { id: 'public-shop', path: '#/shop/RC000004900T' },
  { id: 'performance-summary', path: '#/performance' },
  { id: 'product-performance', path: '#/performance/products' },
  { id: 'settlement', path: '#/settlement' },
] as const

describe('screenRegistry', () => {
  it('registers every required screen at a unique hash path', () => {
    expect(
      screenRegistry.map(({ id, path }) => ({ id, path })),
    ).toEqual(expectedScreens)

    const paths = screenRegistry.map((screen) => screen.path)

    expect(paths.every((path) => path.startsWith('#/'))).toBe(true)
    expect(new Set(paths).size).toBe(paths.length)
  })

  it.each(screenRegistry)('selects $id for $path', ({ id, path }) => {
    expect(selectScreenByHash(path).id).toBe(id)
  })

  it('falls back to the catalog for an unknown hash', () => {
    expect(selectScreenByHash('#/not-a-screen').id).toBe('catalog')
  })
})
