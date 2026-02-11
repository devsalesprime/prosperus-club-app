/**
 * useScrollLock Hook - iOS-proof scroll lock for modals
 * 
 * Strategy: overflow:hidden on BOTH html + body + touch-action:none
 * This is more reliable than position:fixed on iOS standalone PWA mode.
 * 
 * Features:
 * - Blocks body scroll when modal opens (iOS Safari + standalone PWA)
 * - Saves/restores scroll position on close
 * - Supports stacked modals (only unlocks when ALL close)
 * - No layout shifts (no position:fixed on body)
 * 
 * @version 2.0.0
 * @compatible iOS 13+, Android 8+, Desktop
 */

import { useEffect, useRef } from 'react';

interface ScrollLockOptions {
    /** Whether to lock scroll (bind to modal isOpen) */
    enabled: boolean;
    /** Unique modal ID (for stacked modals) */
    modalId?: string;
}

// Global state for tracking active modals
const activeModals = new Set<string>();
let savedScrollY = 0;

export const useScrollLock = ({
    enabled,
    modalId = 'modal',
}: ScrollLockOptions) => {
    const isFirstModal = useRef(false);

    useEffect(() => {
        if (!enabled) {
            // Remove this modal from active set
            activeModals.delete(modalId);

            // If no more modals, restore scroll
            if (activeModals.size === 0) {
                unlockScroll();
            }
            return;
        }

        // Track if this is the first modal (the one that should lock)
        isFirstModal.current = activeModals.size === 0;
        activeModals.add(modalId);

        // Only lock on first modal
        if (isFirstModal.current) {
            lockScroll();
        }

        // Cleanup on unmount
        return () => {
            activeModals.delete(modalId);
            if (activeModals.size === 0) {
                unlockScroll();
            }
        };
    }, [enabled, modalId]);
};

function lockScroll() {
    // Save current scroll position
    savedScrollY = window.scrollY;

    // Lock: overflow hidden on BOTH html + body (iOS needs both)
    // NO position:fixed — that causes layout shifts in iOS standalone mode
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // touch-action:none blocks iOS rubber band / gesture scroll
    document.body.style.touchAction = 'none';

    // Add class for CSS-level overrides
    document.body.classList.add('scroll-locked');
    document.documentElement.classList.add('scroll-locked');
}

function unlockScroll() {
    // Remove lock
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.touchAction = '';

    // Remove CSS class
    document.body.classList.remove('scroll-locked');
    document.documentElement.classList.remove('scroll-locked');

    // Restore scroll position
    window.scrollTo(0, savedScrollY);
}

/**
 * Simplified hook for direct use
 */
export const useSimpleScrollLock = (isOpen: boolean) => {
    useScrollLock({ enabled: isOpen });
};
