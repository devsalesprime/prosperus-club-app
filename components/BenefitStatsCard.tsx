// BenefitStatsCard.tsx
// Componente para exibir estatísticas de performance do benefício exclusivo

import React, { useEffect, useState } from 'react';
import { Eye, MousePointerClick, Users, TrendingUp, Loader2, Gift } from 'lucide-react';
import { analyticsService, BenefitStats } from '../services/analyticsService';

interface BenefitStatsCardProps {
    ownerId: string;
}

export const BenefitStatsCard: React.FC<BenefitStatsCardProps> = ({ ownerId }) => {
    const [stats, setStats] = useState<BenefitStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const data = await analyticsService.getBenefitStats(ownerId);
            setStats(data);
            setLoading(false);
        };

        fetchStats();
    }, [ownerId]);

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-center">
                <Loader2 className="animate-spin text-yellow-500" size={24} />
            </div>
        );
    }

    if (!stats || stats.totalViews === 0) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
                <div className="p-4 bg-slate-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Gift className="text-slate-400" size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Nenhuma visualização ainda</h4>
                <p className="text-slate-400 text-sm">
                    Compartilhe seu perfil para começar a receber visualizações e cliques na sua oferta!
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-yellow-600/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="text-yellow-500" size={20} />
                Performance do Meu Benefícios
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Views */}
                <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700 hover:border-blue-500/50 transition-colors">
                    <Eye className="text-blue-400 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-white">{stats.totalViews}</p>
                    <p className="text-xs text-slate-400">Visualizações</p>
                </div>

                {/* Clicks */}
                <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700 hover:border-green-500/50 transition-colors">
                    <MousePointerClick className="text-green-400 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-white">{stats.totalClicks}</p>
                    <p className="text-xs text-slate-400">Cliques no Link</p>
                </div>

                {/* Unique Visitors */}
                <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700 hover:border-purple-500/50 transition-colors">
                    <Users className="text-purple-400 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-white">{stats.uniqueVisitors}</p>
                    <p className="text-xs text-slate-400">Pessoas Alcançadas</p>
                </div>

                {/* CTR */}
                <div className="bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700 hover:border-yellow-500/50 transition-colors">
                    <TrendingUp className="text-yellow-400 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-white">{stats.ctrPercent}%</p>
                    <p className="text-xs text-slate-400">Taxa de Conversão</p>
                </div>
            </div>

            {stats.firstViewAt && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-500 text-center">
                        Primeira visualização: {new Date(stats.firstViewAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BenefitStatsCard;
