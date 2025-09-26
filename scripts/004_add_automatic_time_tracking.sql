-- Add automatic time tracking for task status changes
CREATE TABLE IF NOT EXISTS task_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_minutes INTEGER DEFAULT 0 -- Automatically calculated time spent in this status
);

-- Add task assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  notes TEXT
);

-- Add started_at and completed_at to project_tasks for automatic time tracking
ALTER TABLE project_tasks 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES team_members(id);

-- Create function to automatically track time when task status changes
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

-- Create trigger for automatic time tracking
DROP TRIGGER IF EXISTS track_task_status_change_trigger ON project_tasks;
CREATE TRIGGER track_task_status_change_trigger
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION track_task_status_change();

-- Enable RLS for new tables
ALTER TABLE task_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_status_history
CREATE POLICY "Users can view task status history for their projects" ON task_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = task_status_history.task_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert task status history for their projects" ON task_status_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = task_status_history.task_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create RLS policies for task_assignments
CREATE POLICY "Users can view task assignments for their projects" ON task_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = task_assignments.task_id 
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage task assignments for their projects" ON task_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      JOIN projects p ON p.id = pt.project_id
      WHERE pt.id = task_assignments.task_id 
      AND p.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_status_history_task_id ON task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
