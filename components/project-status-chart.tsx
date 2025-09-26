"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Project {
  id: string
  status: string
}

interface ProjectStatusChartProps {
  projects: Project[]
}

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  const statusData = [
    { name: "Completed", value: projects.filter((p) => p.status === "completed").length, color: "#22c55e" },
    { name: "In Progress", value: projects.filter((p) => p.status === "in-progress").length, color: "#3b82f6" },
    { name: "Planning", value: projects.filter((p) => p.status === "planning").length, color: "#eab308" },
    { name: "On Hold", value: projects.filter((p) => p.status === "on-hold").length, color: "#6b7280" },
    { name: "Cancelled", value: projects.filter((p) => p.status === "cancelled").length, color: "#ef4444" },
  ].filter((item) => item.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Status Distribution</CardTitle>
        <CardDescription>Current status of all projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
