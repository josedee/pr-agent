/**
 * PR Aggregator
 * 
 * Aggregates PRs by reviewer and enriches with reviewer information
 */

/**
 * Find reviewer information from config
 */
function findReviewerInfo(githubUsername, config) {
  const reviewer = config.reviewers.find(
    r => r.github_username.toLowerCase() === githubUsername.toLowerCase()
  );
  
  if (!reviewer) {
    // Return default info if reviewer not found in config
    return {
      github_username: githubUsername,
      slack_id: null,
      email: null,
      name: githubUsername
    };
  }
  
  return reviewer;
}

/**
 * Aggregate PRs by reviewer
 * 
 * Returns an object where keys are GitHub usernames and values are:
 * {
 *   reviewer: { github_username, slack_id, email, name },
 *   prs: [ array of PR objects ]
 * }
 */
function aggregatePRsByReviewer(allPRs, config) {
  const prsByReviewer = {};
  
  // Iterate through all PRs
  for (const pr of allPRs) {
    // Each PR can have multiple requested reviewers
    for (const reviewerUsername of pr.requested_reviewers) {
      // Initialize reviewer entry if it doesn't exist
      if (!prsByReviewer[reviewerUsername]) {
        const reviewerInfo = findReviewerInfo(reviewerUsername, config);
        prsByReviewer[reviewerUsername] = {
          reviewer: reviewerInfo,
          prs: []
        };
      }
      
      // Add PR to this reviewer's list
      prsByReviewer[reviewerUsername].prs.push(pr);
    }
  }
  
  // Sort PRs for each reviewer by age (oldest first)
  for (const reviewerUsername in prsByReviewer) {
    prsByReviewer[reviewerUsername].prs.sort((a, b) => {
      return b.age.total_hours - a.age.total_hours;
    });
  }
  
  // Log summary
  console.log('  Reviewer breakdown:');
  for (const reviewerUsername in prsByReviewer) {
    const { reviewer, prs } = prsByReviewer[reviewerUsername];
    console.log(`    ${reviewer.name || reviewerUsername}: ${prs.length} PR${prs.length !== 1 ? 's' : ''}`);
  }
  
  return prsByReviewer;
}

/**
 * Get statistics about PRs
 */
function getPRStatistics(prsByReviewer) {
  const stats = {
    totalReviewers: Object.keys(prsByReviewer).length,
    totalPRs: 0,
    oldestPR: null,
    newestPR: null,
    avgPRsPerReviewer: 0
  };
  
  let oldestAge = 0;
  let newestAge = Infinity;
  
  for (const reviewerUsername in prsByReviewer) {
    const { prs } = prsByReviewer[reviewerUsername];
    stats.totalPRs += prs.length;
    
    for (const pr of prs) {
      if (pr.age.total_hours > oldestAge) {
        oldestAge = pr.age.total_hours;
        stats.oldestPR = pr;
      }
      if (pr.age.total_hours < newestAge) {
        newestAge = pr.age.total_hours;
        stats.newestPR = pr;
      }
    }
  }
  
  if (stats.totalReviewers > 0) {
    stats.avgPRsPerReviewer = (stats.totalPRs / stats.totalReviewers).toFixed(1);
  }
  
  return stats;
}

module.exports = {
  aggregatePRsByReviewer,
  findReviewerInfo,
  getPRStatistics
};

