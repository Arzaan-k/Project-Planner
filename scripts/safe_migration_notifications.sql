-- SAFE MIGRATION: Create notifications and profiles tables without affecting existing functionality
-- This script is safe to run multiple times and won't break existing features

-- Create notifications table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'notifications' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE notifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'invitation', 'warning', 'success')),
          data JSONB,
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX idx_notifications_type ON notifications(type);
        CREATE INDEX idx_notifications_read_at ON notifications(read_at);

        -- Enable RLS
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'notifications table created successfully';
    ELSE
        RAISE NOTICE 'notifications table already exists, skipping creation';
    END IF;
END $$;

-- Create profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles' 
        AND table_schema = 'public'
    ) THEN
        CREATE TABLE profiles (
          id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
          email TEXT UNIQUE,
          full_name TEXT,
          avatar_url TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS for profiles
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        RAISE NOTICE 'profiles table created successfully';
    ELSE
        RAISE NOTICE 'profiles table already exists, skipping creation';
    END IF;
END $$;

-- Create or replace RLS policies safely
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON notifications;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON profiles;

    -- Create simple policies that work for all authenticated users
    CREATE POLICY "Enable all operations for authenticated users" ON notifications
      FOR ALL USING (auth.uid() IS NOT NULL);

    CREATE POLICY "Enable all operations for authenticated users" ON profiles
      FOR ALL USING (auth.uid() IS NOT NULL);

    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Create or replace the profile creation function
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle the profile creation trigger safely
DO $$
BEGIN
    -- Check if the trigger already exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created_profile' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        -- Drop the existing trigger
        DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
        RAISE NOTICE 'Existing on_auth_user_created_profile trigger removed';
    END IF;

    -- Create the new trigger
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_profile_on_signup();

    RAISE NOTICE 'on_auth_user_created_profile trigger created successfully';
END $$;

-- Verify the setup
SELECT 'notifications and profiles tables setup completed safely' as status;
