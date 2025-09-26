import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProjectDetail } from "@/components/project-detail"
import { checkProjectPermission } from "@/lib/permissions"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  // Check project permissions
  const permissions = await checkProjectPermission(id)
  
  if (!permissions.canView) {
    redirect("/")
  }

  // Fetch project data
  const { data: project, error: projectError } = await supabase.from("projects").select("*").eq("id", id).single()

  if (projectError || !project) {
    redirect("/")
  }

  return <ProjectDetail projectId={id} permissions={permissions} />
}
