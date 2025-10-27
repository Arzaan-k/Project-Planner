-- Add task status history table for tracking task progress

-- Create task status history table (if not exists)
CREATE TABLE IF NOT EXISTS task_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_spent_minutes INTEGER DEFAULT 0 -- Automatically calculated time spent in this status
);

-- Enable RLS for task_status_history (if not already enabled)
ALTER TABLE task_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view task status history for their projects" ON task_status_history;
DROP POLICY IF EXISTS "Users can insert task status history for their projects" ON task_status_history;

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

-- Create indexes for performance (if not exist)
CREATE INDEX IF NOT EXISTS idx_task_status_history_task_id ON task_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_task_status_history_changed_at ON task_status_history(changed_at);