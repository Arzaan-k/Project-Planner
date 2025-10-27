# Project Tasks 400 Error Debug Summary

## Issue Description
Users are encountering a 400 error when trying to access or save project tasks in the browser:
```
Failed to load resource: the server responded with a status of 400 ()
Error saving task: Object
```

## Root Cause Analysis

### 1. Database Schema
- The `project_tasks` table exists and has all the required columns including `assigned_to`
- The `assigned_to` column was added in later migrations and references `team_members(id)`
- All column selection queries work correctly from server-side scripts

### 2. Authentication & RLS Policies
- The main issue is **Row Level Security (RLS)** policies on the `project_tasks` table
- RLS policies require users to be authenticated and be the owner of projects:
  ```sql
  CREATE POLICY "Users can view tasks of their projects" ON project_tasks
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM projects 
        WHERE projects.id = project_tasks.project_id 
        AND projects.user_id = auth.uid()
      )
    );
  ```
- When users are not authenticated, `auth.uid()` returns `null`, causing all RLS checks to fail
- The browser is using the anon key but without proper user authentication

### 3. Middleware Behavior
- Middleware should redirect unauthenticated users to `/auth/login`
- However, users seem to be accessing protected routes without proper authentication

## Solution Steps

### Immediate Fix
1. Ensure users are properly authenticated before accessing project pages
2. Redirect unauthenticated users to the login page
3. Verify that the middleware is working correctly

### Long-term Improvements
1. Add better error handling in the frontend components to show meaningful error messages
2. Consider adding more permissive RLS policies for development/testing environments
3. Add proper user onboarding flow

## Testing Verification
All database operations work correctly from server-side scripts:
- ✅ Column selection with all required fields
- ✅ Task insertion (when a project exists)
- ✅ Table access with anon key

The issue is purely authentication-related in the browser context.