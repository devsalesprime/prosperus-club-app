// ============================================
// OFFICIAL RANKINGS TAB
// ============================================
// Official rankings based on audited deals only

import React, { useState } from 'react';
import { Trophy, Download, Medal, TrendingUp, DollarSign } from 'lucide-react';
import { RankingEntry } from '../../types';

interface OfficialRankingsTabProps {
    rankings: RankingEntry[];
    loading: boolean;
    onExportCSV: () => void;
}

export const OfficialRankingsTab: React.FC<OfficialRankingsTabProps> = ({ rankings, loading, onExportCSV }) => {
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

    const getMedalColor = (rank: number) => {
        switch (rank) {
            case 1: return 'from-yellow-400 to-yellow-600';
            case 2: return 'from-slate-300 to-slate-400';
            case 3: return 'from-orange-400 to-orange-600';
            default: return 'from-slate-700 to-slate-800';
        }
    };

    const getMedalIcon = (rank: number) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return rank;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 animate-pulse">
                    <div className="h-8 bg-slate-800 rounded w-48 mb-4"></div>
                    <div className="h-32 bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    const topThree = rankings.slice(0, 3);
    const others = rankings.slice(3);

    return (
        <div className="space-y-6">
            {/* Header with Export */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">Rankings Oficiais</h3>
                    <p className="text-sm text-slate-400">Baseado apenas em negócios auditados</p>
                </div>
                <button
                    onClick={onExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            {/* Podium - Top 3 */}
            {topThree.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
                    <div className="flex items-end justify-center gap-4 mb-8">
                        {/* 2nd Place */}
                        {topThree[1] && (
                            <div className="flex flex-col items-center w-32">
                                <div className="relative mb-3">
                                    <img
                                        src={topThree[1].image_url || '/default-avatar.svg'}
                                        alt={topThree[1].name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-slate-300"
                                    />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                                        🥈
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-slate-300 to-slate-400 rounded-t-xl w-full h-24 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-900">2º</span>
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-sm font-bold text-white truncate w-32">{topThree[1].name}</p>
                                    <p className="text-xs text-yellow-500 font-bold">{formatCurrency(topThree[1].total_sales || 0)}</p>
                                </div>
                            </div>
                        )}

                        {/* 1st Place */}
                        {topThree[0] && (
                            <div className="flex flex-col items-center w-32">
                                <div className="relative mb-3">
                                    <img
                                        src={topThree[0].image_url || '/default-avatar.svg'}
                                        alt={topThree[0].name}
                                        className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400 ring-4 ring-yellow-400/30"
                                    />
                                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                                        🥇
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-t-xl w-full h-32 flex flex-col items-center justify-center">
                                    <Trophy size={32} className="text-yellow-900 mb-1" />
                                    <span className="text-3xl font-bold text-yellow-900">1º</span>
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-sm font-bold text-white truncate w-32">{topThree[0].name}</p>
                                    <p className="text-xs text-yellow-500 font-bold">{formatCurrency(topThree[0].total_sales || 0)}</p>
                                </div>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {topThree[2] && (
                            <div className="flex flex-col items-center w-32">
                                <div className="relative mb-3">
                                    <img
                                        src={topThree[2].image_url || '/default-avatar.svg'}
                                        alt={topThree[2].name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-orange-400"
                                    />
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-lg font-bold shadow-lg">
                                        🥉
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-xl w-full h-20 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-orange-900">3º</span>
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-sm font-bold text-white truncate w-32">{topThree[2].name}</p>
                                    <p className="text-xs text-yellow-500 font-bold">{formatCurrency(topThree[2].total_sales || 0)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Full Rankings Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Posição
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Sócio
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Total Vendas
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Negócios
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Ticket Médio
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {rankings.map((entry, index) => {
                                const rank = index + 1;
                                const isTopThree = rank <= 3;

                                return (
                                    <tr
                                        key={entry.user_id}
                                        className={`hover:bg-slate-800/50 transition-colors ${isTopThree ? 'bg-slate-800/30' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {isTopThree ? (
                                                    <span className="text-2xl">{getMedalIcon(rank)}</span>
                                                ) : (
                                                    <span className="text-lg font-bold text-slate-500">{rank}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={entry.image_url || '/default-avatar.svg'}
                                                    alt={entry.name}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                                                />
                                                <div>
                                                    <p className="font-bold text-white">{entry.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-lg font-bold text-yellow-500">
                                                {formatCurrency(entry.total_sales || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-medium text-slate-300">
                                                {formatNumber(entry.deals_count || 0)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="text-sm font-medium text-slate-400">
                                                {formatCurrency(entry.avg_ticket || 0)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {rankings.length === 0 && (
                    <div className="p-12 text-center">
                        <Trophy size={48} className="text-slate-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum Negócio Auditado</h3>
                        <p className="text-slate-400">
                            Os rankings aparecerão após a auditoria dos negócios
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OfficialRankingsTab;
