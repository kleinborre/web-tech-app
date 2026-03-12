/**
 * ImageToTextOnline - Main JavaScript Module
 * 
 * This module contains all client-side functionality for the ImageToTextOnline application.
 * Uses ES6+ features with a modular structure.
 * 
 * @version 2.0.0
 * @author ImageToTextOnline Development Team
 */

'use strict';

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const CONFIG = {
    API_BASE_URL: '/api',
    MAX_FILES: 5,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.jfif', '.heic', '.webp', '.bmp', '.pdf']
};

/* ==========================================================================
   DOM UTILITY FUNCTIONS
   ========================================================================== */

/**
 * Safely selects a single DOM element.
 * @param {string} selector - CSS selector string.
 * @param {Element} context - Parent element to search within.
 * @returns {Element|null} The matched element or null.
 */
const $ = (selector, context = document) => context.querySelector(selector);

/**
 * Safely selects multiple DOM elements.
 * @param {string} selector - CSS selector string.
 * @param {Element} context - Parent element to search within.
 * @returns {NodeList} List of matched elements.
 */
const $$ = (selector, context = document) => context.querySelectorAll(selector);

/* ==========================================================================
   NOTIFICATION MODULE
   ========================================================================== */

/**
 * Handles toast notifications for user feedback.
 */
const Notification = (() => {
    /**
     * Shows a notification message to the user.
     * @param {string} message - The message to display.
     * @param {string} type - Type of notification (success, error, warning, info).
     */
    const show = (message, type = 'info') => {
        // Remove existing notifications
        const existing = $('.notification');
        if (existing) existing.remove();

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <span class="notification__message">${message}</span>
            <button class="notification__close" aria-label="Close">&times;</button>
        `;

        // Add styles if not already present
        if (!$('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 1rem 1.5rem;
                    border-radius: 8px;
                    background: #1f2937;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
                .notification--success { background: #10b981; }
                .notification--error { background: #ef4444; }
                .notification--warning { background: #f59e0b; }
                .notification--info { background: #0097b2; }
                .notification__close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.25rem;
                    cursor: pointer;
                    opacity: 0.8;
                }
                .notification__close:hover { opacity: 1; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Play sound based on notification type
        if (typeof SoundManager !== 'undefined') {
            if (type === 'success') SoundManager.play('success');
            else if (type === 'error' || type === 'warning') SoundManager.play('error');
        }

        // Close button handler
        notification.querySelector('.notification__close').addEventListener('click', () => {
            notification.remove();
        });

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    };

    return { show };
})();

/* ==========================================================================
   OCR API MODULE
   ========================================================================== */

/**
 * Handles communication with the OCR API.
 */
const OCRApi = (() => {
    /**
     * Sends files to the OCR API for text extraction.
     * @param {File[]} files - Array of files to process.
     * @returns {Promise<Object>} API response with OCR results.
     */
    const convert = async (files) => {
        const formData = new FormData();

        files.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/ocr/convert`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'OCR conversion failed');
            }

            return data;

        } catch (error) {
            console.error('[OCR API] Error:', error);
            throw error;
        }
    };

    return { convert };
})();

/* ==========================================================================
   DROP ZONE MODULE
   ========================================================================== */

/**
 * Initializes the drag and drop functionality for file uploads.
 */
