const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserCreationSafely() {
  console.log('🧪 Testing user creation after safe fix...')
  
  try {
    const testEmail = `test-${Date.now()}@example.com`
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
      console.log('❌ User creation still failing:', signUpError.message)
      console.log('   Error code:', signUpError.code)
      console.log('   Status:', signUpError.status)
      
      // Check if it's a specific error we can address
      if (signUpError.message.includes('Database error saving new user')) {
        console.log('\n💡 This suggests there might be other triggers or constraints.')
        console.log('   Try running the safe fix SQL in Supabase Dashboard.')
      }
    } else {
      console.log('✅ User creation successful!')
      console.log('   User ID:', signUpData.user?.id)
      console.log('   Email:', signUpData.user?.email)
      console.log('   Confirmed:', signUpData.user?.email_confirmed_at)
      
      // Test if we can sign in
      console.log('\n🔐 Testing sign in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      })
      
      if (signInError) {
        console.log('❌ Sign in failed:', signInError.message)
      } else {
        console.log('✅ Sign in successful!')
      }
    }

    // Test basic functionality
    console.log('\n🔍 Testing basic database access...')
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1)
    
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table accessible')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

testUserCreationSafely()
