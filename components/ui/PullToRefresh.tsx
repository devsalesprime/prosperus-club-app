// ============================================
// PULL TO REFRESH — Prosperus Branded Wrapper
// ============================================
// Wraps scrollable content with pull-down-to-refresh gesture
// Shows a gold spinner indicator during pull and refresh

import React, { useRef } from 'react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { GESTURE, SPRING_EASE } from '../../hooks/gestureConfig';

interface PullToRefreshProps {
    /** Async function called when pull threshold is reached */
    onRefresh: () => Promise<void>;
    /** Whether the gesture is enabled */
    enabled?: boolean;
    /** Additional className for the scroll container */
    className?: string;
    children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    enabled = true,
    className = '',
    children,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const { pullDistance, progress, isRefreshing, bind } = usePullToRefresh({
        onRefresh,
        scrollRef,
        enabled,
    });

    return (
        <div
            {...bind()}
            ref={scrollRef}
            className={`overflow-y-auto h-full ${className}`}
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
