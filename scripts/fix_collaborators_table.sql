-- First, drop the problematic table and policies
DROP TABLE IF EXISTS project_collaborators CASCADE;

-- Drop the problematic function
DROP FUNCTION IF EXISTS update_collaborator_user_id() CASCADE;

-- Recreate the table with proper structure
CREATE TABLE project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_email)
);

-- Create indexes for better performance
CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX idx_project_collaborators_user_email ON project_collaborators(user_email);
CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX idx_project_collaborators_status ON project_collaborators(status);

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Simplified policies to avoid recursion
-- Policy: Users can view collaborators for projects they own
CREATE POLICY "Project owners can view collaborators" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can view their own invitations
CREATE POLICY "Users can view own invitations" ON project_collaborators
  FOR SELECT USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy: Project owners can invite collaborators
CREATE POLICY "Project owners can invite collaborators" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Project owners can update collaborators
CREATE POLICY "Project owners can update collaborators" ON project_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Project owners can remove collaborators
CREATE POLICY "Project owners can remove collaborators" ON project_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own invitation status
CREATE POLICY "Users can update own invitations" ON project_collaborators
  FOR UPDATE USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a safer function to link collaborators when users sign up
CREATE OR REPLACE FUNCTION link_collaborator_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the user_id is null and email matches
  UPDATE project_collaborators
  SET user_id = NEW.id, updated_at = NOW()
  WHERE user_email = NEW.email 
    AND user_id IS NULL
    AND status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to link collaborators when users sign up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_collaborator_on_signup();
