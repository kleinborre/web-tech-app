/**
 * ImageToTextOnline - Global Loading Overlay
 * 
 * Reusable loading overlay with theme-color spinner.
 * Usage: LoadingOverlay.show('Converting...') / LoadingOverlay.hide()
 * 
 * @version 1.0.0
 */

'use strict';

const LoadingOverlay = (() => {
    let overlayEl = null;

    function create() {
        if (overlayEl) return overlayEl;

        overlayEl = document.createElement('div');
        overlayEl.className = 'loading-overlay';
        overlayEl.id = 'globalLoadingOverlay';
        overlayEl.innerHTML = `
            <div class="loading-overlay__content">
                <div class="loading-overlay__spinner">
                    <div class="loading-overlay__ring"></div>
                </div>
                <p class="loading-overlay__message">Loading...</p>
            </div>
        `;
        document.body.appendChild(overlayEl);

        // Add styles if not already present
        if (!document.getElementById('loading-overlay-styles')) {
            const style = document.createElement('style');
            style.id = 'loading-overlay-styles';
            style.textContent = `
                .loading-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.45);
                    backdrop-filter: blur(4px);
                    -webkit-backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    opacity: 0;
                    visibility: hidden;
                    transition: opacity 0.25s ease, visibility 0.25s ease;
                }
                .loading-overlay--visible {
                    opacity: 1;
                    visibility: visible;
                }
                .loading-overlay__content {
                    text-align: center;
                    padding: 2rem 2.5rem;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 16px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
                    min-width: 180px;
                }
                .loading-overlay__spinner {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1rem;
                }
                .loading-overlay__ring {
                    width: 48px;
                    height: 48px;
                    border: 4px solid rgba(0, 151, 178, 0.2);
                    border-top-color: #0097b2;
                    border-radius: 50%;
                    animation: loadingRingSpin 0.8s linear infinite;
                }
                @keyframes loadingRingSpin {
                    to { transform: rotate(360deg); }
                }
                .loading-overlay__message {
                    margin: 0;
                    font-family: 'Poppins', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #374151;
                    letter-spacing: 0.01em;
                }
            `;
            document.head.appendChild(style);
        }

        return overlayEl;
    }

    return {
        show(message = 'Loading...') {
            const el = create();
            el.querySelector('.loading-overlay__message').textContent = message;
            // Force reflow then show
            void el.offsetHeight;
            el.classList.add('loading-overlay--visible');
            // Play navigation sound
            if (typeof SoundManager !== 'undefined') SoundManager.play('navigate');
        },

        hide() {
            if (overlayEl) {
                overlayEl.classList.remove('loading-overlay--visible');
            }
        },

        /**
         * Show overlay then navigate after a short delay so the animation is visible.
         * @param {string} url - Target URL
         * @param {string} [message='Loading...'] - Overlay message
         */
        navigateTo(url, message = 'Loading...') {
            this.show(message);
            setTimeout(() => { window.location.href = url; }, 350);
        }
    };
})();
