// ============================================
// RESPONSIVE DATA VIEW — Shared Layout Wrapper
// ============================================
// Generic component: shows table on desktop, stacked cards on mobile.
// Uses window.matchMedia for mobile detection (768px breakpoint),
// so it works in both AppProvider and AdminApp trees.

import React, { useState, useEffect } from 'react';

// ─── Standalone mobile hook (no context dependency) ──────────

function useIsMobile(breakpoint = 768): boolean {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' && window.innerWidth < breakpoint
    );

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        setIsMobile(mql.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [breakpoint]);

    return isMobile;
}

// ─── Component ────────────────────────────────────────────────

interface ResponsiveDataViewProps<T> {
    data: T[];
    renderTable: () => React.ReactNode;
    renderCard: (item: T, index: number) => React.ReactNode;
    emptyState?: React.ReactNode;
}

export function ResponsiveDataView<T>({
    data,
    renderTable,
    renderCard,
    emptyState,
}: ResponsiveDataViewProps<T>) {
    const isMobile = useIsMobile();

    if (data.length === 0 && emptyState) {
        return <>{emptyState}</>;
    }

    if (isMobile) {
        return (
            <div className="flex flex-col gap-3 w-full">
                {data.map((item, index) => (
                    <React.Fragment key={index}>
                        {renderCard(item, index)}
                    </React.Fragment>
                ))}
            </div>
        );
    }

    return <>{renderTable()}</>;
}

export default ResponsiveDataView;
