// Debug script to check authentication status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAuthStatus() {
  console.log('Debugging authentication status...\n');
  
  try {
    // Check if we're authenticated
    console.log('1. Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Not authenticated');
      console.log('Error:', authError?.message || 'No user found');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('User ID:', user.id);
    
    // Try to access projects (should work if authenticated)
    console.log('\n2. Testing project access...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
    
    if (projectsError) {
      console.log('❌ Error accessing projects:', projectsError.message);
    } else {
      console.log('✅ Projects access successful');
      if (projects && projects.length > 0) {
        console.log('Sample project ID:', projects[0].id);
      }
    }
    
    // Try the exact query that's failing
    console.log('\n3. Testing exact failing query...');
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('title,description,milestone_id,estimated_hours,actual_hours,status,priority,due_date,assigned_to,project_id')
      .limit(1);
    
    if (tasksError) {
      console.log('❌ Error with project_tasks query:', tasksError.message);
      console.log('Error code:', tasksError.code);
      console.log('Error details:', tasksError.details);
    } else {
      console.log('✅ Project_tasks query successful');
      console.log('Rows returned:', tasks.length);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

debugAuthStatus();