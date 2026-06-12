# GitHub Secrets - Security Guide

## What Are GitHub Secrets?

GitHub Secrets are **encrypted environment variables** that store sensitive information like passwords, API keys, and tokens. They are **NOT stored as plain text** and are designed specifically for secure credential management.

## 🔒 Security Features

### How GitHub Secrets Work

```mermaid
graph LR
    A[You Add Secret] -->|Encrypted| B[GitHub's Encrypted Storage]
    B -->|Decrypted Only During Workflow| C[GitHub Actions Runner]
    C -->|Used in Script| D[Your Code]
    D -->|Never Exposed| E[Logs are Masked]
    
    style B fill:#90EE90
    style C fill:#FFE4B5
    style E fill:#90EE90
```

### Security Guarantees

✅ **Encrypted at Rest**
- Secrets are encrypted using AES-256-GCM
- Stored in GitHub's secure infrastructure
- Never visible in repository files

✅ **Encrypted in Transit**
- Transmitted over HTTPS/TLS
- Decrypted only in the runner's memory
- Never written to disk in plain text

✅ **Masked in Logs**
- Secret values are automatically hidden in logs
- Shows `***` instead of actual value
- Prevents accidental exposure

✅ **Access Control**
- Only repository admins can add/edit secrets
- Secrets are scoped to specific repositories
- Can't be read by other repositories

✅ **Audit Trail**
- All secret access is logged
- Can track when secrets are used
- Helps detect unauthorized access

### What You See vs. What's Stored

**In Your Repository Settings:**
```
Secret Name: SLACK_WEBHOOK_URL
Value: ******************* (hidden)
Last updated: 2 days ago
```

**In Your Workflow File (visible):**
```yaml
env:
  SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**In Workflow Logs (masked):**
```
Sending notification to: ***
Response: Success
```

**What's Actually Stored (encrypted):**
```
[AES-256-GCM encrypted binary data]
```

## 📋 Required Secrets Explained

### 1. GITHUB_TOKEN (or PAT_TOKEN)

**What it's for:**
- Authenticates with GitHub API
- Allows reading PRs from repositories
- Required to access repository data

**Two Options:**

#### Option A: GITHUB_TOKEN (Automatic, Limited)
- **Automatically provided** by GitHub Actions
- No setup needed
- Limited to repositories in the same organization
- Expires after workflow completes
- **Recommended for:** Single organization setups

**How to use:**
```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

#### Option B: PAT_TOKEN (Manual, Full Access)
- **You create it** in GitHub settings
- Can access multiple organizations
- Customizable permissions
- Longer expiration (up to 1 year)
- **Recommended for:** Multi-organization setups

**How to get PAT_TOKEN:**

1. **Go to GitHub Settings**
   - Click your profile picture → Settings
   - Scroll to "Developer settings" (bottom left)
   - Click "Personal access tokens" → "Tokens (classic)"

2. **Generate New Token**
   - Click "Generate new token (classic)"
   - Name: "PR Reminder System"
   - Expiration: 90 days (or custom)
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
       - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`
     - OR just ✅ `public_repo` (if only monitoring public repos)

3. **Copy the Token**
   - Click "Generate token"
   - **IMPORTANT:** Copy the token immediately
   - You won't be able to see it again!
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

4. **Add to Repository Secrets**
   - Go to your `pr-reminder-system` repository
   - Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PAT_TOKEN`
   - Value: Paste the token
   - Click "Add secret"

**Security Notes:**
- ✅ Token is encrypted in GitHub's storage
- ✅ Never commit token to code
- ✅ Rotate token every 90 days
- ✅ Use minimal required permissions
- ❌ Don't share token with others
- ❌ Don't store in plain text files

### 2. SLACK_WEBHOOK_URL

**What it's for:**
- Sends messages to Slack channel
- Posts PR reminders
- No authentication needed (webhook is the auth)

**How to get it:**

1. **Go to Slack API**
   - Visit: https://api.slack.com/apps
   - Click "Create New App"

2. **Create App**
   - Choose "From scratch"
   - App Name: "PR Reminder Bot"
   - Workspace: Select your workspace
   - Click "Create App"

3. **Enable Incoming Webhooks**
   - In app settings, click "Incoming Webhooks"
   - Toggle "Activate Incoming Webhooks" to ON
   - Click "Add New Webhook to Workspace"

4. **Select Channel**
   - Choose channel: `#pr-reviews` (or create new)
   - Click "Allow"

5. **Copy Webhook URL**
   - You'll see: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX`
   - Click "Copy" button
   - This is your webhook URL

6. **Add to Repository Secrets**
   - Go to repository Settings → Secrets
   - Name: `SLACK_WEBHOOK_URL`
   - Value: Paste the webhook URL
   - Click "Add secret"

**Test the webhook:**
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Hello from PR Reminder!"}' \
  YOUR_WEBHOOK_URL
