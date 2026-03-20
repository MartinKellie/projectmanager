'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { OnboardingModal } from './onboarding-modal'
import { useAuthContext } from '@/contexts/auth-context'
import { initializeDummyData } from '@/lib/data/dummy-data'

export function OnboardingButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuthContext()

  const handleOpen = () => {
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
  }

  const handleBusinessCreate = () => {
    // TODO: Implement business creation form
    console.log('Create business')
  }

  const handleContactCreate = () => {
    // TODO: Implement contact creation form
    console.log('Create contact')
  }

  const handleProjectCreate = () => {
    // TODO: Implement project creation form
    console.log('Create project')
  }

  const handleInitializeDummyData = async () => {
    if (user) {
      try {
        // Clear the flag to force reinitialization
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

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={handleOpen}
          className="w-full justify-start gap-2"
          variant="default"
        >
          <Plus size={18} />
          Add New
        </Button>
        <Button
          onClick={handleInitializeDummyData}
          className="w-full justify-start gap-2 text-xs"
          variant="ghost"
          size="sm"
        >
          Initialize Dummy Data
        </Button>
      </div>

      <OnboardingModal
        isOpen={isModalOpen}
        onClose={handleClose}
        onBusinessCreate={handleBusinessCreate}
        onContactCreate={handleContactCreate}
        onProjectCreate={handleProjectCreate}
        onProjectCreated={(projectId) => {
          console.log('Project created:', projectId)
          // TODO: Refresh project list or show success message
          handleClose()
        }}
      />
    </>
  )
}
