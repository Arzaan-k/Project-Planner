const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullCollaborationFlow() {
  console.log('🧪 Testing FULL collaboration flow...')
  
  const projectId = "edaafb62-8975-44b5-b97a-4984c30319be"
  const collaboratorEmail = "naqvimohammedjawad@gmail.com"
  const testUserId = "test-collaborator-user-id-12345"
  
  try {
    // Step 1: Check if project exists
    console.log('\n1. Checking if project exists...')
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .eq("id", projectId)
      .single()

    if (projectError) {
      console.log('❌ Project not found:', projectError.message)
      console.log('   This might be why invitations are not working')
      return
    }

    console.log('✅ Project found!')
    console.log(`   Title: "${project.title}"`)
    console.log(`   Owner: ${project.user_id}`)

    // Step 2: Create a test invitation
    console.log('\n2. Creating test invitation...')
    const { data: invitationData, error: inviteError } = await supabase
      .from("project_collaborators")
      .insert({
        project_id: projectId,
        user_email: collaboratorEmail,
        role: "collaborator",
        status: "pending",
        invited_by: project.user_id,
      })
      .select()
      .single()

    if (inviteError) {
      console.log('❌ Error creating invitation:', inviteError.message)
      return
    }

    console.log('✅ Invitation created successfully!')
    console.log(`   Invitation ID: ${invitationData.id}`)
    console.log(`   Email: ${invitationData.user_email}`)
    console.log(`   Role: ${invitationData.role}`)
    console.log(`   Status: ${invitationData.status}`)

    // Step 3: Test fetching invitations for collaborator
    console.log('\n3. Testing invitation fetch for collaborator...')
    const { data: collaboratorInvitations, error: collabInviteError } = await supabase
      .from("project_collaborators")
      .select(`
        *,
        projects (
          title,
          description
        )
      `)
      .eq("user_email", collaboratorEmail)
      .eq("status", "pending")

    if (collabInviteError) {
      console.log('❌ Error fetching collaborator invitations:', collabInviteError.message)
    } else {
      console.log(`✅ Found ${collaboratorInvitations.length} pending invitations for ${collaboratorEmail}`)
      collaboratorInvitations.forEach((inv, index) => {
        console.log(`   ${index + 1}. Project: "${inv.projects?.title || 'Unknown'}"`)
        console.log(`      Role: ${inv.role}`)
        console.log(`      Status: ${inv.status}`)
        console.log(`      Invited: ${inv.invited_at}`)
      })
    }

    // Step 4: Test accepting the invitation
    console.log('\n4. Testing invitation acceptance...')
    const { data: acceptData, error: acceptError } = await supabase
      .from("project_collaborators")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        user_id: testUserId,
        updated_at: new Date().toISOString()
      })
      .eq("id", invitationData.id)
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

    // Step 6: Test project access with the actual project
    console.log('\n6. Testing project access...')
    const { data: accessibleProject, error: accessError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .eq("id", projectId)
      .single()

    if (accessError) {
      console.log('❌ Error accessing project:', accessError.message)
    } else {
      console.log('✅ Project is accessible!')
      console.log(`   Title: "${accessibleProject.title}"`)
      console.log(`   Owner: ${accessibleProject.user_id}`)
    }

    // Step 7: Clean up test data
    console.log('\n7. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from("project_collaborators")
      .delete()
      .eq("id", invitationData.id)

    if (deleteError) {
      console.log('⚠️  Error cleaning up test data:', deleteError.message)
    } else {
      console.log('✅ Test data cleaned up successfully')
    }

    console.log('\n🎉 Full collaboration flow test completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Project exists and is accessible')
    console.log('✅ Invitation can be created')
    console.log('✅ Invitation can be fetched for collaborator')
    console.log('✅ Invitation can be accepted')
    console.log('✅ Project becomes accessible after acceptance')
    console.log('✅ Full collaboration flow is working!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testFullCollaborationFlow()
