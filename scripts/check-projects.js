const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProjects() {
  console.log('🔍 Checking all projects in database...')
  
  try {
    // Check all projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, user_id, created_at")
      .order("created_at", { ascending: false })

    if (projectsError) {
      console.log('❌ Error fetching projects:', projectsError.message)
      return
    }

    console.log(`✅ Found ${projects.length} projects in database:`)
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. "${project.title}"`)
      console.log(`      ID: ${project.id}`)
      console.log(`      Owner: ${project.user_id}`)
      console.log(`      Created: ${project.created_at}`)
    })

    // Check all invitations
    console.log('\n🔍 Checking all invitations in database...')
    const { data: invitations, error: invitationsError } = await supabase
      .from("project_collaborators")
      .select("id, project_id, user_email, role, status, invited_at")
      .order("invited_at", { ascending: false })

    if (invitationsError) {
      console.log('❌ Error fetching invitations:', invitationsError.message)
    } else {
      console.log(`✅ Found ${invitations.length} invitations in database:`)
      invitations.forEach((invitation, index) => {
        console.log(`   ${index + 1}. Project: ${invitation.project_id}`)
        console.log(`      Email: ${invitation.user_email}`)
        console.log(`      Role: ${invitation.role}`)
        console.log(`      Status: ${invitation.status}`)
        console.log(`      Invited: ${invitation.invited_at}`)
      })
    }

    // Check if the specific project ID exists
    const specificProjectId = "edaafb62-8975-44b5-b97a-4984c30319be"
    console.log(`\n🔍 Checking for specific project ID: ${specificProjectId}`)
    
    const projectExists = projects.some(p => p.id === specificProjectId)
    if (projectExists) {
      console.log('✅ Specific project ID found in database!')
    } else {
      console.log('❌ Specific project ID NOT found in database!')
      console.log('   This explains why invitations are not working')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

checkProjects()
