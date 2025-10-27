// Check RLS policies on project_tasks table
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLSPolicies() {
  console.log('Checking RLS policies...\n');
  
  try {
    // Check if RLS is enabled on project_tasks
    console.log('1. Checking if RLS is enabled on project_tasks...');
    
    // We can't directly check RLS status through the JS client, but we can infer it
    // by trying to access the table with and without authentication
    
    // Try to access with anon key (current setup)
    console.log('   Testing access with anon key...');
    const { data: anonData, error: anonError } = await supabase
      .from('project_tasks')
      .select('id')
      .limit(1);
    
    if (anonError) {
      console.log('   ❌ Anon access failed:', anonError.message);
    } else {
      console.log('   ✅ Anon access successful');
    }
    
    // Check for specific RLS-related errors
    if (anonError && (anonError.message.includes('denied') || anonError.message.includes('permission'))) {
      console.log('   ⚠️  This suggests RLS policies are active and blocking access');
    }
    
    // Try to get information about policies (might not work with anon key)
    console.log('\n2. Checking for RLS policies on project_tasks...');
    console.log('   (This might fail with anon key, which is expected)');
    
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_policies_for_table', { table_name: 'project_tasks' });
      
      if (policiesError) {
        console.log('   ℹ️  Cannot fetch policies with anon key (expected)');
      } else {
        console.log('   Policies found:', policies);
      }
    } catch (rpcError) {
      console.log('   ℹ️  RPC call not available with anon key (expected)');
    }
    
    // Check if we're authenticated
    console.log('\n3. Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('   ⚠️  Not authenticated - using anon key only');
      console.log('   This might be causing RLS policy issues');
    } else {
      console.log('   ✅ Authenticated as:', user.email);
    }
    
    console.log('\n4. Summary:');
    console.log('   - If queries work in server scripts but fail in browser,');
    console.log('     it\'s likely an authentication/RLS issue');
    console.log('   - The browser needs to be properly authenticated');
    console.log('   - RLS policies on project_tasks might be blocking access');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRLSPolicies();