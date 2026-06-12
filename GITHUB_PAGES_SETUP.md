# 🚀 GitHub Pages Deployment Guide

## ✅ Files Created

I've created the GitHub Actions workflow file:
- `.github/workflows/deploy-dashboard.yml`

## 📋 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Add PR Agent Dashboard with GitHub Pages deployment"

# Push to GitHub
git push origin main
```

### Step 2: Enable GitHub Pages

1. **Go to your repository on GitHub**
   ```
   https://github.com/YOUR_USERNAME/pr-agent
   ```

2. **Click Settings** (top right)

3. **Click Pages** (left sidebar)

4. **Under "Source":**
   - Select: **GitHub Actions** (NOT "Deploy from a branch")
   - This should be the default option

5. **Save** (if there's a save button)

### Step 3: Wait for Deployment

1. **Go to Actions tab**
   ```
   https://github.com/YOUR_USERNAME/pr-agent/actions
   ```

2. **Look for workflow:**
   - "Deploy Dashboard to GitHub Pages"
   - Should start automatically after push

3. **Wait 1-2 minutes** for deployment to complete

4. **Check for green checkmark** ✅

### Step 4: Access Your Dashboard

Your dashboard will be available at:
```
https://YOUR_USERNAME.github.io/pr-agent/
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## 🔍 Troubleshooting

### Issue: Workflow doesn't start

**Solution:**
1. Check that you pushed the workflow file
2. Go to Actions tab
3. Click "Deploy Dashboard to GitHub Pages"
4. Click "Run workflow" button
5. Select "main" branch
6. Click "Run workflow"

### Issue: 404 Page Not Found

**Possible causes:**

1. **Deployment still in progress**
   - Wait 2-3 minutes
   - Check Actions tab for completion

2. **Wrong URL**
   - Make sure you're using: `https://YOUR_USERNAME.github.io/pr-agent/`
   - NOT: `https://YOUR_USERNAME.github.io/pr-agent/dashboard/`

3. **GitHub Pages not enabled**
   - Go to Settings → Pages
   - Ensure Source is set to "GitHub Actions"

### Issue: Workflow fails

**Check the logs:**
1. Go to Actions tab
2. Click on the failed workflow
3. Click on the "deploy" job
4. Read error messages

**Common fixes:**
- Ensure repository is public (or you have GitHub Pro for private repos)
- Check that all dashboard files exist
- Verify workflow file syntax

## 🔄 How Auto-Updates Work

### When Dashboard Updates

The dashboard auto-deploys when:
1. You push changes to `dashboard/` folder
2. PR Agent generates new `data.json`
3. You manually trigger the workflow

### Complete Update Flow

```
1. PR Agent runs (npm start)
   ↓
2. Generates dashboard/data.json
   ↓
3. Commit and push to GitHub
   ↓
4. GitHub Actions deploys
   ↓
5. Dashboard updates automatically
```

### Manual Trigger

To manually deploy:
1. Go to Actions tab
2. Click "Deploy Dashboard to GitHub Pages"
3. Click "Run workflow"
4. Select branch: main
5. Click "Run workflow"

## 📊 Integrating with PR Agent Workflow

### Option 1: Manual Updates

```bash
# Run PR Agent
npm start

# Commit new data
git add dashboard/data.json
git commit -m "Update dashboard data"
git push

# Dashboard auto-deploys
```

### Option 2: Automated Updates (Recommended)

Modify `.github/workflows/pr-reminder.yml` to auto-commit data:

```yaml
name: PR Agent

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  run-pr-agent:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - run: npm install
      
      - name: Run PR Agent
        env:
          GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
        run: node src/index.js
      
      - name: Commit dashboard data
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add dashboard/data.json
          git diff --quiet && git diff --staged --quiet || git commit -m "Update dashboard data [skip ci]"
          git push
```

**Note:** `[skip ci]` prevents infinite loops

## 🎯 Verification Checklist

After deployment, verify:

- [ ] Dashboard loads at `https://YOUR_USERNAME.github.io/pr-agent/`
- [ ] Statistics show correct numbers
- [ ] PR cards display properly
- [ ] Search works
- [ ] Filter buttons work
- [ ] Theme toggle works (🌙/☀️)
- [ ] Refresh button works
- [ ] Mobile view works

## 📱 Sharing with Team

### Share the URL

Send to your team:
```
🤖 PR Agent Dashboard
https://YOUR_USERNAME.github.io/pr-agent/

Check pending PR reviews across all repositories!
```

### Bookmark Instructions

1. Open the dashboard
2. Press `Ctrl+D` (Windows/Linux) or `Cmd+D` (Mac)
3. Save to bookmarks bar

### Mobile Access

1. Open dashboard on mobile browser
2. Tap share button
3. Select "Add to Home Screen"
4. Dashboard appears as an app icon

## 🔒 Security Notes

### Public Repositories

- ✅ Dashboard is publicly accessible
- ✅ Only shows PR data (no sensitive info)
- ✅ No API keys exposed
- ✅ Safe to share

### Private Repositories

- ⚠️ Requires GitHub Pro/Team for private repo Pages
- ⚠️ Dashboard will be public even if repo is private
- ⚠️ Don't include sensitive PR titles/data

## 📈 Monitoring

### Check Deployment Status

```bash
# View recent deployments
https://github.com/YOUR_USERNAME/pr-agent/deployments
```

### View Workflow Runs

```bash
# View all workflow runs
https://github.com/YOUR_USERNAME/pr-agent/actions
```

### Check Dashboard Health

1. Open dashboard
2. Check "Last updated" time
3. Should match recent PR Agent run

## 🎉 Success!

Once deployed, your dashboard will:
- ✅ Update automatically when data changes
- ✅ Be accessible 24/7
- ✅ Work on all devices
- ✅ Load instantly (static files)
- ✅ Require zero maintenance

## 🆘 Need Help?

1. **Check Actions logs** for deployment errors
2. **Verify Settings → Pages** is set to "GitHub Actions"
3. **Wait 2-3 minutes** after first push
4. **Try manual workflow trigger** if auto-deploy doesn't work

---

## 📚 Related Documentation

- [Dashboard README](dashboard/README.md)
- [Deployment Guide](dashboard/DEPLOYMENT_GUIDE.md)
- [Main README](README.md)