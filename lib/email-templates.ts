export function generateInvitationEmail(
  projectTitle: string,
  inviterName: string,
  role: string,
  projectId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const invitationUrl = `${baseUrl}/projects/${projectId}`
  
  return {
    subject: `You've been invited to collaborate on "${projectTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Project Collaboration Invitation</h2>
        <p>Hello!</p>
        <p><strong>${inviterName}</strong> has invited you to collaborate on the project <strong>"${projectTitle}"</strong> as a <strong>${role}</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">What you can do:</h3>
          <ul>
            <li>View project details and progress</li>
            ${role === 'collaborator' ? '<li>Edit tasks and milestones</li><li>Manage project timeline</li>' : ''}
            <li>Track project analytics</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Project
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          If you don't have an account yet, you'll need to sign up first at ${baseUrl}/auth/sign-up
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          This invitation was sent from the Project Planner application.
        </p>
      </div>
    `,
    text: `
Project Collaboration Invitation

Hello!

${inviterName} has invited you to collaborate on the project "${projectTitle}" as a ${role}.

What you can do:
- View project details and progress
${role === 'collaborator' ? '- Edit tasks and milestones\n- Manage project timeline' : ''}
- Track project analytics

View the project: ${invitationUrl}

If you don't have an account yet, you'll need to sign up first at ${baseUrl}/auth/sign-up

This invitation was sent from the Project Planner application.
    `
  }
}

export function generateInvitationNotification(
  projectTitle: string,
  inviterName: string,
  role: string
) {
  return {
    title: `New Collaboration Invitation`,
    message: `You've been invited to collaborate on "${projectTitle}" as a ${role} by ${inviterName}`,
    type: 'invitation' as const
  }
}