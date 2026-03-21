/**
 * Dummy data generator for development
 * Creates persistent sample data for businesses, contacts, and projects
 */

import { createBusiness } from '@/services/businesses'
import { createContact } from '@/services/contacts'
import { createProject } from '@/services/projects'
import { dateToTimestamp } from '@/lib/storage/firestore'

async function hasExistingData(userId: string): Promise<boolean> {
  try {
    const { getDocuments, businessesCollection, where } = await import('@/lib/storage/firestore')
    const businesses = await getDocuments(businessesCollection, [
      where('userId', '==', userId),
    ])
    return businesses.length > 0
  } catch {
    return false
  }
}

export async function initializeDummyData(userId: string): Promise<void> {
  const hasData = await hasExistingData(userId)
  if (hasData) return

  try {
    // Create businesses
    const acmeCorpId = await createBusiness(userId, {
      name: 'Acme Corporation',
      website: 'https://acme.example.com',
      industry: 'Technology',
      notes: 'Long-term client, very responsive',
      isSampleData: true,
    }).then((r) => r.success ? r.data : null)

    const techStartupId = await createBusiness(userId, {
      name: 'TechStartup Ltd',
      website: 'https://techstartup.example.com',
      industry: 'Software',
      notes: 'Fast-growing startup, exciting projects',
      isSampleData: true,
    }).then((r) => r.success ? r.data : null)

    const designStudioId = await createBusiness(userId, {
      name: 'Creative Design Studio',
      website: 'https://creativedesign.example.com',
      industry: 'Design',
      notes: 'Design-focused agency, great collaboration',
      isSampleData: true,
    }).then((r) => r.success ? r.data : null)

    // Create contacts
    if (acmeCorpId) {
      await createContact(userId, {
        businessId: acmeCorpId,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@acme.example.com',
        phone: '+44 20 1234 5678',
        role: 'Project Manager',
        notes: 'Main point of contact for Acme projects',
        isSampleData: true,
      })

      await createContact(userId, {
        businessId: acmeCorpId,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@acme.example.com',
        phone: '+44 20 1234 5679',
        role: 'CTO',
        notes: 'Technical decision maker',
        isSampleData: true,
      })
    }

    if (techStartupId) {
      await createContact(userId, {
        businessId: techStartupId,
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael@techstartup.example.com',
        phone: '+44 20 2345 6789',
        role: 'Founder & CEO',
        notes: 'Very hands-on, involved in all projects',
        isSampleData: true,
      })

      await createContact(userId, {
        businessId: techStartupId,
        firstName: 'Emma',
        lastName: 'Williams',
        email: 'emma@techstartup.example.com',
        role: 'Product Manager',
        notes: 'Handles product requirements',
        isSampleData: true,
      })
    }

    if (designStudioId) {
      await createContact(userId, {
        businessId: designStudioId,
        firstName: 'David',
        lastName: 'Brown',
        email: 'david@creativedesign.example.com',
        phone: '+44 20 3456 7890',
        role: 'Creative Director',
        notes: 'Leads all creative projects',
        isSampleData: true,
      })
    }

    // Create projects
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    if (acmeCorpId) {
      await createProject(userId, {
        businessId: acmeCorpId,
        name: 'Website Redesign',
        clientName: 'Acme Corporation',
        fixedFee: 15000,
        deadline: dateToTimestamp(nextMonth),
        confidenceScore: 75,
        archived: false,
        templateProjectId: null,
        isSampleData: true,
      })

      await createProject(userId, {
        businessId: acmeCorpId,
        name: 'Mobile App Development',
        clientName: 'Acme Corporation',
        fixedFee: 25000,
        deadline: dateToTimestamp(nextWeek),
        confidenceScore: 60,
        archived: false,
        templateProjectId: null,
        isSampleData: true,
      })
    }

    if (techStartupId) {
      await createProject(userId, {
        businessId: techStartupId,
        name: 'API Integration',
        clientName: 'TechStartup Ltd',
        fixedFee: null,
        deadline: dateToTimestamp(nextMonth),
        confidenceScore: 85,
        archived: false,
        templateProjectId: null,
        isSampleData: true,
      })

      await createProject(userId, {
        businessId: techStartupId,
        name: 'Dashboard Redesign',
        clientName: 'TechStartup Ltd',
        fixedFee: 8000,
        deadline: dateToTimestamp(nextWeek),
        confidenceScore: 70,
        archived: false,
        templateProjectId: null,
        isSampleData: true,
      })
    }

    if (designStudioId) {
      await createProject(userId, {
        businessId: designStudioId,
        name: 'Brand Identity Package',
        clientName: 'Creative Design Studio',
        fixedFee: 12000,
        deadline: dateToTimestamp(nextMonth),
        confidenceScore: 90,
        archived: false,
        templateProjectId: null,
        isSampleData: true,
      })
    }

    // Create a personal project (no business)
    await createProject(userId, {
      businessId: null,
      name: 'Personal Portfolio Site',
      clientName: 'Personal',
      fixedFee: null,
      deadline: null,
      confidenceScore: 50,
      archived: false,
      templateProjectId: null,
      isSampleData: true,
    })

  } catch (error) {
    console.error('Failed to initialize dummy data:', error)
    throw error
  }
}
