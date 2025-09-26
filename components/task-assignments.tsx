"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserPlus, User, Trash2 } from "lucide-react"

interface TaskAssignment {
  id: string
  task_id: string
  user_id: string
  assigned_at: string
  team_members: {
    name: string
    email: string
    avatar_url?: string
  }
}

interface TeamMember {
  id: string
  name: string
  email: string
  avatar_url?: string
  user_id: string
}

interface Task {
  id: string
  title: string
  status: string
}

interface TaskAssignmentsProps {
  projectId: string
  taskId: string
  onAssignmentChange?: () => void
}

export function TaskAssignments({ projectId, taskId, onAssignmentChange }: TaskAssignmentsProps) {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedMember, setSelectedMember] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAssignments()
    fetchTeamMembers()
  }, [taskId, projectId])

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("task_assignments")
        .select(`
          *,
          team_members (
            name,
            email,
            avatar_url
          )
        `)
        .eq("task_id", taskId)

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.from("team_members").select("*").eq("project_id", projectId)

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error("Error fetching team members:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const assignTask = async () => {
    if (!selectedMember) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("task_assignments").insert([
        {
          task_id: taskId,
          user_id: selectedMember,
          assigned_by: user.id,
        },
      ])

      if (error) throw error

      setSelectedMember("")
      fetchAssignments()
      onAssignmentChange?.()
    } catch (error) {
      console.error("Error assigning task:", error)
    }
  }

  const removeAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase.from("task_assignments").delete().eq("id", assignmentId)

      if (error) throw error
      fetchAssignments()
      onAssignmentChange?.()
    } catch (error) {
      console.error("Error removing assignment:", error)
    }
  }

  const availableMembers = teamMembers.filter(
    (member) => !assignments.some((assignment) => assignment.user_id === member.user_id),
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Task Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Task Assignments
        </CardTitle>
        <CardDescription>Assign team members to this task</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Assignment */}
          {availableMembers.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.user_id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={assignTask} disabled={!selectedMember}>
                Assign
              </Button>
            </div>
          )}

          {/* Current Assignments */}
          {assignments.length === 0 ? (
            <div className="text-center py-4">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignment.team_members.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {assignment.team_members.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{assignment.team_members.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Assigned {new Date(assignment.assigned_at).toLocaleDateString()}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeAssignment(assignment.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
