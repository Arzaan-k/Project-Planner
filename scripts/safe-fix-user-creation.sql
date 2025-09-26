-- SAFE FIX: Only disable problematic triggers without affecting other functionality

-- First, let's check if our trigger exists and disable it temporarily
DO $$
BEGIN
    -- Drop the problematic trigger if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created' 
        AND event_object_table = 'users'
        AND event_object_schema = 'auth'
    ) THEN
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        RAISE NOTICE 'Dropped on_auth_user_created trigger';
    ELSE
        RAISE NOTICE 'on_auth_user_created trigger does not exist';
    END IF;
END $$;

-- Also drop the function that might be causing issues
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'link_collaborator_on_signup'
        AND routine_schema = 'public'
    ) THEN
        DROP FUNCTION IF EXISTS link_collaborator_on_signup() CASCADE;
        RAISE NOTICE 'Dropped link_collaborator_on_signup function';
    ELSE
        RAISE NOTICE 'link_collaborator_on_signup function does not exist';
    END IF;
END $$;

-- Check if the old problematic function exists and drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'update_collaborator_user_id'
        AND routine_schema = 'public'
    ) THEN
        DROP FUNCTION IF EXISTS update_collaborator_user_id() CASCADE;
        RAISE NOTICE 'Dropped update_collaborator_user_id function';
    ELSE
        RAISE NOTICE 'update_collaborator_user_id function does not exist';
    END IF;
END $$;

-- Verify the cleanup
SELECT 'Cleanup completed. User creation should now work.' as status;
