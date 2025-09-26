"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export function DatabaseTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<{
    tableExists: boolean | null
    canInsert: boolean | null
    error: string | null
  }>({
    tableExists: null,
    canInsert: null,
    error: null
  })

  const supabase = createClient()

  const testDatabase = async () => {
    setIsLoading(true)
    setResults({ tableExists: null, canInsert: null, error: null })

    try {
      // Test 1: Check if table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from("project_collaborators")
        .select("id")
        .limit(1)

      const tableExists = !tableError || tableError.code !== 'PGRST205'

      // Test 2: Try to insert a test record (we'll delete it immediately)
      let canInsert = false
      if (tableExists) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Get a project owned by the user
          const { data: project } = await supabase
            .from("projects")
            .select("id")
            .eq("user_id", user.id)
            .limit(1)
            .single()

          if (project) {
            const { error: insertError } = await supabase
              .from("project_collaborators")
              .insert({
                project_id: project.id,
                user_email: "test@example.com",
                role: "collaborator",
                status: "pending",
                invited_by: user.id
              })

            canInsert = !insertError

            // Clean up the test record
            if (canInsert) {
              await supabase
                .from("project_collaborators")
                .delete()
                .eq("user_email", "test@example.com")
                .eq("project_id", project.id)
            }
          }
        }
      }

      setResults({
        tableExists,
        canInsert,
        error: tableExists ? null : "Table 'project_collaborators' does not exist. Please run the SQL migration."
      })
    } catch (error) {
      setResults({
        tableExists: false,
        canInsert: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Database Test
        </CardTitle>
        <CardDescription>
          Test if the project_collaborators table is properly set up
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={testDatabase} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Database Setup"
            )}
          </Button>

          {results.tableExists !== null && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {results.tableExists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">
                  Table exists: {results.tableExists ? "Yes" : "No"}
                </span>
              </div>

              {results.canInsert !== null && (
                <div className="flex items-center gap-2">
                  {results.canInsert ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    Can insert records: {results.canInsert ? "Yes" : "No"}
                  </span>
                </div>
              )}

              {results.error && (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{results.error}</AlertDescription>
                </Alert>
              )}

              {results.tableExists && results.canInsert && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Database is properly set up! You can now use the collaboration feature.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
