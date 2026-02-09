/**
 * ImageToTextOnline - Authentication Module
 * 
 * Handles registration, login, logout with live form validation.
 * 
 * @version 1.0.0
 */

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const AUTH_CONFIG = {
    API_BASE: '/api/auth',
    REDIRECT_AFTER_LOGIN: '/admin/dashboard.html',
    REDIRECT_AFTER_LOGOUT: '/',
    LOGIN_PAGE: '/auth/login.html',
    MIN_PASSWORD_LENGTH: 6, // Lowered from 8
    PASSWORD_REGEX: /[!@#$%^&*(),.?":{}|<>]/, // Optional special char
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/
};

/* ==========================================================================
   VALIDATION UTILITIES
   ========================================================================== */

const Validators = {
    /**
     * Validate email format.
     */
    email: (email) => {
        if (!email || email.trim() === '') {
            return { valid: false, message: 'Email is required' };
        }
        if (!AUTH_CONFIG.EMAIL_REGEX.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        return { valid: true, message: '' };
    },

    /**
     * Validate username.
     */
    username: (username) => {
        if (!username || username.trim() === '') {
            return { valid: false, message: 'Username is required' };
        }
        if (username.length < 3) {
            return { valid: false, message: 'Username must be at least 3 characters' };
        }
        if (username.length > 30) {
            return { valid: false, message: 'Username cannot exceed 30 characters' };
        }
        if (!AUTH_CONFIG.USERNAME_REGEX.test(username)) {
            return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
        }
        return { valid: true, message: '' };
    },

    /**
     * Validate password strength (simplified requirements).
     */
    password: (password) => {
        if (!password || password === '') {
            return { valid: false, message: 'Password is required', strength: 0 };
        }

        if (password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
            return {
                valid: false,
                message: `Password must be at least ${AUTH_CONFIG.MIN_PASSWORD_LENGTH} characters`,
                strength: 0
            };
        }

        // Calculate strength (0-4) but only require length
        let strength = 1;
        if (password.length >= 8) strength++;
        if (AUTH_CONFIG.PASSWORD_REGEX.test(password)) strength++;
        if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) strength++;

        return { valid: true, message: 'Password accepted', strength };
    },

    /**
     * Validate password confirmation.
     */
    confirmPassword: (password, confirmPassword) => {
        if (!confirmPassword || confirmPassword === '') {
            return { valid: false, message: 'Please confirm your password' };
        }
        if (password !== confirmPassword) {
            return { valid: false, message: 'Passwords do not match' };
        }
        return { valid: true, message: '' };
    }
};

/* ==========================================================================
   UI FEEDBACK
   ========================================================================== */

const UI = {
    /**
     * Show error state on input field.
     */
    showError: (input, message) => {
        const formGroup = input.closest('.form-group') || input.parentElement;
        const errorElement = formGroup.querySelector('.error-message') || UI.createErrorElement(formGroup);

        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    },

    /**
     * Show success state on input field.
     */
    showSuccess: (input, message = '') => {
        const formGroup = input.closest('.form-group') || input.parentElement;
        const errorElement = formGroup.querySelector('.error-message');

        input.classList.remove('is-invalid');
        input.classList.add('is-valid');

        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },

    /**
     * Clear validation state.
     */
    clearValidation: (input) => {
        const formGroup = input.closest('.form-group') || input.parentElement;
        const errorElement = formGroup.querySelector('.error-message');

        input.classList.remove('is-invalid', 'is-valid');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    },

    /**
     * Create error message element if doesn't exist.
     */
    createErrorElement: (formGroup) => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-danger small mt-1';
        errorDiv.style.display = 'none';
        formGroup.appendChild(errorDiv);
        return errorDiv;
    },

    /**
     * Update password strength meter.
     */
    updatePasswordStrength: (input, strength) => {
        const formGroup = input.closest('.form-group') || input.parentElement;
        let strengthMeter = formGroup.querySelector('.password-strength');

        if (!strengthMeter) {
            strengthMeter = document.createElement('div');
            strengthMeter.className = 'password-strength mt-2';
            strengthMeter.innerHTML = `
                <div class="strength-bar">
                    <div class="strength-fill"></div>
                </div>
                <small class="strength-text"></small>
            `;
            formGroup.appendChild(strengthMeter);
        }

        const fill = strengthMeter.querySelector('.strength-fill');
        const text = strengthMeter.querySelector('.strength-text');

        const levels = ['weak', 'fair', 'good', 'strong'];
        const colors = ['#dc3545', '#fd7e14', '#ffc107', '#28a745'];
        const labels = ['Weak', 'Fair', 'Good', 'Strong'];

        const level = Math.max(0, Math.min(strength - 1, 3));

        fill.style.width = `${(strength / 4) * 100}%`;
        fill.style.backgroundColor = colors[level];
        text.textContent = labels[level] || '';
        text.style.color = colors[level];
    },

    /**
     * Show loading state on button.
     */
    showLoading: (button, text = 'Loading...') => {
        button.disabled = true;
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
    },

    /**
     * Hide loading state on button.
     */
    hideLoading: (button) => {
        button.disabled = false;
        button.innerHTML = button.dataset.originalText || 'Submit';
    },

    /**
     * Show toast notification.
     */
    showToast: (message, type = 'info') => {
        const toastContainer = document.querySelector('.toast-container') || UI.createToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast show align-items-center text-bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.remove();
        }, 5000);

        // Close button handler
        toast.querySelector('.btn-close').addEventListener('click', () => toast.remove());
    },

    /**
     * Create toast container if doesn't exist.
     */
    createToastContainer: () => {
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
        return container;
    },

    /**
     * Show success modal with countdown.
     * @param {boolean} autoRedirect - If true, automatically redirects after countdown (default: false)
     */
    showSuccessModal: (title, message, redirectUrl = null, buttonText = 'Continue', autoRedirect = false) => {
        // Remove existing modal
        const existingModal = document.getElementById('successModal');
        if (existingModal) existingModal.remove();

        // Use primary (dark turquoise) theme color instead of green
        const bgColor = 'background: linear-gradient(135deg, #00838f, #00acc1);';
        const iconColor = 'color: #00838f;';

        const modalHtml = `
            <div class="modal fade" id="successModal" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header text-white" style="${bgColor}">
                            <h5 class="modal-title">
                                <i class="bi bi-check-circle me-2"></i>${title}
                            </h5>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="bi bi-check-circle-fill" style="font-size: 4rem; ${iconColor}"></i>
                            <p class="mt-3 mb-0">${message}</p>
                            ${autoRedirect && redirectUrl ? '<p class="mt-2 text-muted" id="countdownText">Redirecting in <span id="countdownNumber">3</span>...</p>' : ''}
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn" id="modalContinueBtn" style="${bgColor} color: white; border: none;">${buttonText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();

        const continueBtn = document.getElementById('modalContinueBtn');

        // If auto redirect with countdown
        if (autoRedirect && redirectUrl) {
            let countdown = 3;
            const countdownEl = document.getElementById('countdownNumber');

            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdownEl) countdownEl.textContent = countdown;

                if (countdown <= 0) {
                    clearInterval(countdownInterval);
                    modal.hide();
                    window.location.href = redirectUrl;
                }
            }, 1000);

            continueBtn.addEventListener('click', () => {
                clearInterval(countdownInterval);
                modal.hide();
                window.location.href = redirectUrl;
            });
        } else {
            continueBtn.addEventListener('click', () => {
                modal.hide();
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            });

            // Also handle modal close
            document.getElementById('successModal').addEventListener('hidden.bs.modal', () => {
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            });
        }
    },

    /**
     * Show confirmation dialog.
     * @param {string} type - 'primary' (turquoise), 'secondary' (gray), 'warning' (yellow), 'danger' (red)
     */
    showConfirmDialog: (title, message, onConfirm, onCancel = null, confirmText = 'Yes', cancelText = 'Cancel', type = 'primary') => {
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) existingModal.remove();

        // Color schemes
        let bgStyle, btnStyle, iconStyle;
        switch (type) {
            case 'primary':
                bgStyle = 'background: linear-gradient(135deg, #00838f, #00acc1);';
                btnStyle = 'background: linear-gradient(135deg, #00838f, #00acc1); color: white; border: none;';
                iconStyle = 'color: #00838f;';
                break;
            case 'secondary':
                bgStyle = 'background: linear-gradient(135deg, #546e7a, #78909c);';
                btnStyle = 'background: linear-gradient(135deg, #546e7a, #78909c); color: white; border: none;';
                iconStyle = 'color: #546e7a;';
                break;
            case 'danger':
                bgStyle = 'background: linear-gradient(135deg, #c62828, #e53935);';
                btnStyle = 'background: linear-gradient(135deg, #c62828, #e53935); color: white; border: none;';
                iconStyle = 'color: #c62828;';
                break;
            case 'warning':
            default:
                bgStyle = 'background: linear-gradient(135deg, #f9a825, #fbc02d);';
                btnStyle = 'background: linear-gradient(135deg, #f9a825, #fbc02d); color: white; border: none;';
                iconStyle = 'color: #f9a825;';
                break;
        }

        const modalHtml = `
            <div class="modal fade" id="confirmModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header text-white" style="${bgStyle}">
                            <h5 class="modal-title">
                                <i class="bi bi-question-circle me-2"></i>${title}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center py-4">
                            <i class="bi bi-question-circle-fill" style="font-size: 3rem; ${iconStyle}"></i>
                            <p class="mt-3 mb-0">${message}</p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-secondary" id="confirmCancelBtn">${cancelText}</button>
                            <button type="button" class="btn" id="confirmOkBtn" style="${btnStyle}">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = new bootstrap.Modal(document.getElementById('confirmModal'));
        modal.show();

        document.getElementById('confirmOkBtn').addEventListener('click', () => {
            modal.hide();
            if (onConfirm) onConfirm();
        });

        document.getElementById('confirmCancelBtn').addEventListener('click', () => {
            modal.hide();
            if (onCancel) onCancel();
        });
    },

    /**
     * Show double confirmation dialog (for critical actions).
     * First dialog uses primary (turquoise), second uses secondary (gray).
     */
    showDoubleConfirmDialog: (title1, message1, title2, message2, onConfirm) => {
        UI.showConfirmDialog(title1, message1, () => {
            UI.showConfirmDialog(title2, message2, onConfirm, null, 'Yes, I am sure', 'Cancel', 'secondary');
        }, null, 'Yes', 'Cancel', 'primary');
    }
};

