/**
 * Project service layer
 * Handles all project-related Firestore operations
 */

import {
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
  projectsCollection,
  projectConfidenceHistoryCollection,
  where,
  dateToTimestamp,
} from '@/lib/storage/firestore'
import type { Project, ProjectConfidenceHistory } from '@/types/database'
import type { ActionResponse } from '@/types/actions'

export async function getProject(projectId: string): Promise<ActionResponse<Project>> {
  try {
    const project = await getDocument<Project>(projectsCollection, projectId)
    if (!project) {
      return { success: false, error: 'Project not found' }
    }
    return { success: true, data: project }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch project',
    }
  }
}

export async function getUserProjects(userId: string): Promise<ActionResponse<Project[]>> {
  try {
    const projects = await getDocuments<Project>(projectsCollection, [
      where('userId', '==', userId),
      where('archived', '==', false),
    ])
    projects.sort((a, b) => {
      const aTs = new Date(a.lastTouchedAt).getTime()
      const bTs = new Date(b.lastTouchedAt).getTime()
      return bTs - aTs
    })
    return { success: true, data: projects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch projects',
    }
  }
}

export async function createProject(
  userId: string,
  projectData: Omit<Project, 'id' | 'userId' | 'createdAt' | 'lastTouchedAt'>
): Promise<ActionResponse<string>> {
  try {
    const now = new Date()
    const projectId = await createDocument<Project>(
      projectsCollection,
      {
        ...projectData,
        userId,
        lastTouchedAt: dateToTimestamp(now),
        archived: false,
      }
    )
    return { success: true, data: projectId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    }
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<Project>
): Promise<ActionResponse<void>> {
  try {
    await updateDocument(projectsCollection, projectId, updates)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update project',
    }
  }
}

export async function updateProjectConfidence(
  projectId: string,
  newScore: number,
  previousScore: number
): Promise<ActionResponse<void>> {
  try {
    // Update project confidence
    await updateDocument(projectsCollection, projectId, {
      confidenceScore: newScore,
      lastTouchedAt: dateToTimestamp(new Date()),
    })

    // Log confidence history
    await createDocument<ProjectConfidenceHistory>(
      projectConfidenceHistoryCollection,
      {
        projectId,
        previousScore,
        newScore,
        changedAt: dateToTimestamp(new Date()),
      }
    )

    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update confidence score',
    }
  }
}

export async function archiveProject(projectId: string): Promise<ActionResponse<void>> {
  try {
    await updateDocument(projectsCollection, projectId, {
      archived: true,
    })
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to archive project',
    }
  }
}

export async function deleteProject(projectId: string): Promise<ActionResponse<void>> {
  try {
    await deleteDocument(projectsCollection, projectId)
    return { success: true, data: undefined }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete project',
    }
  }
}

/**
 * Clone a project from a template
 * Copies all properties but allows overriding specific fields (business, client, etc.)
 */
export async function cloneProject(
  userId: string,
  templateProjectId: string,
  overrides: Partial<Pick<Project, 'businessId' | 'clientName' | 'name' | 'deadline' | 'fixedFee' | 'confidenceScore'>>
): Promise<ActionResponse<string>> {
  try {
    // Get the template project
    const templateResult = await getProject(templateProjectId)
    if (!templateResult.success || !templateResult.data) {
      return { success: false, error: 'Template project not found' }
    }

    const template = templateResult.data
    const now = new Date()

    // Create new project with template properties and overrides
    const newProject: Omit<Project, 'id' | 'userId' | 'createdAt' | 'lastTouchedAt'> = {
      businessId: overrides.businessId !== undefined ? overrides.businessId : template.businessId,
      name: overrides.name || `${template.name} (Copy)`,
      clientName: overrides.clientName || template.clientName,
      fixedFee: overrides.fixedFee !== undefined ? overrides.fixedFee : template.fixedFee,
      deadline: overrides.deadline !== undefined ? overrides.deadline : null, // Reset deadline by default
      confidenceScore: overrides.confidenceScore !== undefined ? overrides.confidenceScore : 50, // Reset to neutral
      archived: false,
      templateProjectId: templateProjectId, // Track that this was cloned
    }

    const projectId = await createDocument<Project>(
      projectsCollection,
      {
        ...newProject,
        userId,
        lastTouchedAt: dateToTimestamp(now),
      }
    )

    return { success: true, data: projectId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clone project',
    }
  }
}
