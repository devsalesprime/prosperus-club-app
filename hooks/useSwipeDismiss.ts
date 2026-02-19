// ============================================
// useSwipeDismiss — Vertical Swipe to Close
// ============================================
// For modals/overlays: drag down to dismiss
// CSS requirement: touch-action: none on the drag handle

import { useState, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { GESTURE, haptic, SNAP_EASE } from './gestureConfig';

interface UseSwipeDismissOptions {
    /** Callback when dismiss threshold is reached */
    onDismiss: () => void;
    /** Whether gesture is enabled */
    enabled?: boolean;
}

interface UseSwipeDismissReturn {
    /** Current translateY offset in px */
    offsetY: number;
    /** Opacity of backdrop (1 = full, fades as user drags) */
    backdropOpacity: number;
    /** Whether user is currently dragging */
    isDragging: boolean;
    /** Bind props — spread on the drag handle element */
    bind: ReturnType<typeof useDrag>;
    /** CSS transition for the modal container */
    transition: string;
}

export function useSwipeDismiss({
    onDismiss,
    enabled = true,
}: UseSwipeDismissOptions): UseSwipeDismissReturn {
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const bind = useDrag(
        ({ movement: [, my], velocity: [, vy], dragging, cancel }) => {
            if (!enabled) {
                cancel();
                return;
            }

            if (dragging) {
                setIsDragging(true);
                // Only allow downward drag (positive Y)
                setOffsetY(Math.max(0, my));
            } else {
                // Release — check if should dismiss
                const screenH = window.innerHeight;
                const shouldDismiss =
                    my > screenH * GESTURE.DISMISS_THRESHOLD ||
                    vy > GESTURE.DISMISS_VELOCITY;

                if (shouldDismiss && my > 0) {
                    haptic([15]);
                    // Animate off screen, then call onDismiss
                    setOffsetY(screenH);
                    setTimeout(() => {
                        onDismiss();
                        setOffsetY(0);
                    }, GESTURE.SNAP_DURATION);
                } else {
                    // Spring back
                    setOffsetY(0);
                }
                setIsDragging(false);
            }
        },
        {
            axis: 'y',
            filterTaps: true,
            threshold: GESTURE.DRAG_ACTIVATION,
            pointer: { touch: true },
        }
    );

    // Backdrop fades as user drags down
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 800;
    const backdropOpacity = Math.max(0, 1 - offsetY / (screenH * 0.5));

    const transition = isDragging
        ? 'none'
        : `transform ${GESTURE.SNAP_DURATION}ms ${SNAP_EASE}`;

    return { offsetY, backdropOpacity, isDragging, bind, transition };
}
