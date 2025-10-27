// Simulate the exact browser request that's failing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Initialize Supabase client with the same configuration as the browser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateBrowserRequest() {
  console.log('Simulating browser request...\n');
  
  try {
    // This is the exact query from the error message
    console.log('Executing exact query from browser error...');
    console.log('URL: /rest/v1/project_tasks?columns="title","description","milestone_id","estimated_hours","actual_hours","status","priority","due_date","assigned_to","project_id"');
    
    const { data, error } = await supabase
      .from('project_tasks')
      .select('title,description,milestone_id,estimated_hours,actual_hours,status,priority,due_date,assigned_to,project_id');
    
    if (error) {
      console.error('❌ Query failed:', error.message);
      console.log('Error details:');
      console.log('  Code:', error.code);
      console.log('  Message:', error.message);
      console.log('  Details:', error.details);
      console.log('  Hint:', error.hint);
      return;
    }
    
    console.log('✅ Query succeeded!');
    console.log('Returned', data.length, 'rows');
    
    // Let's also test inserting a task to see if that's where the real issue is
    console.log('\nTesting task insertion (as would happen in browser)...');
    
    // First check if we have any projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError.message);
      return;
    }
    
    if (projects && projects.length > 0) {
      const projectId = projects[0].id;
      console.log('Using project ID:', projectId);
      
      // Try to insert a task exactly as the browser would
      const taskData = {
        title: "Test Browser Task",
        description: "Task created to test browser insertion",
        status: "todo",
        priority: "medium",
        project_id: projectId,
        estimated_hours: 1,
        due_date: new Date().toISOString().split('T')[0]
      };
      
      console.log('Inserting task data:', JSON.stringify(taskData, null, 2));
      
      const { data: insertData, error: insertError } = await supabase
        .from('project_tasks')
        .insert([taskData]);
      
      if (insertError) {
        console.error('❌ Task insertion failed:', insertError.message);
        console.log('Error details:');
        console.log('  Code:', insertError.code);
        console.log('  Message:', insertError.message);
        console.log('  Details:', insertError.details);
        console.log('  Hint:', insertError.hint);
      } else {
        console.log('✅ Task insertion succeeded!');
        
        // Clean up if insertion was successful
        if (insertData && insertData.length > 0) {
          // Note: insertData might be empty due to RLS policies
          console.log('Cleaning up test task...');
        }
      }
    } else {
      console.log('⚠️  No projects found, skipping insertion test');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

simulateBrowserRequest();