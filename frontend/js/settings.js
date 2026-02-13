/**
 * ImageToTextOnline - Account Settings Page Logic
 * 
 * Handles Profile (username) and Credentials (email, password) management
 * with readonly inputs, click-to-edit, real-time validation, password
 * verification, eye toggle, and auto-closing success popups.
 * 
 * @version 3.0.0
 */

/* ==========================================================================
   CONFIGURATION
   ========================================================================== */

const SettingsConfig = {
    AUTH_API: '/api/auth',
    LOGIN_PAGE: '/auth/login',
    USERNAME_REGEX: /^[a-zA-Z0-9_-]{3,30}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PW_MIN_LENGTH: 6,
    PW_SPECIAL_REGEX: /[!@#$%^&*(),.?":{}|<>]/,
    VERIFY_DEBOUNCE_MS: 600,
    POPUP_AUTO_CLOSE_MS: 2000
};

/* ==========================================================================
   STATE
   ========================================================================== */

const SettingsState = {
    user: null,
    currentTab: 'profile',
    originalUsername: '',
    originalEmail: '',
    usernameEditing: false,
    emailEditing: false,
    currentPwVerified: false,
    verifyDebounceTimer: null
};

/* ==========================================================================
   API SERVICE (cookie-based auth)
   ========================================================================== */

const SettingsAPI = {
    getMe: async () => {
        const res = await fetch(`${SettingsConfig.AUTH_API}/me`, { credentials: 'include' });
        return res.json();
    },

    updateUsername: async (newUsername) => {
        const res = await fetch(`${SettingsConfig.AUTH_API}/update-username`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newUsername })
        });
        return res.json();
    },

    updateEmail: async (newEmail) => {
        const res = await fetch(`${SettingsConfig.AUTH_API}/update-email`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newEmail })
        });
        return res.json();
    },

    verifyPassword: async (password) => {
        const res = await fetch(`${SettingsConfig.AUTH_API}/verify-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ password })
        });
        return res.json();
    },

    updatePassword: async (currentPassword, newPassword, confirmNewPassword) => {
        const res = await fetch(`${SettingsConfig.AUTH_API}/update-password`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
        });
        return res.json();
    }
};

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUserData();
        initTabs();
        initProfileTab();
        initCredentialsTab();
        initPasswordEyeToggles();
        initHamburger();
        initSidebarNav();
        initLogout();
        showAdminLinks();
    } catch (error) {
        console.error('[Settings] Init error:', error);
        window.location.href = SettingsConfig.LOGIN_PAGE;
    }
});

/**
 * Load user data from /api/auth/me (cookie auth)
 */
async function loadUserData() {
    const result = await SettingsAPI.getMe();

    if (!result.success) {
        window.location.href = SettingsConfig.LOGIN_PAGE;
        return;
    }

    SettingsState.user = result.user || result.data;
    SettingsState.originalUsername = SettingsState.user.username || '';
    SettingsState.originalEmail = SettingsState.user.email || '';

    // Populate header
    const initials = SettingsState.originalUsername.charAt(0).toUpperCase();
    const welcomeEl = document.getElementById('welcomeUser');
    const avatarEl = document.getElementById('userAvatar');
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${SettingsState.originalUsername}`;
    if (avatarEl) avatarEl.textContent = initials;

    // Populate profile avatar
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) profileAvatar.textContent = initials;

    // Populate readonly fields with hint
    const usernameInput = document.getElementById('usernameInput');
    const emailInput = document.getElementById('emailInput');
    if (usernameInput) {
        usernameInput.value = `${SettingsState.originalUsername}  (Click to edit)`;
    }
    if (emailInput) {
        emailInput.value = `${SettingsState.originalEmail}  (Click to edit)`;
    }
}

/**
 * Show admin-only sidebar + mobile links if user is admin/superadmin
 */
function showAdminLinks() {
    const role = SettingsState.user?.role;
    if (role === 'admin' || role === 'superadmin') {
        // Sidebar
        document.querySelectorAll('[data-view="admin"]').forEach(el => {
            el.style.display = '';
        });
        // Mobile menu
        const mobileUsersLink = document.getElementById('mobileUsersLink');
        if (mobileUsersLink) mobileUsersLink.style.display = '';
    }
}

