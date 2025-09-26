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
        canEdit: true, // Full edit access
        canDelete: true, // Full delete access
        canInviteCollaborators: true, // Can invite other collaborators
        role: 'collaborator' // Treat as full collaborator
      }
      return permissions
    }

    // Also check by email (for Google Sheets style sharing)
    const { data: emailCollaboration } = await supabase
      .from("project_collaborators")
      .select("role, status")
      .eq("project_id", projectId)
      .eq("user_email", user.email)
      .eq("status", "accepted")
      .single()

    if (emailCollaboration) {
      const permissions: ProjectPermission = {
        canView: true,
        canEdit: true, // Full edit access
        canDelete: true, // Full delete access
        canInviteCollaborators: true, // Can invite other collaborators
        role: 'collaborator' // Treat as full collaborator
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
    if (!user) {
      console.log("[v0] getUserProjectsClient - No user authenticated")
      return []
    }

    console.log("[v0] getUserProjectsClient - User:", user.email)

    // Get projects owned by user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", user.id)

    if (ownedError) {
      console.error("Error fetching owned projects:", ownedError)
    }

    let collaboratedProjectIds: string[] = []

    // Try to get projects where user is a collaborator (with error handling)
    try {
      // Check by user_id first
      const { data: collaboratedProjects, error: collabError } = await supabase
        .from("project_collaborators")
        .select("project_id")
        .eq("user_id", user.id)

      if (collabError) {
        console.log("Collaboration table not accessible (this is normal if not set up yet):", collabError.message)
      } else {
        collaboratedProjectIds = collaboratedProjects?.map(c => c.project_id) || []
        console.log("[v0] Collaborations by user_id:", collaboratedProjectIds)
      }
      
      // Check for collaborations by email (Google Sheets style)
      const { data: emailCollaboratedProjects, error: emailError } = await supabase
        .from("project_collaborators")
        .select("project_id")
        .eq("user_email", user.email)

      if (emailError) {
        console.log("Email collaboration check failed (this is normal if not set up yet):", emailError.message)
      } else {
        const emailProjectIds = emailCollaboratedProjects?.map(c => c.project_id) || []
        console.log("[v0] Collaborations by email:", emailProjectIds)
        collaboratedProjectIds = [...collaboratedProjectIds, ...emailProjectIds]
      }

      // Also try case-insensitive email match
      const { data: emailCollaboratedProjectsCaseInsensitive, error: emailErrorCaseInsensitive } = await supabase
        .from("project_collaborators")
        .select("project_id")
        .ilike("user_email", user.email)

      if (emailErrorCaseInsensitive) {
        console.log("Case-insensitive email collaboration check failed:", emailErrorCaseInsensitive.message)
      } else {
        const emailProjectIdsCaseInsensitive = emailCollaboratedProjectsCaseInsensitive?.map(c => c.project_id) || []
        console.log("[v0] Collaborations by email (case-insensitive):", emailProjectIdsCaseInsensitive)
        collaboratedProjectIds = [...collaboratedProjectIds, ...emailProjectIdsCaseInsensitive]
      }
    } catch (collaborationError) {
      console.log("Collaboration system not available (this is normal if not set up yet):", collaborationError.message)
    }

    const projectIds = [
      ...(ownedProjects?.map(p => p.id) || []),
      ...collaboratedProjectIds
    ]

    const uniqueProjectIds = [...new Set(projectIds)] // Remove duplicates
    
    console.log("[v0] getUserProjectsClient - Owned projects:", ownedProjects?.length || 0)
    console.log("[v0] getUserProjectsClient - Collaborated projects:", collaboratedProjectIds.length)
    console.log("[v0] getUserProjectsClient - Total accessible projects:", uniqueProjectIds.length)
    console.log("[v0] getUserProjectsClient - Project IDs:", uniqueProjectIds)
    
    return uniqueProjectIds
  } catch (error) {
    console.error("Error getting user projects:", error)
    return []
  }
}
