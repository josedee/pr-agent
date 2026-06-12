/**
 * Dashboard Data Generator
 * 
 * Generates JSON data file for the PR Agent Dashboard
 * This script is called by GitHub Actions after fetching PRs
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate dashboard data from PR information
 */
function generateDashboardData(prs, reviewerMap) {
  const timestamp = new Date().toISOString();
  
  // Calculate statistics
  const stats = {
    totalPRs: prs.length,
    totalReviewers: reviewerMap.size,
    avgPRAge: calculateAveragePRAge(prs),
    oldestPR: findOldestPR(prs),
    repositories: getRepositoryStats(prs)
  };
  
  // Group PRs by reviewer
  const prsByReviewer = groupPRsByReviewer(prs);
  
  // Group PRs by repository
  const prsByRepository = groupPRsByRepository(prs);
  
  // Priority PRs (older than 3 days)
  const priorityPRs = prs.filter(pr => pr.age.days >= 3);
  
  return {
    generated: timestamp,
    stats,
    prs: prs.map(formatPRForDashboard),
    prsByReviewer,
    prsByRepository,
    priorityPRs: priorityPRs.map(formatPRForDashboard)
  };
}

/**
 * Format PR data for dashboard display
 */
function formatPRForDashboard(pr) {
  return {
    number: pr.number,
    title: pr.title,
    url: pr.url,
    author: pr.author,
    repository: pr.repository.full_name,
    age: {
      days: pr.age.days,
      hours: pr.age.hours,
      formatted: pr.age.formatted,
      totalHours: pr.age.total_hours
    },
    reviewers: pr.requested_reviewers,
    labels: pr.labels,
    draft: pr.draft,
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    priority: getPriority(pr)
  };
}

/**
 * Calculate priority based on PR age
 */
function getPriority(pr) {
  const days = pr.age.days;
  if (days > 10) return 'old';
  if (days > 3) return 'moderate';
  return 'new';
}

/**
 * Group PRs by reviewer
 */
function groupPRsByReviewer(prs) {
  const grouped = {};
  
  prs.forEach(pr => {
    pr.requested_reviewers.forEach(reviewer => {
      if (!grouped[reviewer]) {
        grouped[reviewer] = [];
      }
      grouped[reviewer].push(formatPRForDashboard(pr));
    });
  });
  
  // Sort PRs within each reviewer by age (oldest first)
  Object.keys(grouped).forEach(reviewer => {
    grouped[reviewer].sort((a, b) => b.age.totalHours - a.age.totalHours);
  });
  
  return grouped;
}

/**
 * Group PRs by repository
 */
function groupPRsByRepository(prs) {
  const grouped = {};
  
  prs.forEach(pr => {
    const repo = pr.repository.full_name;
    if (!grouped[repo]) {
      grouped[repo] = [];
    }
    grouped[repo].push(formatPRForDashboard(pr));
  });
  
  // Sort PRs within each repository by age (oldest first)
  Object.keys(grouped).forEach(repo => {
    grouped[repo].sort((a, b) => b.age.totalHours - a.age.totalHours);
  });
  
  return grouped;
}

/**
 * Calculate average PR age in hours
 */
function calculateAveragePRAge(prs) {
  if (prs.length === 0) return 0;
  const totalHours = prs.reduce((sum, pr) => sum + pr.age.total_hours, 0);
  return Math.round(totalHours / prs.length);
}

/**
 * Find oldest PR
 */
function findOldestPR(prs) {
  if (prs.length === 0) return null;
  return prs.reduce((oldest, pr) => 
    pr.age.total_hours > oldest.age.total_hours ? pr : oldest
  );
}

/**
 * Get repository statistics
 */
function getRepositoryStats(prs) {
  const stats = {};
  
  prs.forEach(pr => {
    const repo = pr.repository.full_name;
    if (!stats[repo]) {
      stats[repo] = {
        name: repo,
        count: 0,
        avgAge: 0,
        totalHours: 0
      };
    }
    stats[repo].count++;
    stats[repo].totalHours += pr.age.total_hours;
  });
  
  // Calculate average age for each repository
  Object.keys(stats).forEach(repo => {
    stats[repo].avgAge = Math.round(stats[repo].totalHours / stats[repo].count);
  });
  
  return Object.values(stats);
}

/**
 * Save dashboard data to JSON file
 */
function saveDashboardData(data, outputPath) {
  const jsonData = JSON.stringify(data, null, 2);
  fs.writeFileSync(outputPath, jsonData, 'utf8');
  console.log(`✓ Dashboard data saved to ${outputPath}`);
  console.log(`  Total PRs: ${data.stats.totalPRs}`);
  console.log(`  Total Reviewers: ${data.stats.totalReviewers}`);
  console.log(`  Priority PRs: ${data.priorityPRs.length}`);
}

/**
 * Main function - called from PR Agent
 */
function generateFromPRAgent(prs, reviewerMap, outputDir = './dashboard') {
  const data = generateDashboardData(prs, reviewerMap);
  const outputPath = path.join(outputDir, 'data.json');
  
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  saveDashboardData(data, outputPath);
  
  return data;
}

module.exports = {
  generateDashboardData,
  generateFromPRAgent,
  formatPRForDashboard
};
