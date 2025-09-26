-- Fix project creation and collaboration system

-- 1. First, ensure the projects table has the right structure
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  github_link TEXT,
  deployment_link TEXT,
  tech_stack TEXT[],
  business_implementation TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'completed', 'on-hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create project_collaborators table
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

-- 3. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;

DROP POLICY IF EXISTS "Users can view invitations sent to them" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON project_collaborators;
DROP POLICY IF EXISTS "Users can create invitations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON project_collaborators;
DROP POLICY IF EXISTS "Users can delete invitations for their projects" ON project_collaborators;

-- 5. Create new RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

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

-- 6. Create RLS policies for project_collaborators
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

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_collaborators_updated_at ON project_collaborators;
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_email ON project_collaborators(user_email);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

-- 10. Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_collaborators TO authenticated;

-- 11. Create a test project for the owner (arzaanalikhan12@gmail.com)
-- First, we need to get the user ID for arzaanalikhan12@gmail.com
-- This will be done by the app when the user logs in

-- 12. Insert a sample project (this will be created by the app)
-- The app will handle project creation with proper user authentication