/* ==========================================================================
   TAB SWITCHING
   ========================================================================== */

function initTabs() {
    const tabBtns = document.querySelectorAll('.settings-tabs__btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            if (tabId === SettingsState.currentTab) return;

            // Update button states
            tabBtns.forEach(b => b.classList.remove('settings-tabs__btn--active'));
            btn.classList.add('settings-tabs__btn--active');

            // Update content visibility
            document.querySelectorAll('.settings-tab-content').forEach(c => {
                c.classList.remove('settings-tab-content--active');
            });
            document.getElementById(`tab-${tabId}`)?.classList.add('settings-tab-content--active');

            SettingsState.currentTab = tabId;
        });
    });
}

/* ==========================================================================
   PASSWORD EYE TOGGLE (all password fields)
   ========================================================================== */

function initPasswordEyeToggles() {
    document.querySelectorAll('.settings-password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            const icon = btn.querySelector('i');
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
}

/* ==========================================================================
   PROFILE TAB — Username (readonly until click)
   ========================================================================== */

function initProfileTab() {
    const usernameInput = document.getElementById('usernameInput');
    const usernameError = document.getElementById('usernameError');
    const updateBtn = document.getElementById('updateUsernameBtn');
    const form = document.getElementById('usernameForm');

    // Click-to-edit: clicking the readonly field enables editing
    usernameInput.addEventListener('click', () => {
        if (usernameInput.readOnly) {
            usernameInput.readOnly = false;
            usernameInput.classList.remove('settings-form__input--readonly');
            usernameInput.value = '';
            usernameInput.placeholder = 'Enter new username';
            usernameInput.focus();
            SettingsState.usernameEditing = true;
        }
    });

    // On blur: if empty or unchanged, restore readonly state
    usernameInput.addEventListener('blur', () => {
        const val = usernameInput.value.trim();
        if (val === '' || val === SettingsState.originalUsername) {
            resetUsernameField();
        }
    });

    // Real-time validation on input
    usernameInput.addEventListener('input', () => {
        const val = usernameInput.value.trim();

        if (val === '' || val === SettingsState.originalUsername) {
            usernameInput.classList.remove('settings-form__input--error', 'settings-form__input--success');
            usernameError.textContent = '';
            updateBtn.disabled = true;
            updateBtn.classList.add('btn--disabled');
            return;
        }

        if (validateUsername(val, usernameInput, usernameError)) {
            updateBtn.disabled = false;
            updateBtn.classList.remove('btn--disabled');
        } else {
            updateBtn.disabled = true;
            updateBtn.classList.add('btn--disabled');
        }
    });

    // Submit form
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = usernameInput.value.trim();
        if (!val || val === SettingsState.originalUsername) return;
        if (!validateUsername(val, usernameInput, usernameError)) return;

        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Update Username',
                `Change username to "${val}"?`,
                () => submitUsernameUpdate(val),
                null,
                'Confirm',
                'Cancel',
                'primary'
            );
        }
    });
}

function validateUsername(val, input, errorEl) {
    if (val.length < 3) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = 'Username must be at least 3 characters.';
        return false;
    }
    if (val.length > 30) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = 'Username must not exceed 30 characters.';
        return false;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = 'Only letters, numbers, underscores, and hyphens allowed.';
        return false;
    }
    input.classList.remove('settings-form__input--error');
    input.classList.add('settings-form__input--success');
    errorEl.textContent = '';
    return true;
}

function resetUsernameField() {
    const usernameInput = document.getElementById('usernameInput');
    const usernameError = document.getElementById('usernameError');
    const updateBtn = document.getElementById('updateUsernameBtn');

    usernameInput.readOnly = true;
    usernameInput.classList.add('settings-form__input--readonly');
    usernameInput.classList.remove('settings-form__input--error', 'settings-form__input--success');
    usernameInput.value = `${SettingsState.originalUsername}  (Click to edit)`;
    usernameInput.placeholder = '';
    usernameError.textContent = '';
    updateBtn.disabled = true;
    updateBtn.classList.add('btn--disabled');
    SettingsState.usernameEditing = false;
}

