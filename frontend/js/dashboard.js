/**
 * ImageToTextOnline - Dashboard Module
 * 
 * Handles dashboard functionality: history, admin panel, analytics.
 * 
 * @version 1.0.0
 */

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const DASHBOARD_CONFIG = {
    HISTORY_API: '/api/history',
    ADMIN_API: '/api/admin',
    AUTH_API: '/api/auth',
    ITEMS_PER_PAGE: 20,
    LOGIN_PAGE: '/auth/login'
};

/* ==========================================================================
   STATE
   ========================================================================== */

const DashboardState = {
    user: null,
    isAdmin: false,
    currentView: 'user', // 'user' or 'admin'
    historyPage: 1,
    usersPage: 1,
    allHistoryItems: [],
    historySearchQuery: '',
    cardPage: 1,
    CARDS_PER_PAGE: 3,
    adminUsersPage: 1,
    ADMIN_USERS_PER_PAGE: 2,
    adminAllUsers: []
};

/* ==========================================================================
   API SERVICE
   ========================================================================== */

const DashboardAPI = {
    // Get current user
    async getMe() {
        const response = await fetch(`${DASHBOARD_CONFIG.AUTH_API}/me`, { credentials: 'include' });
        return response.json();
    },

    // History endpoints
    async getHistory(page = 1) {
        const response = await fetch(`${DASHBOARD_CONFIG.HISTORY_API}?page=${page}&limit=${DASHBOARD_CONFIG.ITEMS_PER_PAGE}`, { credentials: 'include' });
        return response.json();
    },

    async deleteHistory(id) {
        const response = await fetch(`${DASHBOARD_CONFIG.HISTORY_API}/${id}`, { method: 'DELETE', credentials: 'include' });
        return response.json();
    },

    // Admin endpoints
    async getStats() {
        const response = await fetch(`${DASHBOARD_CONFIG.ADMIN_API}/stats`, { credentials: 'include' });
        return response.json();
    },

    async getUsers(page = 1) {
        const response = await fetch(`${DASHBOARD_CONFIG.ADMIN_API}/users?page=${page}&limit=10`, { credentials: 'include' });
        return response.json();
    },

    async toggleUserStatus(userId) {
        const response = await fetch(`${DASHBOARD_CONFIG.ADMIN_API}/users/${userId}/status`, { method: 'PATCH', credentials: 'include' });
        return response.json();
    },

    async changeUserRole(userId, role) {
        const response = await fetch(`${DASHBOARD_CONFIG.ADMIN_API}/users/${userId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ role })
        });
        return response.json();
    }
};

/* ==========================================================================
   UI UTILITIES
   ========================================================================== */

const DashboardUI = {
    showToast(message, type = 'info') {
        const container = document.querySelector('.toast-container') || DashboardUI.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    },

    createToastContainer() {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    truncateText(text, maxLength = 50) {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    },

    getInitials(username) {
        return username ? username.substring(0, 2).toUpperCase() : 'U';
    },

    getRoleBadgeClass(role) {
        const classes = {
            superadmin: 'bg-danger text-white',
            admin: 'bg-primary text-white',
            user: 'bg-secondary text-white'
        };
        return classes[role] || classes.user;
    }
};

/* ==========================================================================
   HISTORY MANAGEMENT
   ========================================================================== */

const HistoryManager = {
    async load(page = 1) {
        try {
            const result = await DashboardAPI.getHistory(page);
            if (result.success) {
                DashboardState.historyPage = page;
                DashboardState.allHistoryItems = result.data;
                HistoryManager.renderFiltered(result.pagination);
            } else {
                DashboardUI.showToast(result.error || 'Failed to load history', 'danger');
            }
        } catch (error) {
            console.error('History load error:', error);
            DashboardUI.showToast('Failed to load history', 'danger');
        }
    },

    /**
     * Filter items by search query then render both views
     */
    renderFiltered(pagination) {
        const query = DashboardState.historySearchQuery.toLowerCase().trim();
        let items = DashboardState.allHistoryItems;

        if (query) {
            items = items.filter(item => {
                const filename = (item.originalFileName || '').toLowerCase();
                const dateStr = DashboardUI.formatDate(item.conversionDate).toLowerCase();
                const text = (item.extractedText || '').toLowerCase();
                return filename.includes(query) || dateStr.includes(query) || text.includes(query);
            });
        }

        HistoryManager.renderTable(items);
        HistoryManager.renderCards(items);
        HistoryManager.renderPagination(pagination);
    },

    /**
     * Desktop: table rows
     */
    renderTable(items) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2 mb-0">${DashboardState.historySearchQuery ? 'No results found' : 'No conversion history yet'}</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = items.map(item => `
                <tr data-id="${item._id}" style="cursor: pointer;" onclick="HistoryManager.showDetail('${item._id}', '${item.originalFileName || 'Untitled'}', \`${encodeURIComponent(item.extractedText || '')}\`, '${item.conversionDate}')">
                    <td>${DashboardUI.formatDate(item.conversionDate)}</td>
                    <td>${item.originalFileName || 'Untitled'}</td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${DashboardUI.truncateText(item.extractedText, 80)}
                    </td>
                    <td onclick="event.stopPropagation();">
                        <div class="data-table__actions" style="font-size: 1.25rem;">
                            <button class="btn btn--secondary" style="padding: 0.5rem 0.75rem;" title="Copy" onclick="HistoryManager.copy('${item._id}', \`${encodeURIComponent(item.extractedText || '')}\`)">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            <button class="btn btn--secondary" style="padding: 0.5rem 0.75rem;" title="Download" onclick="HistoryManager.download('${item.originalFileName || 'text'}', \`${encodeURIComponent(item.extractedText || '')}\`)">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn--secondary" style="padding: 0.5rem 0.75rem; color: var(--color-error);" title="Delete" onclick="HistoryManager.delete('${item._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        }
        // Enhance table with bulk selection checkboxes
        if (typeof BulkSelection !== 'undefined') BulkSelection.enhanceTable('historyTable');
    },

    /**
     * Mobile/Tablet: card layout with client-side pagination (3 per page)
     */
    renderCards(items) {
        const container = document.getElementById('historyCardsContainer');
        if (!container) return;

        if (!items || items.length === 0) {
            container.innerHTML = `
                <div class="history-empty">
                    <i class="bi bi-inbox"></i>
                    <p>${DashboardState.historySearchQuery ? 'No results found' : 'No conversion history yet'}</p>
                </div>
            `;
            return;
        }

        // Client-side pagination
        const perPage = DashboardState.CARDS_PER_PAGE;
        const totalPages = Math.ceil(items.length / perPage);
        if (DashboardState.cardPage > totalPages) DashboardState.cardPage = totalPages;
        if (DashboardState.cardPage < 1) DashboardState.cardPage = 1;
        const start = (DashboardState.cardPage - 1) * perPage;
        const pageItems = items.slice(start, start + perPage);

        let html = pageItems.map(item => {
            const encodedText = encodeURIComponent(item.extractedText || '');
            const filename = item.originalFileName || 'Untitled';
            return `
                <div class="history-card" data-id="${item._id}" onclick="HistoryManager.showDetail('${item._id}', '${filename}', '${encodedText}', '${item.conversionDate}')">
                    <div class="history-card__header">
                        <span class="history-card__filename">
                            <i class="bi bi-file-earmark-text me-1"></i>${filename}
                        </span>
                        <span class="history-card__date">${DashboardUI.formatDate(item.conversionDate)}</span>
                    </div>
                    <div class="history-card__snippet">${DashboardUI.truncateText(item.extractedText, 120) || 'No text extracted'}</div>
                    <div class="history-card__actions" onclick="event.stopPropagation();">
                        <button class="btn btn--secondary btn--sm" title="Copy" onclick="HistoryManager.copy('${item._id}', '${encodedText}')">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="btn btn--secondary btn--sm" title="Download" onclick="HistoryManager.download('${filename}', '${encodedText}')">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn--secondary btn--sm" style="color: var(--color-error);" title="Delete" onclick="HistoryManager.delete('${item._id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Render card pagination if > 1 page
        if (totalPages > 1) {
            html += `<div class="history-card-pagination">`;
            html += `<button class="btn btn--secondary btn--sm" ${DashboardState.cardPage === 1 ? 'disabled' : ''} onclick="HistoryManager.goCardPage(${DashboardState.cardPage - 1})"><i class="bi bi-chevron-left"></i></button>`;
            for (let i = 1; i <= totalPages; i++) {
                html += `<button class="btn btn--sm ${i === DashboardState.cardPage ? 'btn--primary' : 'btn--secondary'}" onclick="HistoryManager.goCardPage(${i})">${i}</button>`;
            }
            html += `<button class="btn btn--secondary btn--sm" ${DashboardState.cardPage === totalPages ? 'disabled' : ''} onclick="HistoryManager.goCardPage(${DashboardState.cardPage + 1})"><i class="bi bi-chevron-right"></i></button>`;
            html += `</div>`;
        }

        container.innerHTML = html;
        // Enhance cards with bulk selection (long-press)
        if (typeof BulkSelection !== 'undefined') BulkSelection.enhanceCards('.history-card[data-id]');
    },

    goCardPage(page) {
        DashboardState.cardPage = page;
        HistoryManager.renderFiltered();
    },

    renderPagination(pagination) {
        const container = document.getElementById('historyPagination');
        if (!container || !pagination) return;

        const { page, pages } = pagination;
        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<nav><ul class="pagination pagination-sm mb-0">';

        // Previous
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="HistoryManager.load(${page - 1}); return false;">Prev</a>
        </li>`;

        // Page numbers
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                html += `<li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="HistoryManager.load(${i}); return false;">${i}</a>
                </li>`;
            } else if (i === page - 2 || i === page + 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next
        html += `<li class="page-item ${page === pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="HistoryManager.load(${page + 1}); return false;">Next</a>
        </li>`;

        html += '</ul></nav>';
        container.innerHTML = html;
    },

    /**
     * Initialize search input + refresh button
     */
    initSearch() {
        const searchInput = document.getElementById('historySearchInput');
        const refreshBtn = document.getElementById('historyRefreshBtn');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                DashboardState.historySearchQuery = searchInput.value;
                DashboardState.cardPage = 1;
                HistoryManager.renderFiltered();
            });
        }

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                DashboardState.historySearchQuery = '';
                DashboardState.cardPage = 1;
                HistoryManager.load(1);
            });
        }
    },

    copy(id, encodedText) {
        const text = decodeURIComponent(encodedText);
        navigator.clipboard.writeText(text).then(() => {
            DashboardUI.showToast('Copied to clipboard!', 'success');
        }).catch(() => {
            DashboardUI.showToast('Failed to copy', 'danger');
        });
    },

    download(filename, encodedText) {
        const text = decodeURIComponent(encodedText);
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename.replace(/\.[^/.]+$/, '')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    },

    async delete(id) {
        // Use confirmation dialog from auth.js
        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Delete Record',
                'Are you sure you want to delete this record?',
                async () => {
                    await HistoryManager.performDelete(id);
                },
                null,
                'Delete',
                'Cancel',
                'primary'
            );
        } else if (confirm('Are you sure you want to delete this record?')) {
            await HistoryManager.performDelete(id);
        }
    },

    async performDelete(id) {
        try {
            const result = await DashboardAPI.deleteHistory(id);
            if (result.success) {
                DashboardUI.showToast('Record deleted', 'success');
                HistoryManager.load(DashboardState.historyPage);
                // Refresh notifications after deletion
                if (typeof NotificationManager !== 'undefined' && NotificationManager.refresh) {
                    NotificationManager.refresh();
                }
            } else {
                DashboardUI.showToast(result.error || 'Failed to delete', 'danger');
            }
        } catch (error) {
            DashboardUI.showToast('Failed to delete', 'danger');
        }
    },

    showDetail(id, filename, encodedText, date) {
        const text = decodeURIComponent(encodedText);
        const existingModal = document.getElementById('historyDetailModal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div class="modal fade" id="historyDetailModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header text-white" style="background: linear-gradient(135deg, #00838f, #00acc1); align-items: flex-start;">
                            <h5 class="modal-title" style="font-size: 1rem; word-break: break-word; white-space: normal; overflow-wrap: anywhere; max-width: calc(100% - 40px);">
                                <i class="bi bi-file-text me-2"></i>${filename}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(1); opacity: 0.9; flex-shrink: 0;"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <small class="text-muted"><i class="bi bi-calendar me-1"></i>${DashboardUI.formatDate(date)}</small>
                            </div>
                            <div style="background: var(--color-gray-50, #f8f9fa); border-radius: 8px; padding: 1rem; max-height: 50vh; overflow-y: auto; white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 0.85rem; line-height: 1.6;">
${text || 'No text extracted'}
                            </div>
                        </div>
                        <div class="modal-footer" style="justify-content: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem;">
                            <button type="button" class="btn btn-sm" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="HistoryManager.copy('${id}', '${encodedText}'); bootstrap.Modal.getInstance(document.getElementById('historyDetailModal')).hide();">
                                <i class="bi bi-clipboard me-1"></i>Copy
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" style="font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="HistoryManager.download('${filename}', '${encodedText}'); bootstrap.Modal.getInstance(document.getElementById('historyDetailModal')).hide();">
                                <i class="bi bi-download me-1"></i>Download
                            </button>
                            <button type="button" class="btn btn-sm btn-danger" style="font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="bootstrap.Modal.getInstance(document.getElementById('historyDetailModal')).hide(); HistoryManager.delete('${id}');">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        new bootstrap.Modal(document.getElementById('historyDetailModal')).show();
    }
};

