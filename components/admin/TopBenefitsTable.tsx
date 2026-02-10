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

            {/* Table */}
            <div className="overflow-x-auto">
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
                                    <p className="text-sm text-slate-300 max-w-xs truncate">
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
        </div>
    );
};

export default TopBenefitsTable;
