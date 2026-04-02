// ============================================
// TOP BENEFITS TABLE (ADMIN)
// ============================================
// Ranking table showing top performing benefits

import React, { useEffect, useState } from 'react';
import { Trophy, Eye, MousePointerClick, Users, TrendingUp, Loader2 } from 'lucide-react';
import { analyticsService, TopBenefit } from '../../services/analyticsService';

interface TopBenefitsTableProps {
    limit?: number;
}

export const TopBenefitsTable: React.FC<TopBenefitsTableProps> = ({ limit = 10 }) => {
    const [benefits, setBenefits] = useState<TopBenefit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopBenefits = async () => {
            setLoading(true);
            try {
                const data = await analyticsService.getTopBenefits(limit);
                setBenefits(data);
            } catch (error) {
                console.error('[Admin] Error fetching top benefits:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTopBenefits();
    }, [limit]);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="animate-spin text-yellow-500" size={32} />
                </div>
            </div>
        );
    }

    if (benefits.length === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                <Trophy className="text-slate-600 mx-auto mb-4" size={48} />
                <h4 className="text-lg font-bold text-white mb-2">Nenhum benefício com atividade</h4>
                <p className="text-slate-400 text-sm">
                    Quando os membros começarem a interagir com os benefícios, eles aparecerão aqui.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-600/20 rounded-lg">
                        <Trophy className="text-yellow-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Top {limit} Benefícios</h3>
                        <p className="text-xs text-slate-400">Ofertas mais populares por cliques</p>
                    </div>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block w-full">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-800/50 border-b border-slate-800">
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                #
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Membro
                            </th>
                            <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Benefício
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Eye size={14} />
                                    Views
                                </div>
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <MousePointerClick size={14} />
                                    Clicks
                                </div>
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <Users size={14} />
                                    Únicos
                                </div>
                            </th>
                            <th className="text-center px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                <div className="flex items-center justify-center gap-1">
                                    <TrendingUp size={14} />
                                    CTR
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {benefits.map((benefit, index) => (
                            <tr
                                key={benefit.ownerId}
                                className="hover:bg-slate-800/30 transition-colors"
                            >
                                {/* Rank */}
                                <td className="px-6 py-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                            index === 1 ? 'bg-slate-600/50 text-slate-300' :
                                                index === 2 ? 'bg-orange-700/30 text-orange-400' :
                                                    'bg-slate-800 text-slate-500'
                                        }`}>
                                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                                    </div>
                                </td>

                                {/* Owner Name */}
                                <td className="px-6 py-4">
                                    <p className="text-sm font-medium text-white">{benefit.ownerName}</p>
                                </td>

                                {/* Benefit Title */}
                                <td className="px-6 py-4">
                                    <p className="text-sm text-slate-300 max-w-xs truncate min-w-0">
                                        {benefit.benefitTitle}
                                    </p>
                                </td>

                                {/* Views */}
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-medium text-blue-400">
                                        {formatNumber(benefit.totalViews)}
                                    </span>
                                </td>

                                {/* Clicks */}
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-bold text-green-400">
                                        {formatNumber(benefit.totalClicks)}
                                    </span>
                                </td>

                                {/* Unique Visitors */}
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-medium text-purple-400">
                                        {formatNumber(benefit.uniqueVisitors)}
                                    </span>
                                </td>

                                {/* CTR */}
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${benefit.ctrPercent >= 10 ? 'bg-green-500/20 text-green-400' :
                                            benefit.ctrPercent >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-slate-700 text-slate-400'
                                        }`}>
                                        {benefit.ctrPercent}%
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden py-4 px-4 w-full">
                {benefits.map((benefit, index) => (
                    <div key={benefit.ownerId} className="bg-[#031726] border border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-sm relative w-full overflow-hidden">
                        <div className="flex items-center gap-3 w-full min-w-0">
                            <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                    index === 1 ? 'bg-slate-600/50 text-slate-300' :
                                        index === 2 ? 'bg-orange-700/30 text-orange-400' :
                                            'bg-slate-800 text-slate-500'
                                }`}>
                                {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="font-bold text-base text-white truncate block w-full">{benefit.ownerName}</span>
                                <span className="text-xs text-slate-400 truncate block w-full">{benefit.benefitTitle}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 mt-1">
                            <div className="flex flex-col gap-1 text-center">
                                <span className="flex items-center justify-center gap-1 uppercase tracking-wider text-[10px] text-slate-500"><Eye size={12} /> Views</span>
                                <span className="font-medium text-blue-400">{formatNumber(benefit.totalViews)}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                                <span className="flex items-center justify-center gap-1 uppercase tracking-wider text-[10px] text-slate-500"><MousePointerClick size={12} /> Clicks</span>
                                <span className="font-bold text-green-400">{formatNumber(benefit.totalClicks)}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                                <span className="flex items-center justify-center gap-1 uppercase tracking-wider text-[10px] text-slate-500"><Users size={12} /> Únicos</span>
                                <span className="font-medium text-purple-400">{formatNumber(benefit.uniqueVisitors)}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-center">
                                <span className="flex items-center justify-center gap-1 uppercase tracking-wider text-[10px] text-slate-500"><TrendingUp size={12} /> CTR</span>
                                <span className={`inline-flex items-center justify-center gap-1 mx-auto px-2 rounded-full text-xs font-bold ${benefit.ctrPercent >= 10 ? 'bg-green-500/20 text-green-400' :
                                        benefit.ctrPercent >= 5 ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-slate-700 text-slate-400'
                                    }`}>
                                    {benefit.ctrPercent}%
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopBenefitsTable;
