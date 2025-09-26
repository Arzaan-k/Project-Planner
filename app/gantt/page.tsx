import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GanttView } from "@/components/gantt-view"

export default async function GanttPage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <GanttView />
}
