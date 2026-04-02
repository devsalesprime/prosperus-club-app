// useAnalytics.ts
// React Hook para tracking automático de navegação e eventos
// Integra com analyticsService de forma transparente

import { useEffect, useRef, useCallback } from 'react';
import { analyticsService, AnalyticsEventType } from '../services/analyticsService';
import { ViewState } from '../types';

interface UseAnalyticsOptions {
    userId: string | null;
    currentView: ViewState | string;
    enabled?: boolean;
}

interface UseAnalyticsReturn {
    trackEvent: (eventName: AnalyticsEventType, metadata?: Record<string, any>) => void;
    trackVideoStart: (videoId: string, videoTitle?: string) => void;
    trackVideoComplete: (videoId: string, durationSeconds?: number) => void;
    trackArticleRead: (articleId: string, articleTitle?: string) => void;
    trackMessageSent: (conversationId: string) => void;
    trackError: (errorMessage: string, errorStack?: string) => void;
}

/**
 * Hook para tracking automático de navegação e eventos
 * Detecta mudanças de view e dispara PAGE_VIEW automaticamente
 */
export const useAnalytics = ({
    userId,
    currentView,
    enabled = true
}: UseAnalyticsOptions): UseAnalyticsReturn => {
    const previousView = useRef<string | null>(null);
    const viewStartTime = useRef<number>(Date.now());
    const hasTrackedAppOpen = useRef(false);

    // Track APP_OPEN on mount (once per session)
    useEffect(() => {
        if (!enabled || hasTrackedAppOpen.current) return;

        analyticsService.trackAppOpen(userId);
        hasTrackedAppOpen.current = true;
    }, [enabled]);

    // Track PAGE_VIEW on view change
    useEffect(() => {
        if (!enabled) return;

        const currentViewStr = String(currentView);

        // Skip if same view
        if (previousView.current === currentViewStr) return;

        // Calculate duration on previous page
        const durationMs = Date.now() - viewStartTime.current;

        // Track page view
        analyticsService.trackPageView(
            userId,
            currentViewStr,
            previousView.current || undefined
        );

        // If there was a previous view, track duration
        if (previousView.current && durationMs > 1000) {
            // Optional: Track page duration as separate event
            analyticsService.trackEvent(userId, 'PAGE_VIEW', {
                page_name: previousView.current,
                duration_ms: durationMs,
                is_exit: true
            });
        }

        // Update refs
        previousView.current = currentViewStr;
        viewStartTime.current = Date.now();
    }, [currentView, userId, enabled]);

    // Track logout on unmount
    useEffect(() => {
        return () => {
            if (enabled && userId) {
                analyticsService.trackLogout(userId);
            }
        };
    }, [userId, enabled]);

    // Memoized tracking functions
    const trackEvent = useCallback((
        eventName: AnalyticsEventType,
        metadata?: Record<string, any>
    ) => {
        if (!enabled) return;
        analyticsService.trackEvent(userId, eventName, metadata);
    }, [userId, enabled]);

    const trackVideoStart = useCallback((videoId: string, videoTitle?: string) => {
        if (!enabled) return;
        analyticsService.trackVideoStart(userId, videoId, videoTitle);
    }, [userId, enabled]);

    const trackVideoComplete = useCallback((videoId: string, durationSeconds?: number) => {
        if (!enabled) return;
        analyticsService.trackVideoComplete(userId, videoId, durationSeconds);
    }, [userId, enabled]);

    const trackArticleRead = useCallback((articleId: string, articleTitle?: string) => {
        if (!enabled) return;
        analyticsService.trackArticleRead(userId, articleId, articleTitle);
    }, [userId, enabled]);

    const trackMessageSent = useCallback((conversationId: string) => {
        if (!enabled) return;
        analyticsService.trackMessageSent(userId, conversationId);
    }, [userId, enabled]);

    const trackError = useCallback((errorMessage: string, errorStack?: string) => {
        if (!enabled) return;
        analyticsService.trackError(userId, errorMessage, errorStack);
    }, [userId, enabled]);

    return {
        trackEvent,
        trackVideoStart,
        trackVideoComplete,
        trackArticleRead,
        trackMessageSent,
        trackError
    };
};

/**
 * Hook simplificado para tracking manual de eventos
 * Uso: const { track } = useTrackEvent(userId)
 */
export const useTrackEvent = (userId: string | null) => {
    const track = useCallback((
        eventName: AnalyticsEventType,
        metadata?: Record<string, any>
    ) => {
        analyticsService.trackEvent(userId, eventName, metadata);
    }, [userId]);

    return { track };
};

export default useAnalytics;
