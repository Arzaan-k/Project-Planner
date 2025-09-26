"use client"

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  estimated_hours: number | null
  actual_hours: number | null
  status: string
  priority: string
}

interface ProjectEfficiencyChartProps {
  tasks: Task[]
}

export function ProjectEfficiencyChart({ tasks }: ProjectEfficiencyChartProps) {
  // Filter tasks with both estimated and actual hours
  const efficiencyData = tasks
    .filter((t) => t.estimated_hours && t.actual_hours && t.status === "completed")
    .map((task) => ({
      estimated: task.estimated_hours!,
      actual: task.actual_hours!,
      efficiency: task.estimated_hours! / task.actual_hours!,
      priority: task.priority,
      title: task.title.length > 30 ? task.title.substring(0, 30) + "..." : task.title,
    }))

  const getPointColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444"
      case "medium":
        return "#3b82f6"
      case "low":
        return "#22c55e"
      default:
        return "#6b7280"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Estimation Accuracy</CardTitle>
        <CardDescription>Estimated vs actual hours for completed tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart data={efficiencyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="estimated"
                name="Estimated Hours"
                label={{ value: "Estimated Hours", position: "insideBottom", offset: -10 }}
              />
              <YAxis
                type="number"
                dataKey="actual"
                name="Actual Hours"
                label={{ value: "Actual Hours", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                formatter={(value, name) => [value, name === "estimated" ? "Estimated Hours" : "Actual Hours"]}
                labelFormatter={() => ""}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold">{data.title}</p>
                        <p>Estimated: {data.estimated}h</p>
                        <p>Actual: {data.actual}h</p>
                        <p>Efficiency: {(data.efficiency * 100).toFixed(1)}%</p>
                        <p>Priority: {data.priority}</p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Scatter dataKey="actual" fill="#3b82f6" />
              {/* Add diagonal line for perfect estimation */}
              <line x1="0%" y1="0%" x2="100%" y2="100%" stroke="#6b7280" strokeDasharray="5,5" opacity={0.5} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            Points on the diagonal line represent perfect time estimation. Points below the line indicate tasks
            completed faster than estimated.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
