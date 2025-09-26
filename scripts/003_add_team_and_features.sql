-- Add team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  avatar_url TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Add time tracking table
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

-- Add feature requests table
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

-- Add task assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS for new tables
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_members
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_project_id ON team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date_logged);
CREATE INDEX IF NOT EXISTS idx_feature_requests_project_id ON feature_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_requests_updated_at BEFORE UPDATE ON feature_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add total_hours_logged column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_hours_logged DECIMAL(8,2) DEFAULT 0;

-- Create function to calculate total hours for a project
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

-- Create function to update project total hours
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

-- Create trigger to automatically update project total hours
CREATE TRIGGER update_project_hours_trigger
    AFTER INSERT OR UPDATE OR DELETE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_project_total_hours();
