-- Enable RLS and add policies for feature_requests so collaborators can create

-- Ensure table exists (created by scripts/003_add_team_and_features.sql)
-- Enable Row Level Security
ALTER TABLE IF EXISTS feature_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running safely
DROP POLICY IF EXISTS "Feature requests: read for accessible projects" ON feature_requests;
DROP POLICY IF EXISTS "Feature requests: insert for owners or collaborators" ON feature_requests;
DROP POLICY IF EXISTS "Feature requests: update by owners" ON feature_requests;
DROP POLICY IF EXISTS "Feature requests: delete by owners" ON feature_requests;

-- Read: project owner or accepted collaborator (by user_id or email)
CREATE POLICY "Feature requests: read for accessible projects" ON feature_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = feature_requests.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.status = 'accepted'
          AND (
            pc.user_id = auth.uid()
            OR pc.user_email = (auth.jwt() ->> 'email')
          )
        )
      )
    )
  );

-- Insert: project owner or accepted collaborator (by user_id or email)
CREATE POLICY "Feature requests: insert for owners or collaborators" ON feature_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = feature_requests.project_id
      AND (
        p.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators pc
          WHERE pc.project_id = p.id
          AND pc.status = 'accepted'
          AND (
            pc.user_id = auth.uid()
            OR pc.user_email = (auth.jwt() ->> 'email')
          )
        )
      )
    )
  );

-- Update: only project owner may update (e.g., change status)
CREATE POLICY "Feature requests: update by owners" ON feature_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = feature_requests.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Delete: only project owner may delete
CREATE POLICY "Feature requests: delete by owners" ON feature_requests
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = feature_requests.project_id
      AND p.user_id = auth.uid()
    )
  );

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_feature_requests_project_id ON feature_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);


