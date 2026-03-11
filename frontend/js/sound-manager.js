/**
 * ImageToTextOnline - Sound Manager
 * 
 * Generates UI sounds using the Web Audio API.
 * No external audio files required — all sounds are synthesized in real-time.
 * 
 * Usage:
 *   SoundManager.play('success');
 *   SoundManager.play('error');
 *   SoundManager.play('notification');
 *   SoundManager.play('navigate');
 * 
 * @version 1.0.0
 */

'use strict';

const SoundManager = (() => {
    let audioCtx = null;

    /** Lazily create AudioContext on first user interaction */
    function getContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (browser autoplay policy)
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * Play an oscillator note.
     * @param {AudioContext} ctx 
     * @param {number} freq - Frequency in Hz
     * @param {number} start - Start time (relative to ctx.currentTime)
     * @param {number} duration - Note duration in seconds
     * @param {string} type - Oscillator type: 'sine', 'triangle', 'square', 'sawtooth'
     * @param {number} volume - Gain level (0-1)
     */
    function playNote(ctx, freq, start, duration, type = 'sine', volume = 0.15) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);

        gain.gain.setValueAtTime(volume, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
    }

    const sounds = {
        /**
         * Success — bright ascending two-note chime.
         * Used for: successful conversion, login, register, settings updates, copy, download.
         */
        success() {
            const ctx = getContext();
            playNote(ctx, 660, 0, 0.15, 'sine', 0.12);
            playNote(ctx, 880, 0.12, 0.22, 'sine', 0.10);
        },

        /**
         * Error — short descending two-note tone.
         * Used for: failed actions, validation errors, connection errors.
         */
        error() {
            const ctx = getContext();
            playNote(ctx, 440, 0, 0.15, 'square', 0.08);
            playNote(ctx, 330, 0.12, 0.20, 'square', 0.06);
        },

        /**
         * Notification — gentle bell-like ping.
         * Used for: new notifications, alerts.
         */
        notification() {
            const ctx = getContext();
            playNote(ctx, 784, 0, 0.08, 'sine', 0.10);
            playNote(ctx, 1047, 0.07, 0.18, 'sine', 0.08);
            playNote(ctx, 784, 0.20, 0.12, 'sine', 0.05);
        },

        /**
         * Navigate — soft whoosh/sweep.
         * Used for: page transitions, loading overlay appearances.
         */
        navigate() {
            const ctx = getContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.2);
        }
    };

    return {
        /**
         * Play a named sound.
         * @param {'success'|'error'|'notification'|'navigate'} name
         */
        play(name) {
            try {
                if (sounds[name]) {
                    sounds[name]();
                }
            } catch (e) {
                // Silently ignore — audio is non-critical
            }
        }
    };
})();
