// ============================================
// GESTURE SYSTEM — Shared Configuration
// ============================================
// Physics constants and utilities for all gesture hooks
// Stack: @use-gesture/react · CSS transitions · translate3d

// ── Physics Constants ──
export const GESTURE = {
    // Swipe
    SWIPE_THRESHOLD: 60,       // px minimum to count as intentional swipe
    SWIPE_VELOCITY: 0.3,       // min velocity (px/ms)
    DRAG_ACTIVATION: 10,       // px before gesture activates
    RUBBER_BAND: 0.85,         // resistance factor during drag

    // Pull-to-refresh
    PULL_THRESHOLD: 80,        // px to trigger refresh
    PULL_RESISTANCE: 0.45,     // drag resistance (lower = harder to pull)
    PULL_MAX: 120,             // max px the indicator stretches

    // Dismiss
    DISMISS_THRESHOLD: 0.3,    // % of screen height to dismiss
    DISMISS_VELOCITY: 0.5,     // velocity threshold for quick dismiss

    // Timing
    SPRING_DURATION: 300,      // ms for spring-back animation
    SNAP_DURATION: 250,        // ms for snap to position

    // iOS Safety
    EDGE_SAFE_ZONE: 20,        // px from edge — iOS intercepts swipes here
} as const;

// ── Haptic Feedback ──
// Android: navigator.vibrate works
// iOS: only works in response to user interaction, limited patterns
export function haptic(pattern: number[] = [10]): void {
    if ('vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch {
            // Silently fail — iOS blocks most vibration
        }
    }
}

// ── Spring easing ──
export const SPRING_EASE = 'cubic-bezier(0.25, 0.46, 0.45, 0.94)';
export const SNAP_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
