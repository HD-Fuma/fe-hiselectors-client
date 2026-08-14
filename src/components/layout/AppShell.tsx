import type { ReactNode } from 'react'

import type { AppSection, RouteId } from '../../routes'
import MainNavigation from './MainNavigation'
import ServiceSidebar from './ServiceSidebar'

type AppShellProps = {
  children: ReactNode
  screenId: RouteId
  section?: AppSection
  showNavigation?: boolean
}

export default function AppShell({ children, screenId, section, showNavigation }: AppShellProps) {
  return (
    <div className="app-shell">
      <ServiceSidebar />
      <main className="client-panel" data-screen-id={screenId}>
        {children}
        {showNavigation && section ? <MainNavigation current={section} /> : null}
      </main>
    </div>
  )
}
