/**
 * PR Agent Dashboard - Main Application
 * Handles data loading, rendering, and interactivity
 */

// Global state
let dashboardData = null;
let currentView = 'all';
let searchQuery = '';

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
    document.documentElement.setAttribute('data-theme', savedTheme);
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
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle .icon');
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
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
    const { stats, priorityPRs } = dashboardData;
    
    document.getElementById('totalPRs').textContent = stats.totalPRs;
    document.getElementById('totalReviewers').textContent = stats.totalReviewers;
    document.getElementById('priorityPRs').textContent = priorityPRs.length;
    document.getElementById('avgAge').textContent = formatHours(stats.avgPRAge);
    
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
    
    container.innerHTML = filteredPRs.map(pr => renderPRCard(pr)).join('');
}

/**
 * Render priority PRs view
 */
function renderPriorityPRs() {
    const filteredPRs = filterPRs(dashboardData.priorityPRs);
    const container = document.getElementById('priorityPRsList');
    
    if (filteredPRs.length === 0) {
        container.innerHTML = renderEmptyState('No priority PRs found');
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
    
    container.innerHTML = reviewers.map(reviewer => {
        const prs = filterPRs(prsByReviewer[reviewer]);
        if (prs.length === 0 && searchQuery) return '';
        
        return `
            <div class="reviewer-group">
                <div class="group-header">
                    <h3 class="group-title">👤 ${reviewer}</h3>
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
    
    container.innerHTML = repositories.map(repo => {
        const prs = filterPRs(prsByRepository[repo]);
        if (prs.length === 0 && searchQuery) return '';
        
        return `
            <div class="repository-group">
                <div class="group-header">
                    <h3 class="group-title">📦 ${repo}</h3>
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
 * Render a single PR card
 */
function renderPRCard(pr) {
    const priorityClass = `priority-${pr.priority}`;
    
    return `
        <div class="pr-card ${priorityClass}">
            <div class="pr-header">
                <div class="pr-title">
                    <a href="${pr.url}" target="_blank" rel="noopener noreferrer">
                        ${escapeHtml(pr.title)}
                    </a>
                    <div class="pr-number">#${pr.number}</div>
                </div>
                <div class="pr-age ${priorityClass}">
                    ⏱️ ${pr.age.formatted}
                </div>
            </div>
            
            <div class="pr-meta">
                <div class="pr-meta-item">
                    <span>👤</span>
                    <span>${escapeHtml(pr.author)}</span>
                </div>
                <div class="pr-meta-item">
                    <span>📦</span>
                    <span>${escapeHtml(pr.repository)}</span>
                </div>
                ${pr.draft ? '<div class="pr-meta-item"><span>📝</span><span>Draft</span></div>' : ''}
            </div>
            
            ${pr.labels.length > 0 ? `
                <div class="pr-labels">
                    ${pr.labels.map(label => `<span class="pr-label">${escapeHtml(label)}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="pr-reviewers">
                <strong>Reviewers:</strong>
                ${pr.reviewers.map(reviewer => `
                    <span class="reviewer-badge">
                        <span>👤</span>
                        <span>${escapeHtml(reviewer)}</span>
                    </span>
                `).join('')}
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
