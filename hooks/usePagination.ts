// ============================================
// USE PAGINATION — Generic Infinite Scroll Hook
// ============================================
// Manages page state, accumulated items, and loading indicators
// for any Supabase-backed paginated list.

import { useState, useCallback, useRef, useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
    data: T[];
    count: number | null;
}

export interface UsePaginationOptions<T> {
    /** Async function that fetches a page of data */
    fetcher: (page: number, pageSize: number) => Promise<PaginatedResult<T>>;
    /** Items per page (default: 20) */
    pageSize?: number;
    /** Whether to fetch the first page automatically on mount (default: true) */
    autoFetch?: boolean;
}

export interface UsePaginationReturn<T> {
    /** Accumulated items from all loaded pages */
    items: T[];
    /** Whether the initial load is in progress */
    isLoading: boolean;
    /** Whether a subsequent page is being loaded */
    isLoadingMore: boolean;
    /** Whether more pages are available */
    hasMore: boolean;
    /** Total count from the server (if available) */
    totalCount: number | null;
    /** Current page index (0-based) */
    page: number;
    /** Load the next page and append items */
    loadMore: () => void;
    /** Reset to page 0, clear items, and re-fetch */
    reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────

export function usePagination<T>(
    options: UsePaginationOptions<T>
): UsePaginationReturn<T> {
    const { fetcher, pageSize = 20, autoFetch = true } = options;

    const [items, setItems] = useState<T[]>([]);
    const [page, setPage] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [totalCount, setTotalCount] = useState<number | null>(null);

    // Ref to prevent concurrent fetches
    const fetchingRef = useRef(false);
    // Ref to track current fetcher identity (for stale closure prevention)
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const fetchPage = useCallback(async (targetPage: number, isReset: boolean) => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        if (isReset || targetPage === 0) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const result = await fetcherRef.current(targetPage, pageSize);
            const newItems = result.data;

            if (isReset || targetPage === 0) {
                setItems(newItems);
            } else {
                setItems(prev => [...prev, ...newItems]);
            }

            setTotalCount(result.count);
            setHasMore(newItems.length >= pageSize);
            setPage(targetPage);
        } catch (error) {
            console.error('[usePagination] Fetch error:', error);
            // On error, stop pagination but keep existing items
            setHasMore(false);
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            fetchingRef.current = false;
        }
    }, [pageSize]);

    // Auto-fetch first page on mount
    useEffect(() => {
        if (autoFetch) {
            fetchPage(0, true);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadMore = useCallback(() => {
        if (!hasMore || fetchingRef.current) return;
        fetchPage(page + 1, false);
    }, [hasMore, page, fetchPage]);

    const reset = useCallback(() => {
        setItems([]);
        setPage(0);
        setHasMore(true);
        setTotalCount(null);
        fetchingRef.current = false;
        fetchPage(0, true);
    }, [fetchPage]);

    return {
        items,
        isLoading,
        isLoadingMore,
        hasMore,
        totalCount,
        page,
        loadMore,
        reset,
    };
}
