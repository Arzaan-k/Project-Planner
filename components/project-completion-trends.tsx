"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: string
  status: string
  created_at: string
  updated_at: string
}

interface Task {
  id: string
  status: string
  completed_at: string | null
  created_at: string
}

interface ProjectCompletionTrendsProps {
  projects: Project[]
  tasks: Task[]
}

export function ProjectCompletionTrends({ projects, tasks }: ProjectCompletionTrendsProps) {
  // Generate monthly completion data for the last 12 months
  const generateMonthlyData = () => {
    const months = []
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = date.toISOString().substring(0, 7) // YYYY-MM format
      const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })

      const completedProjects = projects.filter((p) => {
        if (p.status !== "completed") return false
        const updatedMonth = p.updated_at.substring(0, 7)
        return updatedMonth === monthKey
      }).length

      const completedTasks = tasks.filter((t) => {
        if (!t.completed_at) return false
        const completedMonth = t.completed_at.substring(0, 7)
        return completedMonth === monthKey
      }).length

      months.push({
        month: monthName,
        projects: completedProjects,
        tasks: completedTasks,
      })
    }

    return months
  }

  const monthlyData = generateMonthlyData()

  // Calculate weekly productivity for the last 8 weeks
  const generateWeeklyProductivity = () => {
    const weeks = []
    const now = new Date()

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - i * 7)
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekLabel = `Week ${8 - i}`

      const tasksCompleted = tasks.filter((t) => {
        if (!t.completed_at) return false
        const completedDate = new Date(t.completed_at)
        return completedDate >= weekStart && completedDate <= weekEnd
      }).length

      weeks.push({
        week: weekLabel,
        productivity: tasksCompleted,
      })
    }

    return weeks
  }

  const weeklyData = generateWeeklyProductivity()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Completion Trends</CardTitle>
          <CardDescription>Projects and tasks completed over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="projects"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Projects"
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Tasks"
                  dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Productivity</CardTitle>
          <CardDescription>Tasks completed per week over the last 8 weeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} tasks`, "Completed"]} />
                <Bar dataKey="productivity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
