import type { ReactNode } from 'react'

import type { ScreenId } from '../screenRegistry'
import HiHiAside from './HiHiAside'

type AppShellProps = {
  children: ReactNode
  screenId: ScreenId
}

export default function AppShell({ children, screenId }: AppShellProps) {
  return (
    <div className="app-shell">
      <HiHiAside />
      <main className="client-panel" data-screen-id={screenId}>
        {children}
      </main>
    </div>
  )
}
