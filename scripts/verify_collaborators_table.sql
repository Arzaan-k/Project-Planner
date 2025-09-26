-- Verify that the project_collaborators table exists and has the correct structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'project_collaborators' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'project_collaborators';

-- Check policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'project_collaborators';

-- Test insert (this should work if everything is set up correctly)
-- You can uncomment this to test, but make sure to replace with actual project_id and user_id
/*
INSERT INTO project_collaborators (project_id, user_email, role, status, invited_by)
VALUES (
  'your-project-id-here',
  'test@example.com',
  'collaborator',
  'pending',
  'your-user-id-here'
);
*/
