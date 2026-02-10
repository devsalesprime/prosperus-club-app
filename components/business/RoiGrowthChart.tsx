// RoiGrowthChart.tsx
// Componente visual para exibir o ROI Tangível do sócio

import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Handshake, Users, Loader2 } from 'lucide-react';
import { roiService, FinancialGrowth } from '../../services/roiService';

interface RoiGrowthChartProps {
    userId: string;
}

export const RoiGrowthChart: React.FC<RoiGrowthChartProps> = ({ userId }) => {
    const [growth, setGrowth] = useState<FinancialGrowth | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGrowth = async () => {
            setLoading(true);
            const data = await roiService.getMyFinancialGrowth(userId);
            setGrowth(data);
            setLoading(false);
        };

        fetchGrowth();
    }, [userId]);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2
        }).format(value);
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-600/30 rounded-xl p-8 flex items-center justify-center">
                <Loader2 className="animate-spin text-green-500" size={32} />
            </div>
        );
    }

    if (!growth || growth.totalRevenue === 0) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-8 text-center">
                <div className="p-4 bg-slate-800 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <DollarSign className="text-slate-400" size={40} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Comece a Gerar Resultados!</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Registre seus negócios fechados e indicações convertidas para acompanhar seu ROI no clube.
                </p>
            </div>
        );
    }

    const dealsPercentage = growth.totalRevenue > 0
        ? (growth.dealsRevenue / growth.totalRevenue) * 100
        : 0;
    const referralsPercentage = growth.totalRevenue > 0
        ? (growth.referralsRevenue / growth.totalRevenue) * 100
        : 0;

    return (
        <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/10 border border-green-600/30 rounded-xl p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp className="text-green-500" size={20} />
                        Faturamento Gerado no Clube
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">ROI Tangível das suas conexões</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-green-400">
                        {formatCurrency(growth.totalRevenue)}
                    </p>
                    <p className="text-xs text-green-500/70">Total Acumulado</p>
                </div>
            </div>

            {/* Visual Breakdown */}
            <div className="mb-6">
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                    {growth.dealsRevenue > 0 && (
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                            style={{ width: `${dealsPercentage}%` }}
                            title={`Vendas Diretas: ${dealsPercentage.toFixed(1)}%`}
                        />
                    )}
                    {growth.referralsRevenue > 0 && (
                        <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${referralsPercentage}%` }}
                            title={`Indicações: ${referralsPercentage.toFixed(1)}%`}
                        />
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Deals */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/30 hover:border-blue-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Handshake className="text-blue-400" size={18} />
                        <span className="text-xs text-slate-400">Vendas Diretas</span>
                    </div>
                    <p className="text-xl font-bold text-white">{formatCurrency(growth.dealsRevenue)}</p>
                    <p className="text-xs text-slate-500 mt-1">{growth.dealsCount} negócio{growth.dealsCount !== 1 ? 's' : ''}</p>
                </div>

                {/* Referrals */}
                <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="text-purple-400" size={18} />
                        <span className="text-xs text-slate-400">Indicações</span>
                    </div>
                    <p className="text-xl font-bold text-white">{formatCurrency(growth.referralsRevenue)}</p>
                    <p className="text-xs text-slate-500 mt-1">{growth.referralsCount} convertida{growth.referralsCount !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Motivational Message */}
            {growth.totalRevenue > 0 && (
                <div className="mt-4 pt-4 border-t border-green-600/20">
                    <p className="text-xs text-center text-green-400/70">
                        🎯 Continue conectando! Cada relacionamento pode gerar novos resultados.
                    </p>
                </div>
            )}
        </div>
    );
};

export default RoiGrowthChart;
