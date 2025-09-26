import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProjectDashboard } from "@/components/project-dashboard"

export default async function HomePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <ProjectDashboard />
}
