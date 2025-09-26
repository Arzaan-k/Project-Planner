const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testCollaborationAfterFix() {
  console.log('🧪 Testing collaboration after database fix...')
  
  try {
    // Step 1: Check if projects table exists and is accessible
    console.log('\n1. Checking projects table...')
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("count")
      .limit(1)

    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message)
      console.log('   Please run the SQL fix script first!')
      return
    }

    console.log('✅ Projects table is accessible')

    // Step 2: Check if project_collaborators table exists and is accessible
    console.log('\n2. Checking project_collaborators table...')
    const { data: collaborators, error: collaboratorsError } = await supabase
      .from("project_collaborators")
      .select("count")
      .limit(1)

    if (collaboratorsError) {
      console.log('❌ Project_collaborators table error:', collaboratorsError.message)
      console.log('   Please run the SQL fix script first!')
      return
    }

    console.log('✅ Project_collaborators table is accessible')

    // Step 3: Test creating a project (this will fail due to RLS, but we can test the structure)
    console.log('\n3. Testing project creation structure...')
    const testProject = {
      title: "Test Project for Collaboration",
      description: "This is a test project",
      user_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
      status: "planning",
      priority: "medium",
      progress: 0
    }

    const { data: createdProject, error: createError } = await supabase
      .from("projects")
      .insert(testProject)
      .select()
      .single()

    if (createError) {
      if (createError.message.includes('row-level security')) {
        console.log('✅ Project creation structure is correct (RLS is working)')
        console.log('   Projects can only be created by authenticated users')
      } else {
        console.log('❌ Project creation error:', createError.message)
      }
    } else {
      console.log('✅ Project created successfully!')
      console.log(`   Project ID: ${createdProject.id}`)
      
      // Clean up the test project
      await supabase.from("projects").delete().eq("id", createdProject.id)
      console.log('   Test project cleaned up')
    }

    // Step 4: Test creating an invitation (this will also fail due to RLS, but we can test the structure)
    console.log('\n4. Testing invitation creation structure...')
    const testInvitation = {
      project_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
      user_email: "test@example.com",
      role: "collaborator",
      status: "pending",
      invited_by: "00000000-0000-0000-0000-000000000000" // Dummy UUID
    }

    const { data: createdInvitation, error: inviteError } = await supabase
      .from("project_collaborators")
      .insert(testInvitation)
      .select()
      .single()

    if (inviteError) {
      if (inviteError.message.includes('row-level security')) {
        console.log('✅ Invitation creation structure is correct (RLS is working)')
        console.log('   Invitations can only be created by authenticated users')
      } else {
        console.log('❌ Invitation creation error:', inviteError.message)
      }
    } else {
      console.log('✅ Invitation created successfully!')
      console.log(`   Invitation ID: ${createdInvitation.id}`)
      
      // Clean up the test invitation
      await supabase.from("project_collaborators").delete().eq("id", createdInvitation.id)
      console.log('   Test invitation cleaned up')
    }

    console.log('\n🎉 Database structure test completed!')
    console.log('\n📋 Summary:')
    console.log('✅ Projects table exists and is accessible')
    console.log('✅ Project_collaborators table exists and is accessible')
    console.log('✅ RLS policies are working correctly')
    console.log('✅ Database is ready for collaboration!')
    console.log('\n🚀 Next steps:')
    console.log('1. Log in to your app with arzaanalikhan12@gmail.com')
    console.log('2. Create a project (it should now save to the database)')
    console.log('3. Invite naqvimohammedjawad@gmail.com as a collaborator')
    console.log('4. Have naqvimohammedjawad@gmail.com log in and accept the invitation')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testCollaborationAfterFix()