/* ==========================================================================
   API SERVICE
   ========================================================================== */

const AuthService = {
    /**
     * Register a new user.
     */
    register: async (userData) => {
        const response = await fetch(`${AUTH_CONFIG.API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(userData)
        });
        return response.json();
    },

    /**
     * Login user.
     */
    login: async (credentials) => {
        const response = await fetch(`${AUTH_CONFIG.API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(credentials)
        });
        return response.json();
    },

    /**
     * Logout user.
     */
    logout: async () => {
        const response = await fetch(`${AUTH_CONFIG.API_BASE}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        return response.json();
    },

    /**
     * Get current user.
     */
    getMe: async () => {
        const response = await fetch(`${AUTH_CONFIG.API_BASE}/me`, {
            credentials: 'include'
        });
        return response.json();
    }
};

/* ==========================================================================
   FORM HANDLERS
   ========================================================================== */

const FormHandlers = {
    /**
     * Initialize login form.
     */
    initLoginForm: () => {
        const form = document.getElementById('loginForm');
        if (!form) return;

        const usernameInput = form.querySelector('#username') || form.querySelector('[name="username"]');
        const emailInput = form.querySelector('#email') || form.querySelector('[name="email"]');
        const passwordInput = form.querySelector('#password') || form.querySelector('[name="password"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Live validation
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                const result = Validators.username(usernameInput.value);
                if (usernameInput.value === '') {
                    UI.clearValidation(usernameInput);
                } else if (result.valid) {
                    UI.showSuccess(usernameInput);
                } else {
                    UI.showError(usernameInput, result.message);
                }
            });
        }

        if (emailInput) {
            emailInput.addEventListener('input', () => {
                const result = Validators.email(emailInput.value);
                if (emailInput.value === '') {
                    UI.clearValidation(emailInput);
                } else if (result.valid) {
                    UI.showSuccess(emailInput);
                } else {
                    UI.showError(emailInput, result.message);
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                if (passwordInput.value === '') {
                    UI.clearValidation(passwordInput);
                } else if (passwordInput.value.length >= 1) {
                    UI.showSuccess(passwordInput);
                }
            });
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const credentials = {};

            // Support both username and email login
            if (usernameInput && usernameInput.value) {
                credentials.username = usernameInput.value.trim();
            }
            if (emailInput && emailInput.value) {
                credentials.email = emailInput.value.trim();
            }
            if (passwordInput) {
                credentials.password = passwordInput.value;
            }

            // Basic validation
            if (!credentials.username && !credentials.email) {
                UI.showToast('Please enter your username or email', 'danger');
                return;
            }
            if (!credentials.password) {
                UI.showToast('Please enter your password', 'danger');
                return;
            }

            UI.showLoading(submitBtn, 'Logging in...');

            try {
                const result = await AuthService.login(credentials);

                if (result.success) {
                    // Store user info in localStorage for frontend use
                    localStorage.setItem('user', JSON.stringify(result.user));

                    // Show success modal with countdown before redirect
                    UI.showSuccessModal(
                        'Login Successful!',
                        `Welcome back, <strong>${result.user.username}</strong>!`,
                        AUTH_CONFIG.REDIRECT_AFTER_LOGIN,
                        'Go to Dashboard',
                        true // Enable auto-redirect with countdown
                    );
                } else {
                    UI.showToast(result.error || 'Login failed', 'danger');
                    UI.hideLoading(submitBtn);
                }
            } catch (error) {
                console.error('Login error:', error);
                UI.showToast('Connection error. Please try again.', 'danger');
                UI.hideLoading(submitBtn);
            }
        });
    },

    /**
     * Initialize register form.
     */
    initRegisterForm: () => {
        const form = document.getElementById('registerForm');
        if (!form) return;

        const usernameInput = form.querySelector('#username') || form.querySelector('[name="username"]');
        const emailInput = form.querySelector('#email') || form.querySelector('[name="email"]');
        const passwordInput = form.querySelector('#password') || form.querySelector('[name="password"]');
        const confirmPasswordInput = form.querySelector('#confirmPassword') || form.querySelector('[name="confirmPassword"]');
        const submitBtn = form.querySelector('button[type="submit"]');

        // Live validation - Username
        if (usernameInput) {
            usernameInput.addEventListener('input', () => {
                const result = Validators.username(usernameInput.value);
                if (usernameInput.value === '') {
                    UI.clearValidation(usernameInput);
                } else if (result.valid) {
                    UI.showSuccess(usernameInput);
                } else {
                    UI.showError(usernameInput, result.message);
                }
            });
        }

        // Live validation - Email
        if (emailInput) {
            emailInput.addEventListener('input', () => {
                const result = Validators.email(emailInput.value);
                if (emailInput.value === '') {
                    UI.clearValidation(emailInput);
                } else if (result.valid) {
                    UI.showSuccess(emailInput);
                } else {
                    UI.showError(emailInput, result.message);
                }
            });
        }

        // Live validation - Password with strength meter
        if (passwordInput) {
            passwordInput.addEventListener('input', () => {
                const result = Validators.password(passwordInput.value);

                if (passwordInput.value === '') {
                    UI.clearValidation(passwordInput);
                    const strengthMeter = passwordInput.closest('.form-group')?.querySelector('.password-strength');
                    if (strengthMeter) strengthMeter.remove();
                } else {
                    UI.updatePasswordStrength(passwordInput, result.strength);
                    if (result.valid) {
                        UI.showSuccess(passwordInput);
                    } else {
                        UI.showError(passwordInput, result.message);
                    }
                }

                // Also validate confirm password if filled
                if (confirmPasswordInput && confirmPasswordInput.value) {
                    const confirmResult = Validators.confirmPassword(passwordInput.value, confirmPasswordInput.value);
                    if (confirmResult.valid) {
                        UI.showSuccess(confirmPasswordInput);
                    } else {
                        UI.showError(confirmPasswordInput, confirmResult.message);
                    }
                }
            });
        }

        // Live validation - Confirm Password
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => {
                const result = Validators.confirmPassword(passwordInput?.value, confirmPasswordInput.value);
                if (confirmPasswordInput.value === '') {
                    UI.clearValidation(confirmPasswordInput);
                } else if (result.valid) {
                    UI.showSuccess(confirmPasswordInput);
                } else {
                    UI.showError(confirmPasswordInput, result.message);
                }
            });
        }

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userData = {
                username: usernameInput?.value.trim(),
                email: emailInput?.value.trim(),
                password: passwordInput?.value,
                confirmPassword: confirmPasswordInput?.value
            };

            // Validate all fields
            const validations = [
                { input: usernameInput, result: Validators.username(userData.username) },
                { input: emailInput, result: Validators.email(userData.email) },
                { input: passwordInput, result: Validators.password(userData.password) },
                { input: confirmPasswordInput, result: Validators.confirmPassword(userData.password, userData.confirmPassword) }
            ];

            let hasErrors = false;
            validations.forEach(({ input, result }) => {
                if (input && !result.valid) {
                    UI.showError(input, result.message);
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                UI.showToast('Please fix the errors above', 'danger');
                return;
            }

            UI.showLoading(submitBtn, 'Creating account...');

            try {
                const result = await AuthService.register(userData);

                if (result.success) {
                    UI.showSuccessModal(
                        'Registration Successful!',
                        'Your account has been created successfully!',
                        AUTH_CONFIG.LOGIN_PAGE,
                        'Go to Login',
                        true // Enable auto-redirect with countdown
                    );
                } else {
                    UI.showToast(result.error || 'Registration failed', 'danger');
                    UI.hideLoading(submitBtn);
                }
            } catch (error) {
                console.error('Registration error:', error);
                UI.showToast('Connection error. Please try again.', 'danger');
                UI.hideLoading(submitBtn);
            }
        });
    },

    /**
     * Initialize logout buttons.
     */
    initLogout: () => {
        const logoutBtns = document.querySelectorAll('.logout-btn, [data-action="logout"], #logoutBtn');

        logoutBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                // Show confirmation dialog
                UI.showConfirmDialog(
                    'Sign Out',
                    'Are you sure you want to sign out?',
                    async () => {
                        try {
                            await AuthService.logout();
                            localStorage.removeItem('user');
                            window.location.href = AUTH_CONFIG.REDIRECT_AFTER_LOGOUT;
                        } catch (error) {
                            console.error('Logout error:', error);
                            // Still redirect even if API fails
                            localStorage.removeItem('user');
                            window.location.href = AUTH_CONFIG.REDIRECT_AFTER_LOGOUT;
                        }
                    },
                    null,
                    'Sign Out',
                    'Cancel'
                );
            });
        });
    }
};

/* ==========================================================================
   AUTH STATE
   ========================================================================== */

const AuthState = {
    /**
     * Get current user from localStorage.
     */
    getUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch {
            return null;
        }
    },

    /**
     * Check if user is logged in.
     */
    isLoggedIn: () => {
        return AuthState.getUser() !== null;
    },

    /**
     * Check if user has admin role.
     */
    isAdmin: () => {
        const user = AuthState.getUser();
        return user && (user.role === 'admin' || user.role === 'superadmin');
    },

    /**
     * Update UI based on auth state.
     */
    updateUI: () => {
        const user = AuthState.getUser();

        // Update user display name
        const userNameElements = document.querySelectorAll('.user-name, [data-user="name"]');
        userNameElements.forEach(el => {
            el.textContent = user?.username || 'Guest';
        });

        // Show/hide auth-dependent elements
        document.querySelectorAll('[data-auth="logged-in"]').forEach(el => {
            el.style.display = user ? '' : 'none';
        });

        document.querySelectorAll('[data-auth="logged-out"]').forEach(el => {
            el.style.display = user ? 'none' : '';
        });

        document.querySelectorAll('[data-auth="admin"]').forEach(el => {
            el.style.display = AuthState.isAdmin() ? '' : 'none';
        });
    }
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize forms based on current page
    FormHandlers.initLoginForm();
    FormHandlers.initRegisterForm();
    FormHandlers.initLogout();

    // Update UI based on auth state
    AuthState.updateUI();
});

// Export for external use
window.Auth = {
    service: AuthService,
    state: AuthState,
    validators: Validators
};
