const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...')
  
  try {
    // Test 1: Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Supabase connection successful')
      console.log(`   User: ${user ? user.email : 'Not authenticated'}`)
    }

    // Test 2: Check if we can read from projects table
    console.log('\n2. Testing projects table access...')
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("count")
      .limit(1)

    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table accessible')
    }

    // Test 3: Check if we can read from project_collaborators table
    console.log('\n3. Testing project_collaborators table access...')
    const { data: collaborators, error: collaboratorsError } = await supabase
      .from("project_collaborators")
      .select("count")
      .limit(1)

    if (collaboratorsError) {
      console.log('❌ Project_collaborators table error:', collaboratorsError.message)
    } else {
      console.log('✅ Project_collaborators table accessible')
    }

    // Test 4: Try to create a test project
    console.log('\n4. Testing project creation...')
    const testProject = {
      title: "Test Project for Collaboration",
      description: "This is a test project to verify database functionality",
      user_id: "test-user-id-12345",
      status: "active"
    }

    const { data: createdProject, error: createError } = await supabase
      .from("projects")
      .insert(testProject)
      .select()
      .single()

    if (createError) {
      console.log('❌ Project creation error:', createError.message)
    } else {
      console.log('✅ Project created successfully!')
      console.log(`   Project ID: ${createdProject.id}`)
      console.log(`   Title: ${createdProject.title}`)

      // Test 5: Try to create a test invitation
      console.log('\n5. Testing invitation creation...')
      const testInvitation = {
        project_id: createdProject.id,
        user_email: "test@example.com",
        role: "collaborator",
        status: "pending",
        invited_by: "test-user-id-12345"
      }

      const { data: createdInvitation, error: inviteError } = await supabase
        .from("project_collaborators")
        .insert(testInvitation)
        .select()
        .single()

      if (inviteError) {
        console.log('❌ Invitation creation error:', inviteError.message)
      } else {
        console.log('✅ Invitation created successfully!')
        console.log(`   Invitation ID: ${createdInvitation.id}`)
        console.log(`   Email: ${createdInvitation.user_email}`)
      }

      // Clean up test data
      console.log('\n6. Cleaning up test data...')
      await supabase.from("project_collaborators").delete().eq("id", createdInvitation.id)
      await supabase.from("projects").delete().eq("id", createdProject.id)
      console.log('✅ Test data cleaned up')
    }

    console.log('\n🎉 Database connection test completed!')

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testDatabaseConnection()
