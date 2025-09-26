"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface Project {
  id: string
  title: string
  start_date: string
  end_date: string
  status: string
  priority: string
  progress: number
}

interface Milestone {
  id: string
  project_id: string
  title: string
  due_date: string
  completed_at: string | null
  status: string
}

interface Task {
  id: string
  project_id: string
  milestone_id: string | null
  title: string
  due_date: string
  completed_at: string | null
  status: string
  priority: string
}

interface GanttChartProps {
  projects: Project[]
  milestones: Milestone[]
  tasks: Task[]
}

interface GanttItem {
  id: string
  title: string
  start: Date
  end: Date
  type: "project" | "milestone" | "task"
  status: string
  priority?: string
  progress?: number
  projectId: string
  parentId?: string
}

export function GanttChart({ projects, milestones, tasks }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Convert data to Gantt items
  const ganttItems = useMemo(() => {
    const items: GanttItem[] = []

    // Filter projects
    const filteredProjects = selectedProject === "all" ? projects : projects.filter((p) => p.id === selectedProject)

    // Add projects
    filteredProjects.forEach((project) => {
      if (project.start_date && project.end_date) {
        items.push({
          id: project.id,
          title: project.title,
          start: new Date(project.start_date),
          end: new Date(project.end_date),
          type: "project",
          status: project.status,
          priority: project.priority,
          progress: project.progress,
          projectId: project.id,
        })
      }
    })

    // Add milestones
    milestones
      .filter((m) => selectedProject === "all" || m.project_id === selectedProject)
      .forEach((milestone) => {
        if (milestone.due_date) {
          const dueDate = new Date(milestone.due_date)
          items.push({
            id: milestone.id,
            title: milestone.title,
            start: dueDate,
            end: dueDate,
            type: "milestone",
            status: milestone.status,
            projectId: milestone.project_id,
          })
        }
      })

    // Add tasks
    tasks
      .filter((t) => selectedProject === "all" || t.project_id === selectedProject)
      .forEach((task) => {
        if (task.due_date) {
          const dueDate = new Date(task.due_date)
          // For tasks, we'll show them as 1-day items ending on their due date
          const startDate = new Date(dueDate)
          startDate.setDate(startDate.getDate() - 1)

          items.push({
            id: task.id,
            title: task.title,
            start: startDate,
            end: dueDate,
            type: "task",
            status: task.status,
            priority: task.priority,
            projectId: task.project_id,
            parentId: task.milestone_id || undefined,
          })
        }
      })

    return items.sort((a, b) => {
      // Sort by project first, then by start date
      if (a.projectId !== b.projectId) {
        return a.projectId.localeCompare(b.projectId)
      }
      if (a.type !== b.type) {
        const typeOrder = { project: 0, milestone: 1, task: 2 }
        return typeOrder[a.type] - typeOrder[b.type]
      }
      return a.start.getTime() - b.start.getTime()
    })
  }, [projects, milestones, tasks, selectedProject])

  // Generate time scale based on view mode
  const generateTimeScale = () => {
    const scale = []
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (viewMode === "month") {
      start.setMonth(start.getMonth() - 2)
      end.setMonth(end.getMonth() + 4)
      start.setDate(1)

      const current = new Date(start)
      while (current <= end) {
        scale.push({
          date: new Date(current),
          label: current.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          isToday: current.getMonth() === new Date().getMonth() && current.getFullYear() === new Date().getFullYear(),
        })
        current.setMonth(current.getMonth() + 1)
      }
    } else if (viewMode === "week") {
      start.setDate(start.getDate() - 14)
      end.setDate(end.getDate() + 28)

      const current = new Date(start)
      current.setDate(current.getDate() - current.getDay()) // Start from Sunday

      while (current <= end) {
        scale.push({
          date: new Date(current),
          label: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          isToday: current.toDateString() === new Date().toDateString(),
        })
        current.setDate(current.getDate() + 7)
      }
    } else {
      start.setDate(start.getDate() - 7)
      end.setDate(end.getDate() + 14)

      const current = new Date(start)
      while (current <= end) {
        scale.push({
          date: new Date(current),
          label: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          isToday: current.toDateString() === new Date().toDateString(),
        })
        current.setDate(current.getDate() + 1)
      }
    }

    return scale
  }

  const timeScale = generateTimeScale()
  const scaleStart = timeScale[0]?.date
  const scaleEnd = timeScale[timeScale.length - 1]?.date

  // Calculate position and width for items
  const getItemPosition = (item: GanttItem) => {
    if (!scaleStart || !scaleEnd) return { left: 0, width: 0 }

    const totalDuration = scaleEnd.getTime() - scaleStart.getTime()
    const itemStart = Math.max(item.start.getTime(), scaleStart.getTime())
    const itemEnd = Math.min(item.end.getTime(), scaleEnd.getTime())

    const left = ((itemStart - scaleStart.getTime()) / totalDuration) * 100
    const width = Math.max(((itemEnd - itemStart) / totalDuration) * 100, 0.5) // Minimum width for visibility

    return { left, width }
  }

  const getStatusColor = (status: string, type: string) => {
    const baseColors = {
      completed: type === "project" ? "bg-green-500" : type === "milestone" ? "bg-green-600" : "bg-green-400",
      "in-progress": type === "project" ? "bg-blue-500" : type === "milestone" ? "bg-blue-600" : "bg-blue-400",
      planning: type === "project" ? "bg-yellow-500" : type === "milestone" ? "bg-yellow-600" : "bg-yellow-400",
      pending: type === "project" ? "bg-yellow-500" : type === "milestone" ? "bg-yellow-600" : "bg-yellow-400",
      "on-hold": type === "project" ? "bg-gray-500" : type === "milestone" ? "bg-gray-600" : "bg-gray-400",
      cancelled: type === "project" ? "bg-red-500" : type === "milestone" ? "bg-red-600" : "bg-red-400",
      todo: "bg-gray-400",
    }
    return baseColors[status as keyof typeof baseColors] || "bg-gray-400"
  }

  const navigateTime = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Project Timeline (Gantt Chart)
            </CardTitle>
            <CardDescription>Visual timeline of projects, milestones, and tasks</CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(value: "month" | "week" | "day") => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {ganttItems.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No timeline data</h3>
            <p className="text-muted-foreground">
              Add start/end dates to projects and due dates to milestones and tasks to see the timeline
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => navigateTime("prev")}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium">
                {currentDate.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                  ...(viewMode !== "month" && { day: "numeric" }),
                })}
              </div>
              <Button variant="outline" size="sm" onClick={() => navigateTime("next")}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Time scale header */}
            <div className="relative">
              <div className="flex border-b border-border pb-2 mb-4">
                <div className="w-64 flex-shrink-0"></div>
                <div className="flex-1 relative">
                  <div className="flex">
                    {timeScale.map((scale, index) => (
                      <div
                        key={index}
                        className={`flex-1 text-center text-xs font-medium py-2 ${
                          scale.isToday ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        }`}
                        style={{ minWidth: `${100 / timeScale.length}%` }}
                      >
                        {scale.label}
                      </div>
                    ))}
                  </div>
                  {/* Today indicator */}
                  {scaleStart &&
                    scaleEnd &&
                    (() => {
                      const now = new Date()
                      if (now >= scaleStart && now <= scaleEnd) {
                        const totalDuration = scaleEnd.getTime() - scaleStart.getTime()
                        const todayPosition = ((now.getTime() - scaleStart.getTime()) / totalDuration) * 100
                        return (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                            style={{ left: `${todayPosition}%` }}
                          />
                        )
                      }
                      return null
                    })()}
                </div>
              </div>

              {/* Gantt items */}
              <div className="space-y-2">
                {ganttItems.map((item, index) => {
                  const position = getItemPosition(item)
                  const project = projects.find((p) => p.id === item.projectId)

                  return (
                    <div key={item.id} className="flex items-center">
                      <div className="w-64 flex-shrink-0 pr-4">
                        <div className={`${item.type === "task" ? "ml-8" : item.type === "milestone" ? "ml-4" : ""}`}>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                item.type === "project"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : item.type === "milestone"
                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              {item.type}
                            </Badge>
                            <span className="text-sm font-medium truncate" title={item.title}>
                              {item.title}
                            </span>
                          </div>
                          {item.type === "project" && (
                            <div className="text-xs text-muted-foreground mt-1">Progress: {item.progress}%</div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 relative h-8">
                        {position.width > 0 && (
                          <div
                            className={`absolute h-6 rounded ${getStatusColor(item.status, item.type)} 
                              ${item.type === "milestone" ? "transform rotate-45" : ""} 
                              opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                            style={{
                              left: `${position.left}%`,
                              width: item.type === "milestone" ? "12px" : `${position.width}%`,
                              minWidth: item.type === "milestone" ? "12px" : "4px",
                            }}
                            title={`${item.title} (${item.status})`}
                          >
                            {item.type === "project" && item.progress !== undefined && (
                              <div className="h-full bg-white/30 rounded" style={{ width: `${item.progress}%` }} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 pt-4 border-t border-border text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-blue-500 rounded"></div>
                <span>Project</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 transform rotate-45"></div>
                <span>Milestone</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-green-500 rounded"></div>
                <span>Task</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-red-500"></div>
                <span>Today</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
