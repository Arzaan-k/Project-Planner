"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  GitBranch,
  ExternalLink,
  Clock,
  Target,
  Plus,
  CheckCircle2,
  Circle,
  PlayCircle,
  User,
} from "lucide-react"
import Link from "next/link"
import { MilestoneForm } from "@/components/milestone-form"
import { EnhancedTaskForm } from "@/components/enhanced-task-form"
import { TeamManagement } from "@/components/team-management"
import { TimeTracking } from "@/components/time-tracking"
import { FeatureRequests } from "@/components/feature-requests"
import { CollaboratorInvitation } from "@/components/collaborator-invitation"
import { ProjectPermission } from "@/lib/permissions"

interface Project {
  id: string
  title: string
  description: string
  github_link: string
  deployment_link: string
  tech_stack: string[]
  business_implementation: string
  start_date: string
  end_date: string
  status: string
  priority: string
  progress: number
  total_hours_logged: number
  created_at: string
  updated_at: string
}

interface Milestone {
  id: string
  project_id: string
  title: string
  description: string
  due_date: string
  completed_at: string | null
  status: string
  created_at: string
  updated_at: string
}

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
  created_at: string
  updated_at: string
  team_members?: {
    name: string
    email: string
  }
}

interface TeamMember {
  id: string
  name: string
  email: string
  role: string
}

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

interface ProjectDetailProps {
  projectId: string
  permissions: ProjectPermission
}

