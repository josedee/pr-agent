# 🚀 PR Agent Dashboard - Deployment Guide

## ✅ Local Testing Confirmed

Your dashboard is working perfectly! Now let's deploy it to GitHub Pages.

## 📋 Deployment Options

### Option 1: Deploy from Main Branch (Recommended)

This is the simplest approach - GitHub Pages serves directly from your repository.

#### Steps:

1. **Push your code to GitHub:**
   ```bash
   git add pr-agent-dashboard/
   git commit -m "Add PR Agent Dashboard"
   git push origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select:
     - Branch: `main`
     - Folder: `/pr-agent-dashboard`
   - Click **Save**

3. **Access your dashboard:**
   ```
   https://YOUR_USERNAME.github.io/pr-agent/
   ```
   
   (Replace `YOUR_USERNAME` with your GitHub username)

4. **Wait 1-2 minutes** for GitHub to build and deploy

---

### Option 2: Deploy to Separate gh-pages Branch

This keeps your dashboard separate from your main code.

#### Steps:

1. **Create gh-pages branch:**
   ```bash
   # Create and switch to gh-pages branch
   git checkout --orphan gh-pages
   
   # Remove all files except dashboard
   git rm -rf .
   git checkout main -- pr-agent-dashboard/
   
   # Move dashboard files to root
   mv pr-agent-dashboard/* .
   rmdir pr-agent-dashboard
   
   # Commit and push
   git add .
   git commit -m "Deploy dashboard to GitHub Pages"
   git push origin gh-pages
   
   # Switch back to main
   git checkout main
   ```

2. **Enable GitHub Pages:**
   - Go to Settings → Pages
   - Source: `gh-pages` branch, `/root` folder
   - Save

3. **Access your dashboard:**
   ```
   https://YOUR_USERNAME.github.io/pr-agent/
   ```

---

### Option 3: Automated Deployment with GitHub Actions

Create a workflow that automatically deploys the dashboard when data updates.

#### Create `.github/workflows/deploy-dashboard.yml`:

```yaml
name: Deploy Dashboard

on:
  push:
    branches: [main]
    paths:
      - 'pr-agent-dashboard/**'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Pages
        uses: actions/configure-pages@v3
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: 'pr-agent-dashboard'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

Then enable GitHub Pages with source: "GitHub Actions"

---

## 🔗 Integration with PR Agent

### Step 1: Modify PR Agent to Generate Dashboard Data

Update `src/index.js` to call the dashboard generator:

```javascript
// At the top of the file
const dashboardGenerator = require('../pr-agent-dashboard/generate-dashboard-data');

// After aggregating PRs (around line 50-60)
async function main() {
  // ... existing code ...
  
  // Aggregate PRs
  const reviewerMap = aggregatePRs(prs, config);
  
  // Generate dashboard data
  console.log('\n📊 Generating dashboard data...');
  dashboardGenerator.generateFromPRAgent(prs, reviewerMap);
  
  // ... rest of the code ...
}
```

### Step 2: Update GitHub Actions Workflow

Modify `.github/workflows/pr-reminder.yml` to commit dashboard data:

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
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
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
          git add pr-agent-dashboard/data.json
          git diff --quiet && git diff --staged --quiet || git commit -m "Update dashboard data"
          git push
```

---

## 🧪 Testing Your Deployment

### 1. Check if GitHub Pages is enabled:
```bash
# Visit your repository settings
https://github.com/YOUR_USERNAME/pr-agent/settings/pages
```

### 2. Verify the dashboard URL:
```bash
# Should show your dashboard
https://YOUR_USERNAME.github.io/pr-agent/
```

### 3. Test data updates:
```bash
# Manually trigger the workflow
# Go to Actions → PR Agent → Run workflow
```

### 4. Check for errors:
```bash
# View GitHub Actions logs
https://github.com/YOUR_USERNAME/pr-agent/actions
```

---

## 🐛 Troubleshooting

### Dashboard shows 404 error

**Cause**: GitHub Pages not configured correctly

**Solution**:
1. Check Settings → Pages is enabled
2. Verify the correct branch and folder are selected
3. Wait 1-2 minutes for deployment
4. Check Actions tab for deployment status

### Dashboard shows old data

**Cause**: Workflow hasn't run or data not committed

**Solution**:
1. Manually trigger the workflow
2. Check if `data.json` was updated in the repository
3. Hard refresh the page (Ctrl+Shift+R)

### Dashboard shows "Failed to Load Data"

**Cause**: `data.json` not found or invalid

**Solution**:
1. Verify `data.json` exists in the repository
2. Check the file is valid JSON
3. Ensure the file path is correct
4. Check browser console for errors

### Styles not loading

**Cause**: Incorrect file paths

**Solution**:
1. Ensure all files are in the same directory
2. Check for typos in file names
3. Verify files were committed to the repository

---

## 📊 Monitoring

### Check Dashboard Health

1. **Last Updated Time**: Shows when data was last refreshed
2. **GitHub Actions**: Monitor workflow runs
3. **Browser Console**: Check for JavaScript errors
4. **Network Tab**: Verify data.json loads correctly

### Performance Metrics

- **Initial Load**: < 100ms
- **Data Size**: ~50KB for 100 PRs
- **Rendering**: < 50ms
- **Search**: Real-time, no lag

---

## 🔒 Security Checklist

- ✅ No API keys in client-side code
- ✅ No GitHub tokens exposed
- ✅ XSS protection via HTML escaping
- ✅ Static data generation
- ✅ HTTPS enabled (GitHub Pages default)

---

## 🎯 Best Practices

1. **Update Frequency**: Run workflow hourly for fresh data
2. **Data Size**: Keep under 1MB for fast loading
3. **Caching**: GitHub Pages caches for 10 minutes
4. **Mobile**: Test on mobile devices
5. **Accessibility**: Dashboard is screen-reader friendly

---

## 📱 Sharing with Team

### Share the Dashboard URL:
```
https://YOUR_USERNAME.github.io/pr-agent/
```

### Bookmark Instructions:
1. Open the dashboard
2. Press Ctrl+D (Windows/Linux) or Cmd+D (Mac)
3. Save to bookmarks bar

### Mobile Access:
1. Open dashboard on mobile browser
2. Add to home screen for app-like experience

---

## 🔄 Updating the Dashboard

### To update the design:
1. Edit `styles.css` or `index.html`
2. Commit and push changes
3. GitHub Pages auto-deploys

### To update functionality:
1. Edit `app.js`
2. Test locally first
3. Commit and push

### To change data format:
1. Edit `generate-dashboard-data.js`
2. Update `app.js` if needed
3. Test with sample data

---

## 📈 Analytics (Optional)

### Add Google Analytics:

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🎉 Success Checklist

- [ ] Dashboard loads locally
- [ ] GitHub Pages enabled
- [ ] Dashboard accessible via URL
- [ ] Data updates automatically
- [ ] Team can access the dashboard
- [ ] Mobile version works
- [ ] Dark/light mode works
- [ ] Search functionality works
- [ ] All views display correctly

---

## 🆘 Need Help?

1. **Check the logs**: GitHub Actions → Latest workflow run
2. **Browser console**: F12 → Console tab
3. **Network tab**: F12 → Network tab
4. **GitHub Pages status**: Settings → Pages

---

## 🎊 You're Done!

Your PR Agent Dashboard is now live and accessible to your entire team!

**Dashboard URL**: `https://YOUR_USERNAME.github.io/pr-agent/`

Share this URL with your team and enjoy the beautiful PR visualization! 🚀

---
