const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserCreationFinal() {
  console.log('🧪 Testing user creation with proper email...')
  
  try {
    const testEmail = `testuser${Date.now()}@gmail.com` // Use gmail.com for valid email
    const testPassword = 'TestPassword123!'
    
    console.log(`Creating test user: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:3000/'
      }
    })
    
    if (signUpError) {
      console.log('❌ User creation failed:', signUpError.message)
      console.log('   Error code:', signUpError.code)
      console.log('   Full error:', signUpError)
    } else {
      console.log('✅ User creation successful!')
      console.log('   User ID:', signUpData.user?.id)
      console.log('   Email:', signUpData.user?.email)
      console.log('   Confirmed:', signUpData.user?.email_confirmed_at)
    }

    // Test table access
    console.log('\n🔍 Testing table access...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1)
    
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table accessible')
    }

    const { data: collaborators, error: collaboratorsError } = await supabase
      .from('project_collaborators')
      .select('id')
      .limit(1)
    
    if (collaboratorsError) {
      console.log('❌ Collaborators table error:', collaboratorsError.message)
    } else {
      console.log('✅ Collaborators table accessible')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testUserCreationFinal()
