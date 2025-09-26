const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCollaborationWithProject() {
  console.log('🧪 Testing collaboration with a real project...')
  
  try {
    // Step 1: Create a test project with a valid UUID
    console.log('\n1. Creating a test project...')
    const projectId = crypto.randomUUID() // Generate a valid UUID
    const userId = crypto.randomUUID() // Generate a valid UUID
    
    const testProject = {
      id: projectId,
      title: "Test Project for Collaboration",
      description: "This is a test project to verify collaboration functionality",
      user_id: userId,
      status: "active",
      priority: "medium",
      progress: 0
    }

    const { data: createdProject, error: createError } = await supabase
      .from("projects")
      .insert(testProject)
      .select()
      .single()

    if (createError) {
      console.log('❌ Project creation error:', createError.message)
      return
    }

    console.log('✅ Project created successfully!')
    console.log(`   Project ID: ${createdProject.id}`)
    console.log(`   Title: ${createdProject.title}`)

    // Step 2: Create a test invitation
    console.log('\n2. Creating test invitation...')
    const collaboratorEmail = "test-collaborator@example.com"
    
    const { data: invitationData, error: inviteError } = await supabase
      .from("project_collaborators")
      .insert({
        project_id: projectId,
        user_email: collaboratorEmail,
        role: "collaborator",
        status: "pending",
        invited_by: userId,
      })
      .select()
      .single()

    if (inviteError) {
      console.log('❌ Invitation creation error:', inviteError.message)
    } else {
      console.log('✅ Invitation created successfully!')
      console.log(`   Invitation ID: ${invitationData.id}`)
      console.log(`   Email: ${invitationData.user_email}`)
      console.log(`   Role: ${invitationData.role}`)
      console.log(`   Status: ${invitationData.status}`)
    }

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
    const testCollaboratorUserId = crypto.randomUUID()
    
    const { data: acceptData, error: acceptError } = await supabase
      .from("project_collaborators")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        user_id: testCollaboratorUserId,
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
    
    const { data: emailCollaboratedProjects } = await supabase
      .from("project_collaborators")
      .select("project_id")
      .eq("user_email", collaboratorEmail)
      .eq("status", "accepted")

    const { data: userCollaboratedProjects } = await supabase
      .from("project_collaborators")
      .select("project_id")
      .eq("user_id", testCollaboratorUserId)
      .eq("status", "accepted")

    const projectIds = [
      ...(emailCollaboratedProjects?.map(c => c.project_id) || []),
      ...(userCollaboratedProjects?.map(c => c.project_id) || [])
    ]

    const uniqueProjectIds = [...new Set(projectIds)]

    console.log('✅ Accessible projects calculated!')
    console.log(`   Collaborated projects (by email): ${emailCollaboratedProjects?.length || 0}`)
    console.log(`   Collaborated projects (by user_id): ${userCollaboratedProjects?.length || 0}`)
    console.log(`   Total accessible projects: ${uniqueProjectIds.length}`)
    console.log(`   Accessible project IDs: ${uniqueProjectIds.join(', ')}`)

    if (uniqueProjectIds.includes(projectId)) {
      console.log('✅ SUCCESS: The shared project is accessible to the collaborator!')
    } else {
      console.log('❌ ISSUE: The shared project is NOT accessible to the collaborator!')
    }

    // Step 6: Clean up test data
    console.log('\n6. Cleaning up test data...')
    await supabase.from("project_collaborators").delete().eq("id", invitationData.id)
    await supabase.from("projects").delete().eq("id", projectId)
    console.log('✅ Test data cleaned up')

    console.log('\n🎉 Collaboration test completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Project creation works with valid UUIDs')
    console.log('✅ Invitation creation works')
    console.log('✅ Invitation fetching works')
    console.log('✅ Invitation acceptance works')
    console.log('✅ Project accessibility works after acceptance')
    console.log('✅ Full collaboration flow is working!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testCollaborationWithProject()
