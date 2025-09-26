"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, TrendingUp, Clock, Target, CheckCircle2, AlertCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { ProjectTimelineChart } from "@/components/project-timeline-chart"
import { ProjectStatusChart } from "@/components/project-status-chart"
import { ProjectEfficiencyChart } from "@/components/project-efficiency-chart"
import { ProjectCompletionTrends } from "@/components/project-completion-trends"
import { GanttChart } from "@/components/gantt-chart"

interface Project {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
  status: string
  priority: string
  progress: number
  created_at: string
  updated_at: string
}

interface Milestone {
  id: string
  project_id: string
  title: string
  due_date: string
  completed_at: string | null
  status: string
  created_at: string
}

interface Task {
  id: string
  project_id: string
  title: string
  estimated_hours: number | null
  actual_hours: number | null
  status: string
  priority: string
  due_date: string
  completed_at: string | null
  created_at: string
}

interface AnalyticsData {
  totalProjects: number
  completedProjects: number
  inProgressProjects: number
  totalTasks: number
  completedTasks: number
  totalEstimatedHours: number
  totalActualHours: number
  averageProjectDuration: number
  onTimeCompletionRate: number
  overdueTasks: number
  upcomingDeadlines: number
}

export function AnalyticsDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const fetchAnalyticsData = async () => {
    try {
      // Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      if (projectsError) throw projectsError
      setProjects(projectsData || [])

      // Fetch all milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from("project_milestones")
        .select("*")
        .order("created_at", { ascending: false })

      if (milestonesError) throw milestonesError
      setMilestones(milestonesData || [])

      // Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("project_tasks")
        .select("*")
        .order("created_at", { ascending: false })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])

      // Calculate analytics
      calculateAnalytics(projectsData || [], milestonesData || [], tasksData || [])
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAnalytics = (projectsData: Project[], milestonesData: Milestone[], tasksData: Task[]) => {
    const totalProjects = projectsData.length
    const completedProjects = projectsData.filter((p) => p.status === "completed").length
    const inProgressProjects = projectsData.filter((p) => p.status === "in-progress").length

    const totalTasks = tasksData.length
    const completedTasks = tasksData.filter((t) => t.status === "completed").length

    const totalEstimatedHours = tasksData.reduce((sum, task) => sum + (task.estimated_hours || 0), 0)
    const totalActualHours = tasksData.reduce((sum, task) => sum + (task.actual_hours || 0), 0)

    // Calculate average project duration for completed projects
    const completedProjectsWithDates = projectsData.filter(
      (p) => p.status === "completed" && p.start_date && p.end_date,
    )
    const averageProjectDuration =
      completedProjectsWithDates.length > 0
        ? completedProjectsWithDates.reduce((sum, project) => {
            const start = new Date(project.start_date)
            const end = new Date(project.end_date)
            return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          }, 0) / completedProjectsWithDates.length
        : 0

    // Calculate on-time completion rate
    const projectsWithDeadlines = projectsData.filter((p) => p.end_date && p.status === "completed")
    const onTimeProjects = projectsWithDeadlines.filter((p) => {
      const endDate = new Date(p.end_date)
      const updatedDate = new Date(p.updated_at)
      return updatedDate <= endDate
    })
    const onTimeCompletionRate =
      projectsWithDeadlines.length > 0 ? (onTimeProjects.length / projectsWithDeadlines.length) * 100 : 0

    // Calculate overdue tasks
    const now = new Date()
    const overdueTasks = tasksData.filter(
      (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) < now,
    ).length

    // Calculate upcoming deadlines (next 7 days)
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    const upcomingDeadlines = tasksData.filter(
      (t) => t.status !== "completed" && t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= nextWeek,
    ).length

    setAnalytics({
      totalProjects,
      completedProjects,
      inProgressProjects,
      totalTasks,
      completedTasks,
      totalEstimatedHours,
      totalActualHours,
      averageProjectDuration,
      onTimeCompletionRate,
      overdueTasks,
      upcomingDeadlines,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

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
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track your project performance and productivity metrics</p>
          </div>
        </div>

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics.completedProjects} completed, {analytics.inProgressProjects} in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalTasks > 0 ? Math.round((analytics.completedTasks / analytics.totalTasks) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.completedTasks} of {analytics.totalTasks} tasks completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Efficiency</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics.totalEstimatedHours > 0
                    ? Math.round((analytics.totalActualHours / analytics.totalEstimatedHours) * 100)
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.totalActualHours}h actual vs {analytics.totalEstimatedHours}h estimated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.onTimeCompletionRate)}%</div>
                <p className="text-xs text-muted-foreground">Projects completed on or before deadline</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.averageProjectDuration)}</div>
                <p className="text-xs text-muted-foreground">Days per completed project</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{analytics.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">Tasks past their due date</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{analytics.upcomingDeadlines}</div>
                <p className="text-xs text-muted-foreground">Due in the next 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    analytics.onTimeCompletionRate * 0.4 +
                      (analytics.totalTasks > 0 ? (analytics.completedTasks / analytics.totalTasks) * 100 : 0) * 0.4 +
                      (analytics.totalEstimatedHours > 0
                        ? Math.min((analytics.totalEstimatedHours / analytics.totalActualHours) * 100, 100)
                        : 100) *
                        0.2,
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Overall productivity rating</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts and Visualizations */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline Analysis</TabsTrigger>
            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
            <TabsTrigger value="trends">Completion Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProjectStatusChart projects={projects} />
              <Card>
                <CardHeader>
                  <CardTitle>Project Priority Distribution</CardTitle>
                  <CardDescription>Breakdown of projects by priority level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["urgent", "high", "medium", "low"].map((priority) => {
                      const count = projects.filter((p) => p.priority === priority).length
                      const percentage = projects.length > 0 ? (count / projects.length) * 100 : 0
                      return (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                priority === "urgent"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : priority === "high"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
                                    : priority === "medium"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              }
                            >
                              {priority}
                            </Badge>
                            <span className="text-sm">{count} projects</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{Math.round(percentage)}%</div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ProjectTimelineChart projects={projects} />
          </TabsContent>

          <TabsContent value="gantt" className="space-y-6">
            <GanttChart projects={projects} milestones={milestones} tasks={tasks} />
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            <ProjectEfficiencyChart tasks={tasks} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <ProjectCompletionTrends projects={projects} tasks={tasks} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
