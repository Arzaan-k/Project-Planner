# 🚀 Quick Setup Guide - Fix Collaboration Feature

## Issues Fixed ✅

1. **PixelCard Error**: Fixed `window is not defined` error during server-side rendering
2. **Database Table**: Created SQL migration for `project_collaborators` table
3. **Error Handling**: Added better error messages and database testing

## 🔧 Steps to Complete Setup

### Step 1: Create Database Table

**Option A: Supabase Dashboard (Recommended)**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `scripts/create_collaborators_table.sql`
5. Paste and click **"Run"**

**Option B: Copy this SQL directly:**
```sql
-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
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

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Create policies (copy the rest from the file)
```

### Step 2: Test the Setup

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Go to http://localhost:3000**

3. **Click "Test Database Setup"** button on the dashboard

4. **Verify the results:**
   - ✅ Table exists: Yes
   - ✅ Can insert records: Yes

### Step 3: Test Collaboration Feature

1. **Create a project** (if you don't have one)
2. **Go to project details**
3. **Click "Collaborators" tab**
4. **Click "Invite Collaborator"**
5. **Enter an email and select role**
6. **Click "Send Invitation"**

## 🎯 Expected Behavior

- **No more errors** in the console
- **Database test passes** ✅
- **Invitation form works** without errors
- **Collaborators tab** shows up in project details
- **Invitations appear** on the dashboard

## 🐛 Troubleshooting

### If you still see "Table not found" error:

1. **Check Supabase Dashboard:**
   - Go to **Table Editor**
   - Look for `project_collaborators` table
   - If missing, run the SQL again

2. **Verify RLS Policies:**
   - Go to **Authentication > Policies**
   - Check that policies exist for `project_collaborators`

3. **Check Console:**
   - Look for any SQL errors
   - Verify the table structure matches the code

### If PixelCard still has issues:

The fix should work, but if you see any window-related errors:
- Clear browser cache
- Restart the dev server
- Check that the fix is applied correctly

## 🎉 Success!

Once everything is working:
1. **Remove the Database Test component** (optional)
2. **Start inviting collaborators** to your projects
3. **Test the full workflow** (invite → accept → collaborate)

## 📝 Next Steps

After the basic setup works:
1. **Set up email service** (Resend/SendGrid) for actual email sending
2. **Customize email templates** to match your brand
3. **Test with real users** and different roles

The collaboration feature is now ready to use! 🚀
