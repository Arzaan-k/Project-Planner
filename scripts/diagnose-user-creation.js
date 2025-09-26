const { createClient } = require('@supabase/supabase-js')

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseUserCreation() {
  console.log('🔍 Diagnosing user creation issues...')
  console.log('Supabase URL:', supabaseUrl)
  
  try {
    // Test 1: Check if auth is working
    console.log('\n1. Testing auth service...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('❌ Auth error:', authError.message)
    } else {
      console.log('✅ Auth service is working')
      if (user) {
        console.log('   Current user:', user.email)
      }
    }

    // Test 2: Check if projects table exists and is accessible
    console.log('\n2. Testing projects table...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1)
    
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table is accessible')
    }

    // Test 3: Check if project_collaborators table exists
    console.log('\n3. Testing project_collaborators table...')
    const { data: collaborators, error: collaboratorsError } = await supabase
      .from('project_collaborators')
      .select('id')
      .limit(1)
    
    if (collaboratorsError) {
      console.log('❌ project_collaborators table error:', collaboratorsError.message)
      if (collaboratorsError.code === 'PGRST205') {
        console.log('   → Table does not exist. Run the migration first.')
      }
    } else {
      console.log('✅ project_collaborators table is accessible')
    }

    // Test 4: Check database functions
    console.log('\n4. Testing database functions...')
    const { data: functions, error: functionsError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%collaborator%'" 
      })
    
    if (functionsError) {
      console.log('⚠️  Could not check functions (this is normal):', functionsError.message)
    } else {
      console.log('✅ Database functions check completed')
    }

    // Test 5: Try to create a test user (this will show the actual error)
    console.log('\n5. Testing user creation...')
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'TestPassword123!'
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/'
      }
    })
    
    if (signUpError) {
      console.log('❌ User creation error:', signUpError.message)
      console.log('   Error details:', signUpError)
    } else {
      console.log('✅ User creation successful')
      console.log('   User ID:', signUpData.user?.id)
      console.log('   Email confirmed:', signUpData.user?.email_confirmed_at)
      
      // Clean up test user
      if (signUpData.user) {
        console.log('   Cleaning up test user...')
        // Note: We can't delete users via client, but this is just a test
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

diagnoseUserCreation()
