"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { GanttChart } from "@/components/gantt-chart"

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

export function GanttView() {
  const [projects, setProjects] = useState<Project[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
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
        .order("due_date", { ascending: true })

      if (milestonesError) throw milestonesError
      setMilestones(milestonesData || [])

      // Fetch all tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("project_tasks")
        .select("*")
        .order("due_date", { ascending: true })

      if (tasksError) throw tasksError
      setTasks(tasksData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
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
            <h1 className="text-3xl font-bold text-foreground">Project Timeline</h1>
            <p className="text-muted-foreground">Visual timeline view of all your projects, milestones, and tasks</p>
          </div>
        </div>

        {/* Gantt Chart */}
        <GanttChart projects={projects} milestones={milestones} tasks={tasks} />
      </div>
    </div>
  )
}
