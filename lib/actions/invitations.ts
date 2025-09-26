"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function sendCollaboratorInvitation(
  projectId: string,
  email: string,
  role: "collaborator" | "viewer"
) {
  const supabase = await createClient()
  
  try {
    console.log(`[INVITATION] Starting invitation process for ${email} to project ${projectId}`)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log("[INVITATION] No user authenticated")
      throw new Error("User not authenticated")
    }

    console.log(`[INVITATION] User authenticated: ${user.email}`)

    // Check if user is the project owner
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("user_id, title")
      .eq("id", projectId)
      .single()

    if (projectError) {
      console.log("[INVITATION] Error fetching project:", projectError.message)
      throw new Error("Project not found")
    }

    if (!project || project.user_id !== user.id) {
      console.log("[INVITATION] User is not project owner")
      throw new Error("You don't have permission to invite collaborators to this project")
    }

    console.log(`[INVITATION] Project found: "${project.title}"`)

    // Check if invitation already exists (with error handling)
    try {
      const { data: existingInvitation, error: existingError } = await supabase
        .from("project_collaborators")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_email", email.toLowerCase())
        .single()

      if (existingError && existingError.code !== 'PGRST116') {
        console.log("[INVITATION] Error checking existing invitation:", existingError.message)
        // Don't throw error, just continue
      } else if (existingInvitation) {
        console.log("[INVITATION] Invitation already exists")
        throw new Error("An invitation has already been sent to this email address")
      }
    } catch (checkError) {
      if (checkError.message.includes("already been sent")) {
        throw checkError
      }
      console.log("[INVITATION] Could not check existing invitations, continuing...")
    }

    console.log("[INVITATION] No existing invitation found, creating new one")

    // Create the invitation with IMMEDIATE ACCESS (like Google Sheets)
    const { data: invitationData, error: insertError } = await supabase
      .from("project_collaborators")
      .insert({
        project_id: projectId,
        user_email: email.toLowerCase(),
        role,
        status: "accepted", // IMMEDIATE ACCESS
        invited_by: user.id,
        accepted_at: new Date().toISOString(), // IMMEDIATE
      })
      .select()
      .single()

    if (insertError) {
      console.log("[INVITATION] Error creating invitation:", insertError.message)
      throw new Error(`Failed to create invitation: ${insertError.message}`)
    }

    console.log(`[INVITATION] Invitation created successfully with ID: ${invitationData.id}`)
    console.log(`[INVITATION] Invitation sent to ${email} for project "${project.title}" with role "${role}"`)
    
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/")
    
    return { success: true, message: "Invitation sent successfully!" }
  } catch (error) {
    console.error("[INVITATION] Error sending invitation:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to send invitation" 
    }
  }
}

export async function respondToInvitation(
  invitationId: string,
  response: "accepted" | "declined"
) {
  const supabase = await createClient()
  
  try {
    console.log(`[RESPOND] Starting invitation response process for ${invitationId} with ${response}`)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log("[RESPOND] No user authenticated")
      throw new Error("User not authenticated")
    }

    console.log(`[RESPOND] User ${user.email} responding to invitation ${invitationId} with ${response}`)

    // First, get the invitation to verify it exists and belongs to this user
    const { data: invitation, error: fetchError } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("id", invitationId)
      .eq("user_email", user.email)
      .single()

    if (fetchError) {
      console.log("[RESPOND] Error fetching invitation:", fetchError.message)
      throw new Error("Invitation not found or doesn't belong to this user")
    }

    console.log(`[RESPOND] Found invitation for project ${invitation.project_id}`)

    // Update the invitation status
    const updateData: any = { 
      status: response,
      updated_at: new Date().toISOString()
    }
    
    if (response === "accepted") {
      updateData.accepted_at = new Date().toISOString()
      updateData.user_id = user.id
      console.log(`[RESPOND] Setting user_id to ${user.id} for accepted invitation`)
    }

    const { data: updatedInvitation, error: updateError } = await supabase
      .from("project_collaborators")
      .update(updateData)
      .eq("id", invitationId)
      .eq("user_email", user.email)
      .select()
      .single()

    if (updateError) {
      console.log("[RESPOND] Error updating invitation:", updateError.message)
      throw new Error(`Failed to update invitation: ${updateError.message}`)
    }

    console.log(`[RESPOND] Successfully ${response} invitation ${invitationId}`)
    console.log(`[RESPOND] Updated invitation data:`, updatedInvitation)
    
    revalidatePath("/")
    
    return { 
      success: true, 
      message: response === "accepted" ? "Invitation accepted!" : "Invitation declined" 
    }
  } catch (error) {
    console.error("[RESPOND] Error responding to invitation:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to respond to invitation" 
    }
  }
}

export async function removeCollaborator(collaboratorId: string) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get the collaborator record to check permissions
    const { data: collaborator } = await supabase
      .from("project_collaborators")
      .select("project_id, projects(user_id)")
      .eq("id", collaboratorId)
      .single()

    if (!collaborator) {
      throw new Error("Collaborator not found")
    }

    // Check if user is the project owner
    if (collaborator.projects?.user_id !== user.id) {
      throw new Error("You don't have permission to remove this collaborator")
    }

    const { error } = await supabase
      .from("project_collaborators")
      .delete()
      .eq("id", collaboratorId)

    if (error) throw error

    revalidatePath(`/projects/${collaborator.project_id}`)
    
    return { success: true, message: "Collaborator removed successfully!" }
  } catch (error) {
    console.error("Error removing collaborator:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to remove collaborator" 
    }
  }
}

export async function updateCollaboratorRole(
  collaboratorId: string,
  newRole: "collaborator" | "viewer"
) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Get the collaborator record to check permissions
    const { data: collaborator } = await supabase
      .from("project_collaborators")
      .select("project_id, projects(user_id)")
      .eq("id", collaboratorId)
      .single()

    if (!collaborator) {
      throw new Error("Collaborator not found")
    }

    // Check if user is the project owner
    if (collaborator.projects?.user_id !== user.id) {
      throw new Error("You don't have permission to update this collaborator's role")
    }

    const { error } = await supabase
      .from("project_collaborators")
      .update({ role: newRole })
      .eq("id", collaboratorId)

    if (error) throw error

    revalidatePath(`/projects/${collaborator.project_id}`)
    
    return { success: true, message: "Role updated successfully!" }
  } catch (error) {
    console.error("Error updating collaborator role:", error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : "Failed to update role" 
    }
  }
}
