// ============================================
// CARD SKELETON — Loading placeholder premium
// ============================================

import React from 'react';

interface CardSkeletonProps {
    count?: number;
    variant?: 'card' | 'list' | 'compact';
}

const SkeletonCard = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-slate-800" />
            <div className="flex-1">
                <div className="h-3 bg-slate-800 rounded w-3/4 mb-2" />
                <div className="h-2 bg-slate-800 rounded w-1/2" />
            </div>
        </div>
        <div className="h-2 bg-slate-800 rounded w-full mb-2" />
        <div className="h-2 bg-slate-800 rounded w-2/3" />
    </div>
);

const SkeletonList = () => (
    <div className="flex items-center gap-3 p-3 animate-pulse">
        <div className="w-12 h-12 rounded-full bg-slate-800 shrink-0" />
        <div className="flex-1 min-w-0">
            <div className="h-3.5 bg-slate-800 rounded w-2/3 mb-2" />
            <div className="h-2.5 bg-slate-800 rounded w-1/2" />
        </div>
        <div className="h-2.5 bg-slate-800 rounded w-10 shrink-0" />
    </div>
);

const SkeletonCompact = () => (
    <div className="flex items-center gap-2 p-2 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-slate-800" />
        <div className="flex-1">
            <div className="h-3 bg-slate-800 rounded w-1/2" />
        </div>
    </div>
);

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    count = 3,
    variant = 'card'
}) => {
    const Component = variant === 'list' ? SkeletonList
        : variant === 'compact' ? SkeletonCompact
            : SkeletonCard;

    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <Component key={i} />
            ))}
        </div>
    );
};

export default CardSkeleton;
