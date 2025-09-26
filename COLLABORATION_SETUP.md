# Project Collaboration Feature Setup Guide

This guide explains how to set up and use the new collaboration feature in your Project Planner application.

## Overview

The collaboration feature allows project owners to invite team members via email to collaborate on projects. Collaborators can be assigned different roles with varying levels of access:

- **Owner**: Full access to the project (can edit, delete, invite collaborators)
- **Collaborator**: Can edit and manage the project (add tasks, milestones, etc.)
- **Viewer**: Can only view the project (read-only access)

## Database Setup

### 1. Run the Migration

Execute the SQL migration script to create the necessary tables and policies:

```sql
-- Run this in your Supabase SQL editor
\i scripts/005_add_collaborators.sql
```

This will create:
- `project_collaborators` table
- Row Level Security (RLS) policies
- Triggers for automatic user linking
- Sample data for testing

### 2. Verify the Setup

Check that the table was created successfully:

```sql
SELECT * FROM project_collaborators LIMIT 5;
```

## Features

### 1. Invite Collaborators

Project owners can invite collaborators by:
1. Going to the project detail page
2. Clicking on the "Collaborators" tab
3. Clicking "Invite Collaborator"
4. Entering the email address and selecting a role
5. Sending the invitation

### 2. Accept/Decline Invitations

Invited users will see pending invitations on their dashboard. They can:
- Accept the invitation to gain access to the project
- Decline the invitation to reject access

### 3. Permission Management

The system automatically enforces permissions based on user roles:
- **Owners**: Can edit, delete, and invite collaborators
- **Collaborators**: Can edit project content but cannot delete or invite others
- **Viewers**: Can only view project information

### 4. Project Access

Users can only see projects they:
- Own (created)
- Are invited to as collaborators
- Have accepted invitations for

## Email Integration

### Current Implementation

The system currently logs invitation details to the console. To enable actual email sending:

### Option 1: Resend (Recommended)

1. Sign up for [Resend](https://resend.com)
2. Get your API key
3. Update the invitation action:

```typescript
// In lib/actions/invitations.ts
import { sendEmailWithResend } from "@/lib/email-templates"

// Replace the console.log with:
await sendEmailWithResend({
  projectTitle: project.title,
  inviterName: user.email, // or get from user profile
  inviterEmail: user.email,
  role,
  acceptUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/invitations/${invitationId}/accept`,
  declineUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/invitations/${invitationId}/decline`
}, process.env.RESEND_API_KEY!)
```

### Option 2: SendGrid

1. Sign up for [SendGrid](https://sendgrid.com)
2. Get your API key
3. Use the `sendEmailWithSendGrid` function instead

### Option 3: Custom Email Service

Implement your own email sending logic using the email templates in `lib/email-templates.ts`.

## Environment Variables

Add these to your `.env.local` file:

```env
# Email service (choose one)
RESEND_API_KEY=your_resend_api_key
SENDGRID_API_KEY=your_sendgrid_api_key

# Site URL for invitation links
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Usage Examples

### Inviting a Collaborator

```typescript
// In your component
const handleInvite = async () => {
  const result = await sendCollaboratorInvitation(
    projectId,
    "collaborator@example.com",
    "collaborator"
  )
  
  if (result.success) {
    toast.success("Invitation sent!")
  } else {
    toast.error(result.message)
  }
}
```

### Checking Permissions

```typescript
// Server-side
import { checkProjectPermission } from "@/lib/permissions"

const permissions = await checkProjectPermission(projectId)
if (!permissions.canView) {
  redirect("/")
}

// Client-side
import { checkProjectPermissionClient } from "@/lib/permissions-client"

const permissions = await checkProjectPermissionClient(projectId)
if (permissions.canEdit) {
  // Show edit buttons
}
```

### Getting User's Projects

```typescript
// Server-side
import { getUserProjects } from "@/lib/permissions"

const projectIds = await getUserProjects()

// Client-side
import { getUserProjectsClient } from "@/lib/permissions-client"

const projectIds = await getUserProjectsClient()
```

## Security Features

### Row Level Security (RLS)

The system uses Supabase RLS to ensure users can only:
- View collaborators for projects they have access to
- Invite collaborators only if they own the project
- Update their own invitation status
- Remove collaborators only if they own the project

### Permission Validation

All operations are validated server-side to prevent unauthorized access:
- Invitation sending
- Role updates
- Collaborator removal
- Project access

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

2. **"You don't have permission to invite collaborators"**
   - Only project owners can invite collaborators
   - Check that the user is the owner of the project

3. **"An invitation has already been sent to this email address"**
   - Each email can only have one pending invitation per project
   - Check existing invitations or remove the old one first

4. **Build errors with permissions**
   - Use `lib/permissions.ts` for server-side components
   - Use `lib/permissions-client.ts` for client-side components

### Database Issues

If you need to reset the collaborators table:

```sql
-- Drop and recreate the table
DROP TABLE IF EXISTS project_collaborators CASCADE;
-- Then run the migration script again
```

## Future Enhancements

Potential improvements for the collaboration feature:

1. **Real-time notifications** for new invitations
2. **Bulk invitation** functionality
3. **Team management** with predefined roles
4. **Activity logs** showing collaborator actions
5. **Advanced permissions** (e.g., can edit tasks but not milestones)
6. **Integration with external team management tools**

## Support

If you encounter any issues with the collaboration feature:

1. Check the browser console for error messages
2. Verify your Supabase setup and RLS policies
3. Ensure all environment variables are properly set
4. Check the database for any constraint violations

The collaboration feature is now fully integrated into your Project Planner application!
