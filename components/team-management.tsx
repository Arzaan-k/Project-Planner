"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, UserPlus, Mail, Crown, Shield, User, Eye, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  joined_at: string
}

interface TeamManagementProps {
  projectId: string
  permissions?: {
    canEdit: boolean
    canDelete: boolean
  }
}

export function TeamManagement({ projectId, permissions }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: "member",
    avatar_url: "",
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTeamMembers()
  }, [projectId])

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("project_id", projectId)
        .order("joined_at", { ascending: false })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addTeamMember = async () => {
    // Validate input
    if (!newMember.name.trim()) {
      alert("Please enter a name for the team member.")
      return
    }
    if (!newMember.email.trim()) {
      alert("Please enter an email address for the team member.")
      return
    }
    if (!newMember.email.includes('@')) {
      alert("Please enter a valid email address.")
      return
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        alert("You must be logged in to add team members.")
        return
      }

      // Normalize email
      const normalizedEmail = newMember.email.toLowerCase().trim()

      // Check if this email is already a team member
      const { data: existingMember, error: checkError } = await supabase
        .from("team_members")
        .select("id, name")
        .eq("project_id", projectId)
        .eq("email", normalizedEmail)
        .maybeSingle()

      if (checkError) {
        console.error("Error checking existing member:", checkError)
        // Continue anyway, the insert will handle duplicates
      }

      if (existingMember) {
        alert(`This email (${normalizedEmail}) is already a member of this project team.`)
        return
      }

      // Prepare team member data
      const teamMemberData = {
        project_id: projectId,
        user_id: null, // Will be populated when user signs up
        name: newMember.name.trim(),
        email: normalizedEmail,
        role: newMember.role,
        avatar_url: newMember.avatar_url?.trim() || null,
      }

      // Insert team member
      const { data: insertedMember, error: insertError } = await supabase
        .from("team_members")
        .insert([teamMemberData])
        .select()
        .single()

      if (insertError) {
        console.error("Insert error details:", insertError)
        
        // Try fallback method if main insert fails
        if (insertError.code === '23502' || insertError.message?.includes('null value')) {
          console.log("Trying fallback method without user_id constraint...")
          return await addTeamMemberFallback(teamMemberData)
        }
        
        // Handle specific error cases
        if (insertError.code === '23505') {
          alert("This email is already a member of this project team.")
          return
        } else if (insertError.code === '23503') {
          alert("Invalid project reference. Please refresh the page and try again.")
          return
        } else if (insertError.message?.includes('permission denied')) {
          alert("You don't have permission to add team members to this project.")
          return
        } else {
          alert(`Failed to add team member: ${insertError.message}`)
          return
        }
      }

      // Success!
      console.log("Team member added successfully:", insertedMember)
      
      // Reset form and close dialog
      setNewMember({ name: "", email: "", role: "member", avatar_url: "" })
      setShowAddForm(false)
      
      // Refresh team members list
      await fetchTeamMembers()
      
      // Show success message
      alert(`Successfully added ${newMember.name} to the team!`)

    } catch (error) {
      console.error("Unexpected error adding team member:", error)
      alert("An unexpected error occurred. Please try again or contact support if the problem persists.")
    }
  }

  // Fallback method for adding team members
  const addTeamMemberFallback = async (teamMemberData: any) => {
    try {
      console.log("Using fallback method to add team member...")
      
      // Try with minimal required fields only
      const fallbackData = {
        project_id: teamMemberData.project_id,
        name: teamMemberData.name,
        email: teamMemberData.email,
        role: teamMemberData.role,
      }

      const { data: insertedMember, error: insertError } = await supabase
        .from("team_members")
        .insert([fallbackData])
        .select()
        .single()

      if (insertError) {
        console.error("Fallback insert error:", insertError)
        alert(`Failed to add team member: ${insertError.message}`)
        return
      }

      // Success with fallback!
      console.log("Team member added successfully with fallback method:", insertedMember)
      
      // Reset form and close dialog
      setNewMember({ name: "", email: "", role: "member", avatar_url: "" })
      setShowAddForm(false)
      
      // Refresh team members list
      await fetchTeamMembers()
      
      // Show success message
      alert(`Successfully added ${teamMemberData.name} to the team!`)

    } catch (error) {
      console.error("Fallback method also failed:", error)
      alert("Unable to add team member. Please check your database permissions or contact support.")
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase.from("team_members").update({ role: newRole }).eq("id", memberId)

      if (error) throw error
      fetchTeamMembers()
    } catch (error) {
      console.error("Error updating member role:", error)
    }
  }

  const removeMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return

    try {
      const { error } = await supabase.from("team_members").delete().eq("id", memberId)

      if (error) throw error
      fetchTeamMembers()
    } catch (error) {
      console.error("Error removing team member:", error)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4" />
      case "admin":
        return <Shield className="h-4 w-4" />
      case "member":
        return <User className="h-4 w-4" />
      case "viewer":
        return <Eye className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "member":
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
              <UserPlus className="h-5 w-5" />
              Team Members
            </CardTitle>
            <CardDescription>Manage project team members and their roles</CardDescription>
          </div>
          {permissions?.canEdit !== false && (
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>Add a new member to your project team</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Enter member name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    placeholder="Enter member email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Viewer</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Avatar URL (optional)</Label>
                  <Input
                    id="avatar"
                    value={newMember.avatar_url}
                    onChange={(e) => setNewMember({ ...newMember, avatar_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addTeamMember} className="flex-1">
                    Add Member
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="h-10 w-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No team members yet. Add your first team member to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={member.avatar_url || "/placeholder.svg"} alt={member.name} />
                    <AvatarFallback>
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getRoleColor(member.role)}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1 capitalize">{member.role}</span>
                  </Badge>
                  {permissions?.canEdit && (
                    <Select value={member.role} onValueChange={(value) => updateMemberRole(member.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {permissions?.canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeMember(member.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