const DropZone = (() => {
    const ACTIVE_CLASS = 'drop-zone--active';
    const LOADING_CLASS = 'drop-zone--loading';
    let isProcessing = false;

    /**
     * Initializes drop zone event listeners.
     */
    const init = () => {
        const dropZone = $('.drop-zone');

        if (!dropZone) return;

        // Prevent default drag behaviors on the document
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight drop zone when dragging over it
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => highlight(dropZone), false);
        });

        // Remove highlight when leaving or dropping
        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => unhighlight(dropZone), false);
        });

        // Handle dropped files
        dropZone.addEventListener('drop', handleDrop, false);

        // Handle click to upload
        dropZone.addEventListener('click', handleClick, false);

        // Handle file input change
        const fileInput = $('#file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect, false);
        }

        // Handle paste from clipboard
        document.addEventListener('paste', handlePaste, false);
    };

    /**
     * Prevents default browser behavior for drag events.
     * @param {Event} e - The drag event.
     */
    const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    /**
     * Adds active class to drop zone.
     * @param {Element} element - The drop zone element.
     */
    const highlight = (element) => {
        if (!isProcessing) {
            element.classList.add(ACTIVE_CLASS);
        }
    };

    /**
     * Removes active class from drop zone.
     * @param {Element} element - The drop zone element.
     */
    const unhighlight = (element) => {
        element.classList.remove(ACTIVE_CLASS);
    };

    /**
     * Sets loading state on drop zone.
     * @param {boolean} loading - Whether loading is active.
     */
    const setLoading = (loading) => {
        const dropZone = $('.drop-zone');
        isProcessing = loading;

        if (loading) {
            dropZone.classList.add(LOADING_CLASS);
            dropZone.querySelector('.drop-zone__title').textContent = 'Processing...';
            dropZone.querySelector('.drop-zone__subtitle').textContent = 'Please wait while we extract text';
        } else {
            dropZone.classList.remove(LOADING_CLASS);
            dropZone.querySelector('.drop-zone__title').textContent = 'Drag & Drop your images here';
            dropZone.querySelector('.drop-zone__subtitle').textContent = 'or use the options below';
        }
    };

    /**
     * Handles files dropped onto the drop zone.
     * @param {DragEvent} e - The drop event.
     */
    const handleDrop = (e) => {
        if (isProcessing) return;
        const files = e.dataTransfer.files;
        if (files.length) {
            processFiles(files);
        }
    };

    /**
     * Handles click on drop zone to trigger file input.
     * @param {MouseEvent} e - The click event.
     */
    const handleClick = (e) => {
        if (isProcessing) return;
        // Prevent triggering if clicking on a button inside drop zone
        if (e.target.closest('button') || e.target.closest('input')) return;

        const fileInput = $('#file-input');
        if (fileInput) {
            fileInput.click();
        }
    };

    /**
     * Handles file selection from input.
     * @param {Event} e - The change event.
     */
    const handleFileSelect = (e) => {
        if (isProcessing) return;
        const files = e.target.files;
        if (files.length) {
            processFiles(files);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    };

    /**
     * Handles paste events from clipboard.
     * @param {ClipboardEvent} e - The paste event.
     */
    const handlePaste = (e) => {
        if (isProcessing) return;
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles = [];
        for (const item of items) {
            if (item.type.startsWith('image/')) {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length) {
            processFiles(imageFiles);
        }
    };

    /**
     * Validates a file against allowed types and size.
     * @param {File} file - The file to validate.
     * @returns {boolean} True if valid.
     */
    const validateFile = (file) => {
        // Check file size
        if (file.size > CONFIG.MAX_FILE_SIZE) {
            return false;
        }

        // Check MIME type
        if (CONFIG.ALLOWED_TYPES.includes(file.type)) {
            return true;
        }

        // Check extension as fallback
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        return CONFIG.ALLOWED_EXTENSIONS.includes(extension);
    };

    /**
     * Processes uploaded files and sends them to the OCR API.
     * @param {FileList|Array} files - The files to process.
     */
    const processFiles = async (files) => {
        // Validate and filter files
        const validFiles = Array.from(files).filter(validateFile);

        if (validFiles.length === 0) {
            Notification.show('No valid files selected. Supported: JPG, PNG, GIF, PDF', 'error');
            return;
        }

        if (validFiles.length > CONFIG.MAX_FILES) {
            Notification.show(`Maximum ${CONFIG.MAX_FILES} files allowed. Only first ${CONFIG.MAX_FILES} will be processed.`, 'warning');
            validFiles.length = CONFIG.MAX_FILES;
        }

        // Show loading state
        setLoading(true);
        Results.showLoading();
        if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.show('Converting...');

        try {
            // Send to OCR API
            const response = await OCRApi.convert(validFiles);

            if (response.success) {
                // Render results
                Results.render(response.results, validFiles);
                Notification.show(`Text extracted from ${response.summary.successful} file(s)`, 'success');
            } else {
                throw new Error(response.error || 'OCR conversion failed');
            }

        } catch (error) {
            console.error('[Process Files] Error:', error);
            Notification.show(error.message || 'Failed to process files', 'error');
            Results.hide();
        } finally {
            setLoading(false);
            if (typeof LoadingOverlay !== 'undefined') LoadingOverlay.hide();
        }
    };

    return { init };
})();

/* ==========================================================================
   RESULTS MODULE
   ========================================================================== */

/**
 * Handles the display and management of OCR results.
 */
