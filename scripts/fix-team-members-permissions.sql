-- Fix team_members table permissions to allow collaborators access

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view team members of their projects" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members of their projects" ON team_members;

-- Create new policies that allow collaborators to access team members
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

-- Also fix time_entries permissions for collaborators
DROP POLICY IF EXISTS "Users can view time entries of their projects" ON time_entries;
DROP POLICY IF EXISTS "Users can manage time entries of their projects" ON time_entries;

CREATE POLICY "Users can view time entries of their projects" ON time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = time_entries.project_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = time_entries.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

CREATE POLICY "Users can manage time entries of their projects" ON time_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = time_entries.project_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = time_entries.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

-- Fix feature_requests permissions for collaborators
DROP POLICY IF EXISTS "Users can view feature requests of their projects" ON feature_requests;
DROP POLICY IF EXISTS "Users can manage feature requests of their projects" ON feature_requests;

CREATE POLICY "Users can view feature requests of their projects" ON feature_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = feature_requests.project_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = feature_requests.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

CREATE POLICY "Users can manage feature requests of their projects" ON feature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = feature_requests.project_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = feature_requests.project_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

-- Fix task_assignments permissions for collaborators
DROP POLICY IF EXISTS "Users can view task assignments of their projects" ON task_assignments;
DROP POLICY IF EXISTS "Users can manage task assignments of their projects" ON task_assignments;

CREATE POLICY "Users can view task assignments of their projects" ON task_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_tasks 
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_assignments.task_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_tasks 
      JOIN projects ON projects.id = project_tasks.project_id
      JOIN project_collaborators ON project_collaborators.project_id = projects.id
      WHERE project_tasks.id = task_assignments.task_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

CREATE POLICY "Users can manage task assignments of their projects" ON task_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_tasks 
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_assignments.task_id 
      AND projects.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM project_tasks 
      JOIN projects ON projects.id = project_tasks.project_id
      JOIN project_collaborators ON project_collaborators.project_id = projects.id
      WHERE project_tasks.id = task_assignments.task_id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );
