-- Align project_tasks priority to support 'urgent' as used by the UI/components
ALTER TABLE project_tasks DROP CONSTRAINT IF EXISTS project_tasks_priority_check;
ALTER TABLE project_tasks
  ADD CONSTRAINT project_tasks_priority_check
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));


