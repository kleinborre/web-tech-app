/**
 * ImageToTextOnline - Bulk Selection Module
 * 
 * Adds checkbox-based bulk selection to data tables (desktop)
 * and long-press selection for mobile card views.
 * Injects a floating action bar for bulk delete / download.
 *
 * @version 2.0.0
 */

'use strict';

const BulkSelection = (() => {
    // ── State ──
    let selectedIds = new Set();
    let selectionMode = false;
    let longPressTimer = null;
    let config = {};
    let actionBar = null;

    // ── Defaults ──
    const LONG_PRESS_MS = 600;

    // ── Inject Styles (once) ──
    function injectStyles() {
        if (document.getElementById('bulk-selection-styles')) return;
        const style = document.createElement('style');
        style.id = 'bulk-selection-styles';
        style.textContent = `
            /* Checkbox column — compact, no extra whitespace */
            .bulk-cb-col {
                width: 36px !important;
                min-width: 36px !important;
                max-width: 36px !important;
                text-align: center;
                vertical-align: middle;
                padding: 0.5rem 0.25rem !important;
            }
            .bulk-cb-col input[type="checkbox"] {
                width: 16px; height: 16px; cursor: pointer;
                accent-color: #0097b2; margin: 0;
            }

            /* Table with bulk selection needs adjusted layout */
            #historyTable.bulk-enhanced {
                table-layout: fixed;
                width: 100%;
            }
            #historyTable.bulk-enhanced th:nth-child(1),
            #historyTable.bulk-enhanced td:nth-child(1) {
                width: 36px; min-width: 36px; max-width: 36px;
            }
            #historyTable.bulk-enhanced th:nth-child(2),
            #historyTable.bulk-enhanced td:nth-child(2) {
                width: 145px;
            }
            #historyTable.bulk-enhanced th:nth-child(3),
            #historyTable.bulk-enhanced td:nth-child(3) {
                width: 150px;
            }
            #historyTable.bulk-enhanced th:nth-child(4),
            #historyTable.bulk-enhanced td:nth-child(4) {
                width: auto;
            }
            #historyTable.bulk-enhanced th:nth-child(5),
            #historyTable.bulk-enhanced td:nth-child(5) {
                width: 160px; min-width: 160px;
                white-space: nowrap;
            }

            /* Row highlight when selected */
            tr.bulk-selected { background: rgba(0,151,178,0.08) !important; }
            .history-card.bulk-selected {
                outline: 2px solid #0097b2;
                outline-offset: -2px;
                background: rgba(0,151,178,0.06) !important;
            }

            /* Floating bulk action bar */
            .bulk-action-bar {
                position: fixed; bottom: 0; left: 0; right: 0;
                height: 56px; z-index: 9998;
                background: linear-gradient(135deg, #00838f, #00acc1);
                color: #fff; display: flex; align-items: center;
                justify-content: space-between; padding: 0 1.5rem;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.18);
                transform: translateY(100%);
                transition: transform 0.25s cubic-bezier(.4,0,.2,1);
                font-family: 'Poppins', sans-serif;
            }
            .bulk-action-bar--visible { transform: translateY(0); }
            .bulk-action-bar__info {
                font-size: 0.9rem; font-weight: 500;
                display: flex; align-items: center; gap: 0.5rem;
            }
            .bulk-action-bar__actions { display: flex; gap: 0.5rem; }
            .bulk-action-bar__btn {
                border: none; border-radius: 8px; padding: 0.4rem 1rem;
                font-size: 0.82rem; font-weight: 500; cursor: pointer;
                display: inline-flex; align-items: center; gap: 0.35rem;
                transition: background 0.15s, transform 0.1s;
                font-family: 'Poppins', sans-serif;
            }
            .bulk-action-bar__btn:active { transform: scale(0.96); }
            .bulk-action-bar__btn--delete {
                background: rgba(255,255,255,0.2); color: #fff;
            }
            .bulk-action-bar__btn--delete:hover { background: rgba(239,68,68,0.85); }
            .bulk-action-bar__btn--download {
                background: rgba(255,255,255,0.2); color: #fff;
            }
            .bulk-action-bar__btn--download:hover { background: rgba(255,255,255,0.35); }
            .bulk-action-bar__btn--cancel {
                background: transparent; color: rgba(255,255,255,0.8);
                text-decoration: underline;
            }
            .bulk-action-bar__btn--cancel:hover { color: #fff; }

            /* Mobile: hide checkboxes, show long-press hint */
            .bulk-hint {
                font-size: 0.75rem; color: var(--color-gray-400, #9ca3af);
                text-align: center; padding: 0.25rem 0 0;
                display: none;
            }
            @media (max-width: 768px) {
                .bulk-hint { display: block; }
                .bulk-cb-col { display: none !important; }
            }
            @media (min-width: 769px) {
                .bulk-hint { display: none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    // ── Action Bar ──
    function createActionBar() {
        if (actionBar) return;
        actionBar = document.createElement('div');
        actionBar.className = 'bulk-action-bar';
        actionBar.id = 'bulkActionBar';
        actionBar.innerHTML = `
            <div class="bulk-action-bar__info">
                <i class="bi bi-check2-square"></i>
                <span id="bulkCount">0 selected</span>
            </div>
            <div class="bulk-action-bar__actions">
                <button class="bulk-action-bar__btn bulk-action-bar__btn--download" id="bulkDownloadBtn" title="Download selected">
                    <i class="bi bi-download"></i> Download
                </button>
                <button class="bulk-action-bar__btn bulk-action-bar__btn--delete" id="bulkDeleteBtn" title="Delete selected">
                    <i class="bi bi-trash"></i> Delete
                </button>
                <button class="bulk-action-bar__btn bulk-action-bar__btn--cancel" id="bulkCancelBtn" title="Cancel selection">
                    Cancel
                </button>
            </div>
        `;
        document.body.appendChild(actionBar);

        document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete);
        document.getElementById('bulkDownloadBtn').addEventListener('click', handleBulkDownload);
        document.getElementById('bulkCancelBtn').addEventListener('click', clearSelection);
    }

    function showActionBar() {
        if (!actionBar) createActionBar();
        actionBar.classList.add('bulk-action-bar--visible');
        document.getElementById('bulkCount').textContent =
            `${selectedIds.size} selected`;
    }

    function hideActionBar() {
        if (actionBar) actionBar.classList.remove('bulk-action-bar--visible');
    }

    // ── Selection Logic ──
    function toggleSelect(id, row) {
        if (selectedIds.has(id)) {
            selectedIds.delete(id);
            row.classList.remove('bulk-selected');
            const cb = row.querySelector('.bulk-row-cb');
            if (cb) cb.checked = false;
        } else {
            selectedIds.add(id);
            row.classList.add('bulk-selected');
            const cb = row.querySelector('.bulk-row-cb');
            if (cb) cb.checked = true;
        }
        updateUI();
    }

    function updateUI() {
        if (selectedIds.size > 0) {
            selectionMode = true;
            showActionBar();
        } else {
            selectionMode = false;
            hideActionBar();
        }
        // Update select-all checkbox
        const selectAll = document.getElementById('bulkSelectAll');
        if (selectAll) {
            const allCbs = document.querySelectorAll('.bulk-row-cb');
            selectAll.checked = allCbs.length > 0 && selectedIds.size === allCbs.length;
            selectAll.indeterminate = selectedIds.size > 0 && selectedIds.size < allCbs.length;
        }
    }

    function clearSelection() {
        selectedIds.clear();
        selectionMode = false;
        hideActionBar();
        document.querySelectorAll('.bulk-selected').forEach(r => r.classList.remove('bulk-selected'));
        document.querySelectorAll('.bulk-row-cb').forEach(cb => cb.checked = false);
        const selectAll = document.getElementById('bulkSelectAll');
        if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
    }

    // ── Table Enhancement (Desktop) ──
    function enhanceTable(tableId) {
        const table = document.getElementById(tableId);
        if (!table) return;

        // Mark table as bulk-enhanced for CSS layout
        table.classList.add('bulk-enhanced');

        // Add select-all header
        const thead = table.querySelector('thead tr');
        if (thead && !thead.querySelector('.bulk-cb-col')) {
            const th = document.createElement('th');
            th.className = 'bulk-cb-col';
            th.innerHTML = '<input type="checkbox" id="bulkSelectAll" title="Select all">';
            thead.prepend(th);

            document.getElementById('bulkSelectAll').addEventListener('change', (e) => {
                const rows = table.querySelectorAll('tbody tr[data-id]');
                rows.forEach(row => {
                    const id = row.dataset.id;
                    if (e.target.checked) {
                        selectedIds.add(id);
                        row.classList.add('bulk-selected');
                        const cb = row.querySelector('.bulk-row-cb');
                        if (cb) cb.checked = true;
                    } else {
                        selectedIds.delete(id);
                        row.classList.remove('bulk-selected');
                        const cb = row.querySelector('.bulk-row-cb');
                        if (cb) cb.checked = false;
                    }
                });
                updateUI();
            });
        } else if (thead && thead.querySelector('.bulk-cb-col')) {
            // Header already exists — just reset select-all state
            const selectAll = document.getElementById('bulkSelectAll');
            if (selectAll) {
                selectAll.checked = false;
                selectAll.indeterminate = false;
            }
        }

        // Add checkbox to each row
        const rows = table.querySelectorAll('tbody tr[data-id]');
        rows.forEach(row => {
            if (row.querySelector('.bulk-cb-col')) return;
            const td = document.createElement('td');
            td.className = 'bulk-cb-col';
            const id = row.dataset.id;
            td.innerHTML = `<input type="checkbox" class="bulk-row-cb" data-id="${id}">`;
            row.prepend(td);

            // CRITICAL: Stop checkbox clicks from propagating to the row's onclick
            td.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Restore checked state if selected
            if (selectedIds.has(id)) {
                row.classList.add('bulk-selected');
                td.querySelector('input').checked = true;
            }

            td.querySelector('input').addEventListener('change', () => {
                toggleSelect(id, row);
            });
        });

        // Update empty row colspan to account for checkbox column
        const emptyRow = table.querySelector('tbody tr:not([data-id]) td[colspan]');
        if (emptyRow) {
            const currentColspan = parseInt(emptyRow.getAttribute('colspan')) || 4;
            emptyRow.setAttribute('colspan', currentColspan + 1);
        }
    }

    // ── Card Enhancement (Mobile long-press) ──
    function enhanceCards(containerSelector) {
        const cards = document.querySelectorAll(containerSelector);
        cards.forEach(card => {
            const id = card.dataset.id;
            if (!id || card.dataset.bulkBound) return;
            card.dataset.bulkBound = 'true';

            // Restore selected state
            if (selectedIds.has(id)) {
                card.classList.add('bulk-selected');
            }

            // Long-press to start selection
            card.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                longPressTimer = setTimeout(() => {
                    e.preventDefault();
                    toggleSelect(id, card);
                }, LONG_PRESS_MS);
            });
            card.addEventListener('pointerup', () => { clearTimeout(longPressTimer); });
            card.addEventListener('pointerleave', () => { clearTimeout(longPressTimer); });
            card.addEventListener('pointermove', () => { clearTimeout(longPressTimer); });

            // If already in selection mode, tap to toggle
            card.addEventListener('click', (e) => {
                if (selectionMode) {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSelect(id, card);
                }
            }, true);
        });
    }

    // ── Bulk Actions ──
    async function handleBulkDelete() {
        if (selectedIds.size === 0) return;
        const count = selectedIds.size;

        const doDelete = async () => {
            if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.show(`Deleting ${count} item(s)...`);
            try {
                const response = await fetch('/api/history/bulk-delete', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedIds) })
                });
                const result = await response.json();
                if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();

                if (result.success) {
                    if (typeof DashboardUI !== 'undefined') {
                        DashboardUI.showToast(`Deleted ${result.deletedCount} record(s)`, 'success');
                    } else if (typeof UI !== 'undefined') {
                        UI.showToast(`Deleted ${result.deletedCount} record(s)`, 'success');
                    }
                    clearSelection();
                    // Refresh data
                    if (typeof HistoryManager !== 'undefined') HistoryManager.load(1);
                    if (typeof NotificationManager !== 'undefined' && NotificationManager.refresh) {
                        NotificationManager.refresh();
                    }
                } else {
                    if (typeof DashboardUI !== 'undefined') {
                        DashboardUI.showToast(result.error || 'Failed to delete', 'danger');
                    }
                }
            } catch (err) {
                if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
                console.error('[BulkSelection] Delete error:', err);
            }
        };

        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Bulk Delete',
                `Delete ${count} selected record(s)? This cannot be undone.`,
                doDelete,
                null,
                'Delete',
                'Cancel',
                'primary'
            );
        } else if (confirm(`Delete ${count} selected record(s)?`)) {
            await doDelete();
        }
    }

    function handleBulkDownload() {
        if (selectedIds.size === 0) return;

        // Collect text from visible rows/cards
        const items = [];
        selectedIds.forEach(id => {
            // Try table row
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                const cells = row.querySelectorAll('td');
                // With checkbox column: cells[0]=checkbox, cells[1]=date, cells[2]=filename, cells[3]=text, cells[4]=actions
                const filename = cells[2]?.textContent?.trim() || 'unknown';
                const text = cells[3]?.textContent?.trim() || '';
                items.push({ filename, text });
                return;
            }
            // Try card
            const card = document.querySelector(`.history-card[data-id="${id}"]`);
            if (card) {
                const filename = card.querySelector('.history-card__filename')?.textContent?.trim() || 'unknown';
                const text = card.querySelector('.history-card__snippet')?.textContent?.trim() || '';
                items.push({ filename, text });
            }
        });

        if (items.length === 0) return;

        // Download as combined text file
        let content = '';
        items.forEach((item) => {
            content += `=== ${item.filename} ===\n${item.text}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk-export-${items.length}-files.txt`;
        a.click();
        URL.revokeObjectURL(url);

        if (typeof DashboardUI !== 'undefined') {
            DashboardUI.showToast(`Downloaded ${items.length} item(s)`, 'success');
        }
    }

    // ── Public API ──
    return {
        init(opts = {}) {
            config = opts;
            injectStyles();
            createActionBar();
        },

        /** Call after table rows are rendered/re-rendered */
        enhanceTable(tableId) {
            enhanceTable(tableId || config.tableId);
        },

        /** Call after mobile cards are rendered */
        enhanceCards(selector) {
            enhanceCards(selector || config.cardSelector);
        },

        /** Clear current selection */
        clear: clearSelection,

        /** Get selected IDs */
        getSelected() { return Array.from(selectedIds); },

        /** Whether selection mode is active */
        isActive() { return selectionMode; }
    };
})();
