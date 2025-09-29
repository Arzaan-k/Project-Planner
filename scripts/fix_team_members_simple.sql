-- Simple fix for team_members table to allow adding team members
-- Run this in your Supabase SQL Editor

-- Step 1: Make user_id nullable (if not already)
ALTER TABLE team_members ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop the problematic unique constraint
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_project_id_user_id_key;

-- Step 3: Create a new unique constraint that allows NULL user_id
CREATE UNIQUE INDEX IF NOT EXISTS team_members_project_id_email_unique 
ON team_members (project_id, email);

-- Step 4: Create a partial unique index for user_id (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS team_members_project_id_user_id_unique 
ON team_members (project_id, user_id) 
WHERE user_id IS NOT NULL;

-- Step 5: Update RLS policies to be more permissive
DROP POLICY IF EXISTS "Users can view team members of their projects" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members of their projects" ON team_members;

-- Allow project owners and collaborators to view team members
CREATE POLICY "Users can view team members of their projects" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = team_members.project_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = team_members.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
    OR team_members.user_id = auth.uid()
  );

-- Allow project owners and collaborators to manage team members
CREATE POLICY "Users can manage team members of their projects" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = team_members.project_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = team_members.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

-- Step 6: Test the fix by trying to insert a test record
-- (This will be rolled back automatically)
BEGIN;
  INSERT INTO team_members (project_id, name, email, role) 
  VALUES ('00000000-0000-0000-0000-000000000000', 'Test User', 'test@example.com', 'member');
  ROLLBACK; -- This rolls back the test insert
COMMIT;

-- If the above test worked without errors, your team_members table is fixed!
