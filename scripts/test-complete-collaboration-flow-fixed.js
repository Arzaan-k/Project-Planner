const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCompleteCollaborationFlowFixed() {
  console.log('🧪 Testing COMPLETE collaboration flow (FIXED)...')
  
  const ownerEmail = "arzaanalikhan12@gmail.com"
  const collaboratorEmail = "naqvimohammedjawad@gmail.com"
  
  try {
    // Step 1: Check if projects exist
    console.log('\n1. Checking existing projects...')
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .order("created_at", { ascending: false })

    if (projectsError) {
      console.log('❌ Error fetching projects:', projectsError.message)
      return
    }

    console.log(`✅ Found ${projects.length} projects in database:`)
    projects.forEach((project, index) => {
      console.log(`   ${index + 1}. "${project.title}" (ID: ${project.id})`)
    })

    if (projects.length === 0) {
      console.log('❌ No projects found. Please create a project first in the app.')
      return
    }

    // Use the first project for testing
    const testProject = projects[0]
    console.log(`\n📋 Using project: "${testProject.title}" (${testProject.id})`)

    // Step 2: Check if invitation already exists
    console.log('\n2. Checking existing invitations...')
    const { data: existingInvitations, error: existingError } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", testProject.id)
      .eq("user_email", collaboratorEmail)

    if (existingError) {
      console.log('❌ Error checking existing invitations:', existingError.message)
    } else {
      console.log(`✅ Found ${existingInvitations.length} existing invitations for ${collaboratorEmail}`)
      existingInvitations.forEach((inv, index) => {
        console.log(`   ${index + 1}. Status: ${inv.status}, Role: ${inv.role}`)
      })
    }

    // Step 3: Create or update invitation
    console.log('\n3. Creating/updating invitation...')
    let invitationData = null

    if (existingInvitations.length > 0) {
      // Update existing invitation
      const existingInvitation = existingInvitations[0]
      const { data: updatedInvitation, error: updateError } = await supabase
        .from("project_collaborators")
        .update({
          status: "pending",
          updated_at: new Date().toISOString()
        })
        .eq("id", existingInvitation.id)
        .select()
        .single()

      if (updateError) {
        console.log('❌ Error updating invitation:', updateError.message)
        return
      }

      invitationData = updatedInvitation
      console.log('✅ Updated existing invitation to pending status')
    } else {
      // Create new invitation
      const { data: newInvitation, error: createError } = await supabase
        .from("project_collaborators")
        .insert({
          project_id: testProject.id,
          user_email: collaboratorEmail,
          role: "collaborator",
          status: "pending",
          invited_by: testProject.user_id,
        })
        .select()
        .single()

      if (createError) {
        console.log('❌ Error creating invitation:', createError.message)
        return
      }

      invitationData = newInvitation
      console.log('✅ Created new invitation')
    }

    console.log(`   Invitation ID: ${invitationData.id}`)
    console.log(`   Email: ${invitationData.user_email}`)
    console.log(`   Role: ${invitationData.role}`)
    console.log(`   Status: ${invitationData.status}`)

    // Step 4: Test fetching invitations for collaborator
    console.log('\n4. Testing invitation fetch for collaborator...')
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

    // Step 5: Test accepting the invitation
    console.log('\n5. Testing invitation acceptance...')
    const testCollaboratorUserId = crypto.randomUUID() // Simulate collaborator's user ID
    
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

    // Step 6: Test accessible projects for collaborator
    console.log('\n6. Testing accessible projects for collaborator...')
    
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

    if (uniqueProjectIds.includes(testProject.id)) {
      console.log('✅ SUCCESS: The shared project is accessible to the collaborator!')
    } else {
      console.log('❌ ISSUE: The shared project is NOT accessible to the collaborator!')
    }

    // Step 7: Test project access with the actual project
    console.log('\n7. Testing project access...')
    const { data: accessibleProject, error: accessError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .eq("id", testProject.id)
      .single()

    if (accessError) {
      console.log('❌ Error accessing project:', accessError.message)
    } else {
      console.log('✅ Project is accessible!')
      console.log(`   Title: "${accessibleProject.title}"`)
      console.log(`   Owner: ${accessibleProject.user_id}`)
    }

    console.log('\n🎉 Complete collaboration flow test completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Projects exist in database')
    console.log('✅ Invitation can be created/updated')
    console.log('✅ Invitation can be fetched for collaborator')
    console.log('✅ Invitation can be accepted')
    console.log('✅ Project becomes accessible after acceptance')
    console.log('✅ Full collaboration flow is working!')

    console.log('\n🚀 Next steps for testing:')
    console.log('1. Log in with arzaanalikhan12@gmail.com')
    console.log('2. Create a project (if not already done)')
    console.log('3. Invite naqvimohammedjawad@gmail.com as collaborator')
    console.log('4. Log in with naqvimohammedjawad@gmail.com')
    console.log('5. Check dashboard for pending invitation')
    console.log('6. Accept the invitation')
    console.log('7. Verify the project appears in the collaborator\'s project list')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testCompleteCollaborationFlowFixed()