/* ==========================================================================
   ADMIN MANAGEMENT
   ========================================================================== */

const AdminManager = {
    async loadStats() {
        try {
            const result = await DashboardAPI.getStats();
            if (result.success) {
                AdminManager.renderStats(result.data);
                AdminManager.renderChart(result.data.conversions.daily);
            }
        } catch (error) {
            console.error('Stats load error:', error);
        }
    },

    renderStats(data) {
        const { users, conversions } = data;

        document.getElementById('statTotalConversions')?.textContent && (document.getElementById('statTotalConversions').textContent = conversions.total);
        document.getElementById('statTotalUsers')?.textContent && (document.getElementById('statTotalUsers').textContent = users.total);
        document.getElementById('statRecentConversions')?.textContent && (document.getElementById('statRecentConversions').textContent = conversions.recent);
        document.getElementById('statNewUsers')?.textContent && (document.getElementById('statNewUsers').textContent = users.new);
    },

    renderChart(dailyData) {
        const canvas = document.getElementById('conversionChart');
        if (!canvas) return;

        // Fill in missing days
        const labels = [];
        const data = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            const dayData = dailyData.find(d => d._id === dateStr);
            data.push(dayData ? dayData.count : 0);
        }

        // HTML/CSS bar chart — responsive, full width
        const maxValue = Math.max(...data, 1);
        const chartContainer = canvas.parentElement;

        chartContainer.innerHTML = `
            <div style="display: flex; align-items: flex-end; gap: 2px; width: 100%; height: 200px; padding: 0 2px; border-bottom: 2px solid #e0e0e0; min-width: 0;">
                ${data.map((value, i) => {
            const heightPercent = Math.max((value / maxValue) * 100, 3);
            return `
                        <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; min-width: 0;">
                            <span style="font-size: clamp(0.65rem, 2vw, 0.85rem); font-weight: 600; color: #00838f; margin-bottom: 2px;">${value}</span>
                            <div style="width: 100%; max-width: 50px; height: ${heightPercent}%; background: linear-gradient(to top, #00838f, #26c6da); border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.4s ease;"></div>
                        </div>
                    `;
        }).join('')}
            </div>
            <div style="display: flex; gap: 2px; width: 100%; padding: 6px 2px 0;">
                ${labels.map(label => `
                    <div style="flex: 1; text-align: center; font-size: clamp(0.6rem, 2vw, 0.85rem); color: #555; font-weight: 500; min-width: 0; overflow: hidden;">${label}</div>
                `).join('')}
            </div>
        `;
    },

    async loadUsers(page = 1) {
        try {
            const result = await DashboardAPI.getUsers(page);
            if (result.success) {
                DashboardState.usersPage = page;
                DashboardState.adminAllUsers = result.data;
                DashboardState.adminUsersPage = 1;
                AdminManager.renderUsers(result.data, result.pagination);
            }
        } catch (error) {
            console.error('Users load error:', error);
        }
    },

    renderUsers(users, pagination) {
        // Paginate at 2 per page
        const perPage = DashboardState.ADMIN_USERS_PER_PAGE;
        const allUsers = users || DashboardState.adminAllUsers;
        const totalPages = Math.ceil(allUsers.length / perPage);
        if (DashboardState.adminUsersPage > totalPages) DashboardState.adminUsersPage = totalPages;
        if (DashboardState.adminUsersPage < 1) DashboardState.adminUsersPage = 1;
        const start = (DashboardState.adminUsersPage - 1) * perPage;
        const pageUsers = allUsers.slice(start, start + perPage);

        // === Table rendering (desktop) ===
        const tbody = document.getElementById('usersTableBody');
        if (tbody) {
            tbody.innerHTML = pageUsers.map(user => {
                const isSelf = user._id === DashboardState.user?._id;
                const isSuperadmin = user.role === 'superadmin';
                const canModify = !isSelf && !isSuperadmin;

                return `
                    <tr data-id="${user._id}" class="${!user.isActive ? 'table-secondary' : ''}">
                        <td>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="dashboard__avatar" style="width: 32px; height: 32px; font-size: 0.875rem;">${DashboardUI.getInitials(user.username)}</div>
                                <span>${user.username}${isSelf ? ' (You)' : ''}</span>
                            </div>
                        </td>
                        <td>${user.email || '-'}</td>
                        <td><span class="badge ${DashboardUI.getRoleBadgeClass(user.role)}">${user.role}</span></td>
                        <td>${DashboardUI.formatDate(user.createdAt)}</td>
                        <td>
                            <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td>
                            <div class="data-table__actions">
                                ${canModify ? `
                                    <button class="btn btn--secondary btn--sm" title="${user.isActive ? 'Deactivate' : 'Activate'}" onclick="AdminManager.toggleStatus('${user._id}')">
                                        <i class="bi bi-${user.isActive ? 'person-x' : 'person-check'}"></i>
                                    </button>
                                    ${DashboardState.user?.role === 'superadmin' ? `
                                        <button class="btn btn--secondary btn--sm" title="${user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}" onclick="AdminManager.toggleRole('${user._id}', '${user.role}')">
                                            <i class="bi bi-${user.role === 'admin' ? 'arrow-down' : 'arrow-up'}"></i>
                                        </button>
                                    ` : ''}
                                ` : '<span class="text-muted">-</span>'}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // === Card rendering (mobile) ===
        const cardsContainer = document.getElementById('adminUsersCardsContainer');
        if (cardsContainer) {
            cardsContainer.innerHTML = pageUsers.map(user => {
                const isSelf = user._id === DashboardState.user?._id;
                const isSuperadmin = user.role === 'superadmin';
                const canModify = !isSelf && !isSuperadmin;

                return `
                    <div class="user-card">
                        <div class="user-card__header">
                            <div class="dashboard__avatar" style="width: 36px; height: 36px; font-size: 0.875rem;">${DashboardUI.getInitials(user.username)}</div>
                            <div class="user-card__info">
                                <div class="user-card__name">${user.username}${isSelf ? ' (You)' : ''}</div>
                                <div class="user-card__email">${user.email || '-'}</div>
                            </div>
                        </div>
                        <div class="user-card__meta">
                            <span class="badge ${DashboardUI.getRoleBadgeClass(user.role)}">${user.role}</span>
                            <span class="badge ${user.isActive ? 'bg-success' : 'bg-danger'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        ${canModify ? `
                            <div class="user-card__actions" onclick="event.stopPropagation();">
                                <button class="btn btn--secondary btn--sm" title="${user.isActive ? 'Deactivate' : 'Activate'}" onclick="AdminManager.toggleStatus('${user._id}')">
                                    <i class="bi bi-${user.isActive ? 'person-x' : 'person-check'}"></i>
                                </button>
                                ${DashboardState.user?.role === 'superadmin' ? `
                                    <button class="btn btn--secondary btn--sm" title="${user.role === 'admin' ? 'Demote' : 'Promote'}" onclick="AdminManager.toggleRole('${user._id}', '${user.role}')">
                                        <i class="bi bi-${user.role === 'admin' ? 'arrow-down' : 'arrow-up'}"></i>
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }

        // === Pagination controls ===
        const paginationContainer = document.getElementById('adminUsersPagination');
        if (paginationContainer && totalPages > 1) {
            let phtml = `<div class="history-card-pagination">`;
            phtml += `<button class="btn btn--secondary btn--sm" ${DashboardState.adminUsersPage === 1 ? 'disabled' : ''} onclick="AdminManager.goUsersPage(${DashboardState.adminUsersPage - 1})"><i class="bi bi-chevron-left"></i></button>`;
            for (let i = 1; i <= totalPages; i++) {
                phtml += `<button class="btn btn--sm ${i === DashboardState.adminUsersPage ? 'btn--primary' : 'btn--secondary'}" onclick="AdminManager.goUsersPage(${i})">${i}</button>`;
            }
            phtml += `<button class="btn btn--secondary btn--sm" ${DashboardState.adminUsersPage === totalPages ? 'disabled' : ''} onclick="AdminManager.goUsersPage(${DashboardState.adminUsersPage + 1})"><i class="bi bi-chevron-right"></i></button>`;
            phtml += `</div>`;
            paginationContainer.innerHTML = phtml;
        } else if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    },

    goUsersPage(page) {
        DashboardState.adminUsersPage = page;
        AdminManager.renderUsers(DashboardState.adminAllUsers);
    },

    async toggleStatus(userId) {
        // Get user info for better messaging
        const row = document.querySelector(`tr[data-id="${userId}"]`);
        const username = row?.querySelector('span')?.textContent?.replace(' (You)', '') || 'this user';
        const isActive = row?.querySelector('.badge.bg-success') !== null;
        const action = isActive ? 'deactivate' : 'reactivate';

        // Double confirmation
        if (typeof UI !== 'undefined' && UI.showDoubleConfirmDialog) {
            UI.showDoubleConfirmDialog(
                `${isActive ? 'Deactivate' : 'Reactivate'} User`,
                `${action.charAt(0).toUpperCase() + action.slice(1)} ${username}?`,
                'Final Confirmation',
                `${isActive ? 'The user will be locked out.' : 'The user will regain access.'}`,
                async () => {
                    await AdminManager.performStatusToggle(userId);
                },
                isActive ? 'danger' : 'primary'
            );
        } else {
            await AdminManager.performStatusToggle(userId);
        }
    },

    async performStatusToggle(userId) {
        try {
            const result = await DashboardAPI.toggleUserStatus(userId);
            if (result.success) {
                DashboardUI.showToast(result.message, 'success');
                AdminManager.loadUsers(DashboardState.usersPage);
            } else {
                DashboardUI.showToast(result.error, 'danger');
            }
        } catch (error) {
            DashboardUI.showToast('Failed to update user', 'danger');
        }
    },

    async toggleRole(userId, currentRole) {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        const action = newRole === 'admin' ? 'promote to Admin' : 'demote to User';

        // Get username
        const row = document.querySelector(`tr[data-id="${userId}"]`);
        const username = row?.querySelector('span')?.textContent?.replace(' (You)', '') || 'this user';

        // Double confirmation
        if (typeof UI !== 'undefined' && UI.showDoubleConfirmDialog) {
            UI.showDoubleConfirmDialog(
                `${newRole === 'admin' ? 'Promote' : 'Demote'} User`,
                `${action.charAt(0).toUpperCase() + action.slice(1)} ${username}?`,
                'Final Confirmation',
                `Are you sure you want to ${action}?`,
                async () => {
                    await AdminManager.performRoleChange(userId, newRole);
                },
                'primary'
            );
        } else {
            await AdminManager.performRoleChange(userId, newRole);
        }
    },

    async performRoleChange(userId, role) {
        try {
            const result = await DashboardAPI.changeUserRole(userId, role);
            if (result.success) {
                DashboardUI.showToast(result.message, 'success');
                AdminManager.loadUsers(DashboardState.usersPage);
            } else {
                DashboardUI.showToast(result.error, 'danger');
            }
        } catch (error) {
            DashboardUI.showToast('Failed to update role', 'danger');
        }
    }
};

/* ==========================================================================
   VIEW SWITCHING
   ========================================================================== */

const ViewManager = {
    init() {
        const switcher = document.getElementById('viewSwitcher');
        if (switcher && DashboardState.isAdmin) {
            switcher.style.display = 'block';
            switcher.querySelector('button')?.addEventListener('click', ViewManager.toggle);
        }
    },

    toggle() {
        const targetView = DashboardState.currentView === 'user' ? 'admin' : 'user';
        const viewName = targetView === 'admin' ? 'Admin' : 'User';

        const doSwitch = async () => {
            if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.show(`Switching to ${viewName} View...`);
            DashboardState.currentView = targetView;
            await ViewManager.update();
            if (typeof LoadingOverlay !== 'undefined') {
                setTimeout(() => LoadingOverlay.hide(), 400);
            }
        };

        // Show confirmation dialog
        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Switch View',
                `Switch to ${viewName} View?`,
                doSwitch,
                null,
                'Confirm',
                'Cancel'
            );
        } else {
            doSwitch();
        }
    },

    update() {
        const isAdmin = DashboardState.currentView === 'admin';

        // Update button text
        const btn = document.getElementById('viewSwitcher')?.querySelector('button');
        if (btn) {
            btn.innerHTML = `<i class="bi bi-${isAdmin ? 'person' : 'shield'}"></i> Switch to ${isAdmin ? 'User' : 'Admin'} View`;
        }

        // Show/hide sections
        document.querySelectorAll('[data-view="admin"]').forEach(el => {
            el.style.display = isAdmin ? '' : 'none';
        });
        document.querySelectorAll('[data-view="user"]').forEach(el => {
            el.style.display = !isAdmin ? '' : 'none';
        });

        // Load appropriate data
        if (isAdmin) {
            AdminManager.loadStats();
            AdminManager.loadUsers();
        } else {
            HistoryManager.load();
        }
    }
};

/* ==========================================================================
   LOGOUT
   ========================================================================== */

async function handleLogout() {
    try {
        await fetch(`${DASHBOARD_CONFIG.AUTH_API}/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
        console.error('Logout error:', error);
    }
    localStorage.removeItem('user');
    if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('You have been signed out successfully.', 'success');
    }
    if (typeof LoadingOverlay !== 'undefined') {
        LoadingOverlay.show('Signing out...');
    }
    setTimeout(() => {
        window.location.replace(DASHBOARD_CONFIG.LOGIN_PAGE);
    }, 800);
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

async function initDashboard() {
    try {
        // Check authentication
        const result = await DashboardAPI.getMe();

        if (!result.success) {
            // Show visual warning for unauthorized access
            if (typeof UI !== 'undefined' && UI.showToast) {
                UI.showToast('Session expired. Please sign in again.', 'warning');
            }
            if (typeof LoadingOverlay !== 'undefined') {
                LoadingOverlay.show('Redirecting to login...');
            }
            setTimeout(() => {
                window.location.replace(DASHBOARD_CONFIG.LOGIN_PAGE);
            }, 1000);
            return;
        }

        DashboardState.user = result.user;
        DashboardState.isAdmin = ['admin', 'superadmin'].includes(result.user.role);
        DashboardState.currentView = DashboardState.isAdmin ? 'admin' : 'user';

        // Update UI with user info
        const welcomeEl = document.getElementById('welcomeUser');
        if (welcomeEl) welcomeEl.textContent = `Welcome, ${result.user.username}`;

        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) {
            if (result.user.profilePicture) {
                avatarEl.innerHTML = `<img src="${result.user.profilePicture}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            } else {
                avatarEl.textContent = DashboardUI.getInitials(result.user.username);
            }
        }

        // Initialize view
        ViewManager.init();
        ViewManager.update();

        // Initialize history search
        HistoryManager.initSearch();

        // Post-login back-button guard
        // Activates when user JUST logged in via manual login (sessionStorage flag)
        // or Google OAuth (?login=success URL param)
        const urlParams = new URLSearchParams(window.location.search);
        const isJustLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true' || urlParams.get('login') === 'success';
        if (isJustLoggedIn) {
            sessionStorage.removeItem('justLoggedIn');
            // Clean URL param without triggering navigation
            if (urlParams.has('login')) {
                const cleanUrl = window.location.pathname;
                history.replaceState(null, '', cleanUrl);
            }
            history.pushState({ postLogin: true }, '', window.location.href);

            const postLoginPopstateHandler = () => {
                if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
                    UI.showConfirmDialog(
                        'Sign Out',
                        'Are you sure you want to sign out?',
                        async () => {
                            // User confirmed sign out
                            window.removeEventListener('popstate', postLoginPopstateHandler);
                            try {
                                await fetch(DASHBOARD_CONFIG.AUTH_API + '/logout', { method: 'POST', credentials: 'include' });
                            } catch (e) { /* continue */ }
                            localStorage.removeItem('user');
                            sessionStorage.clear();
                            if (typeof UI !== 'undefined' && UI.showToast) {
                                UI.showToast('You have been signed out successfully.', 'success');
                            }
                            if (typeof LoadingOverlay !== 'undefined') {
                                LoadingOverlay.show('Signing out...');
                            }
                            setTimeout(() => {
                                window.location.replace('/');
                            }, 800);
                        },
                        () => {
                            // User cancelled - stay on dashboard
                            history.pushState({ postLogin: true }, '', window.location.href);
                        },
                        'Confirm',
                        'Cancel'
                    );
                } else {
                    // Fallback: stay on page
                    history.pushState({ postLogin: true }, '', window.location.href);
                }
            };

            window.addEventListener('popstate', postLoginPopstateHandler);

            // Remove the guard when user navigates via any dashboard link
            // (clicking Convert, Settings, Users = normal navigation, no guard needed)
            document.querySelectorAll('.dashboard__nav-link:not(.dashboard__nav-link--active), .dashboard__mobile-link:not(.dashboard__mobile-link--active)').forEach(link => {
                link.addEventListener('click', () => {
                    window.removeEventListener('popstate', postLoginPopstateHandler);
                }, { once: true });
            });
        }

    } catch (error) {
        console.error('Dashboard init error:', error);
        if (typeof LoadingOverlay !== 'undefined') {
            LoadingOverlay.show('Redirecting to login...');
        }
        setTimeout(() => {
            window.location.replace(DASHBOARD_CONFIG.LOGIN_PAGE);
        }, 800);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    initDashboard();
    initNavOverlays();
});

/**
 * Attach loading overlay transitions to all sidebar and mobile nav links.
 * Skips active links (current page) and logout buttons.
 */
function initNavOverlays() {
    const allNavLinks = document.querySelectorAll(
        '.dashboard__nav-link:not(.dashboard__nav-link--active), ' +
        '.dashboard__mobile-link:not(.dashboard__mobile-link--active)'
    );

    allNavLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Skip logout, active, and anchor-only links
        if (!href || href === '#' || link.id === 'mobileLogoutBtn') return;

        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Close mobile menu if open
            const hamburger = document.getElementById('hamburgerToggle');
            const mobileMenu = document.getElementById('mobileMenu');
            if (hamburger) hamburger.classList.remove('dashboard__hamburger--active');
            if (mobileMenu) mobileMenu.classList.remove('dashboard__mobile-menu--open');

            if (typeof LoadingOverlay !== 'undefined') {
                LoadingOverlay.navigateTo(href);
            } else {
                window.location.href = href;
            }
        });
    });

    // Header logo → /home with loading overlay
    const logo = document.querySelector('.dashboard__logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof LoadingOverlay !== 'undefined') {
                LoadingOverlay.navigateTo('/home');
            } else {
                window.location.href = '/home';
            }
        });
    }

    // Welcome/avatar user-link → /settings with loading overlay
    const userLink = document.querySelector('.dashboard__user-link');
    if (userLink) {
        userLink.addEventListener('click', (e) => {
            e.preventDefault();
            const href = userLink.getAttribute('href');
            if (href && href !== '#') {
                if (typeof LoadingOverlay !== 'undefined') {
                    LoadingOverlay.navigateTo(href);
                } else {
                    window.location.href = href;
                }
            }
        });
    }
}

// Expose for inline handlers
window.HistoryManager = HistoryManager;
window.AdminManager = AdminManager;
