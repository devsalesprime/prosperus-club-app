// ============================================
// ANALYTICS UTILITIES — Shared across all tabs
// ============================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────

export type Period = '7d' | '30d' | '90d';

// ─── Period Helpers ───────────────────────────────────────────────

export const periodToDays = (p: Period): number =>
    p === '7d' ? 7 : p === '90d' ? 90 : 30;

export const periodLabel = (p: Period): string =>
    p === '7d' ? '7 dias' : p === '90d' ? '90 dias' : '30 dias';

export const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

// ─── Chart Colors ─────────────────────────────────────────────────

export const CHART_COLORS = {
    primary: '#eab308',
    secondary: '#3b82f6',
    tertiary: '#22c55e',
    quaternary: '#a855f7',
    grid: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8'
};

export const PIE_COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ─── Common Props ─────────────────────────────────────────────────

export interface AnalyticsTabProps {
    period: Period;
}

// ─── Trend Badge ──────────────────────────────────────────────────

export const TrendBadge: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (value === null || value === undefined) return null;

    if (value === 0) {
        return (
            <div className="flex items-center gap-1 text-slate-400">
                <Minus size={14} />
                <span className="text-xs font-bold">0%</span>
            </div>
        );
    }

    const isPositive = value > 0;
    return (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold">{Math.abs(value)}%</span>
        </div>
    );
};
