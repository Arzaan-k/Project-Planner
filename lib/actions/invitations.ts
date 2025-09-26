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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Check if user is the project owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id, title")
      .eq("id", projectId)
      .single()

    if (!project || project.user_id !== user.id) {
      throw new Error("You don't have permission to invite collaborators to this project")
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("project_collaborators")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_email", email.toLowerCase())
      .single()

    if (existingInvitation) {
      throw new Error("An invitation has already been sent to this email address")
    }

    // Create the invitation
    const { error } = await supabase
      .from("project_collaborators")
      .insert({
        project_id: projectId,
        user_email: email.toLowerCase(),
        role,
        status: "pending",
        invited_by: user.id,
      })

    if (error) throw error

    // Get inviter name for notification
    const { data: inviter } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()

    const inviterName = inviter?.full_name || user.email || "Unknown User"

    // In a real application, you would send an email here
    // For now, we'll create a notification in the database
    console.log(`Invitation sent to ${email} for project "${project.title}" with role "${role}"`)
    
    // Create a notification for the invited user (if they exist)
    const { data: invitedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single()

    if (invitedUser) {
      // Get the invitation ID we just created
      const { data: invitationData } = await supabase
        .from("project_collaborators")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_email", email.toLowerCase())
        .single()

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          user_id: invitedUser.id,
          title: "New Collaboration Invitation",
          message: `You've been invited to collaborate on "${project.title}" as a ${role} by ${inviterName}`,
          type: "invitation",
          data: {
            project_id: projectId,
            invitation_id: invitationData?.id
          }
        })
    }
    
    // You could integrate with services like:
    // - Resend
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    
    revalidatePath(`/projects/${projectId}`)
    revalidatePath("/")
    
    return { success: true, message: "Invitation sent successfully!" }
  } catch (error) {
    console.error("Error sending invitation:", error)
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("User not authenticated")
    }

    // Update the invitation status
    const updateData: any = { status: response }
    if (response === "accepted") {
      updateData.accepted_at = new Date().toISOString()
      updateData.user_id = user.id
      updateData.updated_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from("project_collaborators")
      .update(updateData)
      .eq("id", invitationId)
      .eq("user_email", user.email)

    if (error) throw error

    revalidatePath("/")
    
    return { 
      success: true, 
      message: response === "accepted" ? "Invitation accepted!" : "Invitation declined" 
    }
  } catch (error) {
    console.error("Error responding to invitation:", error)
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
