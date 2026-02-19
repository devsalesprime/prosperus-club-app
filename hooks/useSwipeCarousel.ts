// ============================================
// useSwipeCarousel — Horizontal Swipe Hook
// ============================================
// For carousels/galleries: swipe left/right between items
// CSS requirement: touch-action: pan-y on the container

import { useState, useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { GESTURE, haptic, SPRING_EASE } from './gestureConfig';

interface UseSwipeCarouselOptions {
    /** Total number of items */
    total: number;
    /** Callback when index changes */
    onIndexChange?: (index: number) => void;
    /** Whether swipe is enabled */
    enabled?: boolean;
}

interface UseSwipeCarouselReturn {
    /** Current active index */
    index: number;
    /** Set the active index manually */
    setIndex: (index: number) => void;
    /** Pixel offset during active drag (for visual feedback) */
    dragOffset: number;
    /** Whether user is currently dragging */
    isDragging: boolean;
    /** Bind props — spread on the swipeable container */
    bind: ReturnType<typeof useDrag>;
    /** CSS transition to apply (none during drag, spring on release) */
    transition: string;
}

export function useSwipeCarousel({
    total,
    onIndexChange,
    enabled = true,
}: UseSwipeCarouselOptions): UseSwipeCarouselReturn {
    const [index, setIndexState] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const indexRef = useRef(0);

    const setIndex = useCallback((newIndex: number) => {
        const clamped = Math.max(0, Math.min(newIndex, total - 1));
        setIndexState(clamped);
        indexRef.current = clamped;
        onIndexChange?.(clamped);
    }, [total, onIndexChange]);

    const bind = useDrag(
        ({ movement: [mx], velocity: [vx], direction: [dx], dragging, cancel, first }) => {
            if (!enabled || total <= 1) {
                cancel();
                return;
            }

            if (dragging) {
                setIsDragging(true);

                // Rubber band at edges
                const atStart = indexRef.current === 0 && mx > 0;
                const atEnd = indexRef.current === total - 1 && mx < 0;
                const resistance = (atStart || atEnd) ? 0.3 : GESTURE.RUBBER_BAND;

                setDragOffset(mx * resistance);
            } else {
                // Release — decide if swipe was intentional
                const isIntentional =
                    Math.abs(mx) > GESTURE.SWIPE_THRESHOLD ||
                    vx > GESTURE.SWIPE_VELOCITY;

                if (isIntentional) {
                    if (dx < 0 && indexRef.current < total - 1) {
                        // Swipe left → next
                        setIndex(indexRef.current + 1);
                        haptic();
                    } else if (dx > 0 && indexRef.current > 0) {
                        // Swipe right → previous
                        setIndex(indexRef.current - 1);
                        haptic();
                    }
                }

                // Spring back
                setDragOffset(0);
                setIsDragging(false);
            }
        },
        {
            axis: 'x',
            filterTaps: true,
            threshold: GESTURE.DRAG_ACTIVATION,
            pointer: { touch: true },
        }
    );

    const transition = isDragging
        ? 'none'
        : `transform ${GESTURE.SPRING_DURATION}ms ${SPRING_EASE}`;

    return { index, setIndex, dragOffset, isDragging, bind, transition };
}
