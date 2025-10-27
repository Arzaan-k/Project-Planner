"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, GitBranch, ExternalLink, BarChart3, Clock, LogOut } from "lucide-react"
import { ProjectForm } from "@/components/project-form"
import { CollaboratorInvitations } from "@/components/collaborator-invitations"
import { getUserProjectsClient } from "@/lib/permissions-client"
import Link from "next/link"
import PixelCard from "@/components/backgrounds/PixelCard"
// import Beams from "@/components/backgrounds/Beams"

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
  user_id: string
}

export function ProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [userProjects, setUserProjects] = useState<string[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }

      // Get projects the user has access to
      const accessibleProjectIds = await getUserProjectsClient()
      setUserProjects(accessibleProjectIds)
      
      console.log("[v0] Accessible project IDs:", accessibleProjectIds)
      
      if (accessibleProjectIds.length === 0) {
        console.log("[v0] No accessible projects found")
        setProjects([])
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*, total_hours_logged")
        .in("id", accessibleProjectIds)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectSaved = () => {
    fetchProjects()
    setShowForm(false)
    setEditingProject(null)
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setShowForm(true)
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const { error } = await supabase.from("projects").delete().eq("id", projectId)

      if (error) throw error
      fetchProjects()
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // Redirect to login page
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }


  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "planning":
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

  console.log("[v0] ProjectDashboard rendering, projects count:", projects.length)

  if (showForm) {
    return (
      <ProjectForm
        project={editingProject}
        onSave={handleProjectSaved}
        onCancel={() => {
          setShowForm(false)
          setEditingProject(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* <div className="absolute inset-0 z-0">
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={8}
          lightColor="#ffffff"
          speed={1.5}
          noiseIntensity={1.2}
          scale={0.15}
          rotation={0}
        />
      </div> */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Project Planner</h1>
              <p className="text-muted-foreground">Manage your projects, track progress, and analyze performance</p>
            </div>
            <div className="flex gap-4">
              <Link href="/gantt">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </Button>
              </Link>
              <Link href="/analytics">
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2 bg-transparent">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
              <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>
          </div>

          {/* Collaborator Invitations */}
          <div className="mb-8">
            <CollaboratorInvitations />
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <PixelCard key={i} variant="default" className="animate-pulse">
                  <div className="absolute inset-4 bg-background/90 rounded-lg p-6">
                    <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                </PixelCard>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Create your first project to get started</p>
                    <Button onClick={() => setShowForm(true)}>Create Project</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <PixelCard key={project.id} variant="matrix" className="group h-full w-full relative">
                  <div className="p-6 flex flex-col h-full relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 text-balance">{project.title}</h3>
                        <p className="text-sm text-muted-foreground text-pretty">
                          {project.description?.substring(0, 100)}
                          {project.description && project.description.length > 100 && "..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap mb-4">
                      <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                      <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                    </div>

                    <div className="space-y-4 flex-1">
                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Hours Tracking */}
                      {project.total_hours_logged > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{project.total_hours_logged}h logged</span>
                        </div>
                      )}

                      {/* Tech Stack */}
                      {project.tech_stack && project.tech_stack.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Tech Stack</p>
                          <div className="flex flex-wrap gap-1">
                            {project.tech_stack.slice(0, 3).map((tech, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tech}
                              </Badge>
                            ))}
                            {project.tech_stack.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{project.tech_stack.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {project.start_date && new Date(project.start_date).toLocaleDateString()}
                            {project.start_date && project.end_date && " - "}
                            {project.end_date && new Date(project.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {/* Links */}
                      <div className="flex gap-2">
                        {project.github_link && (
                          <a
                            href={project.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <GitBranch className="h-4 w-4" />
                            GitHub
                          </a>
                        )}
                        {project.deployment_link && (
                          <a
                            href={project.deployment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Live
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 mt-auto">
                      <Link href={`/projects/${project.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full bg-transparent">
                          View Details
                        </Button>
                      </Link>
                      {(currentUserId === project.user_id || userProjects.includes(project.id)) && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(project.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </PixelCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
