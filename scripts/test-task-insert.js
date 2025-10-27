// Test script to try inserting a task
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTaskInsert() {
  console.log('Testing task insertion...\n');
  
  // First, let's create a test project if one doesn't exist
  console.log('1. Checking for existing projects...');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .limit(1);
  
  if (projectsError) {
    console.error('❌ Error fetching projects:', projectsError.message);
    return;
  }
  
  let projectId;
  if (projects && projects.length > 0) {
    projectId = projects[0].id;
    console.log('✅ Using existing project:', projectId);
  } else {
    console.log('❌ No projects found. Cannot test task insertion without a project.');
    return;
  }
  
  // Try to insert a simple task
  console.log('\n2. Attempting to insert a test task...');
  const testTask = {
    title: 'Test Task',
    description: 'This is a test task',
    status: 'todo',
    priority: 'medium',
    project_id: projectId
  };
  
  const { data, error } = await supabase
    .from('project_tasks')
    .insert([testTask])
    .select();
  
  if (error) {
    console.error('❌ Error inserting task:', error.message);
    console.log('Error code:', error.code);
    console.log('Error details:', error.details);
    return;
  }
  
  console.log('✅ Task inserted successfully');
  if (data && data.length > 0) {
    const taskId = data[0].id;
    console.log('Task ID:', taskId);
    
    // Clean up - delete the test task
    console.log('\n3. Cleaning up test task...');
    const { error: deleteError } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);
    
    if (deleteError) {
      console.error('❌ Error deleting test task:', deleteError.message);
    } else {
      console.log('✅ Test task cleaned up');
    }
  }
}

testTaskInsert();