async function submitUsernameUpdate(newUsername) {
    try {
        const data = await SettingsAPI.updateUsername(newUsername);

        if (data.success) {
            SettingsState.originalUsername = newUsername;
            const initials = newUsername.charAt(0).toUpperCase();
            document.getElementById('welcomeUser').textContent = `Welcome, ${newUsername}`;
            document.getElementById('userAvatar').textContent = initials;
            document.getElementById('profileAvatar').textContent = initials;
            resetUsernameField();
            showResultPopup('success', 'Username Updated', 'Your username has been updated successfully.');
        } else {
            showResultPopup('error', 'Update Failed', data.error || 'Failed to update username.');
        }
    } catch (error) {
        showResultPopup('error', 'Error', 'Network error. Please try again.');
    }
}

/* ==========================================================================
   CREDENTIALS TAB — Email (readonly until click)
   ========================================================================== */

function initCredentialsTab() {
    initEmailForm();
    initPasswordForm();
}

function initEmailForm() {
    const emailInput = document.getElementById('emailInput');
    const emailError = document.getElementById('emailError');
    const updateBtn = document.getElementById('updateEmailBtn');
    const form = document.getElementById('emailForm');

    // Click-to-edit
    emailInput.addEventListener('click', () => {
        if (emailInput.readOnly) {
            emailInput.readOnly = false;
            emailInput.classList.remove('settings-form__input--readonly');
            emailInput.value = '';
            emailInput.placeholder = 'Enter new email';
            emailInput.focus();
            SettingsState.emailEditing = true;
        }
    });

    // On blur: restore if empty or unchanged
    emailInput.addEventListener('blur', () => {
        const val = emailInput.value.trim();
        if (val === '' || val === SettingsState.originalEmail) {
            resetEmailField();
        }
    });

    // Real-time validation
    emailInput.addEventListener('input', () => {
        const val = emailInput.value.trim();

        if (val === '' || val === SettingsState.originalEmail) {
            emailInput.classList.remove('settings-form__input--error', 'settings-form__input--success');
            emailError.textContent = '';
            updateBtn.disabled = true;
            updateBtn.classList.add('btn--disabled');
            return;
        }

        if (validateEmail(val, emailInput, emailError)) {
            updateBtn.disabled = false;
            updateBtn.classList.remove('btn--disabled');
        } else {
            updateBtn.disabled = true;
            updateBtn.classList.add('btn--disabled');
        }
    });

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const val = emailInput.value.trim();
        if (!val || val === SettingsState.originalEmail) return;
        if (!validateEmail(val, emailInput, emailError)) return;

        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Update Email',
                `Change email to "${val}"?`,
                () => submitEmailUpdate(val),
                null,
                'Confirm',
                'Cancel',
                'primary'
            );
        }
    });
}

function validateEmail(val, input, errorEl) {
    if (!SettingsConfig.EMAIL_REGEX.test(val)) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = 'Please enter a valid email address.';
        return false;
    }
    input.classList.remove('settings-form__input--error');
    input.classList.add('settings-form__input--success');
    errorEl.textContent = '';
    return true;
}

function resetEmailField() {
    const emailInput = document.getElementById('emailInput');
    const emailError = document.getElementById('emailError');
    const updateBtn = document.getElementById('updateEmailBtn');

    emailInput.readOnly = true;
    emailInput.classList.add('settings-form__input--readonly');
    emailInput.classList.remove('settings-form__input--error', 'settings-form__input--success');
    emailInput.value = `${SettingsState.originalEmail}  (Click to edit)`;
    emailInput.placeholder = '';
    emailError.textContent = '';
    updateBtn.disabled = true;
    updateBtn.classList.add('btn--disabled');
    SettingsState.emailEditing = false;
}

async function submitEmailUpdate(newEmail) {
    try {
        const data = await SettingsAPI.updateEmail(newEmail);

        if (data.success) {
            SettingsState.originalEmail = newEmail;
            resetEmailField();
            showResultPopup('success', 'Email Updated', 'Your email has been updated successfully.', 'credentials');
        } else {
            showResultPopup('error', 'Update Failed', data.error || 'Failed to update email.', 'credentials');
        }
    } catch (error) {
        showResultPopup('error', 'Error', 'Network error. Please try again.', 'credentials');
    }
}

/* ==========================================================================
   CREDENTIALS TAB — Password
   ========================================================================== */

