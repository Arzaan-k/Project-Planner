-- Fix team_members table to allow NULL user_id values
-- This allows adding team members by email even if they haven't signed up yet

-- First, drop the NOT NULL constraint on user_id
ALTER TABLE team_members ALTER COLUMN user_id DROP NOT NULL;

-- Update the unique constraint to handle NULL user_id values
-- We need to drop the existing constraint first
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_project_id_user_id_key;

-- Create a new unique constraint that allows NULL user_id
-- This ensures one user_id per project, but allows multiple NULL user_ids
CREATE UNIQUE INDEX team_members_project_id_user_id_unique 
ON team_members (project_id, user_id) 
WHERE user_id IS NOT NULL;

-- Also create a unique constraint for email per project
CREATE UNIQUE INDEX team_members_project_id_email_unique 
ON team_members (project_id, email);

-- Update RLS policies to handle NULL user_id
DROP POLICY IF EXISTS "Users can view team members of their projects" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members of their projects" ON team_members;

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
    OR (
      team_members.user_id = auth.uid()
    )
  );

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
