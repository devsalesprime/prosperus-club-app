// ============================================
// PULL TO REFRESH — Prosperus Branded Wrapper
// ============================================
// Wraps scrollable content with pull-down-to-refresh gesture
// Shows a gold spinner indicator during pull and refresh
//
// NOTE: This component does NOT create its own scroll container.
// The parent <main> in AppLayout handles scrolling.
// scrollRef finds the nearest scrollable ancestor for scrollTop checks.

import React, { useRef, useEffect } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { GESTURE, SPRING_EASE } from '../../hooks/gestureConfig';

interface PullToRefreshProps {
    /** Async function called when pull threshold is reached */
    onRefresh: () => Promise<void>;
    /** Whether the gesture is enabled */
    enabled?: boolean;
    /** Additional className for the container */
    className?: string;
    children: React.ReactNode;
}

/**
 * Find the nearest scrollable parent element.
 * Walks up the DOM to find the <main> with overflowY: auto/scroll.
 */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
    let node = el?.parentElement;
    while (node) {
        const style = getComputedStyle(node);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            return node;
        }
        node = node.parentElement;
    }
    return null;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    enabled = true,
    className = '',
    children,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLElement | null>(null);

    // On mount, find the scrollable parent (<main> in AppLayout)
    useEffect(() => {
        scrollRef.current = findScrollParent(containerRef.current);
    }, []);

    const { pullDistance, progress, isRefreshing, bind } = usePullToRefresh({
        onRefresh,
        scrollRef,
        enabled,
    });

    return (
        <div
            {...bind()}
            ref={containerRef}
            className={className}
            style={{ touchAction: 'pan-y' }}
        >
            {/* Pull indicator */}
            <div
                className="flex items-center justify-center overflow-hidden pointer-events-none"
                style={{
                    height: `${pullDistance}px`,
                    transition: pullDistance === 0
                        ? `height ${GESTURE.SPRING_DURATION}ms ${SPRING_EASE}`
                        : 'none',
                }}
            >
                {isRefreshing ? (
                    // Refreshing spinner
                    <div className="w-7 h-7 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    // Pull progress indicator
                    <div
                        className="w-7 h-7 border-2 border-yellow-500/60 rounded-full"
                        style={{
                            opacity: progress,
                            transform: `rotate(${progress * 360}deg)`,
                            transition: 'opacity 0.1s ease',
                        }}
                    />
                )}
            </div>

            {children}
        </div>
    );
};