const Results = (() => {
    const VISIBLE_CLASS = 'results--visible';
    let currentResults = [];

    /**
     * Shows the results section.
     */
    const show = () => {
        const resultsSection = $('.results');
        if (resultsSection) {
            resultsSection.classList.add(VISIBLE_CLASS);
        }
    };

    /**
     * Hides the results section.
     */
    const hide = () => {
        const resultsSection = $('.results');
        if (resultsSection) {
            resultsSection.classList.remove(VISIBLE_CLASS);
        }
    };

    /**
     * Shows loading state in results section.
     */
    const showLoading = () => {
        show();
        const resultsList = $('.results__list');
        if (resultsList) {
            resultsList.innerHTML = `
                <div class="results__loading">
                    <div class="spinner"></div>
                    <p>Extracting text from images...</p>
                </div>
            `;
        }

        // Add spinner styles if not present
        if (!$('#spinner-styles')) {
            const styles = document.createElement('style');
            styles.id = 'spinner-styles';
            styles.textContent = `
                .results__loading {
                    padding: 3rem;
                    text-align: center;
                    color: var(--color-gray-600);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid var(--color-gray-200);
                    border-top-color: var(--color-primary);
                    border-radius: 50%;
                    margin: 0 auto 1rem;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }
    };

    /**
     * Renders OCR results in the results list.
     * @param {Array} results - Array of OCR result objects.
     * @param {File[]} files - Original files for thumbnails.
     */
    const render = (results, files) => {
        currentResults = results;
        const resultsList = $('.results__list');

        if (!resultsList) return;

        // Clear existing content
        resultsList.innerHTML = '';

        // Create result items
        results.forEach((result, index) => {
            const file = files[index];
            const item = createResultItem(result, file, index);
            resultsList.appendChild(item);
        });

        show();
    };

    /**
     * Creates a result item element.
     * @param {Object} result - OCR result object.
     * @param {File} file - Original file.
     * @param {number} index - Result index.
     * @returns {HTMLElement} Result item element.
     */
    const createResultItem = (result, file, index) => {
        const item = document.createElement('div');
        item.className = 'results__item';
        item.dataset.index = index;
        item.style.cursor = 'pointer';

        // Create thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.className = 'results__item-thumbnail';
        thumbnail.alt = result.filename;

        if (file && file.type.startsWith('image/')) {
            thumbnail.src = URL.createObjectURL(file);
        } else {
            thumbnail.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%236b7280" viewBox="0 0 16 16"%3E%3Cpath d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z"/%3E%3C/svg%3E';
        }

        // Content container
        const content = document.createElement('div');
        content.className = 'results__item-content';

        // Filename
        const name = document.createElement('p');
        name.className = 'results__item-name';
        name.textContent = result.filename;

        // Extracted text (or error message)
        const text = document.createElement('p');
        text.className = 'results__item-text';

        if (result.success) {
            text.textContent = result.text || 'No text found in image';
        } else {
            text.textContent = `Error: ${result.error || 'Failed to extract text'}`;
            text.style.color = 'var(--color-error)';
        }

        content.appendChild(name);
        content.appendChild(text);

        // Actions container
        const actions = document.createElement('div');
        actions.className = 'results__item-actions';

        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn--secondary btn--sm';
        copyBtn.title = 'Copy text';
        copyBtn.innerHTML = '<i class="bi bi-clipboard"></i>';
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            copyText(result.text, result.filename);
        });

        // Download button
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'btn btn--secondary btn--sm';
        downloadBtn.title = 'Download as text file';
        downloadBtn.innerHTML = '<i class="bi bi-download"></i>';
        downloadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            downloadText(result.text, result.filename);
        });

        // Translate button
        const translateBtn = document.createElement('button');
        translateBtn.className = 'btn btn--secondary btn--sm';
        translateBtn.title = 'Translate';
        translateBtn.style.color = 'var(--color-primary, #0097b2)';
        translateBtn.innerHTML = '<i class="bi bi-translate"></i>';
        translateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (result.success && result.text) {
                TranslationUI.showModal(result.text, result.filename);
            } else {
                Notification.show('No text available to translate', 'warning');
            }
        });

        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn--secondary btn--sm';
        deleteBtn.title = 'Delete';
        deleteBtn.style.color = 'var(--color-error, #ef4444)';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showDeleteConfirmation(result, item, index);
        });

        actions.appendChild(copyBtn);
        actions.appendChild(downloadBtn);
        actions.appendChild(translateBtn);
        actions.appendChild(deleteBtn);

        // Assemble item
        item.appendChild(thumbnail);
        item.appendChild(content);
        item.appendChild(actions);

        // Make entire item clickable to show modal
        item.addEventListener('click', () => {
            if (result.success && result.text) {
                showDetailModal(result.filename, result.text, result, item, index);
            }
        });

        return item;
    };

    /**
     * Shows delete confirmation dialog.
     * @param {Object} result - The result object.
     * @param {HTMLElement} item - The DOM element to remove.
     * @param {number} index - The index in currentResults array.
     */
    const showDeleteConfirmation = (result, item, index) => {
        // Remove existing modal
        const existingModal = document.getElementById('deleteConfirmModal');
        if (existingModal) existingModal.remove();

        const modalHtml = `
            <div class="modal fade" id="deleteConfirmModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header text-white" style="background: linear-gradient(135deg, #00838f, #00acc1);">
                            <h5 class="modal-title">Delete Confirmation</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <p class="mb-0" style="word-wrap: break-word; overflow-wrap: break-word;">Remove "${result.filename}"?</p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn text-white" style="background: linear-gradient(135deg, #00838f, #00acc1);" id="confirmDeleteBtn">
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();

        document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
            modal.hide();

            // Remove from UI
            item.remove();

            // Remove from currentResults array
            currentResults.splice(index, 1);

            // If result has database ID, delete from database
            if (result._id) {
                try {
                    await fetch(`${CONFIG.API_BASE_URL}/history/${result._id}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });
                } catch (error) {
                    console.error('Failed to delete from database:', error);
                }
            }

            Notification.show('Conversion deleted', 'success');

            // Check if results list is empty
            const resultsList = $('.results__list');
            if (resultsList && currentResults.length === 0) {
                hide();
            }
        });

        // Clean up on modal close
        document.getElementById('deleteConfirmModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('deleteConfirmModal')?.remove();
        });
    };

    /**
     * Shows a modal with full extracted text.
     * @param {string} filename - The filename.
     * @param {string} text - The full extracted text.
     */
    const showDetailModal = (filename, text, result, item, index) => {
        // Remove existing modal
        const existingModal = document.getElementById('resultDetailModal');
        if (existingModal) existingModal.remove();

        // Get image source from the result card thumbnail
        const thumbnailImg = item.querySelector('.results__item-thumbnail');
        const imgSrc = thumbnailImg && thumbnailImg.src && !thumbnailImg.src.startsWith('data:') ? thumbnailImg.src : '';

        const modalHtml = `
            <div class="modal fade" id="resultDetailModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header text-white" style="background: linear-gradient(135deg, #00838f, #00acc1); align-items: flex-start;">
                            <h5 class="modal-title" style="font-size: 1rem; word-break: break-word; white-space: normal; overflow-wrap: anywhere; max-width: calc(100% - 40px);">
                                <i class="bi bi-file-text me-2"></i>${filename}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(1); opacity: 0.9; flex-shrink: 0;"></button>
                        </div>
                        <div class="modal-body">
                            ${imgSrc ? `
                            <div class="mb-3 text-center">
                                <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Converted Image</label>
                                <div style="border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; display: inline-block; max-width: 100%;">
                                    <img src="${imgSrc}" alt="Converted image" style="max-width: 100%; max-height: 300px; object-fit: contain; display: block;">
                                </div>
                            </div>` : ''}
                            <div>
                                <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Extracted Text</label>
                                <div style="background: var(--color-gray-50, #f8f9fa); border-radius: 8px; padding: 1rem; max-height: 50vh; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; overflow-wrap: break-word; font-family: 'Consolas', 'Monaco', monospace; font-size: 0.85rem; line-height: 1.6; border: 1px solid #e9ecef;">
${text || 'No text extracted'}
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer" style="justify-content: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem;">
                            <button type="button" class="btn btn-sm" id="modalCopyBtn" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.85rem; padding: 0.4rem 1rem;">
                                <i class="bi bi-clipboard me-1"></i>Copy
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" id="modalDownloadBtn" style="font-size: 0.85rem; padding: 0.4rem 1rem;">
                                <i class="bi bi-download me-1"></i>Download
                            </button>
                            <button type="button" class="btn btn-sm" id="modalTranslateBtn" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.85rem; padding: 0.4rem 1rem;">
                                <i class="bi bi-translate me-1"></i>Translate
                            </button>
                            <button type="button" class="btn btn-sm btn-danger" id="modalDeleteBtn" style="font-size: 0.85rem; padding: 0.4rem 1rem;">
                                <i class="bi bi-trash me-1"></i>Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalEl = document.getElementById('resultDetailModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // Bind modal button events
        document.getElementById('modalCopyBtn').addEventListener('click', () => {
            copyText(text, filename);
            modal.hide();
        });

        document.getElementById('modalDownloadBtn').addEventListener('click', () => {
            downloadText(text, filename);
            modal.hide();
        });

        document.getElementById('modalTranslateBtn').addEventListener('click', () => {
            modal.hide();
            if (text) {
                TranslationUI.showModal(text, filename);
            }
        });

        document.getElementById('modalDeleteBtn').addEventListener('click', () => {
            modal.hide();
            if (result && item !== undefined && index !== undefined) {
                showDeleteConfirmation(result, item, index);
            }
        });

        // Clean up on modal close
        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl?.remove();
        });
    };

    /**
     * Copies text to clipboard.
     * @param {string} text - Text to copy.
     * @param {string} filename - Source filename for notification.
     */
    const copyText = async (text, filename) => {
        if (!text) {
            Notification.show('No text to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            Notification.show('Text copied to clipboard', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            Notification.show('Text copied to clipboard', 'success');
        }
    };

    /**
     * Downloads text as a file.
     * @param {string} text - Text to download.
     * @param {string} filename - Original filename.
     */
    const downloadText = (text, filename) => {
        if (!text) {
            Notification.show('No text to download', 'warning');
            return;
        }

        const baseName = filename.replace(/\.[^.]+$/, '');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${baseName}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Notification.show('Text downloaded', 'success');
    };

    /**
     * Clears all results and hides the section.
     */
    const clear = () => {
        currentResults = [];
        const resultsList = $('.results__list');
        if (resultsList) {
            resultsList.innerHTML = '';
        }
        hide();

        // Reset file input
        const fileInput = $('#file-input');
        if (fileInput) fileInput.value = '';
    };

    /**
     * Downloads all extracted text as a single file.
     */
    const downloadAll = () => {
        if (currentResults.length === 0) {
            Notification.show('No results to download', 'warning');
            return;
        }

        const allText = currentResults
            .filter(r => r.success && r.text)
            .map(r => `=== ${r.filename} ===\n\n${r.text}`)
            .join('\n\n' + '='.repeat(50) + '\n\n');

        if (!allText) {
            Notification.show('No text content to download', 'warning');
            return;
        }

        const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'extracted-text-all.txt';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        Notification.show('All text downloaded', 'success');
    };

    /**
     * Initializes results section event listeners.
     */
    const init = () => {
        const restartBtn = $('.results__restart');
        if (restartBtn) {
            restartBtn.addEventListener('click', clear);
        }

        const downloadAllBtn = $('.results__download-all');
        if (downloadAllBtn) {
            downloadAllBtn.addEventListener('click', downloadAll);
        }
    };

    return { init, show, hide, showLoading, render, clear };
})();

/* ==========================================================================
   PASSWORD MODULE
   ========================================================================== */

/**
 * Handles password field functionality including visibility toggle and strength meter.
 */
const Password = (() => {
    /**
     * Initializes password field functionality.
     */
    const init = () => {
        initToggle();
        initStrengthMeter();
    };

    /**
     * Sets up password visibility toggle buttons.
     */
    const initToggle = () => {
        const toggleButtons = $$('.password-input__toggle');

        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const input = button.closest('.password-input').querySelector('input');
                const icon = button.querySelector('i');

                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            });
        });
    };

    /**
     * Sets up password strength meter.
     */
    const initStrengthMeter = () => {
        const passwordInput = $('#password');
        const strengthFill = $('.password-strength__fill');
        const strengthText = $('.password-strength__text');

        if (!passwordInput || !strengthFill) return;

        passwordInput.addEventListener('input', (e) => {
            const password = e.target.value;
            const strength = calculateStrength(password);
            updateStrengthUI(strength, strengthFill, strengthText);
        });
    };

    /**
     * Calculates password strength based on various criteria.
     * @param {string} password - The password to evaluate.
     * @returns {Object} Strength level and label.
     */
    const calculateStrength = (password) => {
        let score = 0;

        if (password.length === 0) {
            return { level: '', label: '' };
        }

        // Length checks
        if (password.length >= 8) score += 1;
        if (password.length >= 12) score += 1;

        // Character type checks
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^a-zA-Z0-9]/.test(password)) score += 1;

        if (score <= 2) {
            return { level: 'weak', label: 'Weak' };
        } else if (score <= 3) {
            return { level: 'fair', label: 'Fair' };
        } else if (score <= 5) {
            return { level: 'good', label: 'Good' };
        } else {
            return { level: 'strong', label: 'Strong' };
        }
    };

    /**
     * Updates the strength meter UI.
     * @param {Object} strength - The calculated strength object.
     * @param {Element} fillElement - The progress bar fill element.
     * @param {Element} textElement - The strength text element.
     */
    const updateStrengthUI = (strength, fillElement, textElement) => {
        // Remove all strength classes
        fillElement.className = 'password-strength__fill';

        if (strength.level) {
            fillElement.classList.add(`password-strength__fill--${strength.level}`);
        }

        if (textElement) {
            textElement.textContent = strength.label;
        }
    };

    return { init };
})();

