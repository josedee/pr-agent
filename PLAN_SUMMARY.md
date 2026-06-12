# PR Reminder System - Plan Summary

## 📋 What We're Building

A **serverless, automated PR review reminder system** that:
- Monitors PRs across multiple GitHub repositories
- Sends daily reminders via Slack and Email
- Runs automatically on GitHub Actions (no server needed)
- Costs $0 to operate (free tier)
- Takes 15-30 minutes to set up

## 🎯 Your Requirements Met

| Requirement | Solution |
|-------------|----------|
| ✅ List of PRs pending with each teammate | Groups PRs by assigned reviewer |
| ✅ PRs across multiple repos | Monitors all configured repositories |
| ✅ Notify via Slack | Slack webhook integration |
| ✅ Notify via Email | SMTP email integration |
| ✅ Configurable frequency | Cron-based scheduling (daily, weekly, custom) |

## 🏗️ Architecture Overview

### The Simple Version
```
ONE Repository → GitHub Actions → Fetch PRs → Send Notifications
```

### The Detailed Version
```
Central Repository (pr-reminder-system)
    ↓
GitHub Actions Workflow (runs daily at 9 AM)
    ↓
Fetch PRs Script (Node.js)
    ↓
GitHub API → Repo 1, Repo 2, Repo 3, ...
    ↓
Aggregate by Reviewer
    ↓
Send Notifications → Slack + Email
```

## 📁 Project Structure

```
pr-reminder-system/
├── .github/
│   └── workflows/
│       └── pr-reminder.yml          # GitHub Actions workflow
├── scripts/
│   ├── fetch-prs.js                 # Fetch PRs from GitHub API
│   ├── aggregate-data.js            # Group PRs by reviewer
│   ├── notify-slack.js              # Send Slack notifications
│   └── notify-email.js              # Send email notifications
├── config.yml                       # Configuration file
├── package.json                     # Dependencies
├── README.md                        # Documentation
└── .gitignore                       # Ignore node_modules, etc.
```

## 🔑 Key Decisions Made

### 1. Deployment Strategy
**Decision:** Central repository approach
**Why:** 
- Only one place to maintain
- No changes to existing repositories
- Easier to update and monitor

### 2. Technology Stack
**Decision:** Node.js with GitHub Actions
**Why:**
- Native GitHub Actions support
- Rich ecosystem for GitHub API, Slack, Email
- Easy to maintain and extend

### 3. Security
**Decision:** GitHub Secrets for all credentials
**Why:**
- Industry-standard encryption
- Automatic log masking
- No server to secure
- Free and built-in

### 4. Notification Frequency
**Decision:** Configurable cron schedules
**Why:**
- Different schedules for Slack vs Email
- Easy to adjust based on team feedback
- Can run multiple times per day if needed

## 📚 Documentation Created

1. **[README.md](README.md)** - Project overview and quick start
2. **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup instructions
3. **[GITHUB_ACTIONS_EXPLAINED.md](GITHUB_ACTIONS_EXPLAINED.md)** - How GitHub Actions works
4. **[SECRETS_AND_SECURITY.md](SECRETS_AND_SECURITY.md)** - Security guide and credential setup
5. **[PR_REMINDER_SYSTEM_PLAN.md](PR_REMINDER_SYSTEM_PLAN.md)** - Detailed technical plan

## 🛠️ Implementation Tasks

### Phase 1: Core Setup (Day 1-2)
- [ ] Create project structure
- [ ] Set up package.json with dependencies
- [ ] Create configuration file schema
- [ ] Implement GitHub API client

### Phase 2: PR Fetching (Day 2-3)
- [ ] Implement PR fetching logic
- [ ] Add filtering by assigned reviewers
- [ ] Handle pagination for large result sets
- [ ] Add error handling and retries

### Phase 3: Data Aggregation (Day 3-4)
- [ ] Group PRs by reviewer
- [ ] Calculate PR age and priority
- [ ] Map GitHub usernames to Slack/Email
- [ ] Format data for notifications

### Phase 4: Notifications (Day 4-6)
- [ ] Implement Slack webhook integration
- [ ] Create Slack message templates
- [ ] Implement SMTP email integration
- [ ] Create HTML email templates
- [ ] Add notification scheduling logic

### Phase 5: GitHub Actions (Day 6-7)
- [ ] Create workflow YAML file
- [ ] Configure cron schedules
- [ ] Set up environment variables
- [ ] Add manual trigger option

