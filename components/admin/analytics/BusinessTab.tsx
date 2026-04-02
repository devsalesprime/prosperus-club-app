// ============================================
// BUSINESS TAB — Analytics Dashboard
// ============================================
// Funil de networking, Top ROI, Churn Risk, Academy, Events, Benefits

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
    Users, DollarSign, ArrowRight, GraduationCap, CalendarCheck,
    Crown, UserX, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { IconChat } from '../../ui/icons/CustomIcons';
import {
    analyticsService,
    NetworkingFunnel,
    TopRoiMember,
    ChurnRiskMember,
    AcademyCompletion,
    EventAttendance,
} from '../../../services/analyticsService';
import {
    AdminLoadingState,
    AdminEmptyState,
    AdminTable,
    AdminActionButton,
} from '../shared';
import { AdminBenefitKpiCards } from '../AdminBenefitKpiCards';
import { TopBenefitsTable } from '../TopBenefitsTable';
import {
    AnalyticsTabProps,
    CHART_COLORS,
    periodToDays,
    periodLabel,
    formatCurrency,
} from './analyticsUtils';

// ─── WhatsApp Helper ──────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────

export const BusinessTab: React.FC<AnalyticsTabProps> = ({ period }) => {
    const [funnel, setFunnel] = useState<NetworkingFunnel | null>(null);
    const [topRoi, setTopRoi] = useState<TopRoiMember[]>([]);
    const [churnRisk, setChurnRisk] = useState<ChurnRiskMember[]>([]);
    const [academy, setAcademy] = useState<AcademyCompletion | null>(null);
    const [attendance, setAttendance] = useState<EventAttendance | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const days = periodToDays(period);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const [funnelData, roiData, churnData, academyData, attendanceData] = await Promise.all([
                    analyticsService.getNetworkingFunnel(days),
                    analyticsService.getTopRoiMembers(days, 5),
                    analyticsService.getChurnRiskMembers(14),
                    analyticsService.getAcademyCompletionRate(days),
                    analyticsService.getEventAttendanceRate(days),
                ]);
                if (cancelled) return;
                setFunnel(funnelData);
                setTopRoi(roiData);
                setChurnRisk(churnData);
                setAcademy(academyData);
                setAttendance(attendanceData);
            } catch (error) {
                console.error('Error loading business data:', error);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [period, days]);

    if (isLoading && !funnel) {
        return <AdminLoadingState message="Carregando métricas de negócios..." />;
    }

    const funnelChartData = funnel ? [
        { name: 'Indicações', value: funnel.totalReferrals, fill: '#3b82f6' },
        { name: 'Negócios', value: funnel.totalDeals, fill: '#eab308' },
        { name: 'Auditados', value: funnel.auditedDeals, fill: '#22c55e' },
    ] : [];

    return (
        <>
            {/* BI KPIs */}
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

            {/* NETWORKING FUNNEL + TOP ROI (side-by-side) */}
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
                                    <XAxis type="number" stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="name" stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text, fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
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
                        <AdminEmptyState icon={<ArrowRight size={36} />} message="Nenhuma indicação ou negócio no período" />
                    )}
                </div>

                {/* 🏆 Top ROI Members */}
                <AdminTable title="🏆 Top Performers — ROI" subtitle={`Sócios com maior volume auditado (${periodLabel(period)})`}>
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
                                                    <img src={member.memberImage} alt={member.memberName} className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0" />
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
                                            <span className="text-slate-400">{member.dealCount}</span>
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
                        <AdminEmptyState icon={<Crown size={36} />} message="Nenhum negócio auditado no período" />
                    )}
                </AdminTable>
            </div>

            {/* ⚠️ CHURN RISK TABLE */}
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
                                                icon={IconChat}
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

            {/* BENEFIT ANALYTICS */}
            <div className="space-y-6">
                <AdminBenefitKpiCards period={days} />
                <TopBenefitsTable limit={10} />
            </div>
        </>
    );
};