/* ==========================================================================
   FORM VALIDATION MODULE
   ========================================================================== */

/**
 * Handles form validation UI feedback.
 */
const FormValidation = (() => {
    const ERROR_CLASS = 'form-control--error';
    const SUCCESS_CLASS = 'form-control--success';

    /**
     * Shows an error state on an input field.
     * @param {Element} input - The input element.
     * @param {string} message - The error message.
     */
    const showError = (input, message) => {
        input.classList.remove(SUCCESS_CLASS);
        input.classList.add(ERROR_CLASS);

        // Find or create error element
        let errorElement = input.parentElement.querySelector('.form-error');
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.className = 'form-error';
            input.parentElement.appendChild(errorElement);
        }
        errorElement.textContent = message;
    };

    /**
     * Shows a success state on an input field.
     * @param {Element} input - The input element.
     */
    const showSuccess = (input) => {
        input.classList.remove(ERROR_CLASS);
        input.classList.add(SUCCESS_CLASS);

        const errorElement = input.parentElement.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    };

    /**
     * Clears validation state from an input field.
     * @param {Element} input - The input element.
     */
    const clearState = (input) => {
        input.classList.remove(ERROR_CLASS, SUCCESS_CLASS);

        const errorElement = input.parentElement.querySelector('.form-error');
        if (errorElement) {
            errorElement.remove();
        }
    };

    /**
     * Validates an email address format.
     * @param {string} email - The email to validate.
     * @returns {boolean} True if valid.
     */
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    /**
     * Validates password requirements.
     * @param {string} password - The password to validate.
     * @returns {boolean} True if valid.
     */
    const isValidPassword = (password) => {
        return password.length >= 8;
    };

    return { showError, showSuccess, clearState, isValidEmail, isValidPassword };
})();

