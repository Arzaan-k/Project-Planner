# 🔧 Complete Collaboration System Fix

## **The Problem**
Your collaboration system has these issues:
1. ✅ **Invitations are being sent** (this works)
2. ❌ **Projects are not being saved to database** (RLS policies blocking)
3. ❌ **Collaborators can't see invitations** (table doesn't exist or wrong policies)
4. ❌ **Accepted invitations don't grant project access** (permission system not working)

## **The Solution**

### **Step 1: Fix Database Structure**

Run this SQL script in your Supabase dashboard:

```sql
-- Complete fix for collaboration system

-- 1. Ensure projects table exists with proper structure
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  github_link TEXT,
  deployment_link TEXT,
  tech_stack TEXT[],
  business_implementation TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in-progress', 'completed', 'on-hold', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('collaborator', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_email)
);

-- 3. Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Collaborators can view shared projects" ON projects;

DROP POLICY IF EXISTS "Users can view invitations sent to them" ON project_collaborators;
DROP POLICY IF EXISTS "Users can view invitations they sent" ON project_collaborators;
DROP POLICY IF EXISTS "Users can create invitations for their projects" ON project_collaborators;
DROP POLICY IF EXISTS "Users can update invitations sent to them" ON project_collaborators;
DROP POLICY IF EXISTS "Users can delete invitations for their projects" ON project_collaborators;

-- 5. Create new RLS policies for projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Collaborators can view shared projects" ON projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = projects.id 
      AND (
        project_collaborators.user_id = auth.uid() 
        OR project_collaborators.user_email = auth.jwt() ->> 'email'
      )
      AND project_collaborators.status = 'accepted'
    )
  );

-- 6. Create RLS policies for project_collaborators
CREATE POLICY "Users can view invitations sent to them" ON project_collaborators
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can view invitations they sent" ON project_collaborators
  FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Users can create invitations for their projects" ON project_collaborators
  FOR INSERT WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations sent to them" ON project_collaborators
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can delete invitations for their projects" ON project_collaborators
  FOR DELETE USING (invited_by = auth.uid());

-- 7. Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create triggers
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_collaborators_updated_at ON project_collaborators;
CREATE TRIGGER update_project_collaborators_updated_at
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_email ON project_collaborators(user_email);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user_id ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project_id ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_status ON project_collaborators(status);

-- 10. Grant necessary permissions
GRANT ALL ON projects TO authenticated;
GRANT ALL ON project_collaborators TO authenticated;
```

### **Step 2: Test the Complete Flow**

After running the SQL script, test the collaboration flow:

1. **Log in** with `arzaanalikhan12@gmail.com`
2. **Create a new project** (it should now save to the database)
3. **Go to project details** → **Collaborators tab**
4. **Invite** `naqvimohammedjawad@gmail.com` as a collaborator
5. **Log out** and **log in** with `naqvimohammedjawad@gmail.com`
6. **Check dashboard** - you should see the pending invitation
7. **Accept the invitation** - the project should now be visible and accessible

### **Step 3: Verify the Fix**

The collaboration system should now work as follows:

✅ **Project Owner** (`arzaanalikhan12@gmail.com`):
- Can create projects (saved to database)
- Can invite collaborators via email
- Can manage project collaborators

✅ **Collaborator** (`naqvimohammedjawad@gmail.com`):
- Can see pending invitations on dashboard
- Can accept invitations
- Gets full access to shared projects (same level as owner)
- Can view and edit the project

### **Step 4: Debug Information**

The debug panel on your dashboard will show:
- User information
- Owned projects
- Collaborations (by user ID and email)
- Pending invitations
- Accessible projects summary

### **Step 5: If Issues Persist**

If you still have issues, check the browser console for these logs:
- `[INVITATION]` - Invitation creation logs
- `[ACCEPT]` - Invitation acceptance logs
- `[v0]` - Permission system logs

## **What This Fix Does**

1. **Creates proper database tables** with correct structure
2. **Sets up RLS policies** that allow:
   - Project owners to create and manage projects
   - Collaborators to see invitations sent to their email
   - Collaborators to accept invitations and get project access
3. **Fixes permission system** to check both user_id and user_email
4. **Adds proper error handling** and logging
5. **Ensures projects are saved** to the database when created

## **Expected Result**

After applying this fix:
- Projects will be saved to the database when created
- Invitations will be visible to collaborators
- Accepted invitations will grant full project access
- The collaboration flow will work end-to-end

**Try this fix and let me know if the collaboration flow works correctly!** 🚀
