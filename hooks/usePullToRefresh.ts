// ============================================
// usePullToRefresh — Vertical Pull Hook
// ============================================
// Activates only when scrollTop === 0 (top of list)
// CSS requirement: touch-action: pan-y on the container

import { useState, useRef, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { GESTURE, haptic } from './gestureConfig';

interface UsePullToRefreshOptions {
    /** Async callback when pull threshold is reached */
    onRefresh: () => Promise<void>;
    /** Reference to the scrollable container (to check scrollTop) */
    scrollRef: React.RefObject<HTMLElement | null>;
    /** Whether pull is enabled */
    enabled?: boolean;
}

interface UsePullToRefreshReturn {
    /** Current pull distance in px (0 when not pulling) */
    pullDistance: number;
    /** Progress from 0 to 1 */
    progress: number;
    /** Whether refresh is currently executing */
    isRefreshing: boolean;
    /** Bind props — spread on the scrollable container */
    bind: ReturnType<typeof useDrag>;
}

export function usePullToRefresh({
    onRefresh,
    scrollRef,
    enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const canPullRef = useRef(false);

    const bind = useDrag(
        ({ movement: [, my], dragging, first, cancel }) => {
            if (!enabled || isRefreshing) {
                cancel();
                return;
            }

            // On first touch, check if we're at the top of scroll
            if (first) {
                const scrollTop = scrollRef.current?.scrollTop ?? 0;
                canPullRef.current = scrollTop <= 0;
            }

            if (!canPullRef.current || my < 0) {
                setPullDistance(0);
                return;
            }

            if (dragging) {
                // Apply resistance — harder to pull the further you go
                const dampened = Math.min(
                    my * GESTURE.PULL_RESISTANCE,
                    GESTURE.PULL_MAX
                );
                setPullDistance(dampened);
            } else {
                // Released — check if threshold was met
                const dampened = my * GESTURE.PULL_RESISTANCE;
                if (dampened >= GESTURE.PULL_THRESHOLD) {
                    // Trigger refresh
                    haptic([20, 10, 20]);
                    setIsRefreshing(true);
                    setPullDistance(GESTURE.PULL_THRESHOLD); // Hold at threshold

                    onRefresh().finally(() => {
                        setIsRefreshing(false);
                        setPullDistance(0);
                        canPullRef.current = false;
                    });
                } else {
                    // Spring back
                    setPullDistance(0);
                }
            }
        },
        {
            axis: 'y',
            filterTaps: true,
            pointer: { touch: true },
        }
    );

    const progress = Math.min(pullDistance / GESTURE.PULL_THRESHOLD, 1);

    return { pullDistance, progress, isRefreshing, bind };
}
