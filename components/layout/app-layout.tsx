'use client'

import { useState } from 'react'
import { TopNav } from './top-nav'
import { ThreeColumnLayout } from './three-column-layout'
import { BusinessesView } from '@/components/views/businesses-view'
import { ContactsView } from '@/components/views/contacts-view'
import { ProjectsView } from '@/components/views/projects-view'
import { AbacusMiniBrowser } from '@/components/embedded-chat/abacus-mini-browser'
import { useAuthContext } from '@/contexts/auth-context'
import type { ViewType } from './top-nav'

interface AppLayoutProps {
  leftColumn: React.ReactNode
  middleColumn: React.ReactNode
  rightColumn: React.ReactNode
}

export function AppLayout({
  leftColumn,
  middleColumn,
  rightColumn,
}: AppLayoutProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard')
  const { user } = useAuthContext()

  const renderViewContent = () => {
    if (!user) return null

    switch (currentView) {
      case 'businesses':
        return <BusinessesView userId={user.uid} />
      case 'contacts':
        return <ContactsView userId={user.uid} />
      case 'projects':
        return <ProjectsView userId={user.uid} />
      case 'dashboard':
      default:
        return middleColumn
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopNav currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 overflow-hidden">
        {currentView === 'dashboard' ? (
          <ThreeColumnLayout
            leftColumn={leftColumn}
            middleColumn={middleColumn}
            rightColumn={rightColumn}
          />
        ) : (
          <div className="relative z-10 flex h-full w-full overflow-hidden">
            <aside className="w-64 flex-shrink-0 border-r border-white/10 h-full overflow-y-auto">
              {leftColumn}
            </aside>
            <main className="flex-1 border-r border-white/10 h-full min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {renderViewContent()}
              </div>
              <AbacusMiniBrowser />
            </main>
            <aside className="w-96 flex-shrink-0 h-full overflow-y-auto">
              {rightColumn}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
