-- Update RLS policies to give collaborators full access like owners

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;
DROP POLICY IF EXISTS "Users can manage their project shares" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view projects shared with them" ON project_collaborators;

-- Create new policies that give collaborators full access
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Collaborators can manage shared projects" ON projects
  FOR ALL USING (
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

CREATE POLICY "Users can manage their project shares" ON project_collaborators
  FOR ALL USING (invited_by = auth.uid());

CREATE POLICY "Users can view projects shared with them" ON project_collaborators
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Update project_milestones policies to allow collaborators
DROP POLICY IF EXISTS "Users can view milestones of their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can insert milestones for their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can update milestones of their projects" ON project_milestones;
DROP POLICY IF EXISTS "Users can delete milestones of their projects" ON project_milestones;

CREATE POLICY "Users can manage milestones of their projects" ON project_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_milestones.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can manage milestones of shared projects" ON project_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      JOIN project_collaborators ON projects.id = project_collaborators.project_id
      WHERE projects.id = project_milestones.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

-- Update project_tasks policies to allow collaborators
DROP POLICY IF EXISTS "Users can view tasks of their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can insert tasks for their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks of their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks of their projects" ON project_tasks;

CREATE POLICY "Users can manage tasks of their projects" ON project_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_tasks.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Collaborators can manage tasks of shared projects" ON project_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      JOIN project_collaborators ON projects.id = project_collaborators.project_id
      WHERE projects.id = project_tasks.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );
