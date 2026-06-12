# GitHub Token Requirements - Public vs Private Repos

## Quick Answer

**For Public Repositories:**
- ✅ **No PAT token needed** - The automatic `GITHUB_TOKEN` works fine
- ✅ Can read public PRs without authentication
- ✅ Simpler setup

**For Private Repositories:**
- ⚠️ **PAT token required** - Need Personal Access Token with `repo` scope
- ❌ Automatic `GITHUB_TOKEN` has limited access
- 🔐 More secure but requires setup

## Detailed Explanation

### Automatic GITHUB_TOKEN (Built-in)

GitHub Actions automatically provides a `GITHUB_TOKEN` for every workflow run.

**What it can do:**
- ✅ Read public repositories
- ✅ Read PRs in the same repository where workflow runs
- ✅ Read PRs in same organization (limited)
- ✅ No setup required

**What it CANNOT do:**
- ❌ Read private repositories outside the workflow's repo
- ❌ Access multiple organizations
- ❌ Long-lived access (expires after workflow)

**When to use:**
- All repositories are public
- Monitoring only the repository where workflow runs
- Single organization setup

### Personal Access Token (PAT)

A manually created token with custom permissions.

**What it can do:**
- ✅ Read private repositories
- ✅ Access multiple organizations
- ✅ Custom permission scopes
- ✅ Long-lived (up to 1 year)

**When to use:**
- Monitoring private repositories
- Multiple organizations
- Repositories outside the workflow's repo
- Need more control

## Configuration Examples

### Option 1: Public Repos Only (No PAT Needed)

**Workflow file (`.github/workflows/pr-reminder.yml`):**
```yaml
- name: Run PR Reminder System
  env:
    # Use automatic token (no setup needed)
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
    EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
  run: node src/index.js
```

**Required Secrets:**
- ❌ PAT_TOKEN - Not needed!
- ✅ SLACK_WEBHOOK_URL
- ✅ EMAIL_FROM
- ✅ EMAIL_PASSWORD

**Setup Steps:**
1. Create repository (can be public or private)
2. Add Slack and Email secrets only
3. Push code
4. Done! No PAT token needed

### Option 2: Private Repos (PAT Required)

**Workflow file (`.github/workflows/pr-reminder.yml`):**
```yaml
- name: Run PR Reminder System
  env:
    # Use PAT token for private repos
    GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
    EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
  run: node src/index.js
```

**Required Secrets:**
- ✅ PAT_TOKEN - Required!
- ✅ SLACK_WEBHOOK_URL
- ✅ EMAIL_FROM
- ✅ EMAIL_PASSWORD

**Setup Steps:**
1. Create PAT token with `repo` scope
2. Add PAT_TOKEN to repository secrets
3. Add other secrets
4. Push code

### Option 3: Mixed (Public + Private Repos)

Use PAT token - it works for both public and private repos.

## How to Check Your Setup

### Are all your repositories public?

**Check on GitHub:**
1. Go to your organization
2. Click "Repositories"
3. Look for 🔓 (public) or 🔒 (private) icons

**If all show 🔓:**
- You can use automatic `GITHUB_TOKEN`
- No PAT token needed
- Simpler setup

**If any show 🔒:**
- You need PAT token
- Follow private repo setup

## Code Changes for Public Repos

The current implementation already supports both! No code changes needed.

**In `src/github/pr-fetcher.js`:**
```javascript
function createGitHubClient() {
  // Tries PAT_TOKEN first, falls back to GITHUB_TOKEN
  const token = process.env.GITHUB_TOKEN || process.env.PAT_TOKEN;
  
  if (!token) {
    throw new Error('GitHub token not found');
  }
  
  return new Octokit({ auth: token });
}
```

## Workflow File Update for Public Repos

If you're **only monitoring public repositories**, update the workflow:

```yaml
- name: Run PR Reminder System
  env:
    # For public repos, use automatic token
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    
    # For private repos, use PAT token
    # GITHUB_TOKEN: ${{ secrets.PAT_TOKEN }}
    
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
    EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
  run: node src/index.js
```

## Testing Your Setup

### Test with Automatic Token (Public Repos)

```bash
# Set environment variable
export GITHUB_TOKEN="your_automatic_token"

# Run locally
node src/index.js
```

### Test with PAT Token (Private Repos)

```bash
# Set environment variable
export GITHUB_TOKEN="ghp_your_pat_token"

# Run locally
node src/index.js
```

## Rate Limits

### Automatic GITHUB_TOKEN
- **Rate Limit:** 1,000 requests per hour per repository
- **Usually sufficient** for most use cases

### Personal Access Token
- **Rate Limit:** 5,000 requests per hour
- **Better for:** High-volume usage

## Security Considerations

### Automatic GITHUB_TOKEN
- ✅ More secure (auto-generated, short-lived)
- ✅ Limited scope (can't do much damage)
- ✅ No manual management needed

### Personal Access Token
- ⚠️ More powerful (can access more)
- ⚠️ Needs rotation (expires)
- ⚠️ Must be kept secret

## Recommendations

### For Public Repositories
```
✅ Use automatic GITHUB_TOKEN
✅ Simpler setup
✅ More secure
✅ No token management
```

### For Private Repositories
```
✅ Use PAT token
✅ More control
✅ Access to private repos
⚠️ Requires setup and rotation
```

### For Mixed Environments
```
✅ Use PAT token
✅ Works for both public and private
✅ One token for everything
⚠️ Requires setup
```

## Quick Decision Tree

```
Are all repositories PUBLIC?
├─ YES → Use automatic GITHUB_TOKEN (no PAT needed)
└─ NO → Use PAT token

Do you need to access multiple organizations?
├─ YES → Use PAT token
└─ NO → Check if repos are public (see above)

Is the workflow in the same repo as the PRs?
├─ YES → Automatic GITHUB_TOKEN might work
└─ NO → Use PAT token
```

## Summary Table

| Scenario | Token Type | Setup Required | Best For |
|----------|-----------|----------------|----------|
| All public repos | Automatic `GITHUB_TOKEN` | ❌ No | Simplicity |
| Any private repos | PAT token | ✅ Yes | Security |
| Multiple orgs | PAT token | ✅ Yes | Flexibility |
| Same repo only | Automatic `GITHUB_TOKEN` | ❌ No | Quick start |

## Your Specific Case

**If monitoring only public repositories:**

1. **Update workflow file:**
   ```yaml
   GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
   ```

2. **Don't create PAT token** - not needed!

3. **Only add these secrets:**
   - SLACK_WEBHOOK_URL
   - EMAIL_FROM
   - EMAIL_PASSWORD

4. **Skip PAT token setup** in documentation

**Result:** Simpler setup, more secure, no token management! ✅

---

**Bottom Line:** For public repos, you don't need a PAT token. The automatic `GITHUB_TOKEN` works perfectly and is actually more secure!