/* ==========================================================================
   FAQ MODULE
   ========================================================================== */

/**
 * Handles FAQ accordion functionality.
 */
const FAQ = (() => {
    const ACTIVE_CLASS = 'faq__item--active';

    /**
     * Initializes FAQ accordion.
     */
    const init = () => {
        const faqQuestions = $$('.faq__question');

        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.closest('.faq__item');

                // Close other open items (optional - for accordion behavior)
                const allItems = $$('.faq__item');
                allItems.forEach(item => {
                    if (item !== faqItem) {
                        item.classList.remove(ACTIVE_CLASS);
                    }
                });

                // Toggle current item
                faqItem.classList.toggle(ACTIVE_CLASS);
            });
        });
    };

    return { init };
})();

/* ==========================================================================
   MOBILE MENU MODULE
   ========================================================================== */

/**
 * Handles the responsive hamburger menu for mobile and tablet views.
 * Toggles overlay, animates hamburger icon, and manages body scroll lock.
 */
const MobileMenu = (() => {
    let isOpen = false;

    /**
     * Toggles the mobile menu open/closed state.
     */
    const toggle = () => {
        const hamburger = $('#hamburgerToggle');
        const mobileMenu = $('#mobileMenu');
        if (!hamburger || !mobileMenu) return;

        isOpen = !isOpen;

        hamburger.classList.toggle('header__hamburger--active', isOpen);
        mobileMenu.classList.toggle('header__mobile-menu--open', isOpen);
    };

    /**
     * Closes the mobile menu if open.
     */
    const close = () => {
        if (!isOpen) return;
        isOpen = false;

        const hamburger = $('#hamburgerToggle');
        const mobileMenu = $('#mobileMenu');
        if (hamburger) hamburger.classList.remove('header__hamburger--active');
        if (mobileMenu) mobileMenu.classList.remove('header__mobile-menu--open');
    };

    /**
     * Initializes mobile menu functionality.
     */
    const init = () => {
        const hamburger = $('#hamburgerToggle');
        if (!hamburger) return;

        // Toggle on hamburger click
        hamburger.addEventListener('click', toggle);

        // Close when any mobile link is clicked
        $$('.header__mobile-link').forEach(link => {
            link.addEventListener('click', close);
        });

        // Mobile logout button — mirror desktop logout behavior
        const mobileLogoutBtn = $('#mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                close();
                // Trigger the same logout as desktop headerLogoutBtn
                const headerLogoutBtn = $('#headerLogoutBtn');
                if (headerLogoutBtn) {
                    headerLogoutBtn.click();
                }
            });
        }

        // Close menu if window resizes to desktop width
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 992) {
                close();
            }
        });
    };

    return { init, close };
})();

