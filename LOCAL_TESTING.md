# Local Testing Guide

## 🧪 Testing PR Agent Locally

You can test PR Agent on your local machine **without any credentials** for public repositories!

## What Happens in Dry Run Mode?

**Dry Run Mode:**
- ✅ Fetches real PRs from GitHub
- ✅ Processes and aggregates data
- ✅ Shows what would be sent
- ❌ Does NOT send Slack notifications
- ❌ Does NOT send Email notifications

**Perfect for:**
- Testing your configuration
- Verifying GitHub token works
- Checking which PRs would be found
- Seeing how data is aggregated
- Debugging without spamming your team

## Quick Start - Test Without Notifications

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Create Configuration

```bash
# Copy example config
cp config.example.yml config.yml

# Edit with your repositories
nano config.yml
```

**Minimal config.yml for testing:**
```yaml
repositories:
  - owner: your-github-org
    repos:
      - your-repo-name

notification:
  slack:
    enabled: false  # Disable for local testing
  email:
    enabled: false  # Disable for local testing

reviewers:
  - github_username: your-username
    name: Your Name

filters:
  exclude_drafts: true
```

### Step 3: Run Without Any Token (Public Repos Only)

```bash
# No token needed for public repositories!
node src/index.js
```

**Limitations without token:**
- ⚠️ Rate limit: 60 requests/hour (vs 5,000 with token)
- ⚠️ Only works for public repositories
- ✅ Perfect for testing!

### Step 3b: (Optional) Set GitHub Token

**For private repos or higher rate limits:**

```bash
export GITHUB_TOKEN="your-token-here"
```

**How to get a token:**
1. Go to: https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scope: `public_repo` (for public) or `repo` (for private)
4. Copy the token

### Step 4: Run the Application

```bash
# Run without any credentials (public repos only)
node src/index.js

# Or with dry run mode
export DRY_RUN=true
node src/index.js
```

## Example Output (Dry Run)

```
============================================================
PR Agent - Starting
============================================================

⚠ No GitHub token found
  Using unauthenticated access (60 requests/hour limit)
  Only works for public repositories
  For private repos or higher rate limits, set GITHUB_TOKEN
✓ Configuration loaded successfully

Fetching PRs from GitHub...
  Fetching PRs from your-org/repo-1...
    ✓ Found 3 PRs (5 total, 2 filtered out)
  Fetching PRs from your-org/repo-2...
    ✓ Found 2 PRs (2 total, 0 filtered out)
✓ Found 5 open PRs across all repositories

Aggregating PRs by reviewer...
  Reviewer breakdown:
    John Doe: 3 PRs
    Jane Smith: 2 PRs
✓ Aggregated PRs for 2 reviewers

🧪 Slack notifications skipped (dry run mode)
   Would notify 2 reviewer(s)

🧪 Email notifications skipped (dry run mode)
   Would email 2 reviewer(s)

============================================================
Summary:
  Total PRs: 5
  Reviewers: 2
  Mode: 🧪 DRY RUN (no notifications sent)
============================================================

✓ PR Agent completed successfully
```

## Testing Scenarios

### Scenario 1: Test Without Any Credentials (Public Repos)

```bash
# Absolutely minimal - no credentials needed!
# Just create config.yml with public repositories

# Disable notifications in config.yml
# notification:
#   slack:
#     enabled: false
#   email:
#     enabled: false

node src/index.js
```

**What you'll see:**
- PRs fetched from public repositories
- Warning about rate limits
- Reviewers identified
- No notifications sent

**Perfect for:**
- Quick testing
- Learning how it works
- Testing with public repos like React, Vue, etc.

### Scenario 2: Test with Token (Private Repos or Higher Limits)

```bash
# Set token for private repos or to avoid rate limits
export GITHUB_TOKEN="your-token"
node src/index.js
```

**config.yml:**
```yaml
notification:
  slack:
    enabled: false  # Disabled
  email:
    enabled: false  # Disabled
```

