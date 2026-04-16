// ==============================================
// SOLUTIONS LIST PAGE v2.0 — Member View
// ==============================================
// Premium card layout with banners, category badges,
// gold CTAs, skeleton loading, and elegant empty state.
// Sharp Luxury theme — mobile-first, responsive

import React, { useEffect, useState } from 'react';
import { ExternalLink, ArrowLeft, Wrench } from 'lucide-react';
import { ViewState } from '../types';
import { toolsService, ToolSolution } from '../services/toolsService';
import { analyticsService } from '../services/analyticsService';
import { useApp } from '../contexts/AppContext';

interface SolutionsListPageProps {
    setView: (view: ViewState) => void;
}

// ── Skeleton Loading ──
function SolutionsSkeletonList() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden animate-pulse flex flex-col h-full"
                >
                    {/* Skeleton banner */}
                    {i <= 2 && <div className="h-36 bg-slate-800" />}
                    <div className="p-4 flex flex-col flex-1 space-y-3">
                        <div className="h-5 bg-slate-800 rounded-full w-28" />
                        <div className="h-5 bg-slate-800 rounded w-3/4" />
                        <div className="h-4 bg-slate-800 rounded w-full" />
                        <div className="h-4 bg-slate-800 rounded w-2/3" />
                        <div className="mt-auto pt-2">
                            <div className="h-10 bg-slate-800 rounded-xl" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Empty State ──
function SolutionsMemberEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
            <div className="relative">
                <div className="absolute inset-0 bg-yellow-600/10 rounded-full blur-xl scale-150" />
                <div className="relative w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <Wrench size={26} className="text-slate-600" />
                </div>
            </div>
            <div>
                <p className="text-slate-300 font-semibold">Nenhuma solução disponível</p>
                <p className="text-sm text-slate-500 mt-1 max-w-[240px]">
                    Novas ferramentas serão publicadas em breve pela administração.
                </p>
            </div>
        </div>
    );
}

// ── Solution Card ──
function SolutionMemberCard({
    solution,
    index,
}: {
    solution: ToolSolution;
    index: number;
}) {
    const { currentUser } = useApp();
    return (
        <div
            className="slp-card flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-yellow-600/20 transition-all duration-300"
            style={{ animationDelay: `${index * 60}ms` }}
        >
            {/* Banner */}
            {solution.banner_url && (
                <div className="relative h-36 overflow-hidden">
                    <img
                        src={solution.banner_url}
                        alt={solution.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
                </div>
            )}

            <div className="p-4 flex flex-col flex-1">
                {/* Category badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-600/10 border border-yellow-600/20 mb-3 w-fit">
                    <Wrench size={11} className="text-yellow-500" />
                    <span className="text-[11px] font-semibold text-yellow-500 uppercase tracking-wider">
                        Ferramenta Externa
                    </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white leading-snug mb-1.5">
                    {solution.title}
                </h3>

                {/* Description */}
                {solution.description && (
                    <p className="text-sm text-slate-400 leading-relaxed mb-4 line-clamp-3">
                        {solution.description}
                    </p>
                )}

                {/* CTA Button */}
                <div className="mt-auto pt-2">
                    <a
                        href={solution.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                            analyticsService.trackSolutionClick(currentUser?.id || null, solution.id, solution.title);
                            analyticsService.logEvent('benefit_cta_clicked', { solution_id: solution.id }).catch(console.error);
                        }}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-sm font-semibold text-white transition-all active:scale-[0.98]"
                    >
                        Acessar Ferramenta
                        <ExternalLink size={13} />
                    </a>
                </div>
            </div>
        </div>
    );
}

// ═════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════
export const SolutionsListPage: React.FC<SolutionsListPageProps> = ({ setView }) => {
    const [solutions, setSolutions] = useState<ToolSolution[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSolutions();
    }, []);

    const loadSolutions = async () => {
        try {
            const data = await toolsService.getActiveSolutions();
            setSolutions(data);
        } catch (error) {
            console.error('Failed to load solutions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-full">
            {/* Header */}
            <div className="px-4 pt-4 pb-5">
                <button
                    onClick={() => setView(ViewState.PROSPERUS_TOOLS)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors mb-5"
                >
                    <ArrowLeft size={16} />
                    Voltar
                </button>
                <h1 className="text-2xl font-bold text-white">Soluções Prosperus</h1>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Ferramentas integradas para impulsionar seu negócio
                </p>
            </div>

            {/* Solutions list */}
            <div className="px-4 pb-8">
                {loading ? (
                    <SolutionsSkeletonList />
                ) : solutions.length === 0 ? (
                    <SolutionsMemberEmptyState />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                        {solutions
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((solution, index) => (
                                <SolutionMemberCard key={solution.id} solution={solution} index={index} />
                            ))}
                    </div>
                )}
            </div>

            {/* Staggered entrance animation */}
            <style>{`
                .slp-card {
                    animation: slpFadeIn 400ms ease-out both;
                }
                @keyframes slpFadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

export default SolutionsListPage;
