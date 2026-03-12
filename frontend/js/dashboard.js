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
    ITEMS_PER_PAGE: 10,
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
    async getHistory(page = 1, dateFrom = '', dateTo = '') {
        let url = `${DASHBOARD_CONFIG.HISTORY_API}?page=${page}&limit=${DASHBOARD_CONFIG.ITEMS_PER_PAGE}`;
        if (dateFrom) url += `&dateFrom=${dateFrom}`;
        if (dateTo) url += `&dateTo=${dateTo}`;
        const response = await fetch(url, { credentials: 'include' });
        return response.json();
    },

    async deleteHistory(id) {
        const response = await fetch(`${DASHBOARD_CONFIG.HISTORY_API}/${id}`, { method: 'DELETE', credentials: 'include' });
        return response.json();
    },

    // Admin endpoints
    async getStats(params = {}) {
        const qs = new URLSearchParams();
        if (params.globalDays) qs.set('globalDays', params.globalDays);
        if (params.trendDays) qs.set('trendDays', params.trendDays);
        if (params.fileTypeDays) qs.set('fileTypeDays', params.fileTypeDays);
        if (params.langDays) qs.set('langDays', params.langDays);
        const qsStr = qs.toString();
        const url = `${DASHBOARD_CONFIG.ADMIN_API}/stats${qsStr ? '?' + qsStr : ''}`;
        const response = await fetch(url, { credentials: 'include' });
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
    },

    // Translate a history item
    async translateHistoryItem(id, sourceLang, targetLang) {
        const response = await fetch(`${DASHBOARD_CONFIG.HISTORY_API}/${id}/translate`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sourceLang, targetLang })
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
        // Play sound based on toast type
        if (typeof SoundManager !== 'undefined') {
            if (type === 'success') SoundManager.play('success');
            else if (type === 'danger' || type === 'warning') SoundManager.play('error');
        }
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
                const translation = (item.translatedText || '').toLowerCase();
                const mimeType = (item.mimeType || '').toLowerCase();
                const targetLang = (item.targetLang || '').toLowerCase();
                const ext = filename.split('.').pop();
                return filename.includes(query) || dateStr.includes(query) ||
                       text.includes(query) || translation.includes(query) ||
                       mimeType.includes(query) || targetLang.includes(query) ||
                       ext.includes(query);
            });
        }

        HistoryManager.renderTable(items);
        HistoryManager.renderCards(items);
        HistoryManager.renderPagination(pagination);
    },

    /**
     * Desktop: table rows with Translation + Type columns
     */
    renderTable(items) {
        const tbody = document.getElementById('historyTableBody');
        if (!tbody) return;

        // Helper: get file type badge from mimeType or filename
        const getTypeBadge = (mimeType, filename) => {
            const ext = (filename || '').split('.').pop().toLowerCase();
            const mimeMap = {
                'image/jpeg': { label: 'JPEG', color: '#0097b2' },
                'image/png': { label: 'PNG', color: '#059669' },
                'image/gif': { label: 'GIF', color: '#d97706' },
                'image/webp': { label: 'WebP', color: '#7c3aed' },
                'image/bmp': { label: 'BMP', color: '#6366f1' },
                'image/heic': { label: 'HEIC', color: '#ec4899' },
                'application/pdf': { label: 'PDF', color: '#dc2626' }
            };
            const extMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', heic: 'image/heic', pdf: 'application/pdf', jfif: 'image/jpeg' };
            const key = mimeType || extMap[ext] || '';
            const info = mimeMap[key] || { label: ext.toUpperCase() || '?', color: '#6b7280' };
            return `<span class="badge" style="background: ${info.color}; font-size: 0.65rem; padding: 0.2rem 0.45rem;">${info.label}</span>`;
        };

        if (items.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                        <p class="mt-2 mb-0">${DashboardState.historySearchQuery ? 'No results found' : 'No conversion history yet'}</p>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = items.map(item => {
                const encodedText = encodeURIComponent(item.extractedText || '');
                const encodedTranslation = encodeURIComponent(item.translatedText || '');
                const hasTranslation = !!(item.translatedText);
                const translationCell = hasTranslation
                    ? `<span title="${(item.translatedText || '').replace(/"/g, '&quot;')}" style="font-size: 0.85rem;">${DashboardUI.truncateText(item.translatedText, 40)}</span>`
                    : '';

                return `
                <tr data-id="${item._id}" style="cursor: pointer;" onclick="HistoryManager.showDetail('${item._id}')">
                    <td>${DashboardUI.formatDate(item.conversionDate)}</td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            ${item.imageUrl
                                ? `<img src="${item.imageUrl}" alt="Preview" style="width: 32px; height: 32px; object-fit: cover; border-radius: 4px; flex-shrink: 0; border: 1px solid #e5e7eb;">`
                                : `<i class="bi bi-file-earmark-text" style="font-size: 1.2rem; color: #9ca3af; flex-shrink: 0;"></i>`}
                            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.originalFileName || 'Untitled'}</span>
                        </div>
                    </td>
                    <td style="max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${DashboardUI.truncateText(item.extractedText, 40)}
                    </td>
                    <td style="max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${translationCell}</td>
                    <td>${getTypeBadge(item.mimeType, item.originalFileName)}</td>
                    <td onclick="event.stopPropagation();">
                        <div class="data-table__actions" style="font-size: 1.1rem; gap: 0.25rem;">
                            <button class="btn btn--secondary" style="padding: 0.35rem 0.55rem;" title="${hasTranslation ? 'Re-translate' : 'Translate'}" onclick="HistoryManager.showTranslateModal('${item._id}')">
                                <i class="bi bi-translate"></i>
                            </button>
                            <button class="btn btn--secondary" style="padding: 0.35rem 0.55rem;" title="Copy" onclick="HistoryManager.copyChoice('${item._id}', '${encodedText}', '${encodedTranslation}', ${hasTranslation})">
                                <i class="bi bi-clipboard"></i>
                            </button>
                            <button class="btn btn--secondary" style="padding: 0.35rem 0.55rem;" title="Download" onclick="HistoryManager.downloadChoice('${item._id}', '${item.originalFileName || 'text'}', '${encodedText}', '${encodedTranslation}', ${hasTranslation})">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn--secondary" style="padding: 0.35rem 0.55rem; color: var(--color-error);" title="Delete" onclick="HistoryManager.delete('${item._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }
        if (typeof BulkSelection !== 'undefined') BulkSelection.enhanceTable('historyTable');
    },

    /**
     * Mobile/Tablet: card layout with translation info
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

        const perPage = DashboardState.CARDS_PER_PAGE;
        const totalPages = Math.ceil(items.length / perPage);
        if (DashboardState.cardPage > totalPages) DashboardState.cardPage = totalPages;
        if (DashboardState.cardPage < 1) DashboardState.cardPage = 1;
        const start = (DashboardState.cardPage - 1) * perPage;
        const pageItems = items.slice(start, start + perPage);

        let html = pageItems.map(item => {
            const encodedText = encodeURIComponent(item.extractedText || '');
            const encodedTranslation = encodeURIComponent(item.translatedText || '');
            const filename = item.originalFileName || 'Untitled';
            const hasTranslation = !!(item.translatedText);
            const translationLine = hasTranslation
                ? `<div style="font-size: 0.8rem; margin-top: 0.25rem; padding: 0.25rem 0.5rem; background: #e8f5e9; border-radius: 4px;">
                    <strong>Translation</strong> <span class="badge" style="background: linear-gradient(135deg, #00838f, #00acc1); font-size: 0.6rem;">${(item.sourceLang || '').toUpperCase()} \u2192 ${(item.targetLang || '').toUpperCase()}</span><br>
                    ${DashboardUI.truncateText(item.translatedText, 80)}</div>`
                : `<div style="margin-top: 0.25rem;"><button class="btn btn-sm" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.7rem; padding: 0.15rem 0.5rem;" onclick="event.stopPropagation(); HistoryManager.showTranslateModal('${item._id}')"><i class="bi bi-translate me-1"></i>Translate</button></div>`;

            return `
                <div class="history-card" data-id="${item._id}" onclick="HistoryManager.showDetail('${item._id}')">
                    <div class="history-card__header">
                        <span class="history-card__filename">
                            ${item.imageUrl
                                ? `<img src="${item.imageUrl}" alt="" style="width: 24px; height: 24px; object-fit: cover; border-radius: 3px; vertical-align: middle; margin-right: 0.35rem; border: 1px solid #e5e7eb;">`
                                : `<i class="bi bi-file-earmark-text me-1"></i>`}${filename}
                        </span>
                        <span class="history-card__date">${DashboardUI.formatDate(item.conversionDate)}</span>
                    </div>
                    <div class="history-card__snippet">${DashboardUI.truncateText(item.extractedText, 120) || 'No text extracted'}</div>
                    ${translationLine}
                    <div class="history-card__actions" onclick="event.stopPropagation();">
                        <button class="btn btn--secondary btn--sm" title="Copy" onclick="HistoryManager.copyChoice('${item._id}', '${encodedText}', '${encodedTranslation}', ${hasTranslation})">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="btn btn--secondary btn--sm" title="Download" onclick="HistoryManager.downloadChoice('${item._id}', '${filename}', '${encodedText}', '${encodedTranslation}', ${hasTranslation})">
                            <i class="bi bi-download"></i>
                        </button>
                        <button class="btn btn--secondary btn--sm" style="color: var(--color-error);" title="Delete" onclick="HistoryManager.delete('${item._id}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (totalPages > 1) {
            html += '<nav class="mt-3"><ul class="pagination pagination-sm mb-0">';
            html += `<li class="page-item ${DashboardState.cardPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="HistoryManager.goCardPage(${DashboardState.cardPage - 1}); return false;">Prev</a>
            </li>`;
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= DashboardState.cardPage - 1 && i <= DashboardState.cardPage + 1)) {
                    html += `<li class="page-item ${i === DashboardState.cardPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="HistoryManager.goCardPage(${i}); return false;">${i}</a>
                    </li>`;
                } else if (i === DashboardState.cardPage - 2 || i === DashboardState.cardPage + 2) {
                    html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
                }
            }
            html += `<li class="page-item ${DashboardState.cardPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="HistoryManager.goCardPage(${DashboardState.cardPage + 1}); return false;">Next</a>
            </li>`;
            html += '</ul></nav>';
        }

        container.innerHTML = html;
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
        html += `<li class="page-item ${page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="HistoryManager.load(${page - 1}); return false;">Prev</a>
        </li>`;
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                html += `<li class="page-item ${i === page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="HistoryManager.load(${i}); return false;">${i}</a>
                </li>`;
            } else if (i === page - 2 || i === page + 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }
        html += `<li class="page-item ${page === pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="HistoryManager.load(${page + 1}); return false;">Next</a>
        </li>`;
        html += '</ul></nav>';
        container.innerHTML = html;
    },

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

    /**
     * Copy with choice popup (Original or Translation)
     */
    copyChoice(id, encodedText, encodedTranslation, hasTranslation) {
        if (!hasTranslation) {
            HistoryManager.copy(id, encodedText);
            return;
        }
        HistoryManager.showChoicePopup('Copy', [
            { label: '<i class="bi bi-file-text me-1"></i>Original Text', action: () => HistoryManager.copy(id, encodedText) },
            { label: '<i class="bi bi-translate me-1"></i>Translation', action: () => HistoryManager.copy(id, encodedTranslation) }
        ]);
    },

    copy(id, encodedText) {
        const text = decodeURIComponent(encodedText);
        if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.show('Copying...');
        navigator.clipboard.writeText(text).then(() => {
            setTimeout(() => {
                if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
                DashboardUI.showToast('Text copied to clipboard', 'success');
            }, 300);
        }).catch(() => {
            if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
            DashboardUI.showToast('Failed to copy', 'danger');
        });
    },

    /**
     * Download with choice popup (Original or Translation)
     */
    downloadChoice(id, filename, encodedText, encodedTranslation, hasTranslation) {
        if (!hasTranslation) {
            HistoryManager.download(filename, encodedText);
            return;
        }
        HistoryManager.showChoicePopup('Download', [
            { label: '<i class="bi bi-file-text me-1"></i>Original Text', action: () => HistoryManager.download(filename, encodedText) },
            { label: '<i class="bi bi-translate me-1"></i>Translation', action: () => HistoryManager.download(filename + '_translated', encodedTranslation) }
        ]);
    },

    download(filename, encodedText) {
        const text = decodeURIComponent(encodedText);
        if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.show('Downloading...');
        setTimeout(() => {
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename.replace(/\.[^/.]+$/, '')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
            DashboardUI.showToast('Text downloaded', 'success');
        }, 300);
    },

    /**
     * Show a choice popup with close button
     */
    showChoicePopup(title, choices) {
        const existing = document.getElementById('choicePopupOverlay');
        if (existing) existing.remove();

        const html = `
            <div id="choicePopupOverlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="if(event.target===this) this.remove();">
                <div style="background: white; border-radius: 12px; padding: 1.5rem; min-width: 280px; max-width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2); text-align: center;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h6 style="margin: 0; font-weight: 600; color: #333;">${title}</h6>
                        <button onclick="document.getElementById('choicePopupOverlay').remove();" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666; padding: 0.2rem;">&times;</button>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        ${choices.map((c, i) => `<button id="choiceBtn${i}" class="btn" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.9rem;">${c.label}</button>`).join('')}
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        choices.forEach((c, i) => {
            document.getElementById(`choiceBtn${i}`).addEventListener('click', () => {
                document.getElementById('choicePopupOverlay')?.remove();
                c.action();
            });
        });
    },

    async delete(id) {
        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Delete Record',
                'Are you sure you want to delete this record?',
                async () => { await HistoryManager.performDelete(id); },
                null, 'Delete', 'Cancel', 'primary'
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

    /**
     * Show translate language selector modal for a history item
     */
    showTranslateModal(id) {
        const existing = document.getElementById('translateLangModal');
        if (existing) existing.remove();

        const languages = [
            { code: 'autodetect', name: 'Auto Detect' },
            { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
            { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
            { code: 'ru', name: 'Russian' }, { code: 'ja', name: 'Japanese' },
            { code: 'ko', name: 'Korean' }, { code: 'zh-CN', name: 'Chinese (Simplified)' },
            { code: 'zh-TW', name: 'Chinese (Traditional)' },
            { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' },
            { code: 'nl', name: 'Dutch' }, { code: 'sv', name: 'Swedish' },
            { code: 'pl', name: 'Polish' }, { code: 'tr', name: 'Turkish' },
            { code: 'vi', name: 'Vietnamese' }, { code: 'th', name: 'Thai' },
            { code: 'id', name: 'Indonesian' }, { code: 'tl', name: 'Filipino' }
        ];
        const sourceOpts = languages.map(l => `<option value="${l.code}"${l.code === 'autodetect' ? ' selected' : ''}>${l.name}</option>`).join('');
        const targetOpts = languages.filter(l => l.code !== 'autodetect').map(l => `<option value="${l.code}"${l.code === 'es' ? ' selected' : ''}>${l.name}</option>`).join('');

        const modalHtml = `
            <div id="translateLangModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;" onclick="if(event.target===this) this.remove();">
                <div style="background: white; border-radius: 12px; padding: 1.5rem; min-width: 300px; max-width: 90%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h6 style="margin: 0; font-weight: 600;"><i class="bi bi-translate me-2" style="color: #00838f;"></i>Translate</h6>
                        <button onclick="document.getElementById('translateLangModal').remove();" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; display: block;">From</label>
                        <select id="translateSrcLang" class="form-select form-select-sm">${sourceOpts}</select>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; display: block;">To</label>
                        <select id="translateTgtLang" class="form-select form-select-sm">${targetOpts}</select>
                    </div>
                    <button id="translateSubmitBtn" class="btn w-100" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; padding: 0.5rem; border-radius: 8px; font-weight: 600;">
                        <i class="bi bi-translate me-1"></i>Translate Now
                    </button>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('translateSubmitBtn').addEventListener('click', async () => {
            const src = document.getElementById('translateSrcLang').value;
            const tgt = document.getElementById('translateTgtLang').value;
            document.getElementById('translateLangModal')?.remove();
            if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.show('Translating...');
            try {
                const result = await DashboardAPI.translateHistoryItem(id, src, tgt);
                if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
                if (result.success) {
                    DashboardUI.showToast('Translation saved!', 'success');
                    HistoryManager.load(DashboardState.historyPage);
                } else {
                    DashboardUI.showToast(result.error || 'Translation failed', 'danger');
                }
            } catch (error) {
                if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
                DashboardUI.showToast('Translation failed', 'danger');
            }
        });
    },

    showDetail(id) {
        const item = DashboardState.allHistoryItems.find(i => i._id === id);
        if (!item) return;

        const existingModal = document.getElementById('historyDetailModal');
        if (existingModal) existingModal.remove();

        const filename = item.originalFileName || 'Untitled';
        const encodedText = encodeURIComponent(item.extractedText || '');
        const encodedTranslation = encodeURIComponent(item.translatedText || '');
        const hasTranslation = !!(item.translatedText);

        const translationSection = hasTranslation ? `
            <div class="mt-3">
                <div class="d-flex align-items-center gap-2 mb-2">
                    <label class="form-label mb-0" style="font-size: 0.85rem; font-weight: 600;">Translation</label>
                    <span class="badge" style="background: linear-gradient(135deg, #00838f, #00acc1); font-size: 0.7rem;">
                        ${(item.sourceLang || '').toUpperCase()} \u2192 ${(item.targetLang || '').toUpperCase()}
                    </span>
                </div>
                <div style="background: #e8f5e9; border-radius: 8px; padding: 0.75rem; max-height: 25vh; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 0.85rem; line-height: 1.5; border: 1px solid #c8e6c9;">${item.translatedText}</div>
            </div>` : '';

        const translateBtn = !hasTranslation ? `
            <button type="button" class="btn btn-sm" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="bootstrap.Modal.getInstance(document.getElementById('historyDetailModal')).hide(); HistoryManager.showTranslateModal('${id}');">
                <i class="bi bi-translate me-1"></i>Translate
            </button>` : '';

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
                            <div class="mb-2">
                                <small class="text-muted"><i class="bi bi-calendar me-1"></i>${DashboardUI.formatDate(item.conversionDate)}</small>
                            </div>
                            ${item.imageUrl ? `
                            <div class="mb-3 text-center">
                                <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Converted Image</label>
                                <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; display: inline-block; max-width: 100%;">
                                    <img src="${item.imageUrl}" alt="Converted image" style="max-width: 100%; max-height: 300px; object-fit: contain; display: block;">
                                </div>
                            </div>` : ''}
                            <div>
                                <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Original Text</label>
                                <div style="background: var(--color-gray-50, #f8f9fa); border-radius: 8px; padding: 1rem; max-height: 30vh; overflow-y: auto; white-space: pre-wrap; font-family: 'Consolas', monospace; font-size: 0.85rem; line-height: 1.6;">${item.extractedText || 'No text extracted'}</div>
                            </div>
                            ${translationSection}
                        </div>
                        <div class="modal-footer" style="justify-content: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem;">
                            <button type="button" class="btn btn-sm" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="HistoryManager.copyChoice('${id}', '${encodedText}', '${encodedTranslation}', ${hasTranslation})">
                                <i class="bi bi-clipboard me-1"></i>Copy
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" style="font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="HistoryManager.downloadChoice('${id}', '${filename}', '${encodedText}', '${encodedTranslation}', ${hasTranslation})">
                                <i class="bi bi-download me-1"></i>Download
                            </button>
                            ${translateBtn}
                            <button type="button" class="btn btn-sm btn-danger" style="font-size: 0.85rem; padding: 0.4rem 1rem;" onclick="bootstrap.Modal.getInstance(document.getElementById('historyDetailModal')).hide(); HistoryManager.delete('${id}');">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modalEl = document.getElementById('historyDetailModal');
        new bootstrap.Modal(modalEl).show();
        modalEl.addEventListener('hidden.bs.modal', () => modalEl?.remove());
    }
};


/* ==========================================================================
   ADMIN MANAGEMENT
   ========================================================================== */

const AdminManager = {
    _conversionChart: null,
    _userChart: null,
    _fileTypeChart: null,
    _languageChart: null,
    _lastStats: null,
    _currentTrendDays: 7,
    _langMap: { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', ja: 'Japanese', ko: 'Korean', 'zh-CN': 'Chinese (S)', 'zh-TW': 'Chinese (T)', ar: 'Arabic', ru: 'Russian', hi: 'Hindi', nl: 'Dutch', pl: 'Polish', sv: 'Swedish', tr: 'Turkish', vi: 'Vietnamese', th: 'Thai', id: 'Indonesian', auto: 'Auto Detect', fil: 'Filipino', tl: 'Tagalog' },

    /** Initial full load — populates all KPIs, charts, and dropdown options */
    async loadStats() {
        try {
            const globalDays = parseInt(document.getElementById('globalDaysFilter')?.value) || 0;
            const result = await DashboardAPI.getStats({
                globalDays: globalDays || undefined,
                trendDays: AdminManager._currentTrendDays
            });
            if (result.success) {
                const d = result.data;
                AdminManager._lastStats = d;
                AdminManager.renderStats(d);
                AdminManager.renderChart(d.conversions.daily, AdminManager._currentTrendDays);
                AdminManager.renderUserDistribution(d.users);
                AdminManager.renderFileTypeChart(d.fileTypes || []);
                AdminManager.renderLanguageChart(d.languages || []);
                AdminManager.populateFilterDropdowns(d.availableFileTypes || [], d.availableLanguages || []);

                // Update trend chart title
                const titleEl = document.getElementById('convChartTitle');
                if (titleEl) titleEl.textContent = `Conversions (Last ${AdminManager._currentTrendDays} Days)`;

                // Update trend filter button states
                document.querySelectorAll('.chart-range-btn').forEach(btn => {
                    const btnDays = parseInt(btn.dataset.days);
                    btn.classList.toggle('btn--primary', btnDays === AdminManager._currentTrendDays);
                    btn.classList.toggle('btn--secondary', btnDays !== AdminManager._currentTrendDays);
                });
            }
        } catch (error) {
            console.error('Stats load error:', error);
        }
    },

    /** Populate file type and language filter dropdowns from real DB data */
    populateFilterDropdowns(fileTypes, languages) {
        const ftSelect = document.getElementById('fileTypeFilter');
        if (ftSelect) {
            const current = ftSelect.value;
            ftSelect.innerHTML = '<option value="all">All Types</option>';
            fileTypes.forEach(mime => {
                const label = (mime || '').split('/').pop().toUpperCase();
                ftSelect.innerHTML += `<option value="${mime}">${label}</option>`;
            });
            ftSelect.value = current || 'all';
        }

        const lgSelect = document.getElementById('langFilter');
        if (lgSelect) {
            const current = lgSelect.value;
            lgSelect.innerHTML = '<option value="all">All Languages</option>';
            languages.forEach(code => {
                const label = AdminManager._langMap[code] || code;
                lgSelect.innerHTML += `<option value="${code}">${label}</option>`;
            });
            lgSelect.value = current || 'all';
        }
    },

    /** Independent: reload only the trend chart */
    async loadTrendChart(days) {
        try {
            AdminManager._currentTrendDays = parseInt(days) || 7;
            const globalDays = parseInt(document.getElementById('globalDaysFilter')?.value) || 0;
            const result = await DashboardAPI.getStats({
                trendDays: AdminManager._currentTrendDays,
                globalDays: globalDays || undefined
            });
            if (result.success) {
                AdminManager.renderChart(result.data.conversions.daily, AdminManager._currentTrendDays);
                const titleEl = document.getElementById('convChartTitle');
                if (titleEl) titleEl.textContent = `Conversions (Last ${AdminManager._currentTrendDays} Days)`;
                document.querySelectorAll('.chart-range-btn').forEach(btn => {
                    const btnDays = parseInt(btn.dataset.days);
                    btn.classList.toggle('btn--primary', btnDays === AdminManager._currentTrendDays);
                    btn.classList.toggle('btn--secondary', btnDays !== AdminManager._currentTrendDays);
                });
            }
        } catch (error) {
            console.error('Trend chart load error:', error);
        }
    },

    /** Independent: reload only the file type chart */
    async loadFileTypeChart() {
        try {
            const globalDays = parseInt(document.getElementById('globalDaysFilter')?.value) || 0;
            const result = await DashboardAPI.getStats({
                fileTypeDays: globalDays || undefined,
                globalDays: globalDays || undefined
            });
            if (result.success) {
                let fileTypes = result.data.fileTypes || [];
                const filterVal = document.getElementById('fileTypeFilter')?.value;
                if (filterVal && filterVal !== 'all') {
                    fileTypes = fileTypes.filter(f => f._id === filterVal);
                }
                AdminManager.renderFileTypeChart(fileTypes);
            }
        } catch (error) {
            console.error('File type chart load error:', error);
        }
    },

    /** Independent: reload only the language chart */
    async loadLanguageChart() {
        try {
            const globalDays = parseInt(document.getElementById('globalDaysFilter')?.value) || 0;
            const result = await DashboardAPI.getStats({
                langDays: globalDays || undefined,
                globalDays: globalDays || undefined
            });
            if (result.success) {
                let languages = result.data.languages || [];
                const filterVal = document.getElementById('langFilter')?.value;
                if (filterVal && filterVal !== 'all') {
                    languages = languages.filter(l => l._id === filterVal);
                }
                AdminManager.renderLanguageChart(languages);
            }
        } catch (error) {
            console.error('Language chart load error:', error);
        }
    },

    /** Global filter: reload ALL charts with a shared date range */
    async applyGlobalFilter(days) {
        try {
            const globalDays = parseInt(days) || 0;
            const result = await DashboardAPI.getStats({
                globalDays: globalDays || undefined,
                trendDays: AdminManager._currentTrendDays
            });
            if (result.success) {
                const d = result.data;
                AdminManager._lastStats = d;
                AdminManager.renderStats(d);
                AdminManager.renderChart(d.conversions.daily, AdminManager._currentTrendDays);
                AdminManager.renderUserDistribution(d.users);
                AdminManager.renderFileTypeChart(d.fileTypes || []);
                AdminManager.renderLanguageChart(d.languages || []);
                AdminManager.populateFilterDropdowns(d.availableFileTypes || [], d.availableLanguages || []);
            }
        } catch (error) {
            console.error('Global filter error:', error);
        }
    },

    renderStats(data) {
        const { users, conversions } = data;
        const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        const formatBytes = (b) => {
            if (!b || b === 0) return '0 B';
            const k = 1024, s = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(b) / Math.log(k));
            return parseFloat((b / Math.pow(k, i)).toFixed(1)) + ' ' + s[i];
        };

        // Row 1 — Users
        el('statTotalUsers', users.total);
        el('statActiveUsers', users.active);
        el('statInactiveUsers', users.inactive);
        el('statNewUsers', users.newWeek);

        // Row 2 — Conversions
        el('statTotalConversions', conversions.total);
        el('statRecentConversions', conversions.recent);
        el('statSuccessRate', conversions.total > 0
            ? Math.round((conversions.successful / conversions.total) * 100) + '%'
            : '0%');
        el('statTranslations', conversions.translated);

        // Row 3 — Detailed Metrics
        el('statAvgConfidence', (conversions.avgConfidence || 0) + '%');
        el('statAvgProcessing', (conversions.avgProcessingTime || 0) + 'ms');
        el('statStorageUsed', formatBytes(conversions.totalFileSize));
        el('statWithImages', conversions.withImages || 0);
    },

    /** Chart.js shared tooltip/font config */
    _tooltipConfig() {
        return {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: { family: 'Poppins', size: 12 },
            bodyFont: { family: 'Poppins', size: 13, weight: '600' },
            padding: 10,
            cornerRadius: 8
        };
    },

    renderChart(dailyData, days = 7) {
        const canvas = document.getElementById('conversionChart');
        if (!canvas || typeof Chart === 'undefined') return;

        const labels = [], data = [], today = new Date();
        const numDays = parseInt(days) || 7;
        for (let i = numDays - 1; i >= 0; i--) {
            const date = new Date(today); date.setDate(date.getDate() - i);
            // Short label for 30d+, full for 7d
            const labelOpts = numDays <= 7
                ? { weekday: 'short', month: 'short', day: 'numeric' }
                : { month: 'short', day: 'numeric' };
            labels.push(date.toLocaleDateString('en-US', labelOpts));
            const dayData = (dailyData || []).find(d => d._id === date.toISOString().split('T')[0]);
            data.push(dayData ? dayData.count : 0);
        }

        if (AdminManager._conversionChart) AdminManager._conversionChart.destroy();
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight || 250);
        gradient.addColorStop(0, 'rgba(0, 131, 143, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 172, 193, 0.05)');

        AdminManager._conversionChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Conversions', data, borderColor: '#00838f', backgroundColor: gradient, borderWidth: 3, fill: true, tension: 0.4, pointBackgroundColor: '#00838f', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: numDays <= 14 ? 5 : 2, pointHoverRadius: numDays <= 14 ? 7 : 4 }] },
            options: {
                responsive: true, maintainAspectRatio: true,
                animation: { duration: 1200, easing: 'easeInOutQuart' },
                plugins: { legend: { display: false }, tooltip: { ...AdminManager._tooltipConfig(), displayColors: false, callbacks: { label: (c) => `${c.parsed.y} conversion${c.parsed.y !== 1 ? 's' : ''}` } } },
                scales: { x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: numDays <= 14 ? 11 : 9 }, color: '#6b7280', maxRotation: numDays > 14 ? 45 : 0 } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins', size: 11 }, color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } } },
                interaction: { intersect: false, mode: 'index' }
            }
        });
    },

    renderUserDistribution(usersData) {
        const canvas = document.getElementById('userDistributionChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (AdminManager._userChart) AdminManager._userChart.destroy();

        // Support filter dropdown
        const filterEl = document.getElementById('userDistFilter');
        const filterMode = filterEl ? filterEl.value : 'all';

        let labels, chartData, bgColors;
        const roles = usersData.roles || { user: 0, admin: 0, superadmin: 0 };

        if (filterMode === 'roles') {
            labels = ['Users', 'Admins', 'Super Admins'];
            chartData = [roles.user, roles.admin, roles.superadmin];
            bgColors = ['#00acc1', '#00838f', '#26c6da'];
        } else if (filterMode === 'auth') {
            labels = ['Google OAuth', 'Email/Password'];
            chartData = [usersData.google || 0, usersData.regular || 0];
            bgColors = ['#6366f1', '#00acc1'];
        } else {
            labels = ['Active Users', 'Admins', 'Super Admins', 'Google OAuth', 'Inactive'];
            chartData = [Math.max(roles.user - (usersData.inactive || 0), 0), roles.admin, roles.superadmin, usersData.google || 0, usersData.inactive || 0];
            bgColors = ['#00acc1', '#00838f', '#26c6da', '#6366f1', '#e0e0e0'];
        }

        AdminManager._userChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{ data: chartData, backgroundColor: bgColors, borderColor: '#fff', borderWidth: 3, hoverOffset: 8 }]
            },
            options: {
                responsive: true, maintainAspectRatio: true, cutout: '55%',
                animation: { animateRotate: true, animateScale: true, duration: 1000, easing: 'easeOutQuart' },
                plugins: { legend: { position: 'bottom', labels: { font: { family: 'Poppins', size: 11 }, color: '#374151', padding: 12, usePointStyle: true, pointStyleWidth: 10 } }, tooltip: { ...AdminManager._tooltipConfig(), callbacks: { label: (c) => `${c.label}: ${c.parsed} user${c.parsed !== 1 ? 's' : ''}` } } }
            }
        });
    },

    renderFileTypeChart(fileTypes) {
        const canvas = document.getElementById('fileTypeChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (AdminManager._fileTypeChart) AdminManager._fileTypeChart.destroy();

        const labels = fileTypes.map(f => { const mime = (f._id || '').split('/').pop(); return mime.toUpperCase(); });
        const data = fileTypes.map(f => f.count);
        const colors = ['#00838f', '#00acc1', '#26c6da', '#6366f1', '#f59e0b', '#ec4899', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6'];

        AdminManager._fileTypeChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Files', data, backgroundColor: colors.slice(0, data.length), borderRadius: 6, borderSkipped: false }] },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: true,
                animation: { duration: 800, easing: 'easeOutQuart' },
                plugins: { legend: { display: false }, tooltip: { ...AdminManager._tooltipConfig(), displayColors: false, callbacks: { label: (c) => `${c.parsed.x} file${c.parsed.x !== 1 ? 's' : ''}` } } },
                scales: { x: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins', size: 11 }, color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } }, y: { ticks: { font: { family: 'Poppins', size: 11 }, color: '#374151' }, grid: { display: false } } }
            }
        });
    },

    renderLanguageChart(languages) {
        const canvas = document.getElementById('languageChart');
        if (!canvas || typeof Chart === 'undefined') return;
        if (AdminManager._languageChart) AdminManager._languageChart.destroy();

        const labels = languages.map(l => AdminManager._langMap[l._id] || l._id);
        const data = languages.map(l => l.count);
        const colors = ['#00838f', '#00acc1', '#26c6da', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];

        AdminManager._languageChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Translations', data, backgroundColor: colors.slice(0, data.length), borderRadius: 6, borderSkipped: false }] },
            options: {
                responsive: true, maintainAspectRatio: true,
                animation: { duration: 800, easing: 'easeOutQuart' },
                plugins: { legend: { display: false }, tooltip: { ...AdminManager._tooltipConfig(), displayColors: false, callbacks: { label: (c) => `${c.parsed.y} translation${c.parsed.y !== 1 ? 's' : ''}` } } },
                scales: { x: { ticks: { font: { family: 'Poppins', size: 11 }, color: '#374151' }, grid: { display: false } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { family: 'Poppins', size: 11 }, color: '#6b7280' }, grid: { color: 'rgba(0,0,0,0.06)' } } }
            }
        });
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
            let phtml = '<nav><ul class="pagination pagination-sm mb-0">';
            phtml += `<li class="page-item ${DashboardState.adminUsersPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="AdminManager.goUsersPage(${DashboardState.adminUsersPage - 1}); return false;">Prev</a>
            </li>`;
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= DashboardState.adminUsersPage - 1 && i <= DashboardState.adminUsersPage + 1)) {
                    phtml += `<li class="page-item ${i === DashboardState.adminUsersPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="AdminManager.goUsersPage(${i}); return false;">${i}</a>
                    </li>`;
                } else if (i === DashboardState.adminUsersPage - 2 || i === DashboardState.adminUsersPage + 2) {
                    phtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
                }
            }
            phtml += `<li class="page-item ${DashboardState.adminUsersPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="AdminManager.goUsersPage(${DashboardState.adminUsersPage + 1}); return false;">Next</a>
            </li>`;
            phtml += '</ul></nav>';
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
