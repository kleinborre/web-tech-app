/**
 * ImageToTextOnline - Main JavaScript Module
 * 
 * This module contains all client-side functionality for the ImageToTextOnline application.
 * Uses ES6+ features with a modular structure.
 * 
 * @version 1.0.0
 * @author ImageToTextOnline Development Team
 */

'use strict';

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
   DROP ZONE MODULE
   ========================================================================== */

/**
 * Initializes the drag and drop functionality for file uploads.
 */
const DropZone = (() => {
    const ACTIVE_CLASS = 'drop-zone--active';

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
        element.classList.add(ACTIVE_CLASS);
    };

    /**
     * Removes active class from drop zone.
     * @param {Element} element - The drop zone element.
     */
    const unhighlight = (element) => {
        element.classList.remove(ACTIVE_CLASS);
    };

    /**
     * Handles files dropped onto the drop zone.
     * @param {DragEvent} e - The drop event.
     */
    const handleDrop = (e) => {
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
        const files = e.target.files;
        if (files.length) {
            processFiles(files);
        }
    };

    /**
     * Handles paste events from clipboard.
     * @param {ClipboardEvent} e - The paste event.
     */
    const handlePaste = (e) => {
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
     * Processes uploaded files.
     * @param {FileList|Array} files - The files to process.
     */
    const processFiles = (files) => {
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jfif', 'image/heic', 'application/pdf'];
        const validFiles = Array.from(files).filter(file => {
            const isValid = validTypes.some(type => file.type === type || file.name.toLowerCase().endsWith('.jfif') || file.name.toLowerCase().endsWith('.heic'));
            return isValid;
        });

        if (validFiles.length === 0) {
            console.warn('No valid files selected. Supported formats: JPG, PNG, GIF, JFIF, HEIC, PDF');
            return;
        }

        console.log('Processing files:', validFiles);

        // Show results section
        Results.show();

        // TODO: Implement actual file processing and OCR
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
     * Toggles the visibility of the results section.
     */
    const toggle = () => {
        const resultsSection = $('.results');
        if (resultsSection) {
            resultsSection.classList.toggle(VISIBLE_CLASS);
        }
    };

    /**
     * Clears all results and hides the section.
     */
    const clear = () => {
        const resultsList = $('.results__list');
        if (resultsList) {
            resultsList.innerHTML = '';
        }
        hide();
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

    /**
     * Downloads all extracted text as a single file.
     */
    const downloadAll = () => {
        // TODO: Implement download all functionality
        console.log('Download all clicked');
    };

    return { init, show, hide, toggle, clear };
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
 * Handles mobile navigation menu.
 */
const MobileMenu = (() => {
    /**
     * Initializes mobile menu functionality.
     */
    const init = () => {
        const menuToggle = $('.mobile-menu-toggle');
        const mobileNav = $('.mobile-nav');

        if (!menuToggle || !mobileNav) return;

        menuToggle.addEventListener('click', () => {
            mobileNav.classList.toggle('mobile-nav--active');
            menuToggle.classList.toggle('mobile-menu-toggle--active');
        });
    };

    return { init };
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

        console.log('ImageToTextOnline application initialized');
    };

    return { init };
})();

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', App.init);
