"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: string
  title: string
  start_date: string
  end_date: string
  status: string
  created_at: string
}

interface ProjectTimelineChartProps {
  projects: Project[]
}

export function ProjectTimelineChart({ projects }: ProjectTimelineChartProps) {
  // Calculate project durations
  const projectDurations = projects
    .filter((p) => p.start_date && p.end_date)
    .map((project) => {
      const start = new Date(project.start_date)
      const end = new Date(project.end_date)
      const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

      return {
        name: project.title.length > 20 ? project.title.substring(0, 20) + "..." : project.title,
        duration,
        status: project.status,
      }
    })
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10) // Show top 10 longest projects

  const getBarColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#22c55e"
      case "in-progress":
        return "#3b82f6"
      case "planning":
        return "#eab308"
      case "on-hold":
        return "#6b7280"
      case "cancelled":
        return "#ef4444"
      default:
        return "#6b7280"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Duration Analysis</CardTitle>
        <CardDescription>Duration of projects from start to end date (in days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectDurations} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
              <YAxis />
              <Tooltip
                formatter={(value, name, props) => [`${value} days`, "Duration"]}
                labelFormatter={(label) => `Project: ${label}`}
              />
              <Bar
                dataKey="duration"
                fill={(entry) => getBarColor(entry?.payload?.status || "planning")}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
