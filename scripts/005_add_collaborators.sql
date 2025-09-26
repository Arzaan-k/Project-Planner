-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
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
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_email ON project_collaborators(user_email);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

-- Create RLS policies for project_collaborators
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view collaborators for projects they own or collaborate on
CREATE POLICY "Users can view collaborators for accessible projects" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.user_id = auth.uid()
          AND pc.status = 'accepted'
        )
      )
    )
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

-- Policy: Project owners can update collaborator status
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

-- Policy: Users can accept/decline their own invitations
CREATE POLICY "Users can update their own invitations" ON project_collaborators
  FOR UPDATE USING (
    user_id = auth.uid()
    OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Create function to automatically set user_id when user signs up
CREATE OR REPLACE FUNCTION update_collaborator_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Update any pending invitations for this email
  UPDATE project_collaborators
  SET user_id = NEW.id, updated_at = NOW()
  WHERE user_email = NEW.email AND user_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically link collaborators when users sign up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION update_collaborator_user_id();

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

-- Add sample data for testing
INSERT INTO project_collaborators (project_id, user_email, role, status, invited_by)
SELECT 
  p.id,
  'collaborator@example.com',
  'collaborator',
  'pending',
  p.user_id
FROM projects p
WHERE p.title LIKE '%Sample%'
LIMIT 1;
