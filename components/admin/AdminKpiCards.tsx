// ============================================
// ADMIN KPI CARDS
// ============================================
// Dashboard cards showing key metrics for ROI admin

import React from 'react';
import { TrendingUp, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { AdminKPIs } from '../../services/adminBusinessService';

interface AdminKpiCardsProps {
    kpis: AdminKPIs;
    loading?: boolean;
}

const KpiCard = ({
    icon,
    label,
    value,
    subtitle,
    color,
    trend
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subtitle?: string;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
}) => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl ${color}`}>
                {icon}
            </div>
            {trend && (
                <div className={`text-xs font-bold px-2 py-1 rounded ${trend === 'up' ? 'bg-green-500/20 text-green-400' :
                        trend === 'down' ? 'bg-red-500/20 text-red-400' :
                            'bg-slate-700 text-slate-400'
                    }`}>
                    {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                </div>
            )}
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        {subtitle && (
            <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
        )}
    </div>
);

export const AdminKpiCards: React.FC<AdminKpiCardsProps> = ({ kpis, loading }) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
                        <div className="h-12 w-12 bg-slate-800 rounded-xl mb-4"></div>
                        <div className="h-8 bg-slate-800 rounded w-24 mb-2"></div>
                        <div className="h-4 bg-slate-800 rounded w-32"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {/* Total Volume */}
            <KpiCard
                icon={<DollarSign size={24} className="text-yellow-400" />}
                label="Volume Total"
                value={formatCurrency(kpis.totalVolume)}
                subtitle={`${formatNumber(kpis.dealsCount)} negócios`}
                color="bg-yellow-500/20"
                trend="up"
            />

            {/* Average Ticket */}
            <KpiCard
                icon={<TrendingUp size={24} className="text-blue-400" />}
                label="Ticket Médio"
                value={formatCurrency(kpis.avgTicket)}
                subtitle="Por negócio"
                color="bg-blue-500/20"
            />

            {/* Contested Deals */}
            <KpiCard
                icon={<AlertTriangle size={24} className="text-orange-400" />}
                label="Contestações"
                value={kpis.contestedCount}
                subtitle="Aguardando resolução"
                color="bg-orange-500/20"
                trend={kpis.contestedCount > 0 ? 'down' : 'neutral'}
            />

            {/* Audited Deals */}
            <KpiCard
                icon={<CheckCircle size={24} className="text-green-400" />}
                label="Auditados"
                value={kpis.auditedCount}
                subtitle={`${((kpis.auditedCount / Math.max(kpis.dealsCount, 1)) * 100).toFixed(0)}% do total`}
                color="bg-green-500/20"
                trend="up"
            />

            {/* High Value Pending */}
            <KpiCard
                icon={<Clock size={24} className="text-purple-400" />}
                label="Alto Valor Pendente"
                value={kpis.highValueCount}
                subtitle="Requerem auditoria"
                color="bg-purple-500/20"
            />

            {/* Invalidated */}
            <KpiCard
                icon={<XCircle size={24} className="text-red-400" />}
                label="Invalidados"
                value={kpis.invalidatedCount}
                subtitle="Fraudes detectadas"
                color="bg-red-500/20"
            />
        </div>
    );
};

export default AdminKpiCards;
