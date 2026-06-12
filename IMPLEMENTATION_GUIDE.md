# PR Agent - Implementation Guide

## 🎉 Implementation Complete!

PR Agent has been fully implemented with Node.js. Here's what's been created:

## 📁 Project Structure

```
pr-agent/
├── .github/
│   └── workflows/
│       └── pr-reminder.yml          # GitHub Actions workflow
├── src/
│   ├── index.js                     # Main entry point
│   ├── github/
│   │   └── pr-fetcher.js           # GitHub API integration
│   ├── aggregator/
│   │   └── pr-aggregator.js        # PR aggregation logic
│   └── notifications/
│       ├── slack-notifier.js       # Slack integration
│       └── email-notifier.js       # Email integration
├── config.example.yml               # Example configuration
├── package.json                     # Dependencies
├── .gitignore                      # Git ignore rules
└── README.md                        # Documentation
```

## 🚀 Quick Start Guide

### Step 1: Create Repository on GitHub

1. Go to GitHub.com
2. Click "New repository"
3. Name: `pr-agent`
4. Visibility: Private (recommended)
5. Click "Create repository"

### Step 2: Clone and Setup Locally

```bash
# Clone the repository
git clone https://github.com/YOUR-ORG/pr-agent.git
cd pr-agent

# Copy all implementation files to this directory
# (The files are already in your current workspace)

# Install dependencies
npm install
```

### Step 3: Create Configuration File

```bash
# Copy example config
cp config.example.yml config.yml

# Edit config.yml with your settings
nano config.yml  # or use your preferred editor
```

**Update these sections in config.yml:**

```yaml
repositories:
  - owner: your-org-name        # Your GitHub organization
    repos:
      - repo-1                   # Repository names
      - repo-2
      - repo-3

reviewers:
  - github_username: john_doe   # GitHub username
    slack_id: U123456789        # Slack user ID
    email: john@company.com     # Email address
    name: John Doe              # Display name
```

### Step 4: Get Required Credentials

#### A. GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "PR Reminder System"
4. Expiration: 90 days
5. Select scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token** (starts with `ghp_`)

#### B. Slack Webhook URL

1. Go to: https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. App Name: "PR Reminder Bot"
4. Select your workspace
5. Click "Incoming Webhooks" → Toggle ON
6. Click "Add New Webhook to Workspace"
7. Select channel: `#pr-reviews`
8. **Copy the webhook URL**

#### C. Email Credentials (Gmail example)

1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Select app: "Mail"
4. Select device: "Other" → "PR Reminder System"
5. Click "Generate"
6. **Copy the 16-character password**

### Step 5: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `PAT_TOKEN` | `ghp_xxxx...` | GitHub Personal Access Token |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack webhook URL |
| `EMAIL_FROM` | `your-email@gmail.com` | Email address to send from |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | Email app password |

### Step 6: Push to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial implementation of PR reminder system"

# Push to GitHub
git push origin main
```

### Step 7: Test the Workflow

#### Manual Test

1. Go to your repository on GitHub
2. Click "Actions" tab
3. Select "PR Review Reminder" workflow
4. Click "Run workflow" → "Run workflow"
5. Wait for completion (~1-2 minutes)
6. Check logs and notifications

#### Check Logs

1. Click on the workflow run
2. Click "Send PR Review Reminders"
3. Expand each step to see detailed logs
4. Look for:
   - ✓ Configuration loaded
   - ✓ PRs fetched
   - ✓ Notifications sent

## 🔧 Configuration Options

### Notification Schedules

Edit `.github/workflows/pr-reminder.yml`:

```yaml
schedule:
  # Weekdays at 9 AM
  - cron: '0 9 * * 1-5'
  
  # Or multiple times per day
  - cron: '0 9,15 * * 1-5'  # 9 AM and 3 PM
```

**Common Schedules:**
- `0 9 * * 1-5` - Weekdays at 9 AM
- `0 9 * * 1` - Every Monday at 9 AM
- `0 9,15 * * 1-5` - Weekdays at 9 AM and 3 PM
- `0 */4 * * 1-5` - Every 4 hours on weekdays

### Filter Settings

Edit `config.yml`:

```yaml
filters:
  # Only remind about PRs older than X hours
  min_age_hours: 24  # Only PRs older than 1 day
  
  # Exclude draft PRs
  exclude_drafts: true
  
  # Exclude PRs with specific labels
  exclude_labels:
    - "work-in-progress"
    - "do-not-merge"
    - "blocked"
