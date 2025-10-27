// Script to extract current database schema
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function extractSchema() {
  console.log('Extracting database schema...\n');
  
  try {
    // Get list of tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema')
      .eq('table_schema', 'public')
      .order('table_name');
    
    if (tablesError) {
      console.error('Error fetching tables:', tablesError);
      return;
    }
    
    console.log('=== DATABASE SCHEMA ===\n');
    
    // Process each table
    for (const table of tables) {
      console.log(`TABLE: ${table.table_name}`);
      console.log('-'.repeat(40));
      
      // Get columns
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', table.table_name)
        .eq('table_schema', 'public')
        .order('ordinal_position');
      
      if (columnsError) {
        console.error(`Error fetching columns for ${table.table_name}:`, columnsError);
        continue;
      }
      
      console.log('Columns:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultValue = col.column_default ? `DEFAULT ${col.column_default}` : '';
        console.log(`  ${col.column_name} ${col.data_type} ${nullable} ${defaultValue}`);
      });
      
      // Get constraints
      const { data: constraints, error: constraintsError } = await supabase
        .rpc('get_constraints_for_table', { table_name: table.table_name });
      
      if (!constraintsError && constraints && constraints.length > 0) {
        console.log('\nConstraints:');
        constraints.forEach(constraint => {
          console.log(`  ${constraint.constraint_name}: ${constraint.constraint_type}`);
        });
      }
      
      // Get indexes
      const { data: indexes, error: indexesError } = await supabase
        .rpc('get_indexes_for_table', { table_name: table.table_name });
      
      if (!indexesError && indexes && indexes.length > 0) {
        console.log('\nIndexes:');
        indexes.forEach(index => {
          console.log(`  ${index.indexname}`);
        });
      }
      
      console.log('\n');
    }
    
    // Get RLS policies
    console.log('=== RLS POLICIES ===\n');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .order('tablename');
    
    if (!policiesError && policies) {
      const groupedPolicies = policies.reduce((acc, policy) => {
        if (!acc[policy.tablename]) {
          acc[policy.tablename] = [];
        }
        acc[policy.tablename].push(policy);
        return acc;
      }, {});
      
      for (const [tableName, tablePolicies] of Object.entries(groupedPolicies)) {
        console.log(`TABLE: ${tableName}`);
        console.log('-'.repeat(40));
        tablePolicies.forEach(policy => {
          console.log(`  ${policy.policyname}: ${policy.permissive} ${policy.cmd} ${policy.qual || ''}`);
        });
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('Error extracting schema:', error);
  }
}

// Custom RPC function to get constraints
async function createGetConstraintsFunction() {
  const { error } = await supabase.rpc('create_get_constraints_function');
  if (error) console.error('Error creating get_constraints function:', error);
}

// Custom RPC function to get indexes
async function createGetIndexesFunction() {
  const { error } = await supabase.rpc('create_get_indexes_function');
  if (error) console.error('Error creating get_indexes function:', error);
}

extractSchema();