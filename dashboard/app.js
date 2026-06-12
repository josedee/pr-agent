/**
 * PR Agent Dashboard - Main Application
 * Handles data loading, rendering, and interactivity
 */

// Global state
let dashboardData = null;
let currentView = 'all';
let searchQuery = '';
let selectedRepositories = new Set(); // Track selected repositories for filtering
let selectedReviewers = new Set(); // Track selected reviewers for filtering

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupEventListeners();
    loadDashboardData();
});

/**
 * Initialize theme from localStorage
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon(savedTheme);
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadDashboardData(true);
    });
    
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderCurrentView();
    });
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchView(e.target.dataset.view);
        });
    });
}

/**
 * Toggle theme between light and dark
 */
function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    const newTheme = isDark ? 'light' : 'dark';
    
    if (isDark) {
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.add('dark-mode');
    }
    
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle .icon');
    icon.textContent = theme === 'light' ? 'Dark' : 'Light';
}

/**
 * Load dashboard data from JSON file
 */
async function loadDashboardData(forceRefresh = false) {
    showLoading();
    
    try {
        // Add cache busting parameter if force refresh
        const url = forceRefresh ? `data.json?t=${Date.now()}` : 'data.json';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        dashboardData = await response.json();
        renderDashboard();
        hideLoading();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError(error.message);
    }
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('error').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}

/**
 * Show error state
 */
function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

/**
 * Render entire dashboard
 */
function renderDashboard() {
    renderStats();
    renderCurrentView();
}

/**
 * Render statistics cards
 */
function renderStats() {
    const { stats, prsByReviewer, prs } = dashboardData;
    
    // Calculate totalReviewers if not present in stats
    const totalReviewers = stats.totalReviewers || Object.keys(prsByReviewer || {}).length;
    
    // Calculate count of old PRs (>10 days)
    const oldPRsCount = prs.filter(pr => pr.priority === 'old').length;
    
    // Find oldest PR
    const oldestPR = prs.reduce((oldest, pr) =>
        pr.age.totalHours > oldest.age.totalHours ? pr : oldest
    , prs[0]);
    
    document.getElementById('totalPRs').textContent = stats.totalPRs;
    document.getElementById('totalReviewers').textContent = totalReviewers;
    document.getElementById('priorityPRs').textContent = oldPRsCount;
    document.getElementById('oldestPR').textContent = oldestPR.age.formatted;
    
    // Format last updated time
    const lastUpdated = new Date(dashboardData.generated);
    document.getElementById('lastUpdated').textContent = formatRelativeTime(lastUpdated);
}

/**
 * Switch between different views
 */
function switchView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Hide all views
    document.querySelectorAll('.view-container').forEach(container => {
        container.style.display = 'none';
    });
    
    // Hide filters when switching away from their respective views
    if (view !== 'repository') {
        hideRepositoryFilters();
    }
    if (view !== 'reviewer') {
        hideReviewerFilters();
    }
    
    // Show selected view
    const viewMap = {
        'all': 'allPRsView',
        'priority': 'priorityView',
        'reviewer': 'reviewerView',
        'repository': 'repositoryView'
    };
    
    document.getElementById(viewMap[view]).style.display = 'block';
    renderCurrentView();
}

/**
 * Render current view based on selection
 */
function renderCurrentView() {
    switch (currentView) {
        case 'all':
            renderAllPRs();
            break;
        case 'priority':
            renderPriorityPRs();
            break;
        case 'reviewer':
            renderByReviewer();
            break;
        case 'repository':
            renderByRepository();
            break;
    }
}

/**
 * Render all PRs view
 */
function renderAllPRs() {
    const filteredPRs = filterPRs(dashboardData.prs);
    const container = document.getElementById('allPRsList');
    
    if (filteredPRs.length === 0) {
        container.innerHTML = renderEmptyState('No PRs found');
        return;
    }
    
    // Sort by age (oldest first)
    const sortedPRs = [...filteredPRs].sort((a, b) => b.age.totalHours - a.age.totalHours);
    
    container.innerHTML = sortedPRs.map(pr => renderPRCard(pr)).join('');
}

/**
 * Render priority PRs view
 */
