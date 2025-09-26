const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  try {
    console.log('🚀 Starting migration...')
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'create_collaborators_table.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        
        if (error) {
          // If exec_sql doesn't work, try direct query
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1)
          
          if (directError && directError.code === 'PGRST205') {
            console.log('⚠️  exec_sql function not available, trying alternative approach...')
            // We'll need to use a different method
            console.log('❌ Cannot execute SQL directly. Please run the migration manually in Supabase Dashboard.')
            console.log('📋 Copy the following SQL and run it in your Supabase SQL Editor:')
            console.log('\n' + '='.repeat(50))
            console.log(migrationSQL)
            console.log('='.repeat(50))
            return
          }
          
          throw error
        }
        
        console.log('✅ Statement executed successfully')
      } catch (error) {
        console.error(`❌ Error executing statement ${i + 1}:`, error.message)
        console.log('📋 Please run the migration manually in Supabase Dashboard')
        console.log('📋 Copy the following SQL and run it in your Supabase SQL Editor:')
        console.log('\n' + '='.repeat(50))
        console.log(migrationSQL)
        console.log('='.repeat(50))
        return
      }
    }
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('✅ project_collaborators table created')
    console.log('✅ RLS policies applied')
    console.log('✅ Triggers created')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('📋 Please run the migration manually in Supabase Dashboard')
    console.log('📋 Copy the following SQL and run it in your Supabase SQL Editor:')
    console.log('\n' + '='.repeat(50))
    console.log(fs.readFileSync(path.join(__dirname, 'create_collaborators_table.sql'), 'utf8'))
    console.log('='.repeat(50))
  }
}

runMigration()
