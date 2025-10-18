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
import { Lightbulb, Plus, User, Mail, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface FeatureRequest {
  id: string
  title: string
  description: string
  priority: string
  status: string
  requested_by_name: string
  requested_by_email: string
  stakeholder_type: string
  estimated_hours?: number
  business_value?: string
  created_at: string
}

interface FeatureRequestsProps {
  projectId: string
  permissions?: {
    canEdit: boolean
    canDelete: boolean
  }
}

export function FeatureRequests({ projectId, permissions }: FeatureRequestsProps) {
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    priority: "medium",
    requested_by_name: "",
    requested_by_email: "",
    stakeholder_type: "client",
    estimated_hours: "",
    business_value: "",
  })
  const [formError, setFormError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchFeatureRequests()
  }, [projectId])

  // Prefill requester info from authenticated user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setNewRequest((prev) => ({
            ...prev,
            requested_by_name: user.user_metadata?.full_name || prev.requested_by_name,
            requested_by_email: user.email || prev.requested_by_email,
          }))
        }
      } catch {
        // ignore
      }
    }
    loadUser()
  }, [])

  const fetchFeatureRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("feature_requests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error("Error fetching feature requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const addFeatureRequest = async () => {
    try {
      setFormError(null)
      const trimmedTitle = newRequest.title.trim()
      const trimmedDescription = newRequest.description.trim()

      if (!trimmedTitle || !trimmedDescription) {
        setFormError("Title and description are required")
        return
      }

      const requestData = {
        project_id: projectId,
        // Persist sanitized values so list never shows blank rows
        title: trimmedTitle,
        description: trimmedDescription,
        priority: newRequest.priority || "medium",
        requested_by_name: newRequest.requested_by_name?.trim() || "Unknown",
        requested_by_email: newRequest.requested_by_email?.trim() || "unknown@example.com",
        stakeholder_type: newRequest.stakeholder_type || "client",
        estimated_hours: newRequest.estimated_hours ? Number.parseInt(newRequest.estimated_hours) : null,
        business_value: newRequest.business_value?.trim() || null,
      }

      const { error } = await supabase.from("feature_requests").insert([requestData])

      if (error) throw error

      setNewRequest({
        title: "",
        description: "",
        priority: "medium",
        requested_by_name: "",
        requested_by_email: "",
        stakeholder_type: "client",
        estimated_hours: "",
        business_value: "",
      })
      setShowAddForm(false)
      fetchFeatureRequests()
    } catch (error) {
      console.error("Error adding feature request:", error)
      setFormError("Failed to add request. Please try again.")
    }
  }

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      if (!permissions?.canEdit) return
      const { error } = await supabase.from("feature_requests").update({ status: newStatus }).eq("id", requestId)

      if (error) throw error
      fetchFeatureRequests()
    } catch (error) {
      console.error("Error updating request status:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />
      case "rejected":
        return <XCircle className="h-4 w-4" />
      case "in-progress":
        return <Clock className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "approved":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Feature Requests
            </CardTitle>
            <CardDescription>Manage stakeholder feature requests and feedback</CardDescription>
          </div>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Feature Request</DialogTitle>
                <DialogDescription>Record a new feature request from stakeholders</DialogDescription>
              </DialogHeader>
              {formError && (
                <div className="p-3 rounded border border-destructive/30 bg-destructive/10 text-destructive text-sm">
                  {formError}
                </div>
              )}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title">Feature Title</Label>
                  <Input
                    id="title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    placeholder="Brief description of the feature"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    placeholder="Detailed description of the requested feature"
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="requested_by_name">Requested By</Label>
                    <Input
                      id="requested_by_name"
                      value={newRequest.requested_by_name}
                      onChange={(e) => setNewRequest({ ...newRequest, requested_by_name: e.target.value })}
                      placeholder="Stakeholder name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requested_by_email">Email</Label>
                    <Input
                      id="requested_by_email"
                      type="email"
                      value={newRequest.requested_by_email}
                      onChange={(e) => setNewRequest({ ...newRequest, requested_by_email: e.target.value })}
                      placeholder="stakeholder@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newRequest.priority}
                      onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}
                    >
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
                  <div className="space-y-2">
                    <Label htmlFor="stakeholder_type">Type</Label>
                    <Select
                      value={newRequest.stakeholder_type}
                      onValueChange={(value) => setNewRequest({ ...newRequest, stakeholder_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="user">End User</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimated_hours">Est. Hours</Label>
                    <Input
                      id="estimated_hours"
                      type="number"
                      value={newRequest.estimated_hours}
                      onChange={(e) => setNewRequest({ ...newRequest, estimated_hours: e.target.value })}
                      placeholder="8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_value">Business Value</Label>
                  <Textarea
                    id="business_value"
                    value={newRequest.business_value}
                    onChange={(e) => setNewRequest({ ...newRequest, business_value: e.target.value })}
                    placeholder="How will this feature benefit the business or users?"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={addFeatureRequest} className="flex-1">
                    Add Request
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No feature requests yet. Add requests from stakeholders.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{request.title?.trim() || "(Untitled request)"}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{request.description?.trim() || "No description provided"}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {request.requested_by_name?.trim() || "Unknown"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {request.requested_by_email?.trim() || "unknown@example.com"}
                      </div>
                      {request.estimated_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {request.estimated_hours}h
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status}</span>
                      </Badge>
                      <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                    </div>
                    <Select value={request.status} onValueChange={(value) => updateRequestStatus(request.id, value)} disabled={!permissions?.canEdit}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {request.business_value && (
                  <div className="mt-3 p-3 bg-muted/50 rounded">
                    <p className="text-sm">
                      <strong>Business Value:</strong> {request.business_value}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
