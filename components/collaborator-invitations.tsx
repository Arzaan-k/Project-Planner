"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Users, ExternalLink, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"

interface SharedProject {
  id: string
  project_id: string
  user_email: string
  role: string
  status: string
  invited_at: string
  project_title: string
  project_description: string
  inviter_name: string
}

export function CollaboratorInvitations() {
  const [sharedProjects, setSharedProjects] = useState<SharedProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchSharedProjects()
  }, [])

  const fetchSharedProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setSharedProjects([])
        return
      }

      console.log("Fetching shared projects for user:", user.email)

      // Get projects shared with this user (Google Sheets style)
      const { data, error } = await supabase
        .from("project_collaborators")
        .select(`
          *,
          projects (
            title,
            description
          )
        `)
        .eq("user_email", user.email)
        .order("invited_at", { ascending: false })

      if (error) {
        console.log("Collaboration system not available (this is normal if not set up yet):", error.message)
        setSharedProjects([])
        return
      }

      // Transform the data
      const transformedProjects = data?.map(collaboration => ({
        id: collaboration.id,
        project_id: collaboration.project_id,
        user_email: collaboration.user_email,
        role: collaboration.role,
        status: collaboration.status,
        invited_at: collaboration.invited_at,
        project_title: collaboration.projects?.title || "Unknown Project",
        project_description: collaboration.projects?.description || "",
        inviter_name: "Project Owner"
      })) || []

      setSharedProjects(transformedProjects)
    } catch (error) {
      console.error("Error fetching shared projects:", error)
      setSharedProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Shared Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-2 text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (sharedProjects.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4" />
            Shared Projects
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-center py-2 text-sm text-muted-foreground">
            No projects shared with you
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Shared Projects
                <Badge variant="secondary" className="text-xs">
                  {sharedProjects.length}
                </Badge>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-2">
            {sharedProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{project.project_title}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {project.project_description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {project.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(project.invited_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Link href={`/projects/${project.project_id}`}>
                  <Button size="sm" variant="outline" className="ml-2 h-8 px-2">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </Link>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}