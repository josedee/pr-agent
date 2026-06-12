/**
 * Email Notifier
 * 
 * Sends PR review reminders via email
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
function createEmailTransporter(config) {
  const emailConfig = config.notification.email;
  
  const transporter = nodemailer.createTransport({
    host: emailConfig.smtp_server,
    port: emailConfig.smtp_port,
    secure: emailConfig.smtp_port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  return transporter;
}

/**
 * Format PRs as HTML table
 */
function formatPRsAsHTML(prs) {
  if (prs.length === 0) {
    return '<p>No pending PRs</p>';
  }
  
  let html = `
    <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Repository</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">PR</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Title</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Author</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Age</th>
          <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">Priority</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  prs.forEach((pr, index) => {
    const rowColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
    const priorityColor = pr.age.total_hours > 48 ? '#ff4444' : 
                          pr.age.total_hours > 24 ? '#ffaa00' : '#44ff44';
    const priorityText = pr.age.total_hours > 48 ? 'Urgent' : 
                         pr.age.total_hours > 24 ? 'High' : 'Normal';
    
    html += `
      <tr style="background-color: ${rowColor};">
        <td style="border: 1px solid #ddd; padding: 12px;">${pr.repository.name}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">
          <a href="${pr.url}" style="color: #0366d6; text-decoration: none;">#${pr.number}</a>
        </td>
        <td style="border: 1px solid #ddd; padding: 12px;">${pr.title}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${pr.author}</td>
        <td style="border: 1px solid #ddd; padding: 12px;">${pr.age.formatted}</td>
        <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">
          <span style="background-color: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${priorityText}
          </span>
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  return html;
}

/**
 * Create HTML email body
 */
function createEmailHTML(reviewerData, config) {
  const { reviewer, prs } = reviewerData;
  
  // Count PRs by priority
  const urgent = prs.filter(pr => pr.age.total_hours > 48).length;
  const high = prs.filter(pr => pr.age.total_hours > 24 && pr.age.total_hours <= 48).length;
  const normal = prs.filter(pr => pr.age.total_hours <= 24).length;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PR Review Reminder</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0366d6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🔔 PR Review Reminder</h1>
        <p style="margin: 10px 0 0 0; font-size: 14px;">
          ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      
      <div style="background-color: #f6f8fa; padding: 20px; border-left: 4px solid #0366d6;">
        <h2 style="margin-top: 0;">Hi ${reviewer.name || reviewer.github_username}! 👋</h2>
        <p style="font-size: 16px; margin: 10px 0;">
          You have <strong>${prs.length}</strong> pull request${prs.length !== 1 ? 's' : ''} waiting for your review.
        </p>
        
        ${urgent > 0 || high > 0 ? `
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; border-radius: 4px;">
          <strong>⚠️ Attention needed:</strong>
          ${urgent > 0 ? `<span style="color: #d32f2f;">${urgent} urgent PR${urgent !== 1 ? 's' : ''} (>2 days old)</span>` : ''}
          ${urgent > 0 && high > 0 ? ', ' : ''}
          ${high > 0 ? `<span style="color: #f57c00;">${high} high priority PR${high !== 1 ? 's' : ''} (>1 day old)</span>` : ''}
        </div>
        ` : ''}
      </div>
      
      <div style="padding: 20px; background-color: white;">
        <h3 style="color: #0366d6; border-bottom: 2px solid #0366d6; padding-bottom: 10px;">
          Pending Reviews
        </h3>
        
        ${formatPRsAsHTML(prs)}
        
        <div style="margin-top: 30px; padding: 20px; background-color: #f6f8fa; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #666;">
            💡 <strong>Tip:</strong> Click on the PR number to open it directly in GitHub
          </p>
        </div>
      </div>
      
      <div style="background-color: #f6f8fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
        <p style="margin: 0;">
          This is an automated notification from PR Agent<br>
          Questions? Contact your team administrator
        </p>
      </div>
    </body>
    </html>
  `;
  
  return html;
}

/**
 * Create plain text email body (fallback)
 */
function createEmailText(reviewerData) {
  const { reviewer, prs } = reviewerData;
  
  let text = `PR Review Reminder\n`;
  text += `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
  text += `Hi ${reviewer.name || reviewer.github_username}!\n\n`;
  text += `You have ${prs.length} pull request${prs.length !== 1 ? 's' : ''} waiting for your review:\n\n`;
  
  prs.forEach((pr, index) => {
    const priority = pr.age.total_hours > 48 ? '[URGENT]' : 
                     pr.age.total_hours > 24 ? '[HIGH]' : '[NORMAL]';
    text += `${index + 1}. ${priority} [${pr.repository.name}] ${pr.title} (#${pr.number})\n`;
    text += `   Author: ${pr.author} | Age: ${pr.age.formatted}\n`;
    text += `   ${pr.url}\n\n`;
  });
  
  text += `---\n`;
  text += `This is an automated notification from PR Agent\n`;
  
  return text;
}