function initPasswordForm() {
    const currentPw = document.getElementById('currentPassword');
    const newPw = document.getElementById('newPassword');
    const confirmPw = document.getElementById('confirmNewPassword');
    const currentPwError = document.getElementById('currentPwError');
    const newPwError = document.getElementById('newPwError');
    const confirmPwError = document.getElementById('confirmPwError');
    const verifiedBadge = document.getElementById('pwVerifiedBadge');
    const form = document.getElementById('passwordForm');

    // Real-time: verify current password with debounce
    currentPw.addEventListener('input', () => {
        const val = currentPw.value;
        currentPwError.textContent = '';
        verifiedBadge.style.display = 'none';
        currentPw.classList.remove('settings-form__input--success', 'settings-form__input--error');

        // Lock new password fields while verifying
        lockPasswordFields(true);

        if (val.length < 1) return;

        clearTimeout(SettingsState.verifyDebounceTimer);
        SettingsState.verifyDebounceTimer = setTimeout(async () => {
            await verifyCurrentPassword(val);
        }, SettingsConfig.VERIFY_DEBOUNCE_MS);
    });

    // Real-time: validate new password
    newPw.addEventListener('input', () => {
        const val = newPw.value;
        validateNewPassword(val, newPw, newPwError);
        updateStrengthMeter(val);

        if (confirmPw.value) {
            validateConfirmPassword(confirmPw.value, val, confirmPw, confirmPwError);
        }
        checkPasswordSubmittable();
    });

    // Real-time: validate confirm password
    confirmPw.addEventListener('input', () => {
        validateConfirmPassword(confirmPw.value, newPw.value, confirmPw, confirmPwError);
        checkPasswordSubmittable();
    });

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!SettingsState.currentPwVerified) return;

        const newVal = newPw.value;
        const confirmVal = confirmPw.value;

        if (!validateNewPassword(newVal, newPw, newPwError)) return;
        if (!validateConfirmPassword(confirmVal, newVal, confirmPw, confirmPwError)) return;

        if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
            UI.showConfirmDialog(
                'Update Password',
                'Update your password?',
                () => submitPasswordUpdate(currentPw.value, newVal, confirmVal),
                null,
                'Confirm',
                'Cancel',
                'primary'
            );
        }
    });
}

async function verifyCurrentPassword(password) {
    const currentPw = document.getElementById('currentPassword');
    const currentPwError = document.getElementById('currentPwError');
    const verifiedBadge = document.getElementById('pwVerifiedBadge');

    try {
        const data = await SettingsAPI.verifyPassword(password);

        if (data.success && data.valid) {
            SettingsState.currentPwVerified = true;
            currentPw.classList.add('settings-form__input--success');
            currentPw.classList.remove('settings-form__input--error');
            currentPwError.textContent = '';
            verifiedBadge.style.display = 'inline-flex';
            lockPasswordFields(false);
        } else {
            SettingsState.currentPwVerified = false;
            currentPw.classList.add('settings-form__input--error');
            currentPw.classList.remove('settings-form__input--success');
            currentPwError.textContent = 'Incorrect password.';
            verifiedBadge.style.display = 'none';
            lockPasswordFields(true);
        }
    } catch (error) {
        SettingsState.currentPwVerified = false;
        currentPwError.textContent = 'Could not verify password.';
        lockPasswordFields(true);
    }
}

function lockPasswordFields(locked) {
    const newPw = document.getElementById('newPassword');
    const confirmPw = document.getElementById('confirmNewPassword');
    const updateBtn = document.getElementById('updatePasswordBtn');

    newPw.disabled = locked;
    confirmPw.disabled = locked;

    if (locked) {
        newPw.placeholder = 'Verify current password first';
        confirmPw.placeholder = 'Verify current password first';
        newPw.value = '';
        confirmPw.value = '';
        newPw.classList.remove('settings-form__input--error', 'settings-form__input--success');
        confirmPw.classList.remove('settings-form__input--error', 'settings-form__input--success');
        document.getElementById('newPwError').textContent = '';
        document.getElementById('confirmPwError').textContent = '';
        updateBtn.disabled = true;
        updateBtn.classList.add('btn--disabled');
        document.getElementById('pwStrengthFill').style.width = '0%';
        document.getElementById('pwStrengthLabel').textContent = '';
    } else {
        newPw.placeholder = 'Enter new password';
        confirmPw.placeholder = 'Re-enter new password';
    }
}

