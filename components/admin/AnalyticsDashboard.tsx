// ============================================
// AnalyticsDashboard.tsx
// ============================================
// Painel executivo para a diretoria do Prosperus Club
// ✅ Fase A.2: Shared components, trends reais, filtro 7/30/90d
// ✅ Fase B.2: Funil Networking, Top ROI, Churn Risk, Academy, Events
// ✅ Fase B.3: Patch WhatsApp + last_access corrigido
// Usa: AdminPageHeader, AdminLoadingState, AdminEmptyState,
//      AdminTable, AdminActionButton de shared/

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
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
} from 'recharts';
import {
    Users,
    UserPlus,
    MessageCircle,
    PlayCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Activity,
    RefreshCw,
    FileText,
    Video,
    BarChart3,
    ArrowRight,
    DollarSign,
    AlertTriangle,
    GraduationCap,
    CalendarCheck,
    Crown,
    UserX,
    CheckCircle2,
    Download
} from 'lucide-react';
import {
    analyticsService,
    DashboardStats,
    DailyActivity,
    TopContent,
    EventBreakdown,
    NetworkingFunnel,
    TopRoiMember,
    ChurnRiskMember,
    AcademyCompletion,
    EventAttendance
} from '../../services/analyticsService';
import {
    AdminLoadingState,
    AdminEmptyState,
    AdminPageHeader,
    AdminTable,
    AdminActionButton
} from './shared';
import { AdminBenefitKpiCards } from './AdminBenefitKpiCards';
import { TopBenefitsTable } from './TopBenefitsTable';
import { getFileDownloadStats, FileDownloadStat } from '../../services/filesService';

// ============================================
// CHART COLORS
// ============================================

const CHART_COLORS = {
    primary: '#eab308',
    secondary: '#3b82f6',
    tertiary: '#22c55e',
    quaternary: '#a855f7',
    grid: 'rgba(100, 116, 139, 0.2)',
    text: '#94a3b8'
};

