# 🧪 Collaboration Flow Testing Guide

This guide will help you test the complete collaboration flow in your Project Planner application.

## 📋 Prerequisites

1. **Database Setup**: Make sure you've run the SQL migrations:
   - `scripts/safe_migration_collaborators.sql`
   - `scripts/safe_migration_notifications.sql`

2. **Two User Accounts**: You'll need two different user accounts to test the full flow:
   - **Account 1**: Project Owner (creates projects and invites collaborators)
   - **Account 2**: Collaborator (receives invitations and accepts them)

## 🔄 Complete Testing Flow

### Step 1: Create a Project (as Project Owner)

1. **Sign up/Login** with your first account (Project Owner)
2. **Create a new project**:
   - Click "New Project" button
   - Fill in project details (title, description, etc.)
   - Save the project
3. **Verify project appears** in your dashboard

### Step 2: Invite a Collaborator

1. **Go to project details**:
   - Click on the project you just created
   - You should see project details page
2. **Navigate to Collaborators tab**:
   - Look for "Collaborators" tab in the project details
   - Click on it
3. **Send invitation**:
   - Click "Invite Collaborator" button
   - Enter the email address of your second account
   - Select role (Collaborator or Viewer)
   - Click "Send Invitation"
4. **Verify invitation sent**:
   - You should see a success message
   - The invitation should appear in the collaborators list

### Step 3: Accept Invitation (as Collaborator)

1. **Sign up/Login** with your second account (Collaborator)
2. **Check dashboard for invitations**:
   - Look for "Project Invitations" section on the dashboard
   - You should see the invitation with the correct project title
3. **Accept the invitation**:
   - Click "Accept" button on the invitation
   - You should see a success message
4. **Verify project access**:
   - The project should now appear in your dashboard
   - You should be able to click on it and view project details

### Step 4: Test Collaboration Features

1. **View project details**:
   - Click on the shared project
   - Verify you can see all project information
2. **Test permissions**:
   - As a **Collaborator**: You should be able to edit tasks, milestones, etc.
   - As a **Viewer**: You should only be able to view, not edit
3. **Test project updates**:
   - Make changes to the project (if you have edit permissions)
   - Verify changes are visible to both users

## 🔍 Troubleshooting

### Issue: "Unknown Project" in Invitations

**Solution**: This should be fixed now. If you still see this:
1. Check browser console for errors
2. Verify the project_collaborators table exists
3. Run the database migrations again

### Issue: Projects Not Visible After Accepting Invitation

**Solution**: This should be fixed now. If projects don't appear:
1. Refresh the page after accepting invitation
2. Check browser console for permission errors
3. Verify the invitation was accepted successfully

### Issue: Collaborators Tab Not Showing

**Solution**: 
1. Make sure you're the project owner
2. Check if the project_collaborators table exists
3. Verify RLS policies are set up correctly

### Issue: Invitation Not Appearing on Dashboard

**Solution**:
1. Check if you're logged in with the correct email
2. Verify the invitation was sent to the right email address
3. Check browser console for database errors

## 🧪 Testing Checklist

- [ ] Project creation works
- [ ] Collaborators tab appears for project owners
- [ ] Invitation sending works
- [ ] Invitation appears on collaborator's dashboard
- [ ] Project title shows correctly in invitation
- [ ] Invitation acceptance works
- [ ] Project appears in collaborator's dashboard after acceptance
- [ ] Collaborator can access project details
- [ ] Permissions work correctly (edit vs view)
- [ ] Both users can see project updates

## 🐛 Debug Information

If you encounter issues, check the browser console for these debug messages:

- `[v0] ProjectDashboard rendering, projects count: X`
- `[v0] Accessible project IDs: [...]`
- `[v0] getUserProjectsClient - Owned projects: X`
- `[v0] getUserProjectsClient - Collaborated projects: X`
- `[v0] getUserProjectsClient - Total accessible projects: X`

These messages will help identify where the collaboration flow might be breaking.

## 🎉 Success Indicators

The collaboration system is working correctly when:

1. ✅ Project owners can invite collaborators via email
2. ✅ Invitations show correct project titles (not "Unknown Project")
3. ✅ Invited users see invitations on their dashboard
4. ✅ After accepting invitations, projects appear in collaborator's dashboard
5. ✅ Collaborators can access and interact with shared projects
6. ✅ Permissions work correctly based on assigned roles

## 📞 Need Help?

If you're still experiencing issues:

1. Check the browser console for error messages
2. Verify all database tables exist and have correct data
3. Test with a fresh browser session
4. Make sure both user accounts are properly authenticated

The collaboration system should now work end-to-end! 🚀