function validateNewPassword(val, input, errorEl) {
    if (val.length < SettingsConfig.PW_MIN_LENGTH) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = `Minimum ${SettingsConfig.PW_MIN_LENGTH} characters required.`;
        return false;
    }
    if (!SettingsConfig.PW_SPECIAL_REGEX.test(val)) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = 'Must contain at least one special character.';
        return false;
    }
    input.classList.remove('settings-form__input--error');
    input.classList.add('settings-form__input--success');
    errorEl.textContent = '';
    return true;
}

function validateConfirmPassword(confirmVal, newVal, input, errorEl) {
    if (confirmVal !== newVal) {
        input.classList.add('settings-form__input--error');
        input.classList.remove('settings-form__input--success');
        errorEl.textContent = 'Passwords do not match.';
        return false;
    }
    if (confirmVal.length > 0) {
        input.classList.remove('settings-form__input--error');
        input.classList.add('settings-form__input--success');
    }
    errorEl.textContent = '';
    return true;
}

function updateStrengthMeter(val) {
    const fill = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');

    if (!val) {
        fill.style.width = '0%';
        fill.style.backgroundColor = '';
        label.textContent = '';
        return;
    }

    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (SettingsConfig.PW_SPECIAL_REGEX.test(val)) score++;

    const levels = [
        { width: '20%', color: '#ef4444', text: 'Very Weak' },
        { width: '40%', color: '#f97316', text: 'Weak' },
        { width: '60%', color: '#eab308', text: 'Fair' },
        { width: '80%', color: '#22c55e', text: 'Strong' },
        { width: '100%', color: '#16a34a', text: 'Very Strong' }
    ];

    const level = levels[Math.min(score, 4)];
    fill.style.width = level.width;
    fill.style.backgroundColor = level.color;
    label.textContent = level.text;
    label.style.color = level.color;
}

function checkPasswordSubmittable() {
    const newPw = document.getElementById('newPassword').value;
    const confirmPw = document.getElementById('confirmNewPassword').value;
    const updateBtn = document.getElementById('updatePasswordBtn');

    const newValid = newPw.length >= SettingsConfig.PW_MIN_LENGTH && SettingsConfig.PW_SPECIAL_REGEX.test(newPw);
    const confirmValid = confirmPw === newPw && confirmPw.length > 0;

    if (SettingsState.currentPwVerified && newValid && confirmValid) {
        updateBtn.disabled = false;
        updateBtn.classList.remove('btn--disabled');
    } else {
        updateBtn.disabled = true;
        updateBtn.classList.add('btn--disabled');
    }
}

async function submitPasswordUpdate(currentPassword, newPassword, confirmNewPassword) {
    try {
        const data = await SettingsAPI.updatePassword(currentPassword, newPassword, confirmNewPassword);

        if (data.success) {
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
            document.getElementById('pwVerifiedBadge').style.display = 'none';
            SettingsState.currentPwVerified = false;
            lockPasswordFields(true);
            document.getElementById('currentPassword').classList.remove('settings-form__input--success');
            showResultPopup('success', 'Password Updated', 'Your password has been updated successfully.', 'credentials');
        } else {
            showResultPopup('error', 'Update Failed', data.error || 'Failed to update password.', 'credentials');
        }
    } catch (error) {
        showResultPopup('error', 'Error', 'Network error. Please try again.', 'credentials');
    }
}

/* ==========================================================================
   RESULT POPUP (Auto-close 2s + Return button)
   ========================================================================== */

function showResultPopup(type, title, text, returnTab = null) {
    const overlay = document.getElementById('resultPopup');
    const icon = document.getElementById('resultIcon');
    const titleEl = document.getElementById('resultTitle');
    const textEl = document.getElementById('resultText');
    const returnBtn = document.getElementById('resultReturnBtn');

    icon.className = 'settings-popup__icon';
    if (type === 'success') {
        icon.classList.add('settings-popup__icon--success');
        icon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
    } else {
        icon.classList.add('settings-popup__icon--error');
        icon.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
    }

    titleEl.textContent = title;
    textEl.textContent = text;

    overlay.classList.add('settings-popup-overlay--visible');

    const autoCloseTimer = setTimeout(() => closeResultPopup(returnTab), SettingsConfig.POPUP_AUTO_CLOSE_MS);

    returnBtn.onclick = () => {
        clearTimeout(autoCloseTimer);
        closeResultPopup(returnTab);
    };
}

