"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GridMotion from "@/components/backgrounds/GridMotion"

export default function SignUpSuccessPage() {
  // Only render GridMotion on client-side
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <div className="relative min-h-svh w-full">
      {isClient && (
        <div className="absolute inset-0 z-0">
          <GridMotion
            items={[
              "Success",
              "Welcome",
              "Verify",
              "Email",
              "Confirm",
              "Account",
              "Ready",
              "Start",
              "Begin",
              "Journey",
              "Explore",
              "Discover",
              "Create",
              "Build",
              "Manage",
              "Organize",
              "Plan",
              "Execute",
              "Achieve",
              "Success",
              "Excellence",
              "Quality",
              "Innovation",
              "Growth",
              "Progress",
              "Future",
              "Potential",
              "Opportunity",
            ]}
            gradientColor="rgba(34, 197, 94, 0.1)"
          />
        </div>
      )}
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="flex flex-col gap-6">
            <Card className="bg-background/95 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
                <CardDescription>Check your email to confirm</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  You&apos;ve successfully signed up for Project Planner. Please check your email to confirm your
                  account before signing in.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
