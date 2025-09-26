-- Fix collaboration system by ensuring proper RLS policies and table structure

-- First, let's check if the project_collaborators table exists and has the right structure
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_email)
);

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations sent to them" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON project_collaborators;
DROP POLICY IF EXISTS "Users can create invitations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON project_collaborators;
DROP POLICY IF EXISTS "Users can delete invitations for their projects" ON project_collaborators;

-- Create new RLS policies for project_collaborators
CREATE POLICY "Users can view invitations sent to them" ON project_collaborators
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view invitations they sent" ON project_collaborators
  FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Users can create invitations for their projects" ON project_collaborators
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations sent to them" ON project_collaborators
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete invitations for their projects" ON project_collaborators
  FOR DELETE USING (invited_by = auth.uid());

-- Update projects RLS policies to allow collaborators to view projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Collaborators can view shared projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = projects.id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for project_collaborators
DROP TRIGGER IF EXISTS update_project_collaborators_updated_at ON project_collaborators;
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_email ON project_collaborators(user_email);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

-- Grant necessary permissions
GRANT ALL ON project_collaborators TO authenticated;
GRANT ALL ON projects TO authenticated;
