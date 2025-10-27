-- Add team members, time tracking, and task assignment functionality

-- Add team members table (if not exists)
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add time tracking table (if not exists)
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  hours_spent DECIMAL(5,2) NOT NULL CHECK (hours_spent > 0),
  date_logged DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add feature requests table (if not exists)
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in-progress', 'completed', 'rejected')),
  requested_by_name TEXT NOT NULL,
  requested_by_email TEXT NOT NULL,
  stakeholder_type TEXT DEFAULT 'client' CHECK (stakeholder_type IN ('client', 'user', 'internal', 'other')),
  estimated_hours INTEGER,
  business_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add task assignments table (if not exists)
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Add automatic time tracking columns to project_tasks (if not exist)
ALTER TABLE project_tasks 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id);

-- Create or replace function to automatically track time when task status changes
CREATE OR REPLACE FUNCTION track_task_status_change()
RETURNS TRIGGER AS $$
DECLARE
  time_spent_minutes INTEGER := 0;
BEGIN
  -- Calculate time spent in previous status
  IF OLD.status IS NOT NULL AND OLD.status != NEW.status THEN
    -- If task was in progress, calculate time spent
    IF OLD.status = 'in-progress' AND OLD.started_at IS NOT NULL THEN
      time_spent_minutes := EXTRACT(EPOCH FROM (NOW() - OLD.started_at)) / 60;
      
      -- Update actual hours on the task
      NEW.actual_hours := COALESCE(NEW.actual_hours, 0) + (time_spent_minutes / 60.0);
    END IF;
    
    -- Record status change history
    INSERT INTO task_status_history (task_id, user_id, old_status, new_status, time_spent_minutes)
    VALUES (NEW.id, auth.uid(), OLD.status, NEW.status, time_spent_minutes);
  END IF;
  
  -- Set started_at when task moves to in-progress
  IF NEW.status = 'in-progress' AND OLD.status != 'in-progress' THEN
    NEW.started_at := NOW();
  END IF;
  
  -- Set completed_at when task is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for automatic time tracking
DROP TRIGGER IF EXISTS track_task_status_change_trigger ON project_tasks;
CREATE TRIGGER track_task_status_change_trigger
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION track_task_status_change();

-- Enable RLS for new tables (if not already enabled)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
-- RLS policies for team_members
DROP POLICY IF EXISTS "Users can view team members of their projects" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members of their projects" ON team_members;

CREATE POLICY "Users can view team members of their projects" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = team_members.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage team members of their projects" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = team_members.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS policies for time_entries
DROP POLICY IF EXISTS "Users can view time entries of their projects" ON time_entries;
DROP POLICY IF EXISTS "Users can manage time entries of their projects" ON time_entries;

CREATE POLICY "Users can view time entries of their projects" ON time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = time_entries.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage time entries of their projects" ON time_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = time_entries.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS policies for feature_requests
DROP POLICY IF EXISTS "Users can view feature requests of their projects" ON feature_requests;
DROP POLICY IF EXISTS "Users can manage feature requests of their projects" ON feature_requests;

CREATE POLICY "Users can view feature requests of their projects" ON feature_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = feature_requests.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage feature requests of their projects" ON feature_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = feature_requests.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- RLS policies for task_assignments
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
  );

CREATE POLICY "Users can manage task assignments of their projects" ON task_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_tasks 
      JOIN projects ON projects.id = project_tasks.project_id
      WHERE project_tasks.id = task_assignments.task_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes for performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date_logged);
CREATE INDEX IF NOT EXISTS idx_feature_requests_project_id ON feature_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);

-- Add triggers for updated_at (drop and recreate if they exist)
DROP TRIGGER IF EXISTS update_time_entries_updated_at ON time_entries;
DROP TRIGGER IF EXISTS update_feature_requests_updated_at ON feature_requests;

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_requests_updated_at BEFORE UPDATE ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add total_hours_logged column to projects table (if not exists)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_hours_logged DECIMAL(8,2) DEFAULT 0;

-- Create or replace function to calculate total hours for a project
CREATE OR REPLACE FUNCTION calculate_project_hours(project_uuid UUID)
RETURNS DECIMAL(8,2) AS $$
DECLARE
    total_hours DECIMAL(8,2);
BEGIN
    SELECT COALESCE(SUM(hours_spent), 0) INTO total_hours
    FROM time_entries
    WHERE project_id = project_uuid;
    
    RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to update project total hours
CREATE OR REPLACE FUNCTION update_project_total_hours()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE projects 
        SET total_hours_logged = calculate_project_hours(OLD.project_id)
        WHERE id = OLD.project_id;
        RETURN OLD;
    ELSE
        UPDATE projects 
        SET total_hours_logged = calculate_project_hours(NEW.project_id)
        WHERE id = NEW.project_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger to automatically update project total hours
DROP TRIGGER IF EXISTS update_project_hours_trigger ON time_entries;
CREATE TRIGGER update_project_hours_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_project_total_hours();