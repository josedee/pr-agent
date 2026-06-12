/**
 * GitHub PR Fetcher (GraphQL Optimized)
 * 
 * Fetches open pull requests from multiple repositories using GraphQL API
 * This reduces API calls from ~90 to just 3 (one per repository)
 * 
 * Previous REST API: 1 call per repo + 2 calls per PR = 1 + (44 × 2) = 89 calls
 * Now with GraphQL: 1 call per repo = 3 calls total
 * 
 * To use REST API instead, set USE_REST_API=true in environment variables
 */

const { graphql } = require('@octokit/graphql');

/**
 * Create authenticated GraphQL client
 */
function createGraphQLClient() {
  const token = process.env.GITHUB_TOKEN || process.env.PAT_TOKEN;
  
  if (!token) {
    console.log('  ⚠ No GitHub token found - using unauthenticated access');
    console.log('  ⚠ Rate limit: 60 requests/hour (vs 5000 with token)');
    console.log('  ⚠ Only works for public repositories');
    console.log('  💡 Recommendation: Add GITHUB_TOKEN for better rate limits');
    
    // Return unauthenticated client (no auth header)
    return graphql.defaults({});
  }
  
  // Return authenticated client
  return graphql.defaults({
    headers: {
      authorization: `token ${token}`,
    },
  });
}

/**
 * GraphQL query to fetch all PR data in a single request
 */
const PR_QUERY = `
  query($owner: String!, $repo: String!, $states: [PullRequestState!]) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 100, states: $states, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          number
          title
          url
          createdAt
          updatedAt
          isDraft
          author {
            login
          }
          labels(first: 10) {
            nodes {
              name
            }
          }
          reviewRequests(first: 20) {
            nodes {
              requestedReviewer {
                ... on User {
                  login
                }
                ... on Team {
                  name
                }
              }
            }
          }
          reviews(first: 50) {
            nodes {
              author {
                login
              }
              state
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch PRs from a single repository using GraphQL
 */
async function fetchRepoPRs(graphqlClient, owner, repo, config) {
  try {
    console.log(`  Fetching PRs from ${owner}/${repo}...`);
    
    // Single GraphQL query to get all PR data
    const result = await graphqlClient(PR_QUERY, {
      owner,
      repo,
      states: ['OPEN']
    });
    
    const pulls = result.repository.pullRequests.nodes;
    
    // Process and filter PRs
    const processedPRs = pulls
      .map(pr => {
        // Filter drafts if configured
        if (config.filters?.exclude_drafts && pr.isDraft) {
          return null;
        }
        
        // Filter by labels
        const prLabels = pr.labels.nodes.map(label => label.name);
        if (config.filters?.exclude_labels) {
          const hasExcludedLabel = config.filters.exclude_labels.some(
            excludeLabel => prLabels.includes(excludeLabel)
          );
          if (hasExcludedLabel) {
            return null;
          }
        }
        
        // Filter by minimum age
        if (config.filters?.min_age_hours > 0) {
          const prAge = Date.now() - new Date(pr.createdAt).getTime();
          const minAge = config.filters.min_age_hours * 60 * 60 * 1000;
          if (prAge < minAge) {
            return null;
          }
        }
        
        // Get reviewers who have already reviewed
        const reviewedBy = [...new Set(
          pr.reviews.nodes
            .filter(review => review.author && review.state !== 'COMMENTED')
            .map(review => review.author.login)
        )];
        
        // Get pending reviewers (requested but haven't reviewed yet)
        const pendingReviewers = pr.reviewRequests.nodes
          .map(request => {
            const reviewer = request.requestedReviewer;
            // Handle both User and Team reviewers
            return reviewer.login || reviewer.name;
          })
          .filter(reviewer => !reviewedBy.includes(reviewer));
        
        // Skip PRs with no pending reviewers
        if (pendingReviewers.length === 0) {
          return null;
        }
        
        // Calculate PR age
        const createdAt = new Date(pr.createdAt);
        const ageMs = Date.now() - createdAt.getTime();
        const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
        const ageHours = Math.floor((ageMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        return {
          number: pr.number,
          title: pr.title,
          url: pr.url,
          author: pr.author.login,
          created_at: pr.createdAt,
          updated_at: pr.updatedAt,
          draft: pr.isDraft,
          labels: prLabels,
          requested_reviewers: pendingReviewers,
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
      })
      .filter(pr => pr !== null);
    
    console.log(`    ✓ Found ${processedPRs.length} PRs with pending reviewers (${pulls.length} total open PRs)`);
    
    return processedPRs;
    
  } catch (error) {
    console.error(`    ✗ Error fetching PRs from ${owner}/${repo}:`, error.message);
    return [];
  }
}

/**
 * Fetch PRs from all configured repositories using GraphQL
 */
async function fetchPRs(config) {
  const graphqlClient = createGraphQLClient();
  const allPRs = [];
  
  // Iterate through all configured repositories
  for (const repoGroup of config.repositories) {
    const { owner, repos } = repoGroup;
    
    for (const repo of repos) {
      const prs = await fetchRepoPRs(graphqlClient, owner, repo, config);
      allPRs.push(...prs);
    }
  }
  
  const totalRepos = config.repositories.reduce((sum, group) => sum + group.repos.length, 0);
  
  console.log(`\n  ✅ Total PRs with pending reviewers: ${allPRs.length}`);
  console.log(`  ✅ Total API requests: ${totalRepos} (GraphQL)`);
  console.log(`  💡 Saved ~${(allPRs.length * 2)} requests vs REST API`);
  
  return allPRs;
}

module.exports = {
  fetchPRs,
  createGraphQLClient
};
