/**
 * GitHub PR Fetcher (REST API)
 *
 * Fetches open pull requests from multiple repositories using REST API
 * This is the default implementation for reliability and compatibility.
 *
 * For optimized GraphQL version (97% fewer API calls), set USE_GRAPHQL=true
 */

const { Octokit } = require('@octokit/rest');

/**
 * Create authenticated Octokit instance
 */
function createGitHubClient() {
  const token = process.env.GITHUB_TOKEN || process.env.PAT_TOKEN;
  
  if (!token) {
    console.log('  ⚠ No GitHub token found - using unauthenticated access');
    console.log('  ⚠ Rate limit: 60 requests/hour (vs 5000 with token)');
    console.log('  ⚠ Only works for public repositories');
  }
  
  return new Octokit({
    auth: token || undefined,
    userAgent: 'pr-agent/1.0.0'
  });
}

/**
 * Fetch PRs from a single repository
 */
async function fetchRepoPRs(octokit, owner, repo, config) {
  try {
    console.log(`  Fetching PRs from ${owner}/${repo}...`);
    
    // Fetch open pull requests
    const { data: pulls } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
      per_page: 100
    });
    
    // Filter PRs based on configuration
    const filteredPRs = pulls.filter(pr => {
      // Exclude drafts if configured
      if (config.filters?.exclude_drafts && pr.draft) {
        return false;
      }
      
      // Exclude PRs with specific labels
      if (config.filters?.exclude_labels) {
        const prLabels = pr.labels.map(label => label.name);
        const hasExcludedLabel = config.filters.exclude_labels.some(
          excludeLabel => prLabels.includes(excludeLabel)
        );
        if (hasExcludedLabel) {
          return false;
        }
      }
      
      // Filter by minimum age
      if (config.filters?.min_age_hours > 0) {
        const prAge = Date.now() - new Date(pr.created_at).getTime();
        const minAge = config.filters.min_age_hours * 60 * 60 * 1000;
        if (prAge < minAge) {
          return false;
        }
      }
      
      return true;
    });
    
    // Fetch requested reviewers for each PR
    const prsWithReviewers = await Promise.all(
      filteredPRs.map(async (pr) => {
        try {
          // Get requested reviewers
          const { data: reviewers } = await octokit.pulls.listRequestedReviewers({
            owner,
            repo,
            pull_number: pr.number
          });
          
          // Get existing reviews to filter out reviewers who already reviewed
          const { data: reviews } = await octokit.pulls.listReviews({
            owner,
            repo,
            pull_number: pr.number
          });
          
          // Get unique reviewers who have already reviewed
          const reviewedBy = [...new Set(reviews.map(review => review.user.login))];
          
          // Filter out reviewers who already reviewed
          const pendingReviewers = reviewers.users.filter(
            user => !reviewedBy.includes(user.login)
          );
          
          // Calculate PR age
          const createdAt = new Date(pr.created_at);
          const ageMs = Date.now() - createdAt.getTime();
          const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
          const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          return {
            number: pr.number,
            title: pr.title,
            url: pr.html_url,
            author: pr.user.login,
            created_at: pr.created_at,
            updated_at: pr.updated_at,
            draft: pr.draft,
            labels: pr.labels.map(label => label.name),
            requested_reviewers: pendingReviewers.map(user => user.login),
            repository: {
              owner,
              name: repo,
              full_name: `${owner}/${repo}`
            },
            age: {
              days: ageDays,
              hours: ageHours,
              total_hours: Math.floor(ageMs / (1000 * 60 * 60)),
              formatted: ageDays > 0 
                ? `${ageDays} day${ageDays !== 1 ? 's' : ''}` 
                : `${ageHours} hour${ageHours !== 1 ? 's' : ''}`
            }
          };
        } catch (error) {
          console.error(`    ⚠ Error fetching reviewers for PR #${pr.number}:`, error.message);
          return null;
        }
      })
    );
    
    // Filter out null values (PRs that had errors)
    const validPRs = prsWithReviewers.filter(pr => pr !== null);
    
    console.log(`    ✓ Found ${validPRs.length} PRs (${pulls.length} total, ${pulls.length - validPRs.length} filtered out)`);
    
    return validPRs;
    
  } catch (error) {
    console.error(`    ✗ Error fetching PRs from ${owner}/${repo}:`, error.message);
    return [];
  }
}

/**
 * Fetch PRs from all configured repositories
 */
async function fetchPRs(config) {
  // Check if user wants to use GraphQL API instead
  if (process.env.USE_GRAPHQL === 'true') {
    console.log('\n📊 Using GraphQL API (optimized mode - 97% fewer requests)');
    const graphqlFetcher = require('./pr-fetcher-graphql');
    return graphqlFetcher.fetchPRs(config);
  }
  
  const octokit = createGitHubClient();
  const allPRs = [];
  
  console.log('\n📊 Using REST API (default mode)');
  
  // Iterate through all configured repositories
  for (const repoGroup of config.repositories) {
    const { owner, repos } = repoGroup;
    
    for (const repo of repos) {
      const prs = await fetchRepoPRs(octokit, owner, repo, config);
      allPRs.push(...prs);
    }
  }
  
  // Filter PRs that have at least one requested reviewer
  const prsWithReviewers = allPRs.filter(pr => pr.requested_reviewers.length > 0);
  
  console.log(`  Total PRs with pending reviewers: ${prsWithReviewers.length}`);
  
  return prsWithReviewers;
}

module.exports = {
  fetchPRs,
  createGitHubClient
};

