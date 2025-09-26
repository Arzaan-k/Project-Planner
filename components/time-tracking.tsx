"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Clock, Plus, Calendar, User, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TimeEntry {
  id: string
  description: string
  hours_spent: number
  date_logged: string
  task_id?: string
  created_at: string
  project_tasks?: {
    title: string
  }
}

interface Task {
  id: string
  title: string
}

interface TimeTrackingProps {
  projectId: string
  permissions?: {
    canEdit: boolean
    canDelete: boolean
  }
}

export function TimeTracking({ projectId, permissions }: TimeTrackingProps) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEntry, setNewEntry] = useState({
    description: "",
    hours_spent: "",
    date_logged: new Date().toISOString().split("T")[0],
    task_id: "no-task", // Updated default value to non-empty string
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTimeEntries()
    fetchTasks()
  }, [projectId])

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .select(`
          *,
          project_tasks (
            title
          )
        `)
        .eq("project_id", projectId)
        .order("date_logged", { ascending: false })

      if (error) throw error
      setTimeEntries(data || [])
    } catch (error) {
      console.error("Error fetching time entries:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase.from("project_tasks").select("id, title").eq("project_id", projectId)

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const addTimeEntry = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const entryData = {
        project_id: projectId,
        user_id: user.id,
        description: newEntry.description,
        hours_spent: Number.parseFloat(newEntry.hours_spent),
        date_logged: newEntry.date_logged,
        task_id: newEntry.task_id === "no-task" ? null : newEntry.task_id, // Handle no-task value properly
      }

      const { error } = await supabase.from("time_entries").insert([entryData])

      if (error) throw error

      setNewEntry({
        description: "",
        hours_spent: "",
        date_logged: new Date().toISOString().split("T")[0],
        task_id: "no-task", // Reset to no-task instead of null
      })
      setShowAddForm(false)
      fetchTimeEntries()
    } catch (error) {
      console.error("Error adding time entry:", error)
    }
  }

  const deleteTimeEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this time entry?")) return

    try {
      const { error } = await supabase.from("time_entries").delete().eq("id", entryId)

      if (error) throw error
      fetchTimeEntries()
    } catch (error) {
      console.error("Error deleting time entry:", error)
    }
  }

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours_spent, 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Tracking
            </CardTitle>
            <CardDescription>Track time spent on project tasks • Total: {totalHours.toFixed(1)} hours</CardDescription>
          </div>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Time Entry</DialogTitle>
                <DialogDescription>Record time spent on project work</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="What did you work on?"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours Spent</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={newEntry.hours_spent}
                      onChange={(e) => setNewEntry({ ...newEntry, hours_spent: e.target.value })}
                      placeholder="2.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEntry.date_logged}
                      onChange={(e) => setNewEntry({ ...newEntry, date_logged: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task">Related Task (optional)</Label>
                  <Select
                    value={newEntry.task_id}
                    onValueChange={(value) => setNewEntry({ ...newEntry, task_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-task">No specific task</SelectItem> {/* Fixed empty string value */}
                      {tasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addTimeEntry} className="flex-1">
                    Log Time
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-6 bg-muted rounded w-16"></div>
              </div>
            ))}
          </div>
        ) : timeEntries.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No time entries yet. Start logging your work time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium mb-1">{entry.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.date_logged).toLocaleDateString()}
                    </div>
                    {entry.project_tasks && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.project_tasks.title}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{entry.hours_spent}h</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTimeEntry(entry.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
