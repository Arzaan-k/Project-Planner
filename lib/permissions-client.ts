import { createClient } from "@/lib/supabase/client"

export interface ProjectPermission {
  canView: boolean
  canEdit: boolean
  canDelete: boolean
  canInviteCollaborators: boolean
  role: 'owner' | 'collaborator' | 'viewer' | null
}

export async function checkProjectPermissionClient(projectId: string): Promise<ProjectPermission> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canInviteCollaborators: false,
        role: null
      }
    }

    // Check if user is the project owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single()

    if (project?.user_id === user.id) {
      return {
        canView: true,
        canEdit: true,
        canDelete: true,
        canInviteCollaborators: true,
        role: 'owner'
      }
    }

    // Check if user is a collaborator
    const { data: collaboration } = await supabase
      .from("project_collaborators")
      .select("role, status")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .single()

    if (collaboration) {
      const permissions: ProjectPermission = {
        canView: true,
        canEdit: collaboration.role === 'collaborator',
        canDelete: false,
        canInviteCollaborators: false,
        role: collaboration.role as 'collaborator' | 'viewer'
      }
      return permissions
    }

    // Check if user has a pending invitation
    const { data: pendingInvitation } = await supabase
      .from("project_collaborators")
      .select("role, status")
      .eq("project_id", projectId)
      .eq("user_email", user.email)
      .eq("status", "pending")
      .single()

    if (pendingInvitation) {
      return {
        canView: false,
        canEdit: false,
        canDelete: false,
        canInviteCollaborators: false,
        role: null
      }
    }

    // No access
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canInviteCollaborators: false,
      role: null
    }
  } catch (error) {
    console.error("Error checking project permissions:", error)
    return {
      canView: false,
      canEdit: false,
      canDelete: false,
      canInviteCollaborators: false,
      role: null
    }
  }
}

export async function getUserProjectsClient(): Promise<string[]> {
  const supabase = createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Get projects owned by user
    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id)

    let collaboratedProjectIds: string[] = []

    // Try to get projects where user is a collaborator (if table exists)
    try {
      const { data: collaboratedProjects } = await supabase
        .from("project_collaborators")
        .select("project_id")
        .eq("user_id", user.id)
        .eq("status", "accepted")

      collaboratedProjectIds = collaboratedProjects?.map(c => c.project_id) || []
    } catch (collaborationError) {
      // If project_collaborators table doesn't exist or has issues, just return owned projects
      console.log("Collaboration table not available, returning only owned projects")
    }

    const projectIds = [
      ...(ownedProjects?.map(p => p.id) || []),
      ...collaboratedProjectIds
    ]

    return [...new Set(projectIds)] // Remove duplicates
  } catch (error) {
    console.error("Error getting user projects:", error)
    return []
  }
}
