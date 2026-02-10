// AnalyticsDashboard.tsx
// Dashboard visual de métricas para administradores
// Design: Clean, profissional, com cores indicativas de tendências

import React, { useState, useEffect } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';
import {
    Users,
    UserPlus,
    MessageCircle,
    PlayCircle,
    TrendingUp,
    TrendingDown,
    Activity,
    Calendar,
    RefreshCw,
    FileText,
    Video
} from 'lucide-react';
import {
    analyticsService,
    DashboardStats,
    DailyActivity,
    TopContent,
    EventBreakdown
} from '../../services/analyticsService';
import { AdminBenefitKpiCards } from './AdminBenefitKpiCards';
import { TopBenefitsTable } from './TopBenefitsTable';

// ============================================
// TYPES
// ============================================

interface KPICardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    trend?: number;
    suffix?: string;
    color: string;
}

// ============================================
// COLORS
// ============================================

const CHART_COLORS = {
    primary: '#eab308',      // Yellow-500
    secondary: '#3b82f6',    // Blue-500
    tertiary: '#22c55e',     // Green-500
    quaternary: '#a855f7',   // Purple-500
    area: 'rgba(234, 179, 8, 0.2)',
    grid: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8'
};

const PIE_COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ============================================
// SUB-COMPONENTS
// ============================================

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, suffix = '', color }) => {
    const isPositive = trend !== undefined && trend >= 0;
    const trendColor = isPositive ? 'text-emerald-500' : 'text-red-500';
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    {icon}
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 ${trendColor}`}>
                        <TrendIcon size={14} />
                        <span className="text-xs font-bold">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <p className="text-slate-400 text-sm mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">
                {value.toLocaleString('pt-BR')}{suffix}
            </p>
        </div>
    );
};

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center p-12">
        <RefreshCw size={32} className="text-yellow-500 animate-spin" />
    </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
        <Activity size={48} className="text-slate-600 mb-4" />
        <p className="text-slate-400">{message}</p>
    </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export const AnalyticsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<'7d' | '30d'>('30d');
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [topVideos, setTopVideos] = useState<TopContent[]>([]);
    const [topArticles, setTopArticles] = useState<TopContent[]>([]);
    const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const days = period === '7d' ? 7 : 30;
            const [statsData, activityData, videosData, articlesData, breakdownData] = await Promise.all([
                analyticsService.getDashboardStats(period),
                analyticsService.getActivityByDay(days),
                analyticsService.getTopVideos(5),
                analyticsService.getTopArticles(5),
                analyticsService.getEventBreakdown(days)
            ]);

            setStats(statsData);
            setDailyActivity(activityData);
            setTopVideos(videosData);
            setTopArticles(articlesData);
            setEventBreakdown(breakdownData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    if (isLoading && !stats) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
                    <p className="text-slate-400 text-sm">Métricas de engajamento do Prosperus Club</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="p-2 text-slate-400 hover:text-white transition disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <div className="flex bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setPeriod('7d')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${period === '7d'
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            7 dias
                        </button>
                        <button
                            onClick={() => setPeriod('30d')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition ${period === '30d'
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            30 dias
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Usuários Ativos (Hoje)"
                    value={stats?.activeUsersToday || 0}
                    icon={<Users size={24} className="text-yellow-500" />}
                    color="bg-yellow-500/10"
                    trend={5}
                />
                <KPICard
                    title={`Novos Sócios (${period === '7d' ? '7d' : 'Mês'})`}
                    value={stats?.newMembersMonth || 0}
                    icon={<UserPlus size={24} className="text-blue-500" />}
                    color="bg-blue-500/10"
                    trend={12}
                />
                <KPICard
                    title="Mensagens Trocadas"
                    value={stats?.messagesSent || 0}
                    icon={<MessageCircle size={24} className="text-emerald-500" />}
                    color="bg-emerald-500/10"
                    trend={8}
                />
                <KPICard
                    title="Vídeos Assistidos"
                    value={stats?.videosCompleted || 0}
                    icon={<PlayCircle size={24} className="text-purple-500" />}
                    color="bg-purple-500/10"
                    trend={-3}
                />
            </div>

            {/* ========================================= */}
            {/* BENEFIT ANALYTICS SECTION */}
            {/* ========================================= */}
            <div className="space-y-6">
                {/* Benefit KPI Cards */}
                <AdminBenefitKpiCards period={period === '7d' ? 7 : 30} />

                {/* Top Benefits Ranking */}
                <TopBenefitsTable limit={10} />
            </div>

            {/* Main Chart - Activity by Day */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Atividade por Dia</h2>
                        <p className="text-sm text-slate-400">Últimos {period === '7d' ? '7' : '30'} dias</p>
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
                            <XAxis
                                dataKey="label"
                                stroke={CHART_COLORS.text}
                                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke={CHART_COLORS.text}
                                tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke={CHART_COLORS.primary}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                strokeWidth={2}
                                name="Total"
                            />
                            <Area
                                type="monotone"
                                dataKey="pageViews"
                                stroke={CHART_COLORS.secondary}
                                fillOpacity={1}
                                fill="url(#colorPageViews)"
                                strokeWidth={2}
                                name="Page Views"
                            />
                            <Area
                                type="monotone"
                                dataKey="messages"
                                stroke={CHART_COLORS.tertiary}
                                fillOpacity={0}
                                strokeWidth={2}
                                name="Mensagens"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState message="Nenhum dado de atividade disponível" />
                )}
            </div>

            {/* Bottom Grid: Top Content + Event Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Videos */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Video size={20} className="text-purple-500" />
                        <h3 className="font-bold text-white">Top Vídeos</h3>
                    </div>
                    {topVideos.length > 0 ? (
                        <div className="space-y-3">
                            {topVideos.map((video, index) => (
                                <div key={video.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{video.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">
                                        {video.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Nenhum vídeo assistido ainda" />
                    )}
                </div>

                {/* Top Articles */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Top Artigos</h3>
                    </div>
                    {topArticles.length > 0 ? (
                        <div className="space-y-3">
                            {topArticles.map((article, index) => (
                                <div key={article.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-500 w-5">
                                        #{index + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{article.title}</p>
                                    </div>
                                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                                        {article.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState message="Nenhum artigo lido ainda" />
                    )}
                </div>

                {/* Event Breakdown - Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={20} className="text-emerald-500" />
                        <h3 className="font-bold text-white">Tipos de Evento</h3>
                    </div>
                    {eventBreakdown.length > 0 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={eventBreakdown.slice(0, 5)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={2}
                                    dataKey="value"
                                    nameKey="name"
                                >
                                    {eventBreakdown.slice(0, 5).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="Nenhum evento registrado" />
                    )}
                    {eventBreakdown.length > 0 && (
                        <div className="mt-2 space-y-1">
                            {eventBreakdown.slice(0, 5).map((event, index) => (
                                <div key={event.name} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                        />
                                        <span className="text-slate-400">{event.name.replace('_', ' ')}</span>
                                    </div>
                                    <span className="text-white font-bold">{event.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Total Events Summary */}
            <div className="bg-gradient-to-r from-yellow-600/10 to-yellow-600/5 border border-yellow-600/20 rounded-xl p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 text-sm">Total de eventos registrados</p>
                        <p className="text-3xl font-bold text-white">
                            {(stats?.totalEvents || 0).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-400 text-sm">Período</p>
                        <p className="text-lg font-bold text-yellow-500">
                            Últimos {period === '7d' ? '7' : '30'} dias
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
