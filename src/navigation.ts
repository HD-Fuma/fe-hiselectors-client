export function getCurrentPath(): string {
  return `${window.location.pathname}${window.location.search}`
}

export function navigate(path: string, options: { replace?: boolean } = {}): void {
  const method = options.replace ? 'replaceState' : 'pushState'
  window.history[method](window.history.state, '', path)
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
}
