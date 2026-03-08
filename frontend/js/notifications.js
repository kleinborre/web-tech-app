/**
 * ImageToTextOnline - Notification System (Frontend)
 * 
 * Facebook-style notification bell with persistent badge dismissal,
 * dropdown panel, real-time polling, and clean URL routing.
 * 
 * Badge dismissal is stored in localStorage so it persists across
 * page loads and navigation. Badge only reappears when a genuinely
 * NEW notification arrives (server timestamp newer than last seen).
 * 
 * @version 2.0.0
 */

const NotificationManager = (() => {
    // ── State ──
    let pollInterval = null;
    let isOpen = false;
    let notifications = [];
    let unreadCount = 0;
    let showingAll = false;
    const INITIAL_DISPLAY = 5;

    // ── Configuration ──
    const POLL_INTERVAL_MS = 5000;
    const API_BASE = '/api/notifications';
    const LS_KEY = 'notif_seen_at'; // localStorage key for persistent dismissal

    // ── API Helpers ──
    const fetchApi = async (url, options = {}) => {
        try {
            const res = await fetch(url, {
                credentials: 'include',
                ...options
            });
            return await res.json();
        } catch (err) {
            console.error('[Notification] API error:', err.message);
            return { success: false };
        }
    };

    // ── Persistent badge logic ──

    /**
     * Get the timestamp when user last opened the notification panel.
     * Stored in localStorage so it persists across page loads.
     */
    const getLastSeenAt = () => {
        const val = localStorage.getItem(LS_KEY);
        return val ? new Date(val).getTime() : 0;
    };

    /**
     * Save the current time as the "last seen" timestamp.
     * Called when the notification panel is opened.
     */
    const setLastSeenNow = () => {
        localStorage.setItem(LS_KEY, new Date().toISOString());
    };

    /**
     * Determine if the badge should be shown.
     * Badge shows ONLY if there are unread notifications that are
     * NEWER than the last time the user opened the panel.
     */
    const shouldShowBadge = (latestUnreadAt) => {
        if (unreadCount <= 0 || isOpen) return false;
        if (!latestUnreadAt) return false;

        const lastSeen = getLastSeenAt();
        const latestTime = new Date(latestUnreadAt).getTime();

        // Show badge only if the newest unread is newer than when user last saw
        return latestTime > lastSeen;
    };

    // ── Core Methods ──

    /**
     * Fetch unread count + latest timestamp, update badge.
     */
    const fetchUnreadCount = async () => {
        const data = await fetchApi(`${API_BASE}/unread-count`);
        if (data.success) {
            const prevCount = unreadCount;
            unreadCount = data.count;

            // Update badge based on persistent timestamp comparison
            updateBadge(data.latestUnreadAt);

            // Auto-refresh panel if open and count changed
            if (isOpen && unreadCount !== prevCount) {
                fetchNotifications();
            }
        }
    };

    /**
     * Fetch notifications from server.
     */
    const fetchNotifications = async () => {
        const data = await fetchApi(`${API_BASE}?limit=50`);
        if (data.success) {
            notifications = data.notifications;
            renderPanel();
        }
    };

    /**
     * Mark a single notification as read.
     */
    const markAsRead = async (id) => {
        const data = await fetchApi(`${API_BASE}/${id}/read`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (data.success) {
            notifications = notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            );
            unreadCount = Math.max(0, unreadCount - 1);
            renderPanel();
        }
    };

    /**
     * Mark all notifications as read.
     */
    const markAllAsRead = async () => {
        const data = await fetchApi(`${API_BASE}/read-all`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (data.success) {
            notifications = notifications.map(n => ({ ...n, read: true }));
            unreadCount = 0;
            updateBadge(null);
            renderPanel();
        }
    };

    // ── UI Methods ──

    /**
     * Update the badge count on the bell icon.
     * Uses persistent localStorage comparison — NOT in-memory flags.
     */
    const updateBadge = (latestUnreadAt) => {
        const badge = document.getElementById('notif-badge');
        if (!badge) return;

        if (shouldShowBadge(latestUnreadAt)) {
            badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    };

    const timeAgo = (dateStr) => {
        const now = Date.now();
        const diff = now - new Date(dateStr).getTime();
        const secs = Math.floor(diff / 1000);
        if (secs < 60) return 'Just now';
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        if (days < 7) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const getIcon = (type) => {
        switch (type) {
            case 'conversion': return 'bi-file-earmark-text';
            case 'profile_update': return 'bi-person-gear';
            case 'password_reset': return 'bi-key';
            case 'new_user': return 'bi-person-plus';
            default: return 'bi-bell';
        }
    };

    const getIconBg = (type) => {
        switch (type) {
            case 'conversion': return '#e0f7fa';
            case 'profile_update': return '#e8f5e9';
            case 'password_reset': return '#fff3e0';
            case 'new_user': return '#e3f2fd';
            default: return '#f3f4f6';
        }
    };

    const getIconColor = (type) => {
        switch (type) {
            case 'conversion': return '#00838f';
            case 'profile_update': return '#2e7d32';
            case 'password_reset': return '#e65100';
            case 'new_user': return '#1565c0';
            default: return '#6b7280';
        }
    };

    // ── Page detection & routing ──

    /**
     * Detect what page we're currently on.
     * Handles both clean URLs and .html file URLs.
     */
    const getCurrentPage = () => {
        const path = window.location.pathname.toLowerCase();
        // Clean URL: /admin/dashboard  OR  file: /admin/dashboard.html
        if (path.includes('/admin/dashboard') || path.endsWith('/dashboard.html')) return 'dashboard';
        if (path.includes('/admin/users') || path.endsWith('/users.html')) return 'users';
        if (path.includes('/admin/settings') || path.endsWith('/settings.html')) return 'settings';
        // index.html or root
        return 'home';
    };

    /**
     * Get navigation URL for a notification type.
     * Returns null if already on the correct page (no navigation needed).
     * Uses clean URLs that match server.js route definitions.
     */
    const getRoute = (type) => {
        const currentPage = getCurrentPage();

        switch (type) {
            case 'conversion':
                // Conversion history is on the admin dashboard
                if (currentPage === 'dashboard') return null;
                return '/admin/dashboard';

            case 'profile_update':
            case 'password_reset':
                // Profile updates are on the settings page
                if (currentPage === 'settings') return null;
                return '/admin/settings';

            case 'new_user':
                // New user registrations — admin users page
                if (currentPage === 'users') return null;
                return '/admin/users';

            default:
                return null;
        }
    };

    /**
     * Render the notification panel.
     */
    const renderPanel = () => {
        const list = document.getElementById('notif-list');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1rem; color: #9ca3af;">
                    <i class="bi bi-bell-slash" style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem; opacity: 0.5;"></i>
                    <p style="margin: 0; font-size: 0.9rem; font-weight: 500;">No notifications at the moment.</p>
                </div>
            `;
            return;
        }

        const displayList = showingAll ? notifications : notifications.slice(0, INITIAL_DISPLAY);
        const hasMore = !showingAll && notifications.length > INITIAL_DISPLAY;
        const remainingCount = notifications.length - INITIAL_DISPLAY;

        let html = displayList.map(n => `
            <div class="notif-item" data-id="${n._id}" data-type="${n.type}" data-read="${n.read}" style="
                display: flex; align-items: flex-start; gap: 0.75rem;
                padding: 0.75rem 1rem; cursor: pointer;
                background: ${n.read ? 'transparent' : 'rgba(0, 131, 143, 0.06)'};
                border-left: ${n.read ? '3px solid transparent' : '3px solid #00838f'};
                transition: background 0.15s ease;
                box-sizing: border-box;
            ">
                <div style="
                    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
                    display: flex; align-items: center; justify-content: center;
                    background: ${getIconBg(n.type)};
                ">
                    <i class="bi ${getIcon(n.type)}" style="font-size: 1rem; color: ${getIconColor(n.type)};"></i>
                </div>
                <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <p style="
                        margin: 0 0 2px 0; font-size: 0.84rem; line-height: 1.45;
                        color: #1f2937; ${n.read ? 'opacity: 0.55;' : 'font-weight: 500;'}
                        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
                    ">${n.message}</p>
                    <span style="font-size: 0.72rem; color: ${n.read ? '#9ca3af' : '#00838f'}; font-weight: ${n.read ? '400' : '500'};">
                        ${timeAgo(n.createdAt)}
                    </span>
                </div>
                ${!n.read ? `<span style="
                    width: 10px; height: 10px; border-radius: 50%;
                    background: #00838f; flex-shrink: 0; margin-top: 8px;
                "></span>` : ''}
            </div>
        `).join('');

        if (hasMore) {
            html += `
                <div id="notif-view-more" style="
                    text-align: center; padding: 0.6rem 1rem; cursor: pointer;
                    background: #f9fafb; border-top: 1px solid #e5e7eb;
                    color: #00838f; font-size: 0.82rem; font-weight: 600;
                    transition: background 0.15s ease;
                ">
                    View ${remainingCount} more notification${remainingCount > 1 ? 's' : ''}
                </div>
            `;
        }

        list.innerHTML = html;

        // Scroll behavior
        if (showingAll) {
            list.style.maxHeight = '380px';
            list.style.overflowY = 'auto';
        } else {
            list.style.maxHeight = 'none';
            list.style.overflowY = 'visible';
        }

        // ── Click handlers ──
        list.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const id = item.dataset.id;
                const type = item.dataset.type;
                const isRead = item.dataset.read === 'true';

                if (!isRead) {
                    await markAsRead(id);
                }

                const route = getRoute(type);
                if (route) {
                    // Navigate to the target page
                    window.location.href = route;
                } else {
                    // Already on the target page — just close panel
                    closePanel();
                }
            });

            item.addEventListener('mouseenter', () => {
                item.style.background = '#f0f0f0';
            });
            item.addEventListener('mouseleave', () => {
                const isRead = item.dataset.read === 'true';
                item.style.background = isRead ? 'transparent' : 'rgba(0, 131, 143, 0.06)';
            });
        });

        const viewMoreBtn = document.getElementById('notif-view-more');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showingAll = true;
                renderPanel();
            });
            viewMoreBtn.addEventListener('mouseenter', () => {
                viewMoreBtn.style.background = '#e5e7eb';
            });
            viewMoreBtn.addEventListener('mouseleave', () => {
                viewMoreBtn.style.background = '#f9fafb';
            });
        }
    };

    /**
     * Toggle notification panel.
     */
    const togglePanel = () => {
        const panel = document.getElementById('notif-panel');
        if (!panel) return;

        isOpen = !isOpen;
        panel.style.display = isOpen ? 'block' : 'none';

        if (isOpen) {
            // ===== PERSISTENT DISMISSAL =====
            // Save "last seen" timestamp to localStorage.
            // This persists across page loads and navigation.
            // Badge will only reappear for notifications created AFTER this timestamp.
            setLastSeenNow();

            // Immediately hide badge
            const badge = document.getElementById('notif-badge');
            if (badge) badge.style.display = 'none';

            showingAll = false;
            fetchNotifications();
        }
    };

    /**
     * Close panel.
     */
    const closePanel = () => {
        const panel = document.getElementById('notif-panel');
        if (panel) {
            panel.style.display = 'none';
            isOpen = false;
            showingAll = false;
        }
    };

    /**
     * Inject the bell icon + panel HTML into the page.
     */
    const injectBellIcon = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'notif-wrapper';
        wrapper.style.cssText = 'position: relative; display: inline-flex; align-items: center;';

        wrapper.innerHTML = `
            <button id="notif-bell" aria-label="Notifications" style="
                position: relative; background: none; border: none; cursor: pointer;
                padding: 0.4rem; font-size: 1.35rem; color: #6b7280;
                transition: color 0.2s; display: flex; align-items: center; justify-content: center;
            ">
                <i class="bi bi-bell-fill"></i>
                <span id="notif-badge" style="
                    display: none; position: absolute; top: 0; right: -2px;
                    background: #ef4444; color: white; font-size: 0.6rem; font-weight: 700;
                    min-width: 18px; height: 18px; border-radius: 9px; padding: 0 5px;
                    align-items: center; justify-content: center; line-height: 1;
                    transform: translate(25%, -25%); box-shadow: 0 0 0 2px white;
                "></span>
            </button>

            <div id="notif-panel" style="
                display: none; position: absolute; top: calc(100% + 8px); right: -8px;
                width: 380px; max-width: calc(100vw - 24px); background: white;
                border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05);
                z-index: 9999; overflow: hidden;
            ">
                <div style="
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0.85rem 1rem 0.7rem; border-bottom: 1px solid #e5e7eb;
                ">
                    <h6 style="margin: 0; font-size: 1.05rem; font-weight: 700; color: #111827;">
                        Notifications
                    </h6>
                    <button id="notif-mark-all" style="
                        background: none; border: none; cursor: pointer; font-size: 0.78rem;
                        color: #00838f; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 6px;
                        transition: background 0.15s;
                    ">Mark all read</button>
                </div>

                <div id="notif-list" style="overflow-x: hidden;">
                    <div style="text-align: center; padding: 2rem 1rem; color: #9ca3af;">
                        Loading...
                    </div>
                </div>
            </div>
        `;

        const signOutBtn = container.querySelector('#logoutBtn, #headerLogoutBtn');
        if (signOutBtn) {
            signOutBtn.parentNode.insertBefore(wrapper, signOutBtn);
        } else {
            container.appendChild(wrapper);
        }

        // Event listeners
        document.getElementById('notif-bell').addEventListener('click', (e) => {
            e.stopPropagation();
            togglePanel();
        });

        document.getElementById('notif-mark-all').addEventListener('click', (e) => {
            e.stopPropagation();
            markAllAsRead();
        });

        const markAllBtn = document.getElementById('notif-mark-all');
        markAllBtn.addEventListener('mouseenter', () => { markAllBtn.style.background = '#e0f7fa'; });
        markAllBtn.addEventListener('mouseleave', () => { markAllBtn.style.background = 'none'; });

        document.addEventListener('click', (e) => {
            const wrapper = document.getElementById('notif-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                closePanel();
            }
        });

        const bell = document.getElementById('notif-bell');
        bell.addEventListener('mouseenter', () => { bell.style.color = '#00838f'; });
        bell.addEventListener('mouseleave', () => { bell.style.color = '#6b7280'; });
    };

    /**
     * Initialize the notification system.
     * Injects desktop bell only (not mobile/tablet).
     */
    const init = (containerId) => {
        injectBellIcon(containerId);
        fetchUnreadCount();

        pollInterval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);

        console.log('[Notification] v2.2 initialized — desktop bell only, persistent badge');
    };

    const destroy = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };

    return { init, destroy, fetchUnreadCount, closePanel };
})();
