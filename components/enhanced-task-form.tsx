"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface Task {
  id: string
  project_id: string
  milestone_id: string | null
  title: string
  description: string
  estimated_hours: number | null
  actual_hours: number | null
  status: string
  priority: string
  due_date: string
  completed_at: string | null
  assigned_to: string | null
  started_at: string | null
}

interface Milestone {
  id: string
  title: string
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

interface TaskStatusHistory {
  id: string
  old_status: string | null
  new_status: string
  changed_at: string
  time_spent_minutes: number
}

interface EnhancedTaskFormProps {
  projectId: string
  milestones: Milestone[]
  teamMembers: TeamMember[]
  task?: Task | null
  onSave: () => void
  onCancel: () => void
}

export function EnhancedTaskForm({
  projectId,
  milestones,
  teamMembers,
  task,
  onSave,
  onCancel,
}: EnhancedTaskFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    milestone_id: "",
    estimated_hours: "",
    actual_hours: "",
    status: "todo",
    priority: "medium",
    due_date: "",
    assigned_to: "",
  })
  const [statusHistory, setStatusHistory] = useState<TaskStatusHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        milestone_id: task.milestone_id || "",
        estimated_hours: task.estimated_hours?.toString() || "",
        actual_hours: task.actual_hours?.toString() || "",
        status: task.status || "todo",
        priority: task.priority || "medium",
        due_date: task.due_date || "",
        assigned_to: task.assigned_to || "",
      })
      fetchStatusHistory()
    }
  }, [task])

  const fetchStatusHistory = async () => {
    if (!task) return

    try {
      const { data, error } = await supabase
        .from("task_status_history")
        .select("*")
        .eq("task_id", task.id)
        .order("changed_at", { ascending: false })

      if (error) throw error
      setStatusHistory(data || [])
    } catch (error) {
      console.error("Error fetching status history:", error)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const taskData = {
        title: formData.title,
        description: formData.description,
        milestone_id: formData.milestone_id || null,
        estimated_hours: formData.estimated_hours ? Number.parseInt(formData.estimated_hours) : null,
        actual_hours: formData.actual_hours ? Number.parseInt(formData.actual_hours) : null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
        project_id: projectId,
      }

      if (task) {
        // Update existing task
        const { error } = await supabase.from("project_tasks").update(taskData).eq("id", task.id)

        if (error) throw error
      } else {
        // Create new task
        const { error } = await supabase.from("project_tasks").insert([taskData])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error("Error saving task:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "todo":
        return "secondary"
      case "in-progress":
        return "default"
      case "completed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{task ? "Edit Task" : "Create New Task"}</CardTitle>
            <CardDescription>
              {task ? "Update task details and track progress" : "Add a new task with team assignment"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Task Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="title">Task Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe this task..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="milestone_id">Milestone (Optional)</Label>
                      <Select
                        value={formData.milestone_id}
                        onValueChange={(value) => handleInputChange("milestone_id", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select milestone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No milestone</SelectItem>
                          {milestones.map((milestone) => (
                            <SelectItem key={milestone.id} value={milestone.id}>
                              {milestone.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="assigned_to">Assign To</Label>
                      <Select
                        value={formData.assigned_to}
                        onValueChange={(value) => handleInputChange("assigned_to", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {teamMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="estimated_hours">Estimated Hours</Label>
                      <Input
                        id="estimated_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.estimated_hours}
                        onChange={(e) => handleInputChange("estimated_hours", e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="actual_hours">Actual Hours</Label>
                      <Input
                        id="actual_hours"
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.actual_hours}
                        onChange={(e) => handleInputChange("actual_hours", e.target.value)}
                        placeholder="0"
                        disabled={task?.status !== "completed"}
                      />
                      {task?.status !== "completed" && (
                        <p className="text-xs text-muted-foreground">Auto-calculated when task is completed</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="due_date">Due Date</Label>
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange("due_date", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button type="submit" disabled={isLoading} className="flex-1">
                      {isLoading ? "Saving..." : task ? "Update Task" : "Create Task"}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>

              {/* Status History & Time Tracking */}
              {task && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Time Tracking
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Estimated</p>
                          <p className="font-medium">{task.estimated_hours || 0}h</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Actual</p>
                          <p className="font-medium">{(task.actual_hours || 0).toFixed(1)}h</p>
                        </div>
                      </div>

                      {task.started_at && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Started</p>
                          <p className="font-medium">{new Date(task.started_at).toLocaleString()}</p>
                        </div>
                      )}

                      {task.completed_at && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Completed</p>
                          <p className="font-medium">{new Date(task.completed_at).toLocaleString()}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Status History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {statusHistory.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No status changes yet</p>
                      ) : (
                        <div className="space-y-3">
                          {statusHistory.map((history) => (
                            <div key={history.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusBadgeColor(history.new_status)}>{history.new_status}</Badge>
                                <span className="text-muted-foreground">
                                  {new Date(history.changed_at).toLocaleDateString()}
                                </span>
                              </div>
                              {history.time_spent_minutes > 0 && (
                                <span className="text-muted-foreground">
                                  {formatDuration(history.time_spent_minutes)}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
