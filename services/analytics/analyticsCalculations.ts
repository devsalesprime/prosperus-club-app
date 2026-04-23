// ============================================
// ANALYTICS CALCULATIONS — Pure functions
// Extracted from analyticsService.ts (Operação Estilhaço)
// No side effects, no Supabase calls — pure math & transforms
// ============================================

import { DeviceInfo } from './analyticsTypes';

// ============================================
// SESSION MANAGEMENT
// ============================================

let currentSessionId: string | null = null;
let sessionStartTime: number = 0;

export const generateSessionId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

export const getOrCreateSessionId = (): string => {
    if (!currentSessionId) {
        currentSessionId = generateSessionId();
        sessionStartTime = Date.now();
    }
    return currentSessionId;
};

export const resetSessionId = (): void => {
    currentSessionId = null;
};

export const getSessionStartTime = (): number => sessionStartTime;

export const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') return {};

    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
};

// ============================================
// TREND CALCULATION
// ============================================

/**
 * Calculate trend percentage: ((current - previous) / previous) * 100
 * Returns null if no previous data to compare against
 */
export function calcTrend(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// DATA TRANSFORMS (used by dashboard RPCs)
// ============================================

/**
 * Parse daily activity row from RPC into typed object
 */
export function parseDailyActivityRow(row: Record<string, unknown>): {
    date: string;
    label: string;
    total: number;
    pageViews: number;
    videos: number;
    messages: number;
} {
    const dateStr = String(row.activity_date || '');
    // Safe date parse: append T12:00:00Z to avoid browser timezone shifting the day
    const d = new Date(dateStr + 'T12:00:00Z');
    return {
        date: dateStr,
        label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }),
        total: Number(row.total) || 0,
        pageViews: Number(row.page_views) || 0,
        videos: Number(row.videos) || 0,
        messages: Number(row.messages) || 0,
    };
}

/**
 * Parse top content row from RPC into typed object
 */
export function parseTopContentRow(row: Record<string, unknown>): { id: string; title: string; count: number } {
    return {
        id: String(row.content_id || ''),
        title: String(row.content_title || 'Sem título'),
        count: Number(row.view_count) || 0
    };
}

/**
 * Parse event breakdown row from RPC
 */
export function parseEventBreakdownRow(row: Record<string, unknown>): { name: string; value: number } {
    return {
        name: String(row.event_name || ''),
        value: Number(row.event_count) || 0
    };
}
