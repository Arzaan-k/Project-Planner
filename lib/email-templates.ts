export interface InvitationEmailData {
  projectTitle: string
  inviterName: string
  inviterEmail: string
  role: "collaborator" | "viewer"
  acceptUrl: string
  declineUrl: string
}

export function generateInvitationEmail(data: InvitationEmailData) {
  const { projectTitle, inviterName, inviterEmail, role, acceptUrl, declineUrl } = data
  
  const roleDescription = role === "collaborator" 
    ? "You'll be able to edit and manage the project, add tasks, milestones, and collaborate with the team."
    : "You'll be able to view the project details, progress, and timeline but won't be able to make changes."

  return {
    subject: `You've been invited to collaborate on "${projectTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Project Collaboration Invitation</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .project-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .inviter-info {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #667eea;
            }
            .role-badge {
              display: inline-block;
              background: ${role === "collaborator" ? "#3b82f6" : "#6b7280"};
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 500;
              text-transform: capitalize;
            }
            .buttons {
              margin: 30px 0;
              text-align: center;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              margin: 0 10px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 500;
              font-size: 16px;
            }
            .btn-accept {
              background: #22c55e;
              color: white;
            }
            .btn-decline {
              background: #ef4444;
              color: white;
            }
            .btn:hover {
              opacity: 0.9;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 You're Invited!</h1>
            <p>Join a project collaboration</p>
          </div>
          
          <div class="content">
            <div class="project-title">${projectTitle}</div>
            
            <div class="inviter-info">
              <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to collaborate on this project.</p>
              <p>Your role: <span class="role-badge">${role}</span></p>
              <p>${roleDescription}</p>
            </div>
            
            <div class="buttons">
              <a href="${acceptUrl}" class="btn btn-accept">Accept Invitation</a>
              <a href="${declineUrl}" class="btn btn-decline">Decline</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              If you don't have an account yet, you'll be prompted to create one when you accept the invitation.
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent from Project Planner</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `,
    text: `
You've been invited to collaborate on "${projectTitle}"

${inviterName} (${inviterEmail}) has invited you to collaborate on this project.

Your role: ${role}
${roleDescription}

Accept invitation: ${acceptUrl}
Decline invitation: ${declineUrl}

If you don't have an account yet, you'll be prompted to create one when you accept the invitation.

This invitation was sent from Project Planner.
If you didn't expect this invitation, you can safely ignore this email.
    `.trim()
  }
}

// Example usage with different email services:

export async function sendEmailWithResend(data: InvitationEmailData, apiKey: string) {
  const emailContent = generateInvitationEmail(data)
  
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Project Planner <noreply@yourdomain.com>',
      to: [data.inviterEmail], // This should be the invitee's email
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    }),
  })
  
  return response.json()
}

export async function sendEmailWithSendGrid(data: InvitationEmailData, apiKey: string) {
  const emailContent = generateInvitationEmail(data)
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: data.inviterEmail }], // This should be the invitee's email
        subject: emailContent.subject,
      }],
      from: { email: 'noreply@yourdomain.com', name: 'Project Planner' },
      content: [
        { type: 'text/html', value: emailContent.html },
        { type: 'text/plain', value: emailContent.text },
      ],
    }),
  })
  
  return response.json()
}
