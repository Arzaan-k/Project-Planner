-- Check what triggers exist on auth.users table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';

-- Check what functions exist that might be related to user creation
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name LIKE '%collaborator%' 
OR routine_name LIKE '%user%'
OR routine_name LIKE '%signup%';

-- Check if there are any constraints on auth.users that might be causing issues
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'users' 
AND table_schema = 'auth';
