// Simple script to check project_tasks table schema
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\nChecking project_tasks table...\n');
  
  try {
    // Try to get column info using a different approach
    console.log('1. Trying to select all columns from project_tasks...');
    const { data, error } = await supabase
      .from('project_tasks')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error selecting from project_tasks:', error.message);
      console.log('Error code:', error.code);
      console.log('Error details:', error.details);
      console.log('Error hint:', error.hint);
      return;
    }
    
    console.log('✅ Successfully queried project_tasks');
    if (data && data.length > 0) {
      console.log('Sample row keys:', Object.keys(data[0]));
    } else {
      console.log('Table is empty');
    }
    
    // Try to specifically select the problematic columns
    console.log('\n2. Trying to select specific columns that caused the error...');
    const { data: specificData, error: specificError } = await supabase
      .from('project_tasks')
      .select('title,description,milestone_id,estimated_hours,actual_hours,status,priority,due_date,assigned_to,project_id')
      .limit(1);
    
    if (specificError) {
      console.error('❌ Error selecting specific columns:', specificError.message);
      console.log('This confirms the issue with the column selection.');
      console.log('Most likely the "assigned_to" column is missing.');
    } else {
      console.log('✅ Successfully selected all required columns');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

checkSchema();