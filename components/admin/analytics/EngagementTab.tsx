// ============================================
// ENGAGEMENT TAB — Analytics Dashboard
// ============================================
// KPIs de engajamento, métricas de acesso, gráfico de atividade

import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
    Users, UserPlus, MessageCircle, PlayCircle, Activity,
    TrendingUp, TrendingDown, Minus, BarChart3, LogIn,
} from 'lucide-react';
import {
    analyticsService,
    DashboardStats,
    DailyActivity,
    DailyAccessMetrics,
} from '../../../services/analyticsService';
import { AdminLoadingState, AdminEmptyState } from '../shared';
import {
    AnalyticsTabProps,
    CHART_COLORS,
    TrendBadge,
    periodToDays,
    periodLabel,
} from './analyticsUtils';

export const EngagementTab: React.FC<AnalyticsTabProps> = ({ period }) => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [accessMetrics, setAccessMetrics] = useState<DailyAccessMetrics[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const days = periodToDays(period);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const [statsData, activityData] = await Promise.all([
                    analyticsService.getDashboardStats(period),
                    analyticsService.getActivityByDay(days),
                ]);
                if (cancelled) return;
                setStats(statsData);
                setDailyActivity(activityData);

                // Non-blocking
                analyticsService.getDailyAccessMetrics(days)
                    .then(d => { if (!cancelled) setAccessMetrics(d); })
                    .catch(console.error);
            } catch (error) {
                console.error('Error loading engagement data:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [period, days]);

    if (isLoading && !stats) {
        return <AdminLoadingState message="Carregando métricas de engajamento..." />;
    }

    return (
        <>
            {/* ENGAGEMENT KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Usuários Ativos Hoje */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-yellow-500/10">
                            <Users size={24} className="text-yellow-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Usuários Ativos (Hoje)</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.activeUsersToday || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 2: Novos Sócios */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <UserPlus size={24} className="text-blue-500" />
                        </div>
                        <TrendBadge value={stats?.trendNewMembers} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Novos Sócios ({periodLabel(period)})</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.newMembersMonth || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 3: Mensagens Trocadas */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                            <MessageCircle size={24} className="text-emerald-500" />
                        </div>
                        <TrendBadge value={stats?.trendMessages} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Mensagens Trocadas</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.messagesSent || 0).toLocaleString('pt-BR')}
                    </p>
                </div>

                {/* KPI 4: Vídeos Assistidos */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <PlayCircle size={24} className="text-purple-500" />
                        </div>
                        <TrendBadge value={stats?.trendVideos} />
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Vídeos Assistidos</p>
                    <p className="text-3xl font-bold text-white">
                        {(stats?.videosCompleted || 0).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>

            {/* DAILY ACCESS METRICS (Total Sessions + DAU) */}
            {accessMetrics.length > 0 && (() => {
                const today = accessMetrics[accessMetrics.length - 1];
                const yesterday = accessMetrics.length > 1 ? accessMetrics[accessMetrics.length - 2] : null;
                const totalSessionsPeriod = accessMetrics.reduce((s, d) => s + d.totalSessions, 0);
                const avgDau = Math.round(accessMetrics.reduce((s, d) => s + d.uniqueUsers, 0) / accessMetrics.length);
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-cyan-500/10">
                                    <LogIn size={24} className="text-cyan-500" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-1">Acessos Hoje</p>
                            <p className="text-3xl font-bold text-white">
                                {today.totalSessions.toLocaleString('pt-BR')}
                            </p>
                            {yesterday && (
                                <p className="text-xs text-slate-500 mt-1">Ontem: {yesterday.totalSessions}</p>
                            )}
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-teal-500/10">
                                    <Users size={24} className="text-teal-500" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-1">Usuários Únicos (DAU)</p>
                            <p className="text-3xl font-bold text-white">
                                {today.uniqueUsers.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">Média: {avgDau}/dia</p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-indigo-500/10">
                                    <Activity size={24} className="text-indigo-500" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-1">Total Sessões ({periodLabel(period)})</p>
                            <p className="text-3xl font-bold text-white">
                                {totalSessionsPeriod.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 rounded-lg bg-amber-500/10">
                                    <Users size={24} className="text-amber-500" />
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm mb-1">DAU Médio ({periodLabel(period)})</p>
                            <p className="text-3xl font-bold text-white">
                                {avgDau.toLocaleString('pt-BR')}
                            </p>
                        </div>
                    </div>
                );
            })()}

            {/* ACTIVITY CHART */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Atividade por Dia</h2>
                        <p className="text-sm text-slate-400">Últimos {periodLabel(period)}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <span className="text-slate-400">Total</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="text-slate-400">Page Views</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-slate-400">Mensagens</span>
                        </div>
                    </div>
                </div>

                {dailyActivity.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={dailyActivity}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_COLORS.secondary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_COLORS.secondary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                            <XAxis dataKey="label" stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} />
                            <YAxis stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} labelStyle={{ color: '#94a3b8' }} />
                            <Area type="monotone" dataKey="total" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} name="Total" />
                            <Area type="monotone" dataKey="pageViews" stroke={CHART_COLORS.secondary} fillOpacity={1} fill="url(#colorPageViews)" strokeWidth={2} name="Page Views" />
                            <Area type="monotone" dataKey="messages" stroke={CHART_COLORS.tertiary} fillOpacity={0} strokeWidth={2} name="Mensagens" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <AdminEmptyState icon={<BarChart3 size={48} />} message="Nenhum dado de atividade disponível" description="Os dados aparecerão aqui quando houver eventos registrados no período selecionado." />
                )}
            </div>

            {/* TOTAL EVENTS FOOTER */}
            <div className="bg-gradient-to-r from-yellow-600/10 to-yellow-600/5 border border-yellow-600/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Total de eventos registrados</p>
                        <p className="text-3xl font-bold text-white">{(stats?.totalEvents || 0).toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Período</p>
                        <p className="text-lg font-bold text-yellow-500">Últimos {periodLabel(period)}</p>
                        {stats?.trendEvents !== null && stats?.trendEvents !== undefined && (
                            <div className={`flex items-center justify-end gap-1 mt-1 ${stats.trendEvents > 0 ? 'text-emerald-500' : stats.trendEvents < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                {stats.trendEvents > 0 ? <TrendingUp size={14} /> : stats.trendEvents < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
                                <span className="text-xs font-bold">{Math.abs(stats.trendEvents)}% vs período anterior</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