/* ==========================================================================
   TRANSLATION UI MODULE
   ========================================================================== */

/**
 * Handles the translation modal UI — language selection, API call,
 * result display, and save-to-database for authenticated users.
 */
const TranslationUI = (() => {
    const API_BASE = window.CONFIG?.API_BASE_URL || '/api';

    const LANGUAGES = [
        { code: 'autodetect', name: 'Auto Detect', sourceOnly: true },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh-CN', name: 'Chinese (Simplified)' },
        { code: 'zh-TW', name: 'Chinese (Traditional)' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' },
        { code: 'nl', name: 'Dutch' },
        { code: 'sv', name: 'Swedish' },
        { code: 'pl', name: 'Polish' },
        { code: 'tr', name: 'Turkish' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'th', name: 'Thai' },
        { code: 'id', name: 'Indonesian' },
        { code: 'tl', name: 'Filipino' }
    ];

    /**
     * Builds language <option> elements.
     * @param {string} selectedCode - Default selected language code.
     * @param {boolean} isSource - If true, includes source-only languages like Auto Detect.
     */
    const buildLangOptions = (selectedCode, isSource = false) => {
        return LANGUAGES
            .filter(l => isSource || !l.sourceOnly)
            .map(l =>
                `<option value="${l.code}"${l.code === selectedCode ? ' selected' : ''}>${l.name}</option>`
            ).join('');
    };

    /**
     * Opens the translation modal.
     * @param {string} text - The text to translate.
     * @param {string} filename - Source filename.
     */
    const showModal = (text, filename) => {
        // Remove existing modal
        const existing = document.getElementById('translationModal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal fade" id="translationModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content">
                        <div class="modal-header text-white" style="background: linear-gradient(135deg, #00838f, #00acc1);">
                            <h5 class="modal-title" style="font-size: 1rem;">
                                <i class="bi bi-translate me-2"></i>Translate Text
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" style="filter: invert(1); opacity: 0.9;"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Language selectors -->
                            <div class="row mb-3">
                                <div class="col-5">
                                    <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">From</label>
                                    <select id="translateSourceLang" class="form-select form-select-sm">
                                        ${buildLangOptions('autodetect', true)}
                                    </select>
                                </div>
                                <div class="col-2 d-flex align-items-end justify-content-center">
                                    <button type="button" id="swapLangsBtn" class="btn btn-sm btn-outline-secondary" title="Swap languages" style="margin-bottom: 2px;">
                                        <i class="bi bi-arrow-left-right"></i>
                                    </button>
                                </div>
                                <div class="col-5">
                                    <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">To</label>
                                    <select id="translateTargetLang" class="form-select form-select-sm">
                                        ${buildLangOptions('es')}
                                    </select>
                                </div>
                            </div>

                            <!-- Original text -->
                            <div class="mb-3">
                                <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Original Text</label>
                                <div id="translateOriginalText" style="background: var(--color-gray-50, #f8f9fa); border-radius: 8px; padding: 0.75rem; max-height: 20vh; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 0.85rem; line-height: 1.5; border: 1px solid #e9ecef;">${text}</div>
                            </div>

                            <!-- Translation result -->
                            <div id="translateResultContainer" style="display: none;">
                                <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Translation</label>
                                <div id="translateResultText" style="background: #e8f5e9; border-radius: 8px; padding: 0.75rem; max-height: 20vh; overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; font-size: 0.85rem; line-height: 1.5; border: 1px solid #c8e6c9;"></div>
                            </div>

                            <!-- Loading state -->
                            <div id="translateLoading" style="display: none; text-align: center; padding: 1rem;">
                                <div class="spinner-border text-info" role="status" style="width: 2rem; height: 2rem;"></div>
                                <p style="margin-top: 0.5rem; font-size: 0.85rem; color: #6b7280;">Translating...</p>
                            </div>
                        </div>
                        <div class="modal-footer" style="justify-content: center; flex-wrap: wrap; gap: 0.5rem; padding: 0.75rem;">
                            <button type="button" class="btn btn-sm" id="translateBtn" style="background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none; font-size: 0.85rem; padding: 0.4rem 1.2rem;">
                                <i class="bi bi-translate me-1"></i>Translate
                            </button>
                            <button type="button" class="btn btn-sm" id="translateCopyBtn" style="display: none; font-size: 0.85rem; padding: 0.4rem 1rem; background: #6b7280; color: white; border: none;">
                                <i class="bi bi-clipboard me-1"></i>Copy
                            </button>
                            <button type="button" class="btn btn-sm" id="translateDownloadBtn" style="display: none; font-size: 0.85rem; padding: 0.4rem 1rem; background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none;">
                                <i class="bi bi-download me-1"></i>Download
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modalEl = document.getElementById('translationModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();

        // State
        let lastTranslation = null;

        // Swap languages
        document.getElementById('swapLangsBtn').addEventListener('click', () => {
            const srcEl = document.getElementById('translateSourceLang');
            const tgtEl = document.getElementById('translateTargetLang');
            const temp = srcEl.value;
            srcEl.value = tgtEl.value;
            tgtEl.value = temp;
        });

        // Translate button
        document.getElementById('translateBtn').addEventListener('click', async () => {
            const sourceLang = document.getElementById('translateSourceLang').value;
            const targetLang = document.getElementById('translateTargetLang').value;

            if (sourceLang === targetLang) {
                Notification.show('Source and target languages must be different', 'warning');
                return;
            }

            // Show loading
            document.getElementById('translateLoading').style.display = 'block';
            document.getElementById('translateResultContainer').style.display = 'none';
            document.getElementById('translateCopyBtn').style.display = 'none';

            try {
                const response = await fetch(`${API_BASE}/translate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ text, sourceLang, targetLang })
                });

                const data = await response.json();

                document.getElementById('translateLoading').style.display = 'none';

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Translation failed');
                }

                lastTranslation = {
                    originalText: text,
                    translatedText: data.data.translatedText,
                    sourceLang,
                    targetLang,
                    originalFileName: filename || ''
                };

                // Show result
                document.getElementById('translateResultText').textContent = data.data.translatedText;
                document.getElementById('translateResultContainer').style.display = 'block';
                document.getElementById('translateCopyBtn').style.display = 'inline-block';
                document.getElementById('translateDownloadBtn').style.display = 'inline-block';

                // Auto-save translation for authenticated users
                try {
                    const meRes = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
                    if (meRes.ok) {
                        await fetch(`${API_BASE}/translations`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(lastTranslation)
                        });
                    }
                } catch (saveErr) {
                    console.warn('Auto-save translation failed:', saveErr);
                }

                Notification.show('Translation complete', 'success');

            } catch (error) {
                document.getElementById('translateLoading').style.display = 'none';
                Notification.show(error.message || 'Translation failed', 'error');
            }
        });

        // Copy translation
        document.getElementById('translateCopyBtn').addEventListener('click', async () => {
            if (!lastTranslation) return;
            try {
                await navigator.clipboard.writeText(lastTranslation.translatedText);
                Notification.show('Translation copied to clipboard', 'success');
            } catch (err) {
                Notification.show('Failed to copy', 'error');
            }
        });

        // Download translation
        document.getElementById('translateDownloadBtn').addEventListener('click', () => {
            if (!lastTranslation) return;
            const blob = new Blob([lastTranslation.translatedText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `translation_${(lastTranslation.targetLang || 'text')}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            Notification.show('Translation downloaded', 'success');
        });

        // Clean up on modal close
        modalEl.addEventListener('hidden.bs.modal', () => {
            modalEl?.remove();
        });
    };

    return { showModal };
})();

/* ==========================================================================
   APPLICATION INITIALIZATION
   ========================================================================== */

/**
 * Main application initialization.
 * Runs when the DOM is fully loaded.
 */
const App = (() => {
    /**
     * Initializes all application modules.
     */
    const init = () => {
        // Initialize modules based on current page
        DropZone.init();
        Results.init();
        Password.init();
        FAQ.init();
        MobileMenu.init();

        console.log('ImageToTextOnline application initialized (v2.0.0)');
    };

    return { init };
})();

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
