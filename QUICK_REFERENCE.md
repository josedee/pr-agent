# PR Agent - Quick Reference

## 🚀 Common Commands

### Local Development
```bash
# Install dependencies
npm install

# Run locally (requires env vars)
node src/index.js

# Test configuration
node -e "const yaml = require('js-yaml'); const fs = require('fs'); console.log(yaml.load(fs.readFileSync('config.yml', 'utf8')))"
```

### Environment Variables
```bash
# Set for local testing
export GITHUB_TOKEN="ghp_your_token"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export EMAIL_FROM="your-email@gmail.com"
export EMAIL_PASSWORD="your_app_password"
```

## 🔧 Configuration Quick Edit

### Add New Repository
```yaml
repositories:
  - owner: your-org
    repos:
      - existing-repo
      - new-repo-name  # Add here
```

### Add New Reviewer
```yaml
reviewers:
  - github_username: new_user
    slack_id: U123456789
    email: new.user@company.com
    name: New User
```

### Change Schedule
Edit `.github/workflows/pr-reminder.yml`:
```yaml
schedule:
  - cron: '0 9 * * 1-5'  # Change time here
```

## 📅 Cron Schedule Examples

| Schedule | Cron Expression | Description |
|----------|----------------|-------------|
| Weekdays 9 AM | `0 9 * * 1-5` | Monday-Friday at 9 AM |
| Daily 9 AM | `0 9 * * *` | Every day at 9 AM |
| Monday 9 AM | `0 9 * * 1` | Every Monday at 9 AM |
| Twice daily | `0 9,15 * * 1-5` | 9 AM and 3 PM weekdays |
| Every 4 hours | `0 */4 * * *` | Every 4 hours |

**Note:** Times are in UTC. Adjust for your timezone.

## 🔐 GitHub Secrets

### Required Secrets
| Name | Example | Where to Get |
|------|---------|--------------|
| `PAT_TOKEN` | `ghp_xxxx...` | GitHub Settings → Developer settings → Tokens |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack API → Incoming Webhooks |
| `EMAIL_FROM` | `bot@company.com` | Your email address |
| `EMAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | Email provider → App passwords |

### Add Secret
1. Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Enter name and value
4. Click "Add secret"

## 🧪 Testing

### Manual Workflow Trigger
1. Go to Actions tab
2. Select "PR Review Reminder"
3. Click "Run workflow"
4. Select branch (usually `main`)
5. Click "Run workflow"

### Test Slack Webhook
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test message"}' \
  YOUR_SLACK_WEBHOOK_URL
```

### Test Email SMTP
```bash
# Using Node.js
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'YOUR_EMAIL', pass: 'YOUR_APP_PASSWORD' }
});
transport.verify().then(() => console.log('✓ SMTP OK')).catch(console.error);
"
```

## 🐛 Troubleshooting

### Check Workflow Logs
1. Actions tab → Select workflow run
2. Click "Send PR Review Reminders"
3. Expand steps to see logs

### Common Errors

| Error | Solution |
|-------|----------|
| "GITHUB_TOKEN not found" | Add `PAT_TOKEN` to secrets |
| "Slack webhook failed" | Verify webhook URL in secrets |
| "Email auth failed" | Use app password, not main password |
| "No PRs found" | Check repo names in config.yml |
| "Permission denied" | Ensure PAT has `repo` scope |

### Enable Debug Mode
Add to workflow file:
```yaml
env:
  DEBUG: true
```

## 📊 Monitoring

### View Statistics
Check workflow logs for:
- Total PRs found
- Number of reviewers
- Notification success/failure
- Execution time

### Workflow Status
- ✅ Green = Success
- ❌ Red = Failed
- 🟡 Yellow = Running
- ⚪ Gray = Queued

## 🔄 Maintenance Tasks

### Weekly
- [ ] Check workflow runs for errors
- [ ] Verify notifications are being received

### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review and update reviewer list
- [ ] Check GitHub Actions usage

### Quarterly
- [ ] Rotate PAT token (if expiring)
- [ ] Review notification frequency
- [ ] Update documentation

## 📞 Quick Links

- **GitHub Actions:** `https://github.com/YOUR-ORG/pr-reminder-system/actions`
- **Secrets:** `https://github.com/YOUR-ORG/pr-reminder-system/settings/secrets/actions`
- **Workflow File:** `.github/workflows/pr-reminder.yml`
- **Config File:** `config.yml`

## 💡 Tips

1. **Start Small:** Test with 1-2 repos first
2. **Adjust Schedule:** Based on team feedback
3. **Monitor Usage:** Check GitHub Actions minutes
4. **Keep Updated:** Update dependencies monthly
5. **Document Changes:** Update config comments

## 🎯 Quick Fixes

### Disable Notifications Temporarily
Edit `config.yml`:
```yaml
notification:
  slack:
    enabled: false  # Disable Slack
  email:
    enabled: false  # Disable Email
```

### Change Notification Channel
Edit `config.yml`:
```yaml
notification:
  slack:
    channel: "#new-channel"  # Change channel
```

### Exclude Specific PRs
Edit `config.yml`:
```yaml
filters:
  exclude_labels:
    - "work-in-progress"
    - "blocked"
    - "your-custom-label"  # Add label
```

## 📱 Slack User ID

Find Slack user ID:
1. Click user's profile in Slack
2. Click "More" → "Copy member ID"
3. Format: `U123456789`

Or use Slack API:
```bash
curl -H "Authorization: Bearer YOUR_SLACK_TOKEN" \
  "https://slack.com/api/users.list"
```

## 🔗 Useful Resources

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [Slack Webhooks](https://api.slack.com/messaging/webhooks)
- [Nodemailer Docs](https://nodemailer.com/)
- [Cron Expression Generator](https://crontab.guru/)

---

**Need more help?** See [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for detailed instructions.