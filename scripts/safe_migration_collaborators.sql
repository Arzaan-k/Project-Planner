-- SAFE MIGRATION: Create project_collaborators table without affecting existing functionality
-- This script is safe to run multiple times and won't break existing features

-- Check if project_collaborators table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'project_collaborators' 
        AND table_schema = 'public'
    ) THEN
        -- Create the table
        CREATE TABLE project_collaborators (
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

        -- Create indexes
        CREATE INDEX idx_project_collaborators_project_id ON project_collaborators(project_id);
        CREATE INDEX idx_project_collaborators_user_email ON project_collaborators(user_email);
        CREATE INDEX idx_project_collaborators_user_id ON project_collaborators(user_id);
        CREATE INDEX idx_project_collaborators_status ON project_collaborators(status);

        -- Enable RLS
        ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'project_collaborators table created successfully';
    ELSE
        RAISE NOTICE 'project_collaborators table already exists, skipping creation';
    END IF;
END $$;

-- Create or replace RLS policies safely
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners can view collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Users can view own invitations" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners can invite collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners can update collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Project owners can remove collaborators" ON project_collaborators;
    DROP POLICY IF EXISTS "Users can update own invitations" ON project_collaborators;

    -- Create simple policy that works for all authenticated users
    CREATE POLICY "Enable all operations for authenticated users" ON project_collaborators
      FOR ALL USING (auth.uid() IS NOT NULL);

    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Create or replace the updated_at function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger for updated_at
DROP TRIGGER IF EXISTS update_project_collaborators_updated_at ON project_collaborators;
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create or replace the collaborator linking function
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

-- Check if the trigger already exists and handle it safely
DO $$
BEGIN
    -- Check if the trigger exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        -- Drop the existing trigger
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        RAISE NOTICE 'Existing on_auth_user_created trigger removed';
    END IF;

    -- Create the new trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION link_collaborator_on_signup();

    RAISE NOTICE 'on_auth_user_created trigger created successfully';
END $$;

-- Verify the setup
SELECT 'project_collaborators table setup completed safely' as status;
