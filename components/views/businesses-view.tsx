'use client'

import { useEffect, useState, useCallback } from 'react'
import { deleteBusiness, getUserBusinesses, updateBusiness } from '@/services/businesses'
import { AnimatedCard } from '@/components/ui/animated-card'
import { APP_DATA_REFRESH_EVENT } from '@/lib/events/data-refresh'
import { triggerAppToast } from '@/lib/events/toast'
import type { Business } from '@/types/database'
import { Building2, Globe, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface BusinessesViewProps {
  userId: string
}

export function BusinessesView({ userId }: BusinessesViewProps) {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)

  const loadBusinesses = useCallback(async () => {
    try {
      const result = await getUserBusinesses(userId)
      if (result.success) setBusinesses(result.data)
    } catch (error) {
      console.error('Failed to load businesses:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) loadBusinesses()
  }, [userId, loadBusinesses])

  async function handleEditBusiness(business: Business) {
    const nextName = window.prompt('Business name', business.name)
    if (nextName === null) return

    const nextIndustry = window.prompt('Industry', business.industry || '')
    if (nextIndustry === null) return

    const nextWebsite = window.prompt('Website', business.website || '')
    if (nextWebsite === null) return

    const result = await updateBusiness(business.id, {
      name: nextName.trim() || business.name,
      industry: nextIndustry.trim() || null,
      website: nextWebsite.trim() || null,
    })
    if (!result.success) return window.alert(result.error || 'Failed to update business')

    triggerAppToast({ message: 'Business updated' })
    loadBusinesses()
  }

  async function handleDeleteBusiness(business: Business) {
    const confirmed = window.confirm(`Delete business "${business.name}"?`)
    if (!confirmed) return

    const result = await deleteBusiness(business.id)
    if (!result.success) return window.alert(result.error || 'Failed to delete business')

    triggerAppToast({ message: 'Business deleted' })
    loadBusinesses()
  }

  useEffect(() => {
    function handleRefresh() {
      if (!userId) return
      setLoading(true)
      loadBusinesses()
    }

    window.addEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
    return () => window.removeEventListener(APP_DATA_REFRESH_EVENT, handleRefresh)
  }, [userId, loadBusinesses])

  if (loading) {
    return (
      <div className="text-white/60 text-sm">Loading businesses...</div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 size={48} className="mx-auto mb-4 text-white/40" />
        <p className="text-white/60">No businesses yet</p>
        <p className="text-xs text-white/40 mt-2">Use &quot;Add New&quot; to create your first business</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {businesses.map((business, index) => (
        <AnimatedCard
          key={business.id}
          className="p-4"
          variant="default"
          index={index}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white/10 flex-shrink-0 icon-bounce">
              <Building2 size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-1">{business.name}</h3>
              <div className="mb-2 flex items-center gap-2">
                <button className="text-xs text-white/60 hover:text-white" onClick={() => handleEditBusiness(business)}>Edit</button>
                <button className="text-xs text-red-300 hover:text-red-200" onClick={() => handleDeleteBusiness(business)}>Delete</button>
              </div>
              <div className="space-y-1 text-xs text-white/60">
                {business.industry && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} />
                    <span>{business.industry}</span>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe size={12} />
                    <a
                      href={business.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors truncate"
                    >
                      {business.website}
                    </a>
                  </div>
                )}
                {business.notes && (
                  <p className="text-white/50 mt-2">{business.notes}</p>
                )}
              </div>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  )
}