function renderPriorityPRs() {
    // Filter to show only "old" PRs (>10 days)
    const oldPRs = dashboardData.prs.filter(pr => pr.priority === 'old');
    const filteredPRs = filterPRs(oldPRs);
    const container = document.getElementById('priorityPRsList');
    
    if (filteredPRs.length === 0) {
        container.innerHTML = renderEmptyState('No old PRs found');
        return;
    }
    
    container.innerHTML = filteredPRs.map(pr => renderPRCard(pr)).join('');
}

/**
 * Render PRs grouped by reviewer
 */
function renderByReviewer() {
    const container = document.getElementById('reviewerList');
    const prsByReviewer = dashboardData.prsByReviewer;
    
    const reviewers = Object.keys(prsByReviewer).sort();
    
    if (reviewers.length === 0) {
        container.innerHTML = renderEmptyState('No reviewers found');
        return;
    }
    
    // Render reviewer filter buttons
    renderReviewerFilters(reviewers);
    
    container.innerHTML = reviewers.map(reviewer => {
        const prs = filterPRs(prsByReviewer[reviewer]);
        if (prs.length === 0 && searchQuery) return '';
        
        // Hide reviewer group if it's not selected (when filters are active)
        const isVisible = selectedReviewers.size === 0 || selectedReviewers.has(reviewer);
        const displayStyle = isVisible ? '' : 'style="display: none;"';
        
        return `
            <div class="reviewer-group" data-reviewer="${escapeHtml(reviewer)}" ${displayStyle}>
                <div class="group-header">
                    <h3 class="group-title">${reviewer}</h3>
                    <span class="group-count">${prs.length} PR${prs.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="pr-list">
                    ${prs.length > 0 ? prs.map(pr => renderPRCard(pr)).join('') : '<p class="empty-state">No matching PRs</p>'}
                </div>
            </div>
        `;
    }).filter(html => html).join('');
}

/**
 * Render PRs grouped by repository
 */
function renderByRepository() {
    const container = document.getElementById('repositoryList');
    const prsByRepository = dashboardData.prsByRepository;
    
    const repositories = Object.keys(prsByRepository).sort();
    
    if (repositories.length === 0) {
        container.innerHTML = renderEmptyState('No repositories found');
        return;
    }
    
    // Render repository filter buttons
    renderRepositoryFilters(repositories);
    
    container.innerHTML = repositories.map(repo => {
        const prs = filterPRs(prsByRepository[repo]);
        if (prs.length === 0 && searchQuery) return '';
        
        // Hide repository group if it's not selected (when filters are active)
        const isVisible = selectedRepositories.size === 0 || selectedRepositories.has(repo);
        const displayStyle = isVisible ? '' : 'style="display: none;"';
        
        return `
            <div class="repository-group" data-repo="${escapeHtml(repo)}" ${displayStyle}>
                <div class="group-header">
                    <h3 class="group-title">${repo}</h3>
                    <span class="group-count">${prs.length} PR${prs.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="pr-list">
                    ${prs.length > 0 ? prs.map(pr => renderPRCard(pr)).join('') : '<p class="empty-state">No matching PRs</p>'}
                </div>
            </div>
        `;
    }).filter(html => html).join('');
}

/**
 * Render repository filter buttons
 */
function renderRepositoryFilters(repositories) {
    const filterContainer = document.getElementById('repositoryFilters');
    
    if (!filterContainer) return;
    
    // Show filter container
    filterContainer.style.display = 'block';
    
    // Create filter buttons
    const buttonsHTML = repositories.map(repo => {
        const isSelected = selectedRepositories.has(repo);
        const activeClass = isSelected ? 'active' : '';
        return `
            <button class="repo-filter-btn ${activeClass}" data-repo="${escapeHtml(repo)}">
                ${escapeHtml(repo)}
            </button>
        `;
    }).join('');
    
    filterContainer.innerHTML = `
        <div class="repo-filters-header">
            <span class="filter-label">Filter by Repository:</span>
            <button class="clear-filters-btn" ${selectedRepositories.size === 0 ? 'style="display: none;"' : ''}>
                Clear Filters
            </button>
        </div>
        <div class="repo-filter-buttons">
            ${buttonsHTML}
        </div>
    `;
    
    // Add event listeners to filter buttons
    filterContainer.querySelectorAll('.repo-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleRepositoryFilter(btn.dataset.repo));
    });
    
    // Add event listener to clear button
    const clearBtn = filterContainer.querySelector('.clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearRepositoryFilters);
    }
}

/**
 * Toggle repository filter
 */
