'use client'

import { useState, useEffect } from 'react'
import { GlassPanel } from '@/components/layout/glass-panel'
import { Button } from '@/components/ui/button'
import { getUserProjects } from '@/services/projects'
import { getUserBusinesses } from '@/services/businesses'
import type { Project } from '@/types/database'
import type { Business } from '@/types/database'
import { cn } from '@/lib/utils/cn'
import { FolderKanban, Building2, Sparkles } from 'lucide-react'

interface ProjectTemplateSelectorProps {
  userId: string
  onSelectTemplate: (template: Project) => void
  onCreateNew: () => void
  onCancel: () => void
}

export function ProjectTemplateSelector({
  userId,
  onSelectTemplate,
  onCreateNew,
  onCancel,
}: ProjectTemplateSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<Project | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [projectName, setProjectName] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [projectsResult, businessesResult] = await Promise.all([
          getUserProjects(userId),
          getUserBusinesses(userId),
        ])

        if (projectsResult.success) {
          setProjects(projectsResult.data)
        }
        if (businessesResult.success) {
          setBusinesses(businessesResult.data)
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [userId])

  const handleTemplateSelect = (template: Project) => {
    setSelectedTemplate(template)
    setProjectName(`${template.name} (Copy)`)
    setSelectedBusinessId(template.businessId)
  }

  const handleCreateFromTemplate = () => {
    if (selectedTemplate) {
      // Pass the template and overrides separately
      const businessName = selectedBusinessId
        ? businesses.find((b) => b.id === selectedBusinessId)?.name || selectedTemplate.clientName
        : selectedTemplate.clientName

      const modifiedTemplate: Project = {
        ...selectedTemplate,
        businessId: selectedBusinessId,
        clientName: businessName,
        name: projectName || `${selectedTemplate.name} (Copy)`,
      }
      onSelectTemplate(modifiedTemplate)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-white/60">Loading projects...</p>
      </div>
    )
  }

  if (selectedTemplate) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Customise Template</h3>
          <p className="text-sm text-white/60 mb-4">
            Based on: <span className="text-white">{selectedTemplate.name}</span>
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Enter project name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Business/Client</label>
            <select
              value={selectedBusinessId || ''}
              onChange={(e) => setSelectedBusinessId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg glass border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 bg-black/20 text-white text-sm"
            >
              <option value="" className="bg-slate-900 text-white">
                Personal Project
              </option>
              {businesses.map((business) => (
                <option
                  key={business.id}
                  value={business.id}
                  className="bg-slate-900 text-white"
                >
                  {business.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setSelectedTemplate(null)}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleCreateFromTemplate}
              variant="default"
              className="flex-1"
              disabled={!projectName.trim()}
            >
              Create Project
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Create from Template</h3>
        <p className="text-sm text-white/60 mb-4">
          Start with a similar project and customise the details
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-8">
          <FolderKanban size={48} className="mx-auto mb-4 text-white/40" />
          <p className="text-white/60 mb-4">No existing projects to use as templates</p>
          <Button onClick={onCreateNew} variant="default">
            Create New Project
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {projects.map((project, index) => {
              const delayClass = index === 0 ? 'animate-card-in' :
                index === 1 ? 'animate-card-in-delay-1' :
                index === 2 ? 'animate-card-in-delay-2' :
                index === 3 ? 'animate-card-in-delay-3' :
                index === 4 ? 'animate-card-in-delay-4' :
                'animate-card-in-delay-5'
              
              return (
              <button
                key={project.id}
                onClick={() => handleTemplateSelect(project)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg',
                  'glass hover:glass-strong transition-all card-hover',
                  'text-left',
                  delayClass
                )}
              >
                <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce">
                  <FolderKanban size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1 truncate">{project.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Building2 size={12} />
                    <span className="truncate">{project.clientName}</span>
                  </div>
                  {project.fixedFee && (
                    <p className="text-xs text-white/50 mt-1">
                      £{project.fixedFee.toLocaleString()}
                    </p>
                  )}
                </div>
                <Sparkles size={16} className="text-white/40 flex-shrink-0" />
              </button>
              )
            })}
          </div>

          <div className="pt-2 border-t border-white/10">
            <Button
              onClick={onCreateNew}
              variant="ghost"
              className="w-full"
            >
              Create New Project (No Template)
            </Button>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  )
}
