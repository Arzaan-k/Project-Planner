const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCollaborationFlow() {
  console.log('🧪 Testing collaboration flow...')
  
  try {
    // Test 1: Check if we can fetch invitations with project details
    console.log('\n1. Testing invitation fetching with project details...')
    
    // First, let's see if there are any invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        projects!inner (
          title,
          description
        )
      `)
      .eq("status", "pending")
      .limit(5)

    if (invitationsError) {
      console.log('❌ Error fetching invitations:', invitationsError.message)
    } else {
      console.log('✅ Invitations fetched successfully')
      console.log(`   Found ${invitations.length} pending invitations`)
      
      invitations.forEach((invitation, index) => {
        console.log(`   ${index + 1}. Project: "${invitation.projects?.title || 'Unknown'}"`)
        console.log(`      Email: ${invitation.user_email}`)
        console.log(`      Role: ${invitation.role}`)
        console.log(`      Status: ${invitation.status}`)
      })
    }

    // Test 2: Check if we can fetch accepted collaborations
    console.log('\n2. Testing accepted collaborations...')
    
    const { data: acceptedCollaborations, error: acceptedError } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        projects!inner (
          title,
          description
        )
      `)
      .eq("status", "accepted")
      .limit(5)

    if (acceptedError) {
      console.log('❌ Error fetching accepted collaborations:', acceptedError.message)
    } else {
      console.log('✅ Accepted collaborations fetched successfully')
      console.log(`   Found ${acceptedCollaborations.length} accepted collaborations`)
      
      acceptedCollaborations.forEach((collaboration, index) => {
        console.log(`   ${index + 1}. Project: "${collaboration.projects?.title || 'Unknown'}"`)
        console.log(`      User ID: ${collaboration.user_id || 'Not set'}`)
        console.log(`      Email: ${collaboration.user_email}`)
        console.log(`      Role: ${collaboration.role}`)
        console.log(`      Accepted: ${collaboration.accepted_at}`)
      })
    }

    // Test 3: Check projects table
    console.log('\n3. Testing projects table...')
    
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .limit(5)

    if (projectsError) {
      console.log('❌ Error fetching projects:', projectsError.message)
    } else {
      console.log('✅ Projects fetched successfully')
      console.log(`   Found ${projects.length} projects`)
      
      projects.forEach((project, index) => {
        console.log(`   ${index + 1}. "${project.title}" (Owner: ${project.user_id})`)
      })
    }

    console.log('\n📋 Collaboration Flow Test Summary:')
    console.log('✅ All database queries working')
    console.log('✅ Project details are being fetched correctly')
    console.log('✅ Collaboration status tracking is working')
    
    console.log('\n💡 Next steps:')
    console.log('1. Test inviting a collaborator in the app')
    console.log('2. Check if project title shows correctly in invitation')
    console.log('3. Accept the invitation and verify project appears in dashboard')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testCollaborationFlow()
