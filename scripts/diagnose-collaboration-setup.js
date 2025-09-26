const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nvzrysquqvcxnczzdeba.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enJ5c3F1cXZjeG5jenpkZWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyNTk5MzAsImV4cCI6MjA3MzgzNTkzMH0.7vU1j2foFdwhE4rOr9Y2i_kIo7M2RUl7Kf07MFMA-vc'

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseCollaborationSetup() {
  console.log('🔍 Diagnosing collaboration setup...')
  
  try {
    // Check 1: Database tables exist
    console.log('\n1. Checking database tables...')
    
    const tables = ['projects', 'project_collaborators', 'notifications', 'profiles']
    const tableStatus = {}
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (error) {
          tableStatus[table] = { exists: false, error: error.message }
        } else {
          tableStatus[table] = { exists: true, count: data.length }
        }
      } catch (err) {
        tableStatus[table] = { exists: false, error: err.message }
      }
    }
    
    Object.entries(tableStatus).forEach(([table, status]) => {
      if (status.exists) {
        console.log(`   ✅ ${table} table exists`)
      } else {
        console.log(`   ❌ ${table} table error: ${status.error}`)
      }
    })

    // Check 2: RLS policies
    console.log('\n2. Checking RLS policies...')
    
    try {
      const { data: policies, error: policyError } = await supabase
        .from("project_collaborators")
        .select("*")
        .limit(1)
      
      if (policyError) {
        console.log(`   ❌ RLS policy error: ${policyError.message}`)
      } else {
        console.log(`   ✅ RLS policies working (can query project_collaborators)`)
      }
    } catch (err) {
      console.log(`   ❌ RLS policy error: ${err.message}`)
    }

    // Check 3: Projects table access
    console.log('\n3. Checking projects table access...')
    
    try {
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, title, user_id")
        .limit(5)
      
      if (projectsError) {
        console.log(`   ❌ Projects table error: ${projectsError.message}`)
      } else {
        console.log(`   ✅ Projects table accessible`)
        console.log(`   📊 Found ${projects.length} projects`)
        projects.forEach((project, index) => {
          console.log(`      ${index + 1}. "${project.title}" (Owner: ${project.user_id})`)
        })
      }
    } catch (err) {
      console.log(`   ❌ Projects table error: ${err.message}`)
    }

    // Check 4: Test collaboration query
    console.log('\n4. Testing collaboration queries...')
    
    try {
      // Test invitation query
      const { data: invitations, error: invitationError } = await supabase
        .from("project_collaborators")
        .select(`
          *,
          projects!inner (
            title,
            description
          )
        `)
        .limit(1)
      
      if (invitationError) {
        console.log(`   ❌ Invitation query error: ${invitationError.message}`)
      } else {
        console.log(`   ✅ Invitation query with project details works`)
        console.log(`   📊 Found ${invitations.length} invitations`)
      }
    } catch (err) {
      console.log(`   ❌ Invitation query error: ${err.message}`)
    }

    // Check 5: Authentication
    console.log('\n5. Checking authentication...')
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.log(`   ⚠️  Auth error (expected if not logged in): ${authError.message}`)
      } else if (user) {
        console.log(`   ✅ User authenticated: ${user.email}`)
      } else {
        console.log(`   ℹ️  No user authenticated (this is normal for anonymous access)`)
      }
    } catch (err) {
      console.log(`   ❌ Auth error: ${err.message}`)
    }

    console.log('\n📋 Diagnosis Summary:')
    
    const allTablesExist = Object.values(tableStatus).every(status => status.exists)
    if (allTablesExist) {
      console.log('✅ All required database tables exist')
    } else {
      console.log('❌ Some database tables are missing or have errors')
    }
    
    console.log('\n🎯 Next Steps:')
    console.log('1. If all tables exist, the collaboration system is ready!')
    console.log('2. Follow the COLLABORATION_TESTING_GUIDE.md to test the full flow')
    console.log('3. Create two user accounts and test the complete collaboration process')
    console.log('4. Check browser console for any runtime errors during testing')

  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error.message)
  }
}

diagnoseCollaborationSetup()
