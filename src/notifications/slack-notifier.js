/**
 * Slack Notifier
 * 
 * Sends PR review reminders to Slack using webhooks
 */

const { IncomingWebhook } = require('@slack/webhook');

/**
 * Format PR list for Slack message
 */
function formatPRsForSlack(prs, mentionUser = false, slackId = null) {
  if (prs.length === 0) {
    return 'No pending PRs';
  }
  
  return prs.map((pr, index) => {
    const emoji = pr.age.total_hours > 48 ? '🔴' : pr.age.total_hours > 24 ? '🟡' : '🟢';
    return `${emoji} *[${pr.repository.name}]* ${pr.title} (#${pr.number}) - _${pr.age.formatted} old_\n   ${pr.url}`;
  }).join('\n\n');
}

/**
 * Create Slack message for a reviewer
 */
function createSlackMessage(reviewerData, config) {
  const { reviewer, prs } = reviewerData;
  const mentionUsers = config.notification.slack.mention_users;
  
  // Create mention string
  let greeting = `*${reviewer.name || reviewer.github_username}*`;
  if (mentionUsers && reviewer.slack_id) {
    greeting = `<@${reviewer.slack_id}>`;
  }
  
  // Count PRs by age
  const urgent = prs.filter(pr => pr.age.total_hours > 48).length;
  const warning = prs.filter(pr => pr.age.total_hours > 24 && pr.age.total_hours <= 48).length;
  const recent = prs.filter(pr => pr.age.total_hours <= 24).length;
  
  // Build message
  let message = `${greeting} - You have *${prs.length}* PR${prs.length !== 1 ? 's' : ''} pending review`;
  
  if (urgent > 0 || warning > 0) {
    const parts = [];
    if (urgent > 0) parts.push(`${urgent} urgent (>2 days)`);
    if (warning > 0) parts.push(`${warning} aging (>1 day)`);
    message += ` (${parts.join(', ')})`;
  }
  
  message += ':\n\n';
  message += formatPRsForSlack(prs, mentionUsers, reviewer.slack_id);
  
  return message;
}

/**
 * Send Slack notification for all reviewers
 */
async function sendSlackNotifications(prsByReviewer, config) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('  ⚠ SLACK_WEBHOOK_URL not set, skipping Slack notifications');
    return false;
  }
  
  const webhook = new IncomingWebhook(webhookUrl);
  const reviewerCount = Object.keys(prsByReviewer).length;
  
  if (reviewerCount === 0) {
    console.log('  ℹ No reviewers with pending PRs, skipping Slack notification');
    return true;
  }
  
  try {
    // Calculate totals
    let totalPRs = 0;
    let oldestPR = null;
    let oldestAge = 0;
    
    for (const reviewerUsername in prsByReviewer) {
      const { prs } = prsByReviewer[reviewerUsername];
      totalPRs += prs.length;
      
      for (const pr of prs) {
        if (pr.age.total_hours > oldestAge) {
          oldestAge = pr.age.total_hours;
          oldestPR = pr;
        }
      }
    }
    
    // Create header message
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let headerText = `🔔 *PR Review Reminder* - ${today}\n\n`;
    headerText += `📊 *Summary:* ${totalPRs} PR${totalPRs !== 1 ? 's' : ''} pending across ${reviewerCount} reviewer${reviewerCount !== 1 ? 's' : ''}`;
    
    if (oldestPR) {
      headerText += `\n⏰ *Oldest PR:* ${oldestPR.age.formatted} old`;
    }
    
    headerText += '\n\n' + '─'.repeat(50) + '\n\n';
    
    // Build individual reviewer messages
    const reviewerMessages = [];
    for (const reviewerUsername in prsByReviewer) {
      const reviewerData = prsByReviewer[reviewerUsername];
      reviewerMessages.push(createSlackMessage(reviewerData, config));
    }
    
    // Combine all messages
    const fullMessage = headerText + reviewerMessages.join('\n\n' + '─'.repeat(50) + '\n\n');
    
    // Send to Slack
    await webhook.send({
      text: fullMessage,
      unfurl_links: false,
      unfurl_media: false
    });
    
    console.log(`  ✓ Sent Slack notification to ${config.notification.slack.channel}`);
    console.log(`    Notified ${reviewerCount} reviewer${reviewerCount !== 1 ? 's' : ''} about ${totalPRs} PR${totalPRs !== 1 ? 's' : ''}`);
    
    return true;
    
  } catch (error) {
    console.error('  ✗ Error sending Slack notification:', error.message);
    throw error;
  }
}

/**
 * Send test Slack notification
 */
async function sendTestSlackNotification() {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    throw new Error('SLACK_WEBHOOK_URL not set');
  }
  
  const webhook = new IncomingWebhook(webhookUrl);
  
  await webhook.send({
    text: '✅ PR Agent - Slack integration test successful!\n\nYour Slack notifications are configured correctly.'
  });
  
  console.log('✓ Test Slack notification sent successfully');
}

module.exports = {
  sendSlackNotifications,
  sendTestSlackNotification,
  createSlackMessage,
  formatPRsForSlack
};

