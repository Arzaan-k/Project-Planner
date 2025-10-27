// Comprehensive test script
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runComprehensiveTest() {
  console.log('Running comprehensive database test...\n');
  
  try {
    // Test 1: Check if we can access the projects table
    console.log('1. Testing projects table access...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Error accessing projects:', projectsError.message);
      return;
    }
    console.log('✅ Projects table accessible');
    
    // Test 2: Check if we can access the project_tasks table
    console.log('\n2. Testing project_tasks table access...');
    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('id, title')
      .limit(1);
    
    if (tasksError) {
      console.error('❌ Error accessing project_tasks:', tasksError.message);
      return;
    }
    console.log('✅ Project_tasks table accessible');
    
    // Test 3: Try to select the exact columns that are failing in the browser
    console.log('\n3. Testing exact column selection from error...');
    const { data: columnTest, error: columnError } = await supabase
      .from('project_tasks')
      .select('title,description,milestone_id,estimated_hours,actual_hours,status,priority,due_date,assigned_to,project_id')
      .limit(1);
    
    if (columnError) {
      console.error('❌ Error with exact column selection:', columnError.message);
      console.log('This matches the browser error!');
      return;
    }
    console.log('✅ Exact column selection works');
    
    // Test 4: Try to insert a task with all the fields
    console.log('\n4. Testing task insertion with all fields...');
    
    // If we have a project, use it, otherwise this test will be skipped
    if (projects && projects.length > 0) {
      const projectId = projects[0].id;
      console.log('Using project ID:', projectId);
      
      const testTask = {
        title: 'Test Task',
        description: 'This is a test task',
        status: 'todo',
        priority: 'medium',
        project_id: projectId,
        estimated_hours: 2,
        due_date: new Date().toISOString().split('T')[0] // Today's date
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('project_tasks')
        .insert([testTask])
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting task:', insertError.message);
        console.log('Details:', insertError.details);
        console.log('Hint:', insertError.hint);
      } else {
        console.log('✅ Task inserted successfully');
        
        // Clean up
        if (insertData && insertData.length > 0) {
          const taskId = insertData[0].id;
          await supabase.from('project_tasks').delete().eq('id', taskId);
          console.log('✅ Test task cleaned up');
        }
      }
    } else {
      console.log('⚠️  No projects found, skipping insertion test');
    }
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

runComprehensiveTest();