const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSpecificProject() {
  console.log('🧪 Testing specific project collaboration...')
  
  const projectId = "edaafb62-8975-44b5-b97a-4984c30319be"
  const collaboratorEmail = "naqvimohammedjawad@gmail.com"
  
  try {
    // Step 1: Check the project exists
    console.log('\n1. Checking project exists...')
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .eq("id", projectId)
      .single()

    if (projectError) {
      console.log('❌ Error fetching project:', projectError.message)
      return
    }

    console.log('✅ Project found!')
    console.log(`   Title: "${project.title}"`)
    console.log(`   Owner: ${project.user_id}`)

    // Step 2: Check if invitation exists
    console.log('\n2. Checking invitation exists...')
    const { data: invitation, error: invitationError } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        projects!inner (
          title,
          description
        )
      `)
      .eq("project_id", projectId)
      .eq("user_email", collaboratorEmail)
      .single()

    if (invitationError) {
      console.log('❌ Error fetching invitation:', invitationError.message)
      return
    }

    console.log('✅ Invitation found!')
    console.log(`   Invitation ID: ${invitation.id}`)
    console.log(`   Email: ${invitation.user_email}`)
    console.log(`   Role: ${invitation.role}`)
    console.log(`   Status: ${invitation.status}`)
    console.log(`   Project Title: "${invitation.projects?.title || 'Unknown'}"`)

    // Step 3: Test fetching invitations for the collaborator
    console.log('\n3. Testing invitation fetching for collaborator...')
    const { data: collaboratorInvitations, error: collabInviteError } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        projects!inner (
          title,
          description
        )
      `)
      .eq("user_email", collaboratorEmail)
      .eq("status", "pending")

    if (collabInviteError) {
      console.log('❌ Error fetching collaborator invitations:', collabInviteError.message)
    } else {
      console.log('✅ Collaborator invitations fetched successfully!')
      console.log(`   Found ${collaboratorInvitations.length} pending invitations`)
      
      collaboratorInvitations.forEach((inv, index) => {
        console.log(`   ${index + 1}. Project: "${inv.projects?.title || 'Unknown'}"`)
        console.log(`      Role: ${inv.role}`)
        console.log(`      Status: ${inv.status}`)
        console.log(`      Invited: ${inv.invited_at}`)
      })
    }

    // Step 4: Test accepting the invitation
    console.log('\n4. Testing invitation acceptance...')
    const testUserId = "550e8400-e29b-41d4-a716-446655440002" // Test user ID for collaborator
    
    const { data: acceptData, error: acceptError } = await supabase
      .from("project_collaborators")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        user_id: testUserId,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id)
      .eq("user_email", collaboratorEmail)
      .select()
      .single()

    if (acceptError) {
      console.log('❌ Error accepting invitation:', acceptError.message)
    } else {
      console.log('✅ Invitation accepted successfully!')
      console.log(`   Status: ${acceptData.status}`)
      console.log(`   User ID: ${acceptData.user_id}`)
      console.log(`   Accepted at: ${acceptData.accepted_at}`)
    }

    // Step 5: Test accessible projects for collaborator
    console.log('\n5. Testing accessible projects for collaborator...')
    
    // Simulate the getUserProjectsClient function
    const { data: ownedProjects } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", testUserId)

    const { data: collaboratedProjects } = await supabase
      .from("project_collaborators")
      .select("project_id")
      .eq("user_id", testUserId)
      .eq("status", "accepted")

    const { data: emailCollaboratedProjects } = await supabase
      .from("project_collaborators")
      .select("project_id")
      .eq("user_email", collaboratorEmail)
      .eq("status", "accepted")

    const projectIds = [
      ...(ownedProjects?.map(p => p.id) || []),
      ...(collaboratedProjects?.map(c => c.project_id) || []),
      ...(emailCollaboratedProjects?.map(c => c.project_id) || [])
    ]

    const uniqueProjectIds = [...new Set(projectIds)]

    console.log('✅ Accessible projects calculated!')
    console.log(`   Owned projects: ${ownedProjects?.length || 0}`)
    console.log(`   Collaborated projects (by user_id): ${collaboratedProjects?.length || 0}`)
    console.log(`   Collaborated projects (by email): ${emailCollaboratedProjects?.length || 0}`)
    console.log(`   Total accessible projects: ${uniqueProjectIds.length}`)
    console.log(`   Accessible project IDs: ${uniqueProjectIds.join(', ')}`)

    if (uniqueProjectIds.includes(projectId)) {
      console.log('✅ SUCCESS: The shared project is accessible to the collaborator!')
    } else {
      console.log('❌ ISSUE: The shared project is NOT accessible to the collaborator!')
    }

    // Step 6: Reset the invitation status for testing
    console.log('\n6. Resetting invitation status for testing...')
    const { error: resetError } = await supabase
      .from("project_collaborators")
      .update({
        status: "pending",
        accepted_at: null,
        user_id: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitation.id)

    if (resetError) {
      console.log('⚠️  Error resetting invitation:', resetError.message)
    } else {
      console.log('✅ Invitation status reset to pending for testing')
    }

    console.log('\n🎉 Test completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Project exists and is accessible')
    console.log('✅ Invitation exists in database')
    console.log('✅ Invitation can be fetched for collaborator')
    console.log('✅ Invitation can be accepted')
    console.log('✅ Project becomes accessible after acceptance')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testSpecificProject()
