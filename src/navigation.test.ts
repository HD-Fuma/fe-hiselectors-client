import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getCurrentPath, navigate } from './navigation'

describe('navigation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
  })

  it('navigates with the History API without adding a hash', () => {
    const onPopState = vi.fn()
    window.addEventListener('popstate', onPopState)

    navigate('/campaigns/season-pick')

    expect(window.location.pathname).toBe('/campaigns/season-pick')
    expect(window.location.hash).toBe('')
    expect(getCurrentPath()).toBe('/campaigns/season-pick')
    expect(onPopState).toHaveBeenCalledOnce()
    window.removeEventListener('popstate', onPopState)
  })

  it('preserves query parameters as part of the current location', () => {
    navigate('/product/60A2099341?ptrsRefCd=RC000003200T')

    expect(getCurrentPath()).toBe('/product/60A2099341?ptrsRefCd=RC000003200T')
    expect(window.location.hash).toBe('')
  })
})
