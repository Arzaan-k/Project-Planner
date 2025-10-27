# Troubleshooting Project Tasks 400 Error

## Problem
You're seeing a 400 error when trying to access or save project tasks:
```
Failed to load resource: the server responded with a status of 400 ()
Error saving task: Object
```

## Most Likely Causes

### 1. Authentication Issue (Most Common)
The error is typically caused by Row Level Security (RLS) policies that require proper user authentication.

**Solution:**
1. Make sure you're logged in to the application
2. If you're not logged in, you'll be redirected to `/auth/login`
3. If you don't have an account, sign up at `/auth/sign-up`

### 2. Project Ownership
You can only access tasks for projects you own.

**Solution:**
1. Ensure you're viewing a project you created
2. If you're trying to access someone else's project, you need to be added as a collaborator

## Debugging Steps

### Step 1: Check Authentication Status
1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Look for authentication-related messages
4. Check if you're properly logged in

### Step 2: Verify Network Requests
1. Open your browser's developer tools (F12)
2. Go to the Network tab
3. Try to access or save a task
4. Look for failed requests to `/rest/v1/project_tasks`
5. Check the response details for more information

### Step 3: Check Console Errors
1. Open your browser's developer tools (F12)
2. Go to the Console tab
3. Look for detailed error messages with more information than "Object"

## Quick Fixes

### Clear Browser Data
Sometimes cached data can cause issues:
1. Open your browser's settings
2. Clear cookies and cache for this site
3. Refresh the page
4. Log in again

### Force Refresh
1. Press Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. This forces a complete refresh ignoring cache

## For Developers

### Database Schema Requirements
Make sure all required tables and columns exist:
- `project_tasks` table with `assigned_to` column
- `team_members` table for task assignments
- Proper foreign key relationships

### RLS Policy Verification
Check that RLS policies are correctly configured:
```sql
-- Should exist on project_tasks table
CREATE POLICY "Users can view tasks of their projects" ON project_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_tasks.project_id 
      AND projects.user_id = auth.uid()
    )
  );
```

### Environment Variables
Ensure your `.env` file has correct Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Still Having Issues?

1. Try logging out and logging back in
2. Create a new project and try adding tasks there
3. Contact support with screenshots of the Network tab showing the failed requests