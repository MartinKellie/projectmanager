import { deleteProject } from '@/services/projects'
import type { Project } from '@/types/database'

/** @returns whether the project was deleted in Firestore */
export async function promptAndDeleteProject(project: Project): Promise<boolean> {
  const confirmed = window.confirm(`Delete project "${project.name}"?`)
  if (!confirmed) return false

  const result = await deleteProject(project.id)
  if (!result.success) {
    window.alert(result.error || 'Failed to delete project')
    return false
  }
  return true
}