**What you'll see:**
- PRs fetched and processed
- Message: "Slack notifications disabled in config"
- Message: "Email notifications disabled in config"

### Scenario 3: Test Everything (With Notifications)

```bash
# Set all credentials
export GITHUB_TOKEN="your-token"
export SLACK_WEBHOOK_URL="your-webhook"
export EMAIL_FROM="your-email"
export EMAIL_PASSWORD="your-password"

# Enable notifications in config.yml
node src/index.js
```

**What you'll see:**
- PRs fetched and processed
- Actual Slack notification sent
- Actual emails sent

## Debugging Tips

### Check Configuration

```bash
# Validate YAML syntax
node -e "const yaml = require('js-yaml'); const fs = require('fs'); console.log(JSON.stringify(yaml.load(fs.readFileSync('config.yml', 'utf8')), null, 2))"
```

### Test GitHub Token

```bash
# Test if token works
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

### Verbose Output

Add console.log statements to see more details:

```javascript
// In src/index.js, after fetching PRs
console.log('PRs found:', JSON.stringify(allPRs, null, 2));
```

## Common Issues

### Issue: "GITHUB_TOKEN not found"
**Solution:**
```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

### Issue: "No PRs found"
**Possible causes:**
- Repository names incorrect in config.yml
- No open PRs with requested reviewers
- Token doesn't have access to repositories

**Debug:**
```bash
# Check if repos exist
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO
```

### Issue: "Configuration file not found"
**Solution:**
```bash
# Make sure config.yml exists
cp config.example.yml config.yml
```

## Environment Variables Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `GITHUB_TOKEN` | Yes | GitHub API access | `ghp_xxxx...` |
| `DRY_RUN` | No | Skip notifications | `true` or `false` |
| `SLACK_WEBHOOK_URL` | No* | Slack notifications | `https://hooks.slack.com/...` |
| `EMAIL_FROM` | No* | Email sender | `bot@company.com` |
| `EMAIL_PASSWORD` | No* | SMTP password | `xxxx xxxx xxxx xxxx` |

*Required only if notifications are enabled in config.yml

## Quick Test Commands

```bash
# Test 1: Dry run (safest)
export GITHUB_TOKEN="your-token"
export DRY_RUN=true
node src/index.js

# Test 2: With notifications disabled in config
export GITHUB_TOKEN="your-token"
node src/index.js

# Test 3: Full test with notifications
export GITHUB_TOKEN="your-token"
export SLACK_WEBHOOK_URL="your-webhook"
export EMAIL_FROM="your-email"
export EMAIL_PASSWORD="your-password"
node src/index.js
```

## What Gets Tested?

### ✅ Always Tested (Even in Dry Run)
- GitHub API connection
- Repository access
- PR fetching logic
- Reviewer identification
- Data aggregation
- PR age calculation
- Filter logic

### ❌ Not Tested in Dry Run
- Slack webhook delivery
- Email SMTP connection
- Actual notification sending

## Recommended Testing Flow

1. **Start with Dry Run**
   ```bash
   export DRY_RUN=true
   node src/index.js
   ```

2. **Test with One Repo**
   - Add just one repository to config.yml
   - Verify it works

3. **Add More Repos**
   - Gradually add more repositories
   - Test after each addition

4. **Test Slack Only**
   - Enable Slack, disable Email
   - Send test notification

5. **Test Email Only**
   - Enable Email, disable Slack
   - Send test email

6. **Full Test**
   - Enable both
   - Verify everything works

## Summary

**To test locally without notifications:**
```bash
# 1. Install
npm install

# 2. Configure
cp config.example.yml config.yml
# Edit config.yml

# 3. Set token
export GITHUB_TOKEN="your-token"

# 4. Disable notifications in config.yml OR use dry run
export DRY_RUN=true

# 5. Run
node src/index.js
```

**You'll see:**
- Which PRs were found
- Who needs to review them
- How they're grouped
- NO actual notifications sent

Perfect for testing! 🧪