const PIE_COLORS = ['#eab308', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

// ============================================
// PERIOD HELPERS
// ============================================

type Period = '7d' | '30d' | '90d';

const periodToDays = (p: Period): number =>
    p === '7d' ? 7 : p === '90d' ? 90 : 30;

const periodLabel = (p: Period): string =>
    p === '7d' ? '7 dias' : p === '90d' ? '90 dias' : '30 dias';

const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

// ============================================
// WHATSAPP HELPER
// ============================================

const openWhatsApp = (member: ChurnRiskMember) => {
    if (!member.phone) {
        toast.error('Sócio não possui telefone cadastrado');
        return;
    }

    let cleaned = member.phone.replace(/\D/g, '');

    // Adicionar DDI 55 (Brasil) caso o número tenha 10-11 dígitos e não comece com 55
    if ((cleaned.length === 10 || cleaned.length === 11) && !cleaned.startsWith('55')) {
        cleaned = '55' + cleaned;
    }

    const message = encodeURIComponent(
        `Olá ${member.memberName}, tudo bem? Notamos sua ausência no Prosperus Club e gostaríamos de saber como podemos te ajudar a gerar mais negócios. Conte conosco! 🤝`
    );

    window.open(`https://wa.me/${cleaned}?text=${message}`, '_blank');
};

// ============================================
// TREND BADGE
// ============================================

const TrendBadge: React.FC<{ value: number | null | undefined }> = ({ value }) => {
    if (value === null || value === undefined) return null;

    if (value === 0) {
        return (
            <div className="flex items-center gap-1 text-slate-400">
                <Minus size={14} />
                <span className="text-xs font-bold">0%</span>
            </div>
        );
    }

    const isPositive = value > 0;
    return (
        <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="text-xs font-bold">{Math.abs(value)}%</span>
        </div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AnalyticsDashboard: React.FC = () => {
    const [period, setPeriod] = useState<Period>('30d');
    const [isLoading, setIsLoading] = useState(true);

    // Fase A states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
    const [topVideos, setTopVideos] = useState<TopContent[]>([]);
    const [topArticles, setTopArticles] = useState<TopContent[]>([]);
    const [eventBreakdown, setEventBreakdown] = useState<EventBreakdown[]>([]);

    // Fase B states
    const [funnel, setFunnel] = useState<NetworkingFunnel | null>(null);
    const [topRoi, setTopRoi] = useState<TopRoiMember[]>([]);
    const [churnRisk, setChurnRisk] = useState<ChurnRiskMember[]>([]);
    const [academy, setAcademy] = useState<AcademyCompletion | null>(null);
    const [attendance, setAttendance] = useState<EventAttendance | null>(null);
    const [fileStats, setFileStats] = useState<FileDownloadStat[]>([]);

    const days = periodToDays(period);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [
                statsData, activityData, videosData, articlesData, breakdownData,
                funnelData, roiData, churnData, academyData, attendanceData
            ] = await Promise.all([
                analyticsService.getDashboardStats(period),
                analyticsService.getActivityByDay(days),
                analyticsService.getTopVideos(5, days),
                analyticsService.getTopArticles(5, days),
                analyticsService.getEventBreakdown(days),
                analyticsService.getNetworkingFunnel(days),
                analyticsService.getTopRoiMembers(days, 5),
                analyticsService.getChurnRiskMembers(14),
                analyticsService.getAcademyCompletionRate(days),
                analyticsService.getEventAttendanceRate(days)
            ]);

            // Load file stats separately (non-blocking)
            getFileDownloadStats(period).then(setFileStats).catch(console.error);

            setStats(statsData);
            setDailyActivity(activityData);
            setTopVideos(videosData);
            setTopArticles(articlesData);
            setEventBreakdown(breakdownData);
            setFunnel(funnelData);
            setTopRoi(roiData);
            setChurnRisk(churnData);
            setAcademy(academyData);
            setAttendance(attendanceData);
        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [period]);

    // ─── Full-page loading (first load only) ─────────────────────────
    if (isLoading && !stats) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <AdminLoadingState message="Carregando métricas..." />
            </div>
        );
    }

    // ─── Period filter buttons ───────────────────────────────────────
    const PeriodFilter = (
        <div className="flex items-center gap-3">
            <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-white transition disabled:opacity-50"
                title="Atualizar dados"
            >
                <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <div className="flex bg-slate-800 rounded-lg p-1">
                {(['7d', '30d', '90d'] as Period[]).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                            period === p
                                ? 'bg-yellow-600 text-white'
                                : 'text-slate-400 hover:text-white'
                        }`}
                    >
                        {periodLabel(p)}
                    </button>
                ))}
            </div>
        </div>
    );

    // ─── Funnel chart data ───────────────────────────────────────────
    const funnelChartData = funnel ? [
        { name: 'Indicações', value: funnel.totalReferrals, fill: '#3b82f6' },
        { name: 'Negócios', value: funnel.totalDeals, fill: '#eab308' },
        { name: 'Auditados', value: funnel.auditedDeals, fill: '#22c55e' },
    ] : [];

    return (
        <div className="space-y-8">
            {/* ═══════════════════════════════════════════════════════ */}
            {/* HEADER                                                 */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AdminPageHeader
                title="Analytics Dashboard"
                subtitle="Métricas de engajamento e inteligência de negócios"
                action={PeriodFilter}
            />

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ENGAGEMENT KPIs (Fase A)                               */}
            {/* ═══════════════════════════════════════════════════════ */}
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

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BUSINESS INTELLIGENCE KPIs (Fase B)                    */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* BI KPI 1: Volume ROI Auditado */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-emerald-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                            <DollarSign size={24} className="text-emerald-500" />
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">ROI Auditado</p>
                    <p className="text-2xl font-bold text-emerald-400">
                        {formatCurrency(funnel?.auditedVolume || 0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {funnel?.auditedDeals || 0} negócios fechados
                    </p>
                </div>

                {/* BI KPI 2: Taxa de Conversão do Funil */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-blue-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-blue-500/10">
                            <ArrowRight size={24} className="text-blue-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Conversão do Funil</p>
                    <p className="text-2xl font-bold text-blue-400">
                        {funnel?.conversionRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {funnel?.totalReferrals || 0} indicações → {funnel?.auditedDeals || 0} fechados
                    </p>
                </div>

                {/* BI KPI 3: Academy Completion */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-purple-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                            <GraduationCap size={24} className="text-purple-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Conclusão Academy</p>
                    <p className="text-2xl font-bold text-purple-400">
                        {academy?.completionRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {academy?.videosCompleted || 0} de {academy?.videosStarted || 0} concluídos
                    </p>
                </div>

                {/* BI KPI 4: Event Attendance */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-cyan-800/50 transition">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-lg bg-cyan-500/10">
                            <CalendarCheck size={24} className="text-cyan-500" />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm mb-1">Presença em Eventos</p>
                    <p className="text-2xl font-bold text-cyan-400">
                        {attendance?.attendanceRate || 0}%
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {attendance?.totalCheckins || 0} check-ins · {attendance?.noShowCount || 0} no-shows
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* NETWORKING FUNNEL + TOP ROI (side-by-side)             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Networking Funnel Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <ArrowRight size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Funil de Networking</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {funnelChartData.some(d => d.value > 0) ? (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={funnelChartData} layout="vertical" barCategoryGap="20%">
                                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} horizontal={false} />
                                    <XAxis
                                        type="number"
                                        stroke={CHART_COLORS.text}
                                        tick={{ fill: CHART_COLORS.text, fontSize: 11 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke={CHART_COLORS.text}
                                        tick={{ fill: CHART_COLORS.text, fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #334155',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                        {funnelChartData.map((entry, index) => (
                                            <Cell key={`funnel-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-400">Volume auditado</span>
                                    <span className="text-emerald-400 font-bold">
                                        {formatCurrency(funnel?.auditedVolume || 0)}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState
                            icon={<ArrowRight size={36} />}
                            message="Nenhuma indicação ou negócio no período"
                        />
                    )}
                </div>

                {/* 🏆 Top ROI Members — usando AdminTable */}
                <AdminTable
                    title="🏆 Top Performers — ROI"
                    subtitle={`Sócios com maior volume auditado (${periodLabel(period)})`}
                >
                    {topRoi.length > 0 ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">#</th>
                                    <th className="text-left text-xs text-slate-500 font-medium py-3">Sócio</th>
                                    <th className="text-center text-xs text-slate-500 font-medium py-3">Negócios</th>
                                    <th className="text-right text-xs text-slate-500 font-medium px-5 py-3">Volume (R$)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topRoi.map((member, index) => (
                                    <tr key={member.memberId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                                index === 1 ? 'bg-slate-400/20 text-slate-300' :
                                                index === 2 ? 'bg-orange-600/20 text-orange-400' :
                                                'bg-slate-700/50 text-slate-500'
                                            }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                {member.memberImage ? (
                                                    <img
                                                        src={member.memberImage}
                                                        alt={member.memberName}
                                                        className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                        <Users size={14} className="text-slate-400" />
                                                    </div>
                                                )}
                                                <span className="text-white font-medium truncate max-w-[160px]">
                                                    {member.memberName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="text-slate-400">
                                                {member.dealCount}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="text-emerald-400 font-bold">
                                                {formatCurrency(member.totalVolume)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <AdminEmptyState
                            icon={<Crown size={36} />}
                            message="Nenhum negócio auditado no período"
                        />
                    )}
                </AdminTable>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ⚠️ CHURN RISK TABLE — usando AdminTable + WhatsApp     */}
            {/* ═══════════════════════════════════════════════════════ */}
            <AdminTable
                title="⚠️ Sócios em Risco de Churn"
                subtitle="Inativos há 14+ dias e sem negócios nos últimos 60 dias"
                headerAction={
                    <span className="text-xs text-red-400/70 bg-red-500/10 px-3 py-1 rounded-full font-medium">
                        {churnRisk.length} sócio{churnRisk.length !== 1 ? 's' : ''} em risco
                    </span>
                }
            >
                {churnRisk.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left text-xs text-slate-500 font-medium px-5 py-3">Sócio</th>
                                <th className="text-left text-xs text-slate-500 font-medium py-3">E-mail</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Dias Inativo</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Último Acesso</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Deals (60d)</th>
                                <th className="text-center text-xs text-slate-500 font-medium py-3">Risco</th>
                                <th className="text-center text-xs text-slate-500 font-medium px-5 py-3">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {churnRisk.slice(0, 15).map((member) => {
                                const riskLevel = member.daysInactive >= 30 ? 'high' : member.daysInactive >= 21 ? 'medium' : 'low';
                                return (
                                    <tr key={member.memberId} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                {member.memberImage ? (
                                                    <img src={member.memberImage} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                                        <UserX size={14} className="text-slate-500" />
                                                    </div>
                                                )}
                                                <span className="text-white font-medium truncate max-w-[140px]">
                                                    {member.memberName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-slate-400 truncate max-w-[180px]">
                                            {member.memberEmail}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`font-bold ${
                                                riskLevel === 'high' ? 'text-red-400' :
                                                riskLevel === 'medium' ? 'text-orange-400' :
                                                'text-yellow-400'
                                            }`}>
                                                {member.daysInactive}d
                                            </span>
                                        </td>
                                        <td className="py-3 text-center text-slate-400">
                                            {member.lastAccess
                                                ? new Date(member.lastAccess).toLocaleDateString('pt-BR')
                                                : `Há ${member.daysInactive} dias`
                                            }
                                        </td>
                                        <td className="py-3 text-center text-slate-500">
                                            {member.dealsLast60d}
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                riskLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                                                riskLevel === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                                {riskLevel === 'high' ? 'ALTO' : riskLevel === 'medium' ? 'MÉDIO' : 'BAIXO'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <AdminActionButton
                                                icon={MessageCircle}
                                                variant="primary"
                                                title={`Enviar WhatsApp para ${member.memberName}`}
                                                onClick={() => openWhatsApp(member)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <AdminEmptyState
                        icon={<CheckCircle2 size={48} className="text-emerald-500" />}
                        message="Nenhum sócio em risco de churn!"
                        description="Todos os sócios ativos se logaram nos últimos 14 dias ou possuem negócios recentes."
                    />
                )}
                {churnRisk.length > 15 && (
                    <div className="px-5 py-3 border-t border-slate-800 text-center">
                        <p className="text-xs text-slate-500">
                            Mostrando 15 de {churnRisk.length} sócios em risco
                        </p>
                    </div>
                )}
            </AdminTable>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BENEFIT ANALYTICS (Fase A)                             */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="space-y-6">
                <AdminBenefitKpiCards period={days} />
                <TopBenefitsTable limit={10} />
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* ACTIVITY CHART (Fase A)                                */}
            {/* ═══════════════════════════════════════════════════════ */}
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
                    <AdminEmptyState
                        icon={<BarChart3 size={48} />}
                        message="Nenhum dado de atividade disponível"
                        description="Os dados aparecerão aqui quando houver eventos registrados no período selecionado."
                    />
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* BOTTOM GRID: Top Content + Event Breakdown (Fase A)    */}
            {/* ═══════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Videos */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Video size={20} className="text-purple-500" />
                        <h3 className="font-bold text-white">Top Vídeos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
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
                        <AdminEmptyState
                            icon={<Video size={36} />}
                            message="Nenhum vídeo assistido"
                        />
                    )}
                </div>

                {/* Top Articles */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-blue-500" />
                        <h3 className="font-bold text-white">Top Artigos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
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
                        <AdminEmptyState
                            icon={<FileText size={36} />}
                            message="Nenhum artigo lido"
                        />
                    )}
                </div>

                {/* Event Breakdown - Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={20} className="text-emerald-500" />
                        <h3 className="font-bold text-white">Tipos de Evento</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    {eventBreakdown.length > 0 ? (
                        <>
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
                                        {eventBreakdown.slice(0, 5).map((_entry, index) => (
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
                            <div className="mt-2 space-y-1">
                                {eventBreakdown.slice(0, 5).map((event, index) => (
                                    <div key={event.name} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                            />
                                            <span className="text-slate-400">{event.name.replace(/_/g, ' ')}</span>
                                        </div>
                                        <span className="text-white font-bold">{event.value.toLocaleString('pt-BR')}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <AdminEmptyState
                            icon={<Activity size={36} />}
                            message="Nenhum evento registrado"
                        />
                    )}
                </div>
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FILE DOWNLOADS SECTION                                  */}
            {/* ═══════════════════════════════════════════════════════ */}
            {fileStats.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Download size={20} className="text-teal-500" />
                        <h3 className="font-bold text-white">Downloads de Arquivos</h3>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded ml-auto">
                            {periodLabel(period)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        {fileStats.filter(s => s.total_downloads > 0).slice(0, 10).map((stat, index) => (
                            <div key={stat.file_id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                                <span className="text-xs font-bold text-slate-500 w-5 text-right">
                                    #{index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{stat.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {stat.file_type.toUpperCase()} · {stat.unique_downloaders} sócio{Number(stat.unique_downloaders) !== 1 ? 's' : ''} único{Number(stat.unique_downloaders) !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-teal-400">
                                        {stat.total_downloads}
                                    </span>
                                    <p className="text-[10px] text-slate-500">downloads</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {fileStats.filter(s => s.total_downloads > 0).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-4">Nenhum download no período.</p>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════ */}
            {/* TOTAL EVENTS FOOTER (Fase A)                           */}
            {/* ═══════════════════════════════════════════════════════ */}
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
                            Últimos {periodLabel(period)}
                        </p>
                        {stats?.trendEvents !== null && stats?.trendEvents !== undefined && (
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                                stats.trendEvents > 0
                                    ? 'text-emerald-500'
                                    : stats.trendEvents < 0
                                        ? 'text-red-500'
                                        : 'text-slate-400'
                            }`}>
                                {stats.trendEvents > 0 ? (
                                    <TrendingUp size={14} />
                                ) : stats.trendEvents < 0 ? (
                                    <TrendingDown size={14} />
                                ) : (
                                    <Minus size={14} />
                                )}
                                <span className="text-xs font-bold">
                                    {Math.abs(stats.trendEvents)}% vs período anterior
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
