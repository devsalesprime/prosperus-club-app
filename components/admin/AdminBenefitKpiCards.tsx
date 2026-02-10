// ============================================
// ADMIN BENEFIT KPI CARDS
// ============================================
// Dashboard cards showing benefit analytics for admin

import React, { useEffect, useState } from 'react';
import { Gift, Eye, MousePointerClick, Users, TrendingUp, Percent, Loader2 } from 'lucide-react';
import { analyticsService, BenefitOverview, BenefitEngagement } from '../../services/analyticsService';

interface AdminBenefitKpiCardsProps {
    period?: number; // Days for engagement metrics
}

const KpiCard = ({
    icon,
    label,
    value,
    subtitle,
    color,
    trend,
    loading
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
    loading?: boolean;
}) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
            {trend && !loading && (
                <div className={`text-xs font-bold px-2 py-1 rounded ${trend === 'up' ? 'bg-green-500/20 text-green-400' :
                        trend === 'down' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400'
                    }`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </div>
            )}
        </div>
        {loading ? (
            <>
                <div className="h-8 bg-slate-800 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-4 bg-slate-800 rounded w-32 animate-pulse"></div>
            </>
        ) : (
            <>
                <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
                <p className="text-sm font-medium text-slate-400">{label}</p>
                {subtitle && (
                    <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
                )}
            </>
        )}
    </div>
);

export const AdminBenefitKpiCards: React.FC<AdminBenefitKpiCardsProps> = ({ period = 30 }) => {
    const [overview, setOverview] = useState<BenefitOverview | null>(null);
    const [engagement, setEngagement] = useState<BenefitEngagement | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [overviewData, engagementData] = await Promise.all([
                    analyticsService.getBenefitOverview(),
                    analyticsService.getBenefitEngagement(period)
                ]);
                setOverview(overviewData);
                setEngagement(engagementData);
            } catch (error) {
                console.error('[Admin] Error fetching benefit KPIs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [period]);

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-600/20 rounded-lg">
                    <Gift className="text-yellow-500" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Analytics de Benefícios</h3>
                    <p className="text-xs text-slate-400">Performance das ofertas exclusivas do clube</p>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Active Benefits */}
                <KpiCard
                    icon={<Gift size={24} className="text-yellow-400" />}
                    label="Benefícios Ativos"
                    value={overview?.activeBenefits || 0}
                    subtitle={`${overview?.benefitsWithActivity || 0} com atividade`}
                    color="bg-yellow-500/20"
                    trend={overview && overview.activeBenefits > 0 ? 'up' : 'neutral'}
                    loading={loading}
                />

                {/* Total Views */}
                <KpiCard
                    icon={<Eye size={24} className="text-blue-400" />}
                    label="Visualizações Totais"
                    value={formatNumber(overview?.totalViews || 0)}
                    subtitle="Perfis visualizados"
                    color="bg-blue-500/20"
                    trend="up"
                    loading={loading}
                />

                {/* Total Clicks */}
                <KpiCard
                    icon={<MousePointerClick size={24} className="text-green-400" />}
                    label="Cliques Totais"
                    value={formatNumber(overview?.totalClicks || 0)}
                    subtitle="Links acessados"
                    color="bg-green-500/20"
                    trend="up"
                    loading={loading}
                />

                {/* Average CTR */}
                <KpiCard
                    icon={<Percent size={24} className="text-purple-400" />}
                    label="CTR Médio"
                    value={`${overview?.avgCtrPercent || 0}%`}
                    subtitle="Taxa de conversão geral"
                    color="bg-purple-500/20"
                    trend={overview && overview.avgCtrPercent > 5 ? 'up' : 'neutral'}
                    loading={loading}
                />

                {/* Unique Viewers */}
                <KpiCard
                    icon={<Users size={24} className="text-cyan-400" />}
                    label="Membros Engajados"
                    value={formatNumber(engagement?.uniqueViewers || 0)}
                    subtitle={`${engagement?.engagementRate || 0}% dos membros`}
                    color="bg-cyan-500/20"
                    trend="up"
                    loading={loading}
                />

                {/* Unique Clickers */}
                <KpiCard
                    icon={<TrendingUp size={24} className="text-orange-400" />}
                    label="Conversões Únicas"
                    value={formatNumber(engagement?.uniqueClickers || 0)}
                    subtitle={`${engagement?.conversionRate || 0}% converteram`}
                    color="bg-orange-500/20"
                    trend={engagement && engagement.conversionRate > 10 ? 'up' : 'neutral'}
                    loading={loading}
                />

                {/* Total Unique Visitors */}
                <KpiCard
                    icon={<Users size={24} className="text-pink-400" />}
                    label="Visitantes Únicos"
                    value={formatNumber(overview?.totalUniqueVisitors || 0)}
                    subtitle="Alcance total"
                    color="bg-pink-500/20"
                    loading={loading}
                />

                {/* Engagement Rate */}
                <KpiCard
                    icon={<TrendingUp size={24} className="text-indigo-400" />}
                    label="Taxa de Engajamento"
                    value={`${engagement?.engagementRate || 0}%`}
                    subtitle={`${formatNumber(engagement?.totalMembers || 0)} membros totais`}
                    color="bg-indigo-500/20"
                    trend={engagement && engagement.engagementRate > 20 ? 'up' : 'neutral'}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default AdminBenefitKpiCards;
