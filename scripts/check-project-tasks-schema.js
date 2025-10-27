// Script to check project_tasks table schema
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  console.log('Please ensure you have a .env.local file with:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProjectTasksSchema() {
  console.log('Checking project_tasks table schema...\n');
  
  try {
    // Test connection
    console.log('1. Testing database connection...');
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return;
    }
    console.log('✅ Connection successful\n');
    
    // Check if project_tasks table exists
    console.log('2. Checking if project_tasks table exists...');
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'project_tasks')
      .eq('table_schema', 'public');
    
    if (tableError) {
      console.error('❌ Error checking table existence:', tableError.message);
      return;
    }
    
    if (tableExists.length === 0) {
      console.log('❌ project_tasks table does not exist');
      return;
    }
    console.log('✅ project_tasks table exists\n');
    
    // Get columns in project_tasks table
    console.log('3. Getting project_tasks columns...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'project_tasks')
      .eq('table_schema', 'public')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Error getting columns:', columnsError.message);
      return;
    }
    
    console.log('Columns in project_tasks table:');
    const columnNames = [];
    columns.forEach(col => {
      columnNames.push(col.column_name);
      console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Check for required columns
    console.log('\n4. Checking required columns...');
    const requiredColumns = [
      'title', 'description', 'milestone_id', 'estimated_hours', 
      'actual_hours', 'status', 'priority', 'due_date', 'assigned_to', 'project_id'
    ];
    
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
      console.log('\nThe following columns are expected but missing:');
      missingColumns.forEach(col => console.log(`  - ${col}`));
    } else {
      console.log('✅ All required columns present');
    }
    
    // Test a simple query
    console.log('\n5. Testing simple query...');
    const { data: testData, error: testError } = await supabase
      .from('project_tasks')
      .select('id, title, status')
      .limit(1);
    
    if (testError) {
      console.error('❌ Query failed:', testError.message);
      console.log('This confirms there is a schema mismatch.');
    } else {
      console.log('✅ Query successful');
      if (testData && testData.length > 0) {
        console.log('Sample data:', JSON.stringify(testData[0], null, 2));
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProjectTasksSchema();