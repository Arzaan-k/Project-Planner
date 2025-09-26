"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Mail, UserCheck, UserX, Calendar, Users } from "lucide-react"
import { toast } from "sonner"
import { respondToInvitation } from "@/lib/actions/invitations"
import Link from "next/link"

interface CollaboratorInvitation {
  id: string
  project_id: string
  user_email: string
  role: "owner" | "collaborator" | "viewer"
  status: "pending" | "accepted" | "declined"
  invited_at: string
  accepted_at: string | null
  project_title: string
  project_description: string
  inviter_name: string
}

export function CollaboratorInvitations() {
  const [invitations, setInvitations] = useState<CollaboratorInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("project_collaborators")
        .select(`
          *,
          projects (
            title,
            description
          )
        `)
        .eq("user_email", user.email)
        .eq("status", "pending")
        .order("invited_at", { ascending: false })

      if (error) throw error

      // Transform the data to include project and inviter info
      const transformedInvitations = data?.map(invitation => ({
        id: invitation.id,
        project_id: invitation.project_id,
        user_email: invitation.user_email,
        role: invitation.role,
        status: invitation.status,
        invited_at: invitation.invited_at,
        accepted_at: invitation.accepted_at,
        project_title: invitation.projects?.title || "Unknown Project",
        project_description: invitation.projects?.description || "",
        inviter_name: "Project Owner" // We could fetch this from the inviter's profile
      })) || []

      setInvitations(transformedInvitations)
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast.error("Failed to load invitations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const result = await respondToInvitation(invitationId, "accepted")
      
      if (result.success) {
        toast.success(result.message)
        fetchInvitations()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error accepting invitation:", error)
      toast.error("Failed to accept invitation")
    }
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const result = await respondToInvitation(invitationId, "declined")
      
      if (result.success) {
        toast.success(result.message)
        fetchInvitations()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error declining invitation:", error)
      toast.error("Failed to decline invitation")
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "collaborator":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Project Invitations
          </CardTitle>
          <CardDescription>Manage your project collaboration invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Project Invitations
        </CardTitle>
        <CardDescription>Manage your project collaboration invitations</CardDescription>
      </CardHeader>
      <CardContent>
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
            <p className="text-muted-foreground">
              You don't have any pending project invitations at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{invitation.project_title}</h3>
                      <Badge className={getRoleColor(invitation.role)}>
                        {invitation.role}
                      </Badge>
                    </div>
                    {invitation.project_description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {invitation.project_description.length > 100
                          ? `${invitation.project_description.substring(0, 100)}...`
                          : invitation.project_description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Invited {new Date(invitation.invited_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        By {invitation.inviter_name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <UserX className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Decline Invitation</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to decline the invitation to collaborate on "{invitation.project_title}"?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeclineInvitation(invitation.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Decline
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvitation(invitation.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
