-- Create the project_collaborators table if it doesn't exist
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

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Project owners can view collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view own invitations" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can invite collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update own invitations" ON project_collaborators;

-- Create simplified policies
CREATE POLICY "Project owners can view collaborators" ON project_collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own invitations" ON project_collaborators
  FOR SELECT USING (
    user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Project owners can invite collaborators" ON project_collaborators
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can update collaborators" ON project_collaborators
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can remove collaborators" ON project_collaborators
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_collaborators.project_id
      AND p.user_id = auth.uid()
    )
  );

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
DROP TRIGGER IF EXISTS update_project_collaborators_updated_at ON project_collaborators;
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION link_collaborator_on_signup();

-- Verify the table was created
SELECT 'project_collaborators table created successfully' as status;
