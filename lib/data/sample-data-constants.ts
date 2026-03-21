/**
 * Legacy dummy seed names (before `isSampleData` existed in Firestore).
 * Used only as a fallback when the flag is missing.
 */

export const LEGACY_SAMPLE_BUSINESS_NAMES = new Set([
  'Acme Corporation',
  'TechStartup Ltd',
  'Creative Design Studio',
])

/** Dummy contacts used @*.example.com addresses in the seed script */
export const LEGACY_SAMPLE_CONTACT_EMAIL =
  /@(acme|techstartup|creativedesign)\.example\.com$/i

/** Name + client pairs from the original dummy project seed */
export const LEGACY_SAMPLE_PROJECT_SIGNATURES: Array<{
  name: string
  clientName: string
  onlyWithoutBusiness?: boolean
}> = [
  { name: 'Website Redesign', clientName: 'Acme Corporation' },
  { name: 'Mobile App Development', clientName: 'Acme Corporation' },
  { name: 'API Integration', clientName: 'TechStartup Ltd' },
  { name: 'Dashboard Redesign', clientName: 'TechStartup Ltd' },
  { name: 'Brand Identity Package', clientName: 'Creative Design Studio' },
  {
    name: 'Personal Portfolio Site',
    clientName: 'Personal',
    onlyWithoutBusiness: true,
  },
]
