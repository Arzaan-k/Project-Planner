"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

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
}

interface ProjectFormProps {
  project?: Project | null
  onSave: () => void
  onCancel: () => void
}

export function ProjectForm({ project, onSave, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    github_link: "",
    deployment_link: "",
    tech_stack: [] as string[],
    business_implementation: "",
    start_date: "",
    end_date: "",
    status: "planning",
    priority: "medium",
    progress: 0,
  })
  const [newTech, setNewTech] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        github_link: project.github_link || "",
        deployment_link: project.deployment_link || "",
        tech_stack: project.tech_stack || [],
        business_implementation: project.business_implementation || "",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        status: project.status || "planning",
        priority: project.priority || "medium",
        progress: project.progress || 0,
      })
    }
  }, [project])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTechStack = () => {
    if (newTech.trim() && !formData.tech_stack.includes(newTech.trim())) {
      setFormData((prev) => ({
        ...prev,
        tech_stack: [...prev.tech_stack, newTech.trim()],
      }))
      setNewTech("")
    }
  }

  const removeTechStack = (tech: string) => {
    setFormData((prev) => ({
      ...prev,
      tech_stack: prev.tech_stack.filter((t) => t !== tech),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      if (project) {
        const updateData = {
          title: formData.title,
          description: formData.description,
          github_link: formData.github_link,
          deployment_link: formData.deployment_link,
          tech_stack: formData.tech_stack,
          business_implementation: formData.business_implementation,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          status: formData.status,
          priority: formData.priority,
          progress: formData.progress,
        }
        const { error } = await supabase.from("projects").update(updateData).eq("id", project.id)

        if (error) throw error
      } else {
        // Create new project
        const projectData = {
          ...formData,
          user_id: user.id,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        }
        const { error } = await supabase.from("projects").insert([projectData])

        if (error) throw error
      }

      onSave()
    } catch (error) {
      console.error("Error saving project:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">{project ? "Edit Project" : "Create New Project"}</CardTitle>
            <CardDescription>
              {project ? "Update your project details" : "Add a new project to your portfolio"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="Enter project title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your project..."
                  rows={4}
                />
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="github_link">GitHub Link</Label>
                  <Input
                    id="github_link"
                    type="url"
                    value={formData.github_link}
                    onChange={(e) => handleInputChange("github_link", e.target.value)}
                    placeholder="https://github.com/username/repo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deployment_link">Deployment Link</Label>
                  <Input
                    id="deployment_link"
                    type="url"
                    value={formData.deployment_link}
                    onChange={(e) => handleInputChange("deployment_link", e.target.value)}
                    placeholder="https://your-project.vercel.app"
                  />
                </div>
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTech}
                    onChange={(e) => setNewTech(e.target.value)}
                    placeholder="Add technology (e.g., React, Node.js)"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTechStack())}
                  />
                  <Button type="button" onClick={addTechStack} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tech_stack.map((tech, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechStack(tech)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Timeline and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <Label htmlFor="progress">Progress ({formData.progress}%)</Label>
                <Input
                  id="progress"
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleInputChange("progress", Number.parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Business Implementation */}
              <div className="space-y-2">
                <Label htmlFor="business_implementation">Business Implementation</Label>
                <Textarea
                  id="business_implementation"
                  value={formData.business_implementation}
                  onChange={(e) => handleInputChange("business_implementation", e.target.value)}
                  placeholder="Describe the business plan, target market, revenue model, etc."
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : project ? "Update Project" : "Create Project"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