function closeResultPopup(returnTab) {
    const overlay = document.getElementById('resultPopup');
    overlay.classList.remove('settings-popup-overlay--visible');

    if (returnTab) {
        const tabBtn = document.querySelector(`.settings-tabs__btn[data-tab="${returnTab}"]`);
        if (tabBtn) tabBtn.click();
    }
}

/* ==========================================================================
   SIDEBAR NAV CONFIRMATIONS (Desktop only)
   ========================================================================== */

function initSidebarNav() {
    // Dashboard link
    const dashboardLink = document.querySelector('a[href="dashboard.html"].dashboard__nav-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
                UI.showConfirmDialog(
                    'Leave Settings',
                    'Go to Dashboard?',
                    () => { window.location.href = 'dashboard.html'; },
                    null, 'Confirm', 'Cancel', 'primary'
                );
            } else {
                window.location.href = 'dashboard.html';
            }
        });
    }

    // Convert link
    const convertLink = document.querySelector('a[href="../index.html"].dashboard__nav-link');
    if (convertLink) {
        convertLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
                UI.showConfirmDialog(
                    'Leave Settings',
                    'Go to Main Page (OCR Conversion)?',
                    () => { window.location.href = '../index.html'; },
                    null, 'Confirm', 'Cancel', 'primary'
                );
            } else {
                window.location.href = '../index.html';
            }
        });
    }

    // Users link
    const usersLink = document.querySelector('a[href="users.html"].dashboard__nav-link');
    if (usersLink) {
        usersLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
                UI.showConfirmDialog(
                    'Leave Settings',
                    'Go to User Management?',
                    () => { window.location.href = 'users.html'; },
                    null, 'Confirm', 'Cancel', 'primary'
                );
            } else {
                window.location.href = 'users.html';
            }
        });
    }

    // Logo link
    const logoLink = document.querySelector('.dashboard__logo');
    if (logoLink) {
        logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
                UI.showConfirmDialog(
                    'Leave Settings',
                    'Go to home page?',
                    () => { window.location.href = '../index.html'; },
                    null, 'Confirm', 'Cancel', 'primary'
                );
            } else {
                window.location.href = '../index.html';
            }
        });
    }
}

/* ==========================================================================
   HAMBURGER MENU (Mobile)
   ========================================================================== */

function initHamburger() {
    const hamburger = document.getElementById('hamburgerToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('dashboard__hamburger--active');
            mobileMenu.classList.toggle('dashboard__mobile-menu--open');
        });

        // Close menu when clicking a link (except sign out)
        mobileMenu.querySelectorAll('.dashboard__mobile-link').forEach(link => {
            if (link.id !== 'mobileLogoutBtn') {
                link.addEventListener('click', () => {
                    hamburger.classList.remove('dashboard__hamburger--active');
                    mobileMenu.classList.remove('dashboard__mobile-menu--open');
                });
            }
        });
    }
}

/* ==========================================================================
   LOGOUT (Desktop + Mobile)
   ========================================================================== */

function initLogout() {
    // Desktop sign out
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showSignOutConfirm();
        });
    }

    // Mobile sign out
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Close mobile menu first
            document.getElementById('hamburgerToggle')?.classList.remove('dashboard__hamburger--active');
            document.getElementById('mobileMenu')?.classList.remove('dashboard__mobile-menu--open');
            showSignOutConfirm();
        });
    }
}

function showSignOutConfirm() {
    if (typeof UI !== 'undefined' && UI.showConfirmDialog) {
        UI.showConfirmDialog(
            'Sign Out',
            'Are you sure you want to sign out?',
            async () => {
                if (typeof AuthService !== 'undefined') {
                    await AuthService.logout();
                }
                localStorage.removeItem('user');
                window.location.href = '/';
            },
            null,
            'Confirm',
            'Cancel',
            'primary'
        );
    }
}