### Phase 6: Testing & Documentation (Day 7-8)
- [ ] Test with sample repositories
- [ ] Verify Slack notifications
- [ ] Verify email notifications
- [ ] Update documentation
- [ ] Create usage examples

## 🎨 Example Outputs

### Slack Notification
```
🔔 PR Review Reminder - June 4, 2026

@john_doe - You have 3 PRs pending review:
• [backend-api] Fix authentication bug (#123) - 2 days old
  https://github.com/org/backend-api/pull/123
• [frontend] Add new dashboard (#456) - 1 day old
  https://github.com/org/frontend/pull/456
• [backend-api] Update dependencies (#789) - 5 hours old
  https://github.com/org/backend-api/pull/789

Total: 3 PRs | Oldest: 2 days
```

### Email Notification
```
Subject: PR Review Reminder - 3 PRs Pending

Hi John,

You have 3 pull requests waiting for your review:

Repository      | PR #  | Title                    | Age
----------------|-------|--------------------------|--------
backend-api     | #123  | Fix authentication bug   | 2 days
frontend        | #456  | Add new dashboard        | 1 day
backend-api     | #789  | Update dependencies      | 5 hours

[View All PRs]
```

## 💰 Cost Analysis

### GitHub Actions Usage
- **Workflow duration:** ~2 minutes per run
- **Frequency:** Once per day
- **Monthly usage:** ~60 minutes
- **Free tier:** 2,000 minutes/month
- **Cost:** $0 (well within free tier)

### Scaling
- 50 repositories: ~5 minutes per run
- Daily runs: ~150 minutes/month
- Still free!

## 🔒 Security Summary

### What's Secure
✅ All credentials encrypted in GitHub Secrets
✅ Secrets never appear in logs (masked)
✅ Minimal API permissions (read-only)
✅ No data stored outside GitHub
✅ Industry-standard encryption (AES-256)

### What You Need
1. **GitHub Personal Access Token** - Access GitHub API
2. **Slack Webhook URL** - Send Slack messages
3. **Email App Password** - Send emails

All stored securely in GitHub Secrets (see [SECRETS_AND_SECURITY.md](SECRETS_AND_SECURITY.md))

## 📊 Success Metrics

### Technical Success
- ✅ Successfully fetch PRs from all repositories
- ✅ Accurately identify assigned reviewers
- ✅ Deliver notifications reliably
- ✅ Run on schedule without failures
- ✅ Complete execution in < 5 minutes

### Business Success
- ✅ Reduce average PR review time
- ✅ Increase PR review completion rate
- ✅ Improve team awareness of pending reviews
- ✅ Positive team feedback
- ✅ Adoption by all team members

## 🚀 Next Steps

### Option 1: Proceed with Implementation
If you're happy with this plan, we can switch to **Code mode** and start building:
1. Create project structure
2. Implement PR fetching logic
3. Add notification integrations
4. Set up GitHub Actions workflow
5. Test and deploy

### Option 2: Refine the Plan
If you have questions or want changes:
- Adjust notification frequency
- Change technology stack
- Add/remove features
- Modify architecture

### Option 3: Start with MVP
Build a minimal version first:
1. Single repository monitoring
2. Slack notifications only
3. Manual trigger (no scheduling)
4. Expand later based on feedback

## ❓ Questions to Consider

Before implementation, think about:

1. **Repositories to Monitor**
   - How many repositories? (affects execution time)
   - Public or private? (affects token permissions)
   - Same organization or multiple? (affects token setup)

2. **Team Size**
   - How many reviewers? (affects notification volume)
   - Do you have Slack IDs for everyone? (needed for mentions)
   - Email addresses available? (needed for emails)

3. **Notification Preferences**
   - What time should reminders go out? (9 AM? Different time?)
   - How often? (Daily? Weekly? Multiple times per day?)
   - Slack, Email, or both? (can enable/disable each)

4. **Customization Needs**
   - Custom message templates?
   - Filter by PR age? (only remind for PRs > 2 days old)
   - Escalation rules? (notify managers for very old PRs)

## 📝 Your Feedback

Please review this plan and let me know:
- ✅ Approve and proceed with implementation
- 🔄 Request changes or clarifications
- ❓ Ask additional questions

---

**Ready to build this?** Let's switch to Code mode and make it happen! 🚀