function toggleRepositoryFilter(repo) {
    if (selectedRepositories.has(repo)) {
        selectedRepositories.delete(repo);
    } else {
        selectedRepositories.add(repo);
    }
    renderCurrentView();
}

/**
 * Clear all repository filters
 */
function clearRepositoryFilters() {
    selectedRepositories.clear();
    renderCurrentView();
}

/**
 * Hide repository filters when switching views
 */
function hideRepositoryFilters() {
    const filterContainer = document.getElementById('repositoryFilters');
    if (filterContainer) {
        filterContainer.style.display = 'none';
    }
}

/**
 * Render reviewer filter buttons
 */
function renderReviewerFilters(reviewers) {
    const filterContainer = document.getElementById('reviewerFilters');
    
    if (!filterContainer) return;
    
    // Show filter container
    filterContainer.style.display = 'block';
    
    // Create filter buttons
    const buttonsHTML = reviewers.map(reviewer => {
        const isSelected = selectedReviewers.has(reviewer);
        const activeClass = isSelected ? 'active' : '';
        return `
            <button class="reviewer-filter-btn ${activeClass}" data-reviewer="${escapeHtml(reviewer)}">
                ${escapeHtml(reviewer)}
            </button>
        `;
    }).join('');
    
    filterContainer.innerHTML = `
        <div class="reviewer-filters-header">
            <span class="filter-label">Filter by Reviewer:</span>
            <button class="clear-filters-btn" ${selectedReviewers.size === 0 ? 'style="display: none;"' : ''}>
                Clear Filters
            </button>
        </div>
        <div class="reviewer-filter-buttons">
            ${buttonsHTML}
        </div>
    `;
    
    // Add event listeners to filter buttons
    filterContainer.querySelectorAll('.reviewer-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleReviewerFilter(btn.dataset.reviewer));
    });
    
    // Add event listener to clear button
    const clearBtn = filterContainer.querySelector('.clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearReviewerFilters);
    }
}

/**
 * Toggle reviewer filter
 */
function toggleReviewerFilter(reviewer) {
    if (selectedReviewers.has(reviewer)) {
        selectedReviewers.delete(reviewer);
    } else {
        selectedReviewers.add(reviewer);
    }
    renderCurrentView();
}

/**
 * Clear all reviewer filters
 */
function clearReviewerFilters() {
    selectedReviewers.clear();
    renderCurrentView();
}

/**
 * Hide reviewer filters when switching views
 */
function hideReviewerFilters() {
    const filterContainer = document.getElementById('reviewerFilters');
    if (filterContainer) {
        filterContainer.style.display = 'none';
    }
}

/**
 * Render a single PR card
 */
function renderPRCard(pr) {
    const priorityLabel = pr.priority.charAt(0).toUpperCase() + pr.priority.slice(1);
    const priorityClass = `priority-${pr.priority}`;
    
    return `
        <div class="pr-card">
            <div class="pr-header">
                <div class="pr-title-section">
                    <a href="${pr.url}" target="_blank" rel="noopener noreferrer" class="pr-title">
                        ${escapeHtml(pr.title)}
                    </a>
                    <div class="pr-repo">${escapeHtml(pr.repository)}</div>
                </div>
            </div>
            
            <div class="pr-footer">
                <div class="pr-meta">
                    <span>#${pr.number}</span>
                    <span class="separator">·</span>
                    <span>by @${escapeHtml(pr.author)}</span>
                    <span class="separator">·</span>
                    <span>${pr.age.formatted} ago</span>
                </div>
                <div class="pr-actions">
                    <span class="badge ${priorityClass}">${priorityLabel}</span>
                    ${pr.reviewers.map(reviewer => `
                        <span class="reviewer-tag">@${escapeHtml(reviewer)}</span>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render empty state
 */
function renderEmptyState(message) {
    return `
        <div class="empty-state">
            <div class="empty-state-icon">📭</div>
            <p>${message}</p>
        </div>
    `;
}

/**
 * Filter PRs based on search query
 */
function filterPRs(prs) {
    if (!searchQuery) return prs;
    
    return prs.filter(pr => {
        const searchableText = [
            pr.title,
            pr.author,
            pr.repository,
            pr.number.toString(),
            ...pr.reviewers,
            ...pr.labels
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchQuery);
    });
}

/**
 * Format hours to human-readable string
 */
function formatHours(hours) {
    if (hours < 24) {
        return `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
