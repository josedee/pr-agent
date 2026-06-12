/**
 * PR Agent - Main Entry Point
 * 
 * This script:
 * 1. Loads configuration
 * 2. Fetches PRs from GitHub
 * 3. Aggregates PRs by reviewer
 * 4. Sends notifications via Slack and Email
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { fetchPRs } = require('./github/pr-fetcher');
const { aggregatePRsByReviewer } = require('./aggregator/pr-aggregator');
const { sendSlackNotifications } = require('./notifications/slack-notifier');
const { sendEmailNotifications } = require('./notifications/email-notifier');
const { generateFromPRAgent } = require('../dashboard/generate-dashboard-data');

/**
 * Load configuration from config.yml
 */
function loadConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'config.yml');
    const fileContents = fs.readFileSync(configPath, 'utf8');
    const config = yaml.load(fileContents);
    
    console.log('✓ Configuration loaded successfully');
    return config;
  } catch (error) {
    console.error('✗ Error loading configuration:', error.message);
    console.error('Make sure config.yml exists (copy from config.example.yml)');
    process.exit(1);
  }
}

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  const token = process.env.GITHUB_TOKEN || process.env.PAT_TOKEN;
  
  if (!token) {
    console.log('⚠ No GitHub token found');
    console.log('  Using unauthenticated access (60 requests/hour limit)');
    console.log('  Only works for public repositories');
    console.log('  For private repos or higher rate limits, set GITHUB_TOKEN');
  } else {
    console.log('✓ GitHub token found');
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('PR Agent - Starting');
  console.log('='.repeat(60));
  console.log();
  
  try {
    // Step 1: Validate environment
    validateEnvironment();
    
    // Step 2: Load configuration
    const config = loadConfig();
    console.log();
    
    // Step 3: Fetch PRs from all repositories
    console.log('Fetching PRs from GitHub...');
    const allPRs = await fetchPRs(config);
    console.log(`✓ Found ${allPRs.length} open PRs across all repositories`);
    console.log();
    
    // Step 4: Aggregate PRs by reviewer
    console.log('Aggregating PRs by reviewer...');
    const prsByReviewer = aggregatePRsByReviewer(allPRs, config);
    const reviewerCount = Object.keys(prsByReviewer).length;
    console.log(`✓ Aggregated PRs for ${reviewerCount} reviewers`);
    console.log();
    
    // Step 5: Generate dashboard data
    console.log('Generating dashboard data...');
    try {
      generateFromPRAgent(allPRs, prsByReviewer);
      console.log('✓ Dashboard data generated successfully');
    } catch (error) {
      console.error('⚠ Error generating dashboard data:', error.message);
    }
    console.log();
    
    // Step 6: Send notifications
    let slackSuccess = false;
    let emailSuccess = false;
    
    // Send Slack notifications
    if (config.notification.slack.enabled) {
      console.log('Sending Slack notifications...');
      try {
        slackSuccess = await sendSlackNotifications(prsByReviewer, config);
        if (slackSuccess) {
          console.log('✓ Slack notifications sent successfully');
        } else {
          console.log('⚠ Slack notifications partially sent or skipped');
        }
      } catch (error) {
        console.error('✗ Error sending Slack notifications:', error.message);
      }
      console.log();
    } else {
      console.log('⊘ Slack notifications disabled in config');
      console.log();
    }
    
    // Send Email notifications
    if (config.notification.email.enabled) {
      console.log('Sending Email notifications...');
      try {
        emailSuccess = await sendEmailNotifications(prsByReviewer, config);
        if (emailSuccess) {
          console.log('✓ Email notifications sent successfully');
        } else {
          console.log('⚠ Email notifications partially sent or skipped');
        }
      } catch (error) {
        console.error('✗ Error sending Email notifications:', error.message);
      }
      console.log();
    } else {
      console.log('⊘ Email notifications disabled in config');
      console.log();
    }
    
    // Summary
    console.log('='.repeat(60));
    console.log('Summary:');
    console.log(`  Total PRs: ${allPRs.length}`);
    console.log(`  Reviewers: ${reviewerCount}`);
    console.log(`  Dashboard: ✓`);
    console.log(`  Slack: ${config.notification.slack.enabled ? (slackSuccess ? '✓' : '✗') : '⊘'}`);
    console.log(`  Email: ${config.notification.email.enabled ? (emailSuccess ? '✓' : '✗') : '⊘'}`);
    console.log('='.repeat(60));
    console.log();
    console.log('✓ PR Agent completed successfully');
    
  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('✗ Fatal Error:', error.message);
    console.error('='.repeat(60));
    console.error();
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { main };

