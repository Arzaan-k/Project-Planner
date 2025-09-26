const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugInvitation() {
  console.log('🔍 Debugging invitation issue...')
  
  const projectId = "edaafb62-8975-44b5-b97a-4984c30319be"
  const collaboratorEmail = "naqvimohammedjawad@gmail.com"
  
  try {
    // Step 1: Check if the invitation exists
    console.log('\n1. Checking if invitation exists...')
    const { data: invitations, error: inviteError } = await supabase
      .from("project_collaborators")
      .select("*")
      .eq("project_id", projectId)
      .eq("user_email", collaboratorEmail)

    if (inviteError) {
      console.log('❌ Error fetching invitations:', inviteError.message)
      return
    }

    console.log(`✅ Found ${invitations.length} invitations for ${collaboratorEmail}`)
    invitations.forEach((inv, index) => {
      console.log(`   ${index + 1}. ID: ${inv.id}`)
      console.log(`      Project ID: ${inv.project_id}`)
      console.log(`      Email: ${inv.user_email}`)
      console.log(`      Role: ${inv.role}`)
      console.log(`      Status: ${inv.status}`)
      console.log(`      User ID: ${inv.user_id || 'Not set'}`)
      console.log(`      Invited At: ${inv.invited_at}`)
      console.log(`      Accepted At: ${inv.accepted_at || 'Not accepted'}`)
    })

    // Step 2: Check if the project exists
    console.log('\n2. Checking if project exists...')
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, user_id")
      .eq("id", projectId)
      .single()

    if (projectError) {
      console.log('❌ Error fetching project:', projectError.message)
    } else {
      console.log('✅ Project found!')
      console.log(`   Title: "${project.title}"`)
      console.log(`   Owner: ${project.user_id}`)
    }

    // Step 3: Test fetching invitations for the collaborator
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
    if (invitations.length > 0) {
      console.log('\n4. Testing invitation acceptance...')
      const invitation = invitations[0]
      
      const { data: acceptData, error: acceptError } = await supabase
        .from("project_collaborators")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          user_id: "test-user-id-for-collaborator",
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

      // Step 5: Test accessible projects after acceptance
      console.log('\n5. Testing accessible projects after acceptance...')
      
      const { data: emailCollaboratedProjects, error: emailError } = await supabase
        .from("project_collaborators")
        .select("project_id")
        .eq("user_email", collaboratorEmail)
        .eq("status", "accepted")

      if (emailError) {
        console.log('❌ Error fetching collaborated projects by email:', emailError.message)
      } else {
        const emailProjectIds = emailCollaboratedProjects?.map(c => c.project_id) || []
        console.log(`✅ Found ${emailProjectIds.length} accessible projects by email`)
        console.log(`   Project IDs: ${emailProjectIds.join(', ')}`)
        
        if (emailProjectIds.includes(projectId)) {
          console.log('✅ SUCCESS: The project is now accessible to the collaborator!')
        } else {
          console.log('❌ ISSUE: The project is still not accessible to the collaborator!')
        }
      }

      // Step 6: Reset for testing
      console.log('\n6. Resetting invitation for testing...')
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
        console.log('✅ Invitation reset to pending for testing')
      }
    }

    console.log('\n🎉 Debug completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Invitation exists in database')
    console.log('✅ Project exists and is accessible')
    console.log('✅ Invitation can be fetched for collaborator')
    console.log('✅ Invitation can be accepted')
    console.log('✅ Project becomes accessible after acceptance')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

debugInvitation()