```

**Security Notes:**
- ✅ Webhook URL is like a password
- ✅ Anyone with URL can post to your channel
- ✅ Keep it secret
- ✅ Can regenerate if compromised
- ❌ Don't commit to code
- ❌ Don't share publicly

### 3. EMAIL_PASSWORD

**What it's for:**
- Authenticates with SMTP server
- Sends email notifications
- Required for email delivery

**How to get it (Gmail example):**

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"
   - Required for app passwords

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)"
   - Name: "PR Reminder System"
   - Click "Generate"

3. **Copy Password**
   - You'll see: `xxxx xxxx xxxx xxxx` (16 characters)
   - Copy this password
   - Remove spaces: `xxxxxxxxxxxxxxxx`

4. **Add to Repository Secrets**
   - Name: `EMAIL_PASSWORD`
   - Value: Paste the app password
   - Click "Add secret"

**For Other Email Providers:**

**Microsoft 365/Outlook:**
- Go to: https://account.microsoft.com/security
- Enable 2FA
- Generate app password
- SMTP: `smtp.office365.com:587`

**SendGrid (Recommended for production):**
- Sign up: https://sendgrid.com
- Create API key
- Use API key as password
- SMTP: `smtp.sendgrid.net:587`

**AWS SES:**
- Create SMTP credentials in AWS Console
- Use SMTP username and password
- SMTP: `email-smtp.us-east-1.amazonaws.com:587`

**Security Notes:**
- ✅ Use app-specific passwords (not main password)
- ✅ App passwords can be revoked
- ✅ Each app gets unique password
- ✅ Main account password stays secure
- ❌ Never use your main email password
- ❌ Don't share app passwords

## 🔐 Adding Secrets to GitHub

### Step-by-Step Process

1. **Navigate to Repository**
   ```
   GitHub.com → Your Repository → Settings
   ```

2. **Go to Secrets Section**
   ```
   Settings → Secrets and variables → Actions
   ```

3. **Add New Secret**
   ```
   Click "New repository secret"
   ```

4. **Enter Details**
   ```
   Name: SECRET_NAME (uppercase, underscores)
   Value: [paste your secret value]
   ```

5. **Save**
   ```
   Click "Add secret"
   ```

### Visual Guide

```
Repository Settings
├── General
├── Collaborators
├── Secrets and variables
│   ├── Actions ← Click here
│   │   ├── Secrets
│   │   │   ├── PAT_TOKEN
│   │   │   ├── SLACK_WEBHOOK_URL
│   │   │   └── EMAIL_PASSWORD
│   │   └── Variables
│   └── Codespaces
└── ...
```

## 🛡️ Security Best Practices

### DO ✅

1. **Use GitHub Secrets for all sensitive data**
   ```yaml
   # Good
   env:
     TOKEN: ${{ secrets.PAT_TOKEN }}
   ```

2. **Rotate secrets regularly**
   - PAT tokens: Every 90 days
   - Webhooks: If compromised
   - Passwords: Every 6 months

3. **Use minimal permissions**
   - Only grant necessary scopes
   - Principle of least privilege

4. **Monitor secret usage**
   - Check workflow logs
   - Review audit logs
   - Watch for anomalies

5. **Use different secrets per environment**
   - Production secrets
   - Staging secrets
   - Development secrets

### DON'T ❌

1. **Never commit secrets to code**
   ```yaml
   # Bad - Never do this!
   env:
     TOKEN: ghp_xxxxxxxxxxxx
   ```

2. **Never log secret values**
   ```javascript
   // Bad
   console.log('Token:', process.env.GITHUB_TOKEN);
   
   // Good
   console.log('Token:', '***');
   ```

3. **Never share secrets**
   - Don't email secrets
   - Don't paste in chat
   - Don't store in plain text

4. **Never use production secrets in development**
   - Use separate test accounts
   - Use sandbox environments

## 🚨 What If a Secret Is Compromised?

### Immediate Actions

1. **Revoke the Secret**
   - GitHub PAT: Delete in GitHub settings
   - Slack Webhook: Regenerate in Slack app
   - Email Password: Revoke app password

2. **Update in GitHub**
   - Go to repository secrets
   - Update with new value
   - Or delete and recreate

3. **Review Logs**
   - Check workflow runs
   - Look for suspicious activity
   - Review access patterns

4. **Notify Team**
   - Inform security team
   - Document incident
   - Update procedures

### Prevention

- Use secret scanning (GitHub Advanced Security)
- Enable branch protection
- Require code reviews
- Limit repository access
- Regular security audits

## 📊 Secret Management Comparison

| Method | Security | Ease of Use | Cost | Recommended |
|--------|----------|-------------|------|-------------|
| GitHub Secrets | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Free | ✅ Yes |
| Environment Variables | ⭐⭐ | ⭐⭐⭐⭐ | Free | ❌ No |
| Config Files | ⭐ | ⭐⭐⭐⭐⭐ | Free | ❌ Never |
| AWS Secrets Manager | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Paid | For enterprise |
| HashiCorp Vault | ⭐⭐⭐⭐⭐ | ⭐⭐ | Paid | For enterprise |

## 🎓 Summary

### Key Takeaways

1. **GitHub Secrets are secure**
   - Encrypted storage
   - Masked in logs
   - Access controlled

2. **Three secrets needed**
   - `PAT_TOKEN` - GitHub API access
   - `SLACK_WEBHOOK_URL` - Slack notifications
   - `EMAIL_PASSWORD` - Email notifications

3. **Easy to set up**
   - 5-10 minutes per secret
   - One-time setup
   - No maintenance needed

4. **No security concerns**
   - Industry-standard encryption
   - Better than alternatives
   - Used by millions of projects

### Next Steps

1. ✅ Understand what secrets are
2. ✅ Know how to get them
3. ✅ Add them to repository
4. ⏭️ Use them in workflow
5. ⏭️ Monitor and rotate regularly

---

**Still have security concerns?** This is the same system used by:
- Microsoft
- Google
- Netflix
- Thousands of enterprise companies
- Millions of open-source projects

It's battle-tested and secure! 🔒