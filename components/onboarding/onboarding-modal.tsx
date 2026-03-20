'use client'

import { useState } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { X, Building2, User, FolderKanban } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ProjectTemplateSelector } from './project-template-selector'
import { useAuthContext } from '@/contexts/auth-context'
import { cloneProject } from '@/services/projects'
import type { Project } from '@/types/database'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onBusinessCreate: () => void
  onContactCreate: () => void
  onProjectCreate: () => void
  onProjectCreated?: (projectId: string) => void
}

type OnboardingStep = 'select' | 'business' | 'contact' | 'project' | 'project-template'

export function OnboardingModal({
  isOpen,
  onClose,
  onBusinessCreate,
  onContactCreate,
  onProjectCreate,
  onProjectCreated,
}: OnboardingModalProps) {
  const [step, setStep] = useState<OnboardingStep>('select')
  const { user } = useAuthContext()

  if (!isOpen) return null

  const handleBusinessClick = () => {
    setStep('business')
    onBusinessCreate()
  }

  const handleContactClick = () => {
    setStep('contact')
    onContactCreate()
  }

  const handleProjectClick = () => {
    setStep('project-template')
  }

  const handleProjectCreateNew = () => {
    setStep('project')
    onProjectCreate()
  }

  const handleTemplateSelect = async (modifiedTemplate: Project) => {
    if (!user) return

    try {
      // Clone from the original template project (use the template's ID)
      // If the template itself was cloned, we still clone from it (creating a chain)
      const templateProjectId = modifiedTemplate.id

      const result = await cloneProject(user.uid, templateProjectId, {
        businessId: modifiedTemplate.businessId,
        clientName: modifiedTemplate.clientName,
        name: modifiedTemplate.name,
        deadline: null, // Reset deadline
        confidenceScore: 50, // Reset to neutral
      })

      if (result.success && result.data) {
        onProjectCreated?.(result.data)
        onClose()
        setStep('select')
      } else {
        const message = !result.success ? result.error : 'Failed to create project'
        alert(`Failed to create project: ${message}`)
      }
    } catch (error) {
      console.error('Failed to clone project:', error)
      alert('Failed to create project from template')
    }
  }

  const handleBack = () => {
    setStep('select')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <GlassPanel
        className="relative w-full max-w-md p-6 shadow-depth"
        variant="strong"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-white/60 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-6">Add New</h2>

        {step === 'select' && (
          <div className="space-y-3">
            <button
              onClick={handleBusinessClick}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg',
                'glass hover:glass-strong transition-all card-hover',
                'text-left animate-card-in'
              )}
            >
              <div className="p-2 rounded-lg bg-white/10 icon-bounce">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Business</h3>
                <p className="text-sm text-white/60">
                  Add a new business or client
                </p>
              </div>
            </button>

            <button
              onClick={handleContactClick}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg',
                'glass hover:glass-strong transition-all card-hover',
                'text-left animate-card-in-delay-1'
              )}
            >
              <div className="p-2 rounded-lg bg-white/10 icon-bounce">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Contact</h3>
                <p className="text-sm text-white/60">
                  Add a contact at a business
                </p>
              </div>
            </button>

            <button
              onClick={handleProjectClick}
              className={cn(
                'w-full flex items-center gap-4 p-4 rounded-lg',
                'glass hover:glass-strong transition-all card-hover',
                'text-left animate-card-in-delay-2'
              )}
            >
              <div className="p-2 rounded-lg bg-white/10 icon-bounce">
                <FolderKanban size={24} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Project</h3>
                <p className="text-sm text-white/60">
                  Create a new project
                </p>
              </div>
            </button>
          </div>
        )}

        {step === 'project-template' && user && (
          <ProjectTemplateSelector
            userId={user.uid}
            onSelectTemplate={handleTemplateSelect}
            onCreateNew={handleProjectCreateNew}
            onCancel={handleBack}
          />
        )}

        {(step === 'business' || step === 'contact' || step === 'project') && (
          <div className="space-y-4">
            <p className="text-white/80">
              {step === 'business' && 'Business creation form will appear here'}
              {step === 'contact' && 'Contact creation form will appear here'}
              {step === 'project' && 'Project creation form will appear here'}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleBack} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={onClose} variant="default" className="flex-1">
                Close
              </Button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  )
}
