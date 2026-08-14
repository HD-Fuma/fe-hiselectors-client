import type { ReactNode } from 'react'

import type { RouteId } from '../../routes'
import ServiceSidebar from './ServiceSidebar'

type AppShellProps = {
  children: ReactNode
  screenId: RouteId
}

export default function AppShell({ children, screenId }: AppShellProps) {
  return (
    <div className="app-shell">
      <ServiceSidebar />
      <main className="client-panel" data-screen-id={screenId}>
        {children}
      </main>
    </div>
  )
}
