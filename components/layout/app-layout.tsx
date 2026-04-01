'use client'

import { useEffect, useState } from 'react'
import { TopNav } from './top-nav'
import { BusinessesView } from '@/components/views/businesses-view'
import { ContactsView } from '@/components/views/contacts-view'
import { ProjectsView } from '@/components/views/projects-view'
import { AbacusMiniBrowser } from '@/components/embedded-chat/abacus-mini-browser'
import { useAuthContext } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { ViewType } from './top-nav'

const LEFT_COLUMN_COLLAPSED_KEY = 'layout_left_column_collapsed'
const RIGHT_COLUMN_COLLAPSED_KEY = 'layout_right_column_collapsed'

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
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false)
  const [isRightCollapsed, setIsRightCollapsed] = useState(false)
  const { user } = useAuthContext()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const storedLeft = window.localStorage.getItem(LEFT_COLUMN_COLLAPSED_KEY)
      const storedRight = window.localStorage.getItem(RIGHT_COLUMN_COLLAPSED_KEY)
      if (storedLeft != null) setIsLeftCollapsed(storedLeft === 'true')
      if (storedRight != null) setIsRightCollapsed(storedRight === 'true')
    } catch (error) {
      console.error('Failed to load column layout preferences:', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(LEFT_COLUMN_COLLAPSED_KEY, String(isLeftCollapsed))
      window.localStorage.setItem(RIGHT_COLUMN_COLLAPSED_KEY, String(isRightCollapsed))
    } catch (error) {
      console.error('Failed to save column layout preferences:', error)
    }
  }, [isLeftCollapsed, isRightCollapsed])

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
          <div className="relative z-10 flex h-full w-full overflow-hidden">
            <aside
              className={cn(
                'h-full flex-shrink-0 overflow-y-auto border-r border-white/10 transition-all',
                isLeftCollapsed ? 'w-12' : 'w-64'
              )}
            >
              {isLeftCollapsed ? (
                <div className="flex h-full items-start justify-center pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    title="Expand left column"
                    onClick={() => setIsLeftCollapsed(false)}
                  >
                    <PanelLeftOpen size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative h-full">
                  <div className="absolute right-2 top-2 z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 px-0"
                      title="Collapse left column"
                      onClick={() => setIsLeftCollapsed(true)}
                    >
                      <PanelLeftClose size={18} />
                    </Button>
                  </div>
                  {leftColumn}
                </div>
              )}
            </aside>
            <main className="flex-1 border-r border-white/10 h-full overflow-y-auto">
              {middleColumn}
            </main>
            <aside
              className={cn(
                'h-full flex-shrink-0 overflow-y-auto transition-all',
                isRightCollapsed ? 'w-12 border-l border-white/10' : 'w-96'
              )}
            >
              {isRightCollapsed ? (
                <div className="flex h-full items-start justify-center pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    title="Expand right column"
                    onClick={() => setIsRightCollapsed(false)}
                  >
                    <PanelRightOpen size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative h-full">
                  <div className="absolute left-2 top-2 z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 px-0"
                      title="Collapse right column"
                      onClick={() => setIsRightCollapsed(true)}
                    >
                      <PanelRightClose size={18} />
                    </Button>
                  </div>
                  {rightColumn}
                </div>
              )}
            </aside>
          </div>
        ) : (
          <div className="relative z-10 flex h-full w-full overflow-hidden">
            <aside
              className={cn(
                'h-full flex-shrink-0 overflow-y-auto border-r border-white/10 transition-all',
                isLeftCollapsed ? 'w-12' : 'w-64'
              )}
            >
              {isLeftCollapsed ? (
                <div className="flex h-full items-start justify-center pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    title="Expand left column"
                    onClick={() => setIsLeftCollapsed(false)}
                  >
                    <PanelLeftOpen size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative h-full">
                  <div className="absolute right-2 top-2 z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 px-0"
                      title="Collapse left column"
                      onClick={() => setIsLeftCollapsed(true)}
                    >
                      <PanelLeftClose size={18} />
                    </Button>
                  </div>
                  {leftColumn}
                </div>
              )}
            </aside>
            <main className="flex-1 border-r border-white/10 h-full min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {renderViewContent()}
              </div>
              <AbacusMiniBrowser />
            </main>
            <aside
              className={cn(
                'h-full flex-shrink-0 overflow-y-auto transition-all',
                isRightCollapsed ? 'w-12 border-l border-white/10' : 'w-96'
              )}
            >
              {isRightCollapsed ? (
                <div className="flex h-full items-start justify-center pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 px-0"
                    title="Expand right column"
                    onClick={() => setIsRightCollapsed(false)}
                  >
                    <PanelRightOpen size={18} />
                  </Button>
                </div>
              ) : (
                <div className="relative h-full">
                  <div className="absolute left-2 top-2 z-10">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 px-0"
                      title="Collapse right column"
                      onClick={() => setIsRightCollapsed(true)}
                    >
                      <PanelRightClose size={18} />
                    </Button>
                  </div>
                  {rightColumn}
                </div>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
