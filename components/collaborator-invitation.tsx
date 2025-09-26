"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { UserPlus, Mail, UserCheck, UserX, Crown, Users, Eye } from "lucide-react"
import { toast } from "sonner"
import { sendCollaboratorInvitation, removeCollaborator, updateCollaboratorRole } from "@/lib/actions/invitations"

interface Collaborator {
  id: string
  project_id: string
  user_email: string
  user_id: string | null
  role: "owner" | "collaborator" | "viewer"
  status: "pending" | "accepted" | "declined"
  invited_by: string
  invited_at: string
  accepted_at: string | null
  user_name?: string
}

interface CollaboratorInvitationProps {
  projectId: string
  collaborators: Collaborator[]
  onCollaboratorsChange: () => void
}

export function CollaboratorInvitation({ projectId, collaborators, onCollaboratorsChange }: CollaboratorInvitationProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"collaborator" | "viewer">("collaborator")
  const [isInviting, setIsInviting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const supabase = createClient()

  const handleInviteCollaborator = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email address")
      return
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsInviting(true)

    try {
      const result = await sendCollaboratorInvitation(projectId, email.trim(), role)
      
      if (result.success) {
        toast.success(result.message)
        setEmail("")
        setRole("collaborator")
        setIsOpen(false)
        onCollaboratorsChange()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error inviting collaborator:", error)
      if (error instanceof Error && error.message.includes("project_collaborators")) {
        toast.error("Database table not found. Please run the SQL migration first.")
      } else {
        toast.error("Failed to send invitation")
      }
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    try {
      const result = await removeCollaborator(collaboratorId)
      
      if (result.success) {
        toast.success(result.message)
        onCollaboratorsChange()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error removing collaborator:", error)
      toast.error("Failed to remove collaborator")
    }
  }

  const handleUpdateRole = async (collaboratorId: string, newRole: string) => {
    try {
      const result = await updateCollaboratorRole(collaboratorId, newRole as "collaborator" | "viewer")
      
      if (result.success) {
        toast.success(result.message)
        onCollaboratorsChange()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("Failed to update role")
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />
      case "collaborator":
        return <Users className="h-4 w-4" />
      case "viewer":
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "declined":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "collaborator":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Project Collaborators
            </CardTitle>
            <CardDescription>Manage who can access and edit this project</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Collaborator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
                <DialogDescription>
                  Send an invitation to collaborate on this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="collaborator@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={(value: "collaborator" | "viewer") => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collaborator">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Collaborator - Can edit and manage project
                        </div>
                      </SelectItem>
                      <SelectItem value="viewer">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Viewer - Can only view project
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteCollaborator} disabled={isInviting}>
                  {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {collaborators.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No collaborators yet</h3>
            <p className="text-muted-foreground mb-4">
              Invite team members to collaborate on this project
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite First Collaborator
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(collaborator.role)}
                    <div>
                      <div className="font-medium">{collaborator.user_email}</div>
                      <div className="text-sm text-muted-foreground">
                        Invited {new Date(collaborator.invited_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(collaborator.role)}>
                    {collaborator.role}
                  </Badge>
                  <Badge className={getStatusColor(collaborator.status)}>
                    {collaborator.status}
                  </Badge>
                  {collaborator.status === "accepted" && collaborator.role !== "owner" && (
                    <Select
                      value={collaborator.role}
                      onValueChange={(value) => handleUpdateRole(collaborator.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="collaborator">Collaborator</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {collaborator.role !== "owner" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UserX className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {collaborator.user_email} from this project?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemoveCollaborator(collaborator.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