```

### Notification Settings

```yaml
notification:
  slack:
    enabled: true
    channel: "#pr-reviews"
    mention_users: true  # Use @mentions
  
  email:
    enabled: true
    smtp_server: smtp.gmail.com
    smtp_port: 587
    from_name: "PR Reminder Bot"
```

## 🧪 Testing Locally

### Prerequisites

```bash
# Install dependencies
npm install

# Set environment variables
export GITHUB_TOKEN="ghp_your_token_here"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export EMAIL_FROM="your-email@gmail.com"
export EMAIL_PASSWORD="your_app_password"
```

### Run Locally

```bash
# Run the full system
node src/index.js

# Expected output:
# ============================================================
# PR Reminder System - Starting
# ============================================================
# 
# ✓ Environment variables validated
# ✓ Configuration loaded successfully
# 
# Fetching PRs from GitHub...
#   Fetching PRs from org/repo-1...
#     ✓ Found 3 PRs (5 total, 2 filtered out)
# ✓ Found 3 open PRs across all repositories
# 
# Aggregating PRs by reviewer...
#   Reviewer breakdown:
#     John Doe: 2 PRs
#     Jane Smith: 1 PR
# ✓ Aggregated PRs for 2 reviewers
# 
# Sending Slack notifications...
# ✓ Slack notifications sent successfully
# 
# Sending Email notifications...
# ✓ Email notifications sent successfully
```

## 📊 Monitoring

### View Workflow Runs

1. Go to repository → Actions tab
2. See all workflow runs with status
3. Click on a run for detailed logs

### Workflow Status Indicators

- ✅ Green checkmark = Success
- ❌ Red X = Failed
- 🟡 Yellow dot = In progress
- ⚪ Gray circle = Queued

### Common Issues

#### Issue: "GITHUB_TOKEN not found"
**Solution:** Add `PAT_TOKEN` to repository secrets

#### Issue: "Slack webhook failed"
**Solution:** 
- Verify webhook URL is correct
- Check Slack app permissions
- Test webhook with curl:
  ```bash
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"Test"}' \
    YOUR_WEBHOOK_URL
  ```

#### Issue: "Email authentication failed"
**Solution:**
- Verify 2FA is enabled
- Use app-specific password (not main password)
- Check SMTP server and port

#### Issue: "No PRs found"
**Solution:**
- Verify repository names in config.yml
- Check PAT_TOKEN has `repo` scope
- Ensure PRs have requested reviewers assigned

## 🎨 Customization

### Custom Slack Message Format

Edit `src/notifications/slack-notifier.js`:

```javascript
function createSlackMessage(reviewerData, config) {
  // Customize message format here
  // Add emojis, change structure, etc.
}
```

### Custom Email Template

Edit `src/notifications/email-notifier.js`:

```javascript
function createEmailHTML(reviewerData, config) {
  // Customize HTML email template
  // Change colors, layout, etc.
}
```

### Add New Filters

Edit `src/github/pr-fetcher.js`:

```javascript
const filteredPRs = pulls.filter(pr => {
  // Add custom filter logic
  // Example: Filter by specific authors
  if (pr.user.login === 'bot-user') {
    return false;
  }
  return true;
});
```

## 📈 Usage Statistics

### Expected Performance

- **Setup time:** 15-30 minutes
- **Execution time:** 1-2 minutes per run
- **GitHub Actions usage:** ~60 minutes/month (daily runs)
- **Cost:** $0 (within free tier)

### Scaling

- **10 repositories:** ~1 minute execution
- **50 repositories:** ~3 minutes execution
- **100 repositories:** ~5 minutes execution

All within the free tier (2,000 minutes/month)!

## 🔄 Maintenance

### Regular Tasks

1. **Update dependencies** (monthly)
   ```bash
   npm update
   git commit -am "Update dependencies"
   git push
   ```

2. **Rotate PAT token** (every 90 days)
   - Generate new token
   - Update `PAT_TOKEN` secret
   - Delete old token

3. **Review configuration** (quarterly)
   - Update reviewer list
   - Adjust notification frequency
   - Review filter settings

### Troubleshooting

Enable debug logging by adding to workflow:

```yaml
- name: Run PR Reminder System
  env:
    DEBUG: true
  run: node src/index.js
```

## 🎯 Next Steps

1. ✅ Test with a few repositories first
2. ✅ Verify notifications are received
3. ✅ Adjust schedule based on team feedback
4. ✅ Add more repositories gradually
5. ✅ Monitor and optimize

## 📞 Support

- **GitHub Issues:** Report bugs or request features
- **Documentation:** See README.md and other guides
- **Logs:** Check GitHub Actions logs for debugging

---

**Congratulations! Your PR Reminder System is ready to use! 🎉**