/**
 * Send email notifications to all reviewers
 */
async function sendEmailNotifications(prsByReviewer, config) {
  const fromEmail = process.env.EMAIL_FROM;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!fromEmail || !emailPassword) {
    console.log('  ⚠ EMAIL_FROM or EMAIL_PASSWORD not set, skipping email notifications');
    return false;
  }
  
  const reviewerCount = Object.keys(prsByReviewer).length;
  
  if (reviewerCount === 0) {
    console.log('  ℹ No reviewers with pending PRs, skipping email notifications');
    return true;
  }
  
  try {
    const transporter = createEmailTransporter(config);
    
    // Verify transporter configuration
    await transporter.verify();
    console.log('  ✓ Email server connection verified');
    
    let sentCount = 0;
    let failedCount = 0;
    
    // Send email to each reviewer
    for (const reviewerUsername in prsByReviewer) {
      const reviewerData = prsByReviewer[reviewerUsername];
      const { reviewer, prs } = reviewerData;
      
      if (!reviewer.email) {
        console.log(`  ⚠ No email configured for ${reviewer.name || reviewerUsername}, skipping`);
        failedCount++;
        continue;
      }
      
      try {
        const subject = `PR Review Reminder - ${prs.length} PR${prs.length !== 1 ? 's' : ''} Pending`;
        const html = createEmailHTML(reviewerData, config);
        const text = createEmailText(reviewerData);
        
        await transporter.sendMail({
          from: `"${config.notification.email.from_name}" <${fromEmail}>`,
          to: reviewer.email,
          subject: subject,
          text: text,
          html: html
        });
        
        console.log(`  ✓ Sent email to ${reviewer.name || reviewerUsername} (${reviewer.email})`);
        sentCount++;
        
      } catch (error) {
        console.error(`  ✗ Failed to send email to ${reviewer.email}:`, error.message);
        failedCount++;
      }
    }
    
    console.log(`  📧 Email summary: ${sentCount} sent, ${failedCount} failed`);
    
    return sentCount > 0;
    
  } catch (error) {
    console.error('  ✗ Error with email configuration:', error.message);
    throw error;
  }
}

/**
 * Send test email
 */
async function sendTestEmail(config, testEmail) {
  const fromEmail = process.env.EMAIL_FROM;
  const emailPassword = process.env.EMAIL_PASSWORD;
  
  if (!fromEmail || !emailPassword) {
    throw new Error('EMAIL_FROM or EMAIL_PASSWORD not set');
  }
  
  const transporter = createEmailTransporter(config);
  await transporter.verify();
  
  await transporter.sendMail({
    from: `"${config.notification.email.from_name}" <${fromEmail}>`,
    to: testEmail,
    subject: 'PR Agent - Test Email',
    text: 'This is a test email from PR Agent. Your email configuration is working correctly!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #0366d6;">✅ Test Successful!</h2>
        <p>This is a test email from PR Agent.</p>
        <p>Your email configuration is working correctly!</p>
      </div>
    `
  });
  
  console.log(`✓ Test email sent to ${testEmail}`);
}

module.exports = {
  sendEmailNotifications,
  sendTestEmail,
  createEmailHTML,
  createEmailText
};