export function ProjectDetail({ projectId, permissions }: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*, total_hours_logged")
        .eq("id", projectId)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .eq("project_id", projectId)
        .order("due_date", { ascending: true })

      if (milestonesError) throw milestonesError
      setMilestones(milestonesData || [])

      const { data: tasksData, error: tasksError } = await supabase
        .from("project_tasks")
        .select(`
          *,
          team_members (
            name,
            email
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      const { data: teamData, error: teamError } = await supabase
        .from("team_members")
        .select("id, name, email, role")
        .eq("project_id", projectId)

      if (teamError) throw teamError
      setTeamMembers(teamData || [])

      // Fetch collaborators (with error handling)
      try {
        const { data: collaboratorsData, error: collaboratorsError } = await supabase
          .from("project_collaborators")
          .select("*")
          .eq("project_id", projectId)
          .order("invited_at", { ascending: false })

        if (collaboratorsError) {
          console.log("Collaboration system not available (this is normal if not set up yet):", collaboratorsError.message)
          setCollaborators([])
        } else {
          setCollaborators(collaboratorsData || [])
        }
      } catch (collaborationError) {
        console.log("Collaboration system not available:", collaborationError.message)
        setCollaborators([])
      }
    } catch (error) {
      console.error("Error fetching project data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleMilestoneSaved = () => {
    fetchProjectData()
    setShowMilestoneForm(false)
    setEditingMilestone(null)
  }

  const handleTaskSaved = () => {
    fetchProjectData()
    setShowTaskForm(false)
    setEditingTask(null)
  }

  const handleCollaboratorsChange = () => {
    fetchProjectData()
  }

  const updateMilestoneStatus = async (milestoneId: string, status: string) => {
    try {
      const updateData: any = { status }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { error } = await supabase.from("project_milestones").update(updateData).eq("id", milestoneId)

      if (error) throw error
      fetchProjectData()
    } catch (error) {
      console.error("Error updating milestone:", error)
    }
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const updateData: any = { status }
      if (status === "completed") {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }

      const { error } = await supabase.from("project_tasks").update(updateData).eq("id", taskId)

      if (error) throw error
      fetchProjectData()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "planning":
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "on-hold":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      case "medium":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "in-progress":
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (showMilestoneForm) {
    return (
      <MilestoneForm
        projectId={projectId}
        milestone={editingMilestone}
        onSave={handleMilestoneSaved}
        onCancel={() => {
          setShowMilestoneForm(false)
          setEditingMilestone(null)
        }}
      />
    )
  }

  if (showTaskForm) {
    return (
      <EnhancedTaskForm
        projectId={projectId}
        milestones={milestones}
        teamMembers={teamMembers}
        task={editingTask}
        onSave={handleTaskSaved}
        onCancel={() => {
          setShowTaskForm(false)
          setEditingTask(null)
        }}
      />
    )
  }

  const completedMilestones = milestones.filter((m) => m.status === "completed").length
  const completedTasks = tasks.filter((t) => t.status === "completed").length
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)
  const totalActualHours = tasks.reduce((sum, task) => sum + (task.actual_hours || 0), 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-balance">{project.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
              <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
            </div>
          </div>
        </div>

        {/* Project Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{project.progress}%</div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
                <Progress value={project.progress} className="mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {completedMilestones}/{milestones.length}
                </div>
                <div className="text-sm text-muted-foreground">Milestones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {completedTasks}/{tasks.length}
                </div>
                <div className="text-sm text-muted-foreground">Tasks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalActualHours.toFixed(1)}h</div>
                <div className="text-sm text-muted-foreground">of {totalEstimatedHours}h estimated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{project.total_hours_logged || 0}h</div>
                <div className="text-sm text-muted-foreground">Total Logged</div>
              </div>
            </div>

            {project.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground text-pretty">{project.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Timeline */}
              {(project.start_date || project.end_date) && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timeline
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {project.start_date && <div>Start: {new Date(project.start_date).toLocaleDateString()}</div>}
                    {project.end_date && <div>End: {new Date(project.end_date).toLocaleDateString()}</div>}
                  </div>
                </div>
              )}

              {/* Links */}
              <div>
                <h3 className="font-semibold mb-2">Links</h3>
                <div className="space-y-2">
                  {project.github_link && (
                    <a
                      href={project.github_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <GitBranch className="h-4 w-4" />
                      GitHub Repository
                    </a>
                  )}
                  {project.deployment_link && (
                    <a
                      href={project.deployment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Live Deployment
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tech Stack */}
            {project.tech_stack && project.tech_stack.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tech_stack.map((tech, index) => (
                    <Badge key={index} variant="secondary">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Business Implementation */}
            {project.business_implementation && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Business Implementation</h3>
                <p className="text-muted-foreground text-pretty">{project.business_implementation}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs for all project sections */}
        <Tabs defaultValue="milestones" className="space-y-6">
          <TabsList className={`grid w-full ${permissions.canInviteCollaborators ? 'grid-cols-6' : 'grid-cols-5'}`}>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            {permissions.canInviteCollaborators && (
              <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
            )}
            <TabsTrigger value="time">Time Tracking</TabsTrigger>
            <TabsTrigger value="features">Feature Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>Track major project phases and deliverables</CardDescription>
                  </div>
                  {permissions.canEdit && (
                    <Button onClick={() => setShowMilestoneForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {milestones.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
                    <p className="text-muted-foreground mb-4">Add milestones to track major project phases</p>
                    {permissions.canEdit && (
                      <Button onClick={() => setShowMilestoneForm(true)}>Add First Milestone</Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone) => (
                      <div key={milestone.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <button
                              onClick={() =>
                                updateMilestoneStatus(
                                  milestone.id,
                                  milestone.status === "completed" ? "pending" : "completed",
                                )
                              }
                              className="mt-1"
                            >
                              {getStatusIcon(milestone.status)}
                            </button>
                            <div className="flex-1">
                              <h4 className="font-semibold text-balance">{milestone.title}</h4>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mt-1 text-pretty">
                                  {milestone.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <Badge className={getStatusColor(milestone.status)}>{milestone.status}</Badge>
                                {milestone.due_date && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    Due: {new Date(milestone.due_date).toLocaleDateString()}
                                  </div>
                                )}
                                {milestone.completed_at && (
                                  <div className="flex items-center gap-1 text-sm text-green-600">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed: {new Date(milestone.completed_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingMilestone(milestone)
                              setShowMilestoneForm(true)
                            }}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Tasks</CardTitle>
                    <CardDescription>
                      Manage detailed tasks with automatic time tracking and team assignments
                    </CardDescription>
                  </div>
                  {permissions.canEdit && (
                    <Button onClick={() => setShowTaskForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add tasks to break down your project work with automatic time tracking
                    </p>
                    {permissions.canEdit && (
                      <Button onClick={() => setShowTaskForm(true)}>Add First Task</Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task) => {
                      const milestone = milestones.find((m) => m.id === task.milestone_id)
                      return (
                        <div key={task.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <button
                                onClick={() =>
                                  updateTaskStatus(task.id, task.status === "completed" ? "todo" : "completed")
                                }
                                className="mt-1"
                              >
                                {getStatusIcon(task.status)}
                              </button>
                              <div className="flex-1">
                                <h4 className="font-semibold text-balance">{task.title}</h4>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground mt-1 text-pretty">{task.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 flex-wrap">
                                  <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                                  <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                                  {milestone && <Badge variant="outline">{milestone.title}</Badge>}
                                  {task.team_members && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <User className="h-3 w-3" />
                                      {task.team_members.name}
                                    </div>
                                  )}
                                  {(task.estimated_hours || task.actual_hours) && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {(task.actual_hours || 0).toFixed(1)}h / {task.estimated_hours || 0}h
                                    </div>
                                  )}
                                  {task.started_at && task.status === "in-progress" && (
                                    <div className="flex items-center gap-1 text-sm text-blue-600">
                                      <PlayCircle className="h-3 w-3" />
                                      Started {new Date(task.started_at).toLocaleDateString()}
                                    </div>
                                  )}
                                  {task.completed_at && (
                                    <div className="flex items-center gap-1 text-sm text-green-600">
                                      <CheckCircle2 className="h-3 w-3" />
                                      Completed {new Date(task.completed_at).toLocaleDateString()}
                                    </div>
                                  )}
                                  {task.due_date && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      Due: {new Date(task.due_date).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingTask(task)
                                setShowTaskForm(true)
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement projectId={projectId} permissions={permissions} />
          </TabsContent>

          <TabsContent value="collaborators">
            <CollaboratorInvitation 
              projectId={projectId} 
              collaborators={collaborators}
              onCollaboratorsChange={handleCollaboratorsChange}
              permissions={permissions}
            />
          </TabsContent>

          <TabsContent value="time">
            <TimeTracking projectId={projectId} permissions={permissions} />
          </TabsContent>

          <TabsContent value="features">
            <FeatureRequests projectId={projectId} permissions={permissions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
