'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { OnboardingModal } from '@/components/onboarding/onboarding-modal'
import { useAuthContext } from '@/contexts/auth-context'
import { initializeDummyData } from '@/lib/data/dummy-data'
import { Plus, Database, Building2, User, FolderKanban, Settings } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { SettingsModal } from '@/components/settings/settings-modal'
import type { OnboardingStep } from '@/components/onboarding/onboarding-modal'

export type ViewType = 'dashboard' | 'businesses' | 'contacts' | 'projects'

interface TopNavProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
}

export function TopNav({ currentView, onViewChange }: TopNavProps) {
  const { user } = useAuthContext()
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [addNewInitialStep, setAddNewInitialStep] = useState<OnboardingStep>('select')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const handleBusinessCreate = () => {
    console.log('Create business')
  }

  const handleContactCreate = () => {
    console.log('Create contact')
  }

  const handleProjectCreate = () => {
    console.log('Create project')
  }

  const handleInitializeDummyData = async () => {
    if (user) {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dummy_data_initialized')
        }
        await initializeDummyData(user.uid)
        alert('Dummy data initialized! Refreshing page...')
        window.location.reload()
      } catch (error) {
        console.error('Failed to initialize:', error)
        alert(`Failed to initialize dummy data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleAddNewClick = () => {
    const initialStepByView: Record<ViewType, OnboardingStep> = {
      dashboard: 'select',
      businesses: 'business',
      contacts: 'contact',
      projects: 'project-template',
    }
    setAddNewInitialStep(initialStepByView[currentView])
    setIsOnboardingOpen(true)
  }

  return (
    <>
      <nav className="h-14 border-b border-white/10 glass flex items-center justify-between px-4 z-20 relative">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold">AI Productivity OS</h1>
          
          <div className="flex items-center gap-1">
            <Button
              onClick={() => onViewChange('dashboard')}
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              Dashboard
            </Button>
            <Button
              onClick={() => onViewChange('businesses')}
              variant={currentView === 'businesses' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <Building2 size={16} />
              Businesses
            </Button>
            <Button
              onClick={() => onViewChange('contacts')}
              variant={currentView === 'contacts' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <User size={16} />
              Contacts
            </Button>
            <Button
              onClick={() => onViewChange('projects')}
              variant={currentView === 'projects' ? 'default' : 'ghost'}
              size="sm"
              className="gap-2"
            >
              <FolderKanban size={16} />
              Projects
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAddNewClick}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Plus size={16} />
            Add New
          </Button>
          
          <Button
            onClick={() => setIsSettingsOpen(true)}
            variant="ghost"
            size="sm"
            className="gap-2"
            title="Settings"
          >
            <Settings size={16} />
            Settings
          </Button>
          
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={handleInitializeDummyData}
              variant="ghost"
              size="sm"
              className="gap-2 text-xs"
              title="Initialize dummy data"
            >
              <Database size={16} />
            </Button>
          )}
        </div>
      </nav>

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        initialStep={addNewInitialStep}
        onBusinessCreate={handleBusinessCreate}
        onContactCreate={handleContactCreate}
        onProjectCreate={handleProjectCreate}
        onProjectCreated={(projectId) => {
          console.log('Project created:', projectId)
          setIsOnboardingOpen(false)
        }}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  )
}
