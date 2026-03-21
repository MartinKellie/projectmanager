import type { Business, Contact, Project } from '@/types/database'
import {
  LEGACY_SAMPLE_BUSINESS_NAMES,
  LEGACY_SAMPLE_CONTACT_EMAIL,
  LEGACY_SAMPLE_PROJECT_SIGNATURES,
} from '@/lib/data/sample-data-constants'

export function isSampleBusiness(business: Business): boolean {
  if (business.isSampleData === true) return true
  return LEGACY_SAMPLE_BUSINESS_NAMES.has(business.name)
}

export function isSampleContact(contact: Contact): boolean {
  if (contact.isSampleData === true) return true
  const email = contact.email?.trim()
  if (email && LEGACY_SAMPLE_CONTACT_EMAIL.test(email)) return true
  return false
}

export function isSampleProject(project: Project): boolean {
  if (project.isSampleData === true) return true

  return LEGACY_SAMPLE_PROJECT_SIGNATURES.some((sig) => {
    if (project.name !== sig.name || project.clientName !== sig.clientName) return false
    if (sig.onlyWithoutBusiness) return project.businessId == null
    return true
  })
}
