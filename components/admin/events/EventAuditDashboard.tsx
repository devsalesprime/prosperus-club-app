import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, CheckCircle, AlertTriangle, Trophy, Search, Clock, User, Download, Users2, CalendarDays } from 'lucide-react';
import { getEventAuditStatsV2, EventAuditStatsV2, TicketWithProfile } from '../../../services/ticketService';
import { AdminLoadingState } from '../shared';

interface EventAuditDashboardProps {
    eventId: string;
    eventTitle: string;
    onClose: () => void;
}

export const EventAuditDashboard: React.FC<EventAuditDashboardProps> = ({ eventId, eventTitle, onClose }) => {
    const [stats, setStats] = useState<EventAuditStatsV2 | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT' | 'MEMBER' | 'GUEST'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getEventAuditStatsV2(eventId);
                setStats(data);
            } catch (error) {
                console.error('Failed to load audit stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [eventId]);

    const filteredAttendees = useMemo(() => {
        if (!stats) return [];
        let list = stats.ticketsList;

        if (filter === 'PRESENT') list = list.filter(t => t.check_in_status === true);
        if (filter === 'ABSENT') list = list.filter(t => !t.check_in_status);
        if (filter === 'MEMBER') list = list.filter(t => t.owner_type === 'MEMBER');
        if (filter === 'GUEST') list = list.filter(t => t.owner_type === 'GUEST');

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(t => {
                const profile = (t.rsvp as any)?.profile;
                return (
                    t.owner_name?.toLowerCase().includes(term) ||
                    profile?.name?.toLowerCase().includes(term) ||
                    profile?.company?.toLowerCase().includes(term)
                );
            });
        }
        
        return list;
    }, [stats, filter, searchTerm]);

    const getScoreStyle = (score: number) => {
        if (score >= 80) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'Excelente' };
        if (score >= 50) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Médio' };
        return { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Baixo' };
    };

    const handleExportCsv = () => {
        if (!stats) return;
        const BOM = '\uFEFF';
        const header = 'Nome;Tipo;Empresa;Cargo;Data Ingresso;Status;Horário Check-in\n';
        const rows = stats.ticketsList.map(t => {
            const profile = (t.rsvp as any)?.profile;
            const name = t.owner_name || profile?.name || 'Sem nome';
            const type = t.owner_type === 'GUEST' ? 'Convidado' : 'Sócio';
            const company = profile?.company || '';
            const jobTitle = profile?.job_title || '';
            const ticketDate = t.event_date
                ? new Date(t.event_date + 'T12:00:00').toLocaleDateString('pt-BR')
                : '-';
            const status = t.check_in_status ? 'Presente' : 'Ausente';
            const checkInTime = t.check_in_status && t.updated_at
                ? new Date(t.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '-';
            return `"${name}";"${type}";"${company}";"${jobTitle}";"${ticketDate}";"${status}";"${checkInTime}"`;
        }).join('\n');

        const summary = `\n\n"--- RESUMO ---"\n"Total Ingressos";"${stats.totalTickets}"\n"Sócios";"${stats.memberTickets}"\n"Convidados";"${stats.guestTickets}"\n"Presentes";"${stats.totalCheckedIn}"\n"Pendentes";"${stats.totalPending}"\n"High Score";"${stats.attendanceScore}%"`;

        const blob = new Blob([BOM + header + rows + summary], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 16px) 16px calc(env(safe-area-inset-bottom, 0px) + 16px) 16px' }}
            >
                <div className="bg-slate-900 rounded-2xl w-full max-w-5xl max-h-full border border-slate-700 flex items-center justify-center min-h-[300px]">
                    <AdminLoadingState message="Calculando auditoria do evento..." />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const scoreStyle = getScoreStyle(stats.attendanceScore);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px) 8px' }}
        >
            <div className="audit-modal-container bg-slate-950 rounded-2xl w-full max-w-6xl max-h-full border border-slate-800 flex flex-col shadow-2xl overflow-hidden min-w-0">
                <style>{`
                    .audit-modal-container * {
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                    }
                `}</style>
                
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900 flex-shrink-0 min-w-0">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={20} />
                            Auditoria de Evento
                        </h2>
                        <p className="text-sm text-slate-400 truncate max-w-lg mt-0.5">{eventTitle}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleExportCsv}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition shadow-lg shadow-emerald-900/20 active:scale-95"
                        >
                            <Download size={16} />
                            Exportar CSV
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                
                {/* ── BODY ── */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 min-w-0 w-full">
                    
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {/* Total Ingressos */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-start transition hover:border-slate-700">
                            <div className="flex items-center gap-1.5 text-slate-400 mb-1.5">
                                <Users size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Ingressos</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.totalTickets}</span>
                        </div>

                        {/* Sócios */}
                        <div className="bg-blue-900/10 border border-blue-900/30 rounded-xl p-4 flex flex-col items-start transition hover:border-blue-500/30">
                            <div className="flex items-center gap-1.5 text-blue-400 mb-1.5">
                                <User size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Sócios</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.memberTickets}</span>
                        </div>

                        {/* Convidados */}
                        <div className="bg-purple-900/10 border border-purple-900/30 rounded-xl p-4 flex flex-col items-start transition hover:border-purple-500/30">
                            <div className="flex items-center gap-1.5 text-purple-400 mb-1.5">
                                <Users2 size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Convidados</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.guestTickets}</span>
                        </div>

                        {/* Presentes */}
                        <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-4 flex flex-col items-start transition hover:border-emerald-500/30">
                            <div className="flex items-center gap-1.5 text-emerald-500 mb-1.5">
                                <CheckCircle size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Presentes</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.totalCheckedIn}</span>
                        </div>

                        {/* Ausentes */}
                        <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-4 flex flex-col items-start transition hover:border-orange-500/30">
                            <div className="flex items-center gap-1.5 text-orange-500 mb-1.5">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Pendentes</span>
                            </div>
                            <span className="text-2xl font-bold text-white">{stats.totalPending}</span>
                        </div>

                        {/* High Score 🏆 */}
                        <div className={`rounded-xl p-4 flex flex-col items-start transition shadow-lg border ${scoreStyle.bg}`}>
                            <div className={`flex items-center gap-1.5 mb-1.5 ${scoreStyle.color}`}>
                                <Trophy size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">High Score</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className={`text-2xl font-extrabold ${scoreStyle.color}`}>{stats.attendanceScore}%</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${scoreStyle.bg} ${scoreStyle.color}`}>
                                    {scoreStyle.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FILTERS */}
                    <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Lista Analítica
                                <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                                    {filteredAttendees.length} registros
                                </span>
                            </h3>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                {/* Search */}
                                <div className="relative w-full sm:w-auto">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        placeholder="Buscar nome ou empresa..."
                                        className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition-colors"
                                    />
                                </div>

                                {/* Segmented Control — with MEMBER/GUEST filters */}
                                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 w-full sm:w-auto flex-wrap">
                                    {(['ALL', 'PRESENT', 'ABSENT', 'MEMBER', 'GUEST'] as const).map(f => {
                                        const labels: Record<string, string> = { ALL: 'Todos', PRESENT: 'Presentes', ABSENT: 'Pendentes', MEMBER: 'Sócios', GUEST: 'Convidados' };
                                        const activeStyles: Record<string, string> = {
                                            ALL: 'bg-slate-700 text-white shadow',
                                            PRESENT: 'bg-emerald-600/20 text-emerald-400 shadow',
                                            ABSENT: 'bg-orange-600/20 text-orange-400 shadow',
                                            MEMBER: 'bg-blue-600/20 text-blue-400 shadow',
                                            GUEST: 'bg-purple-600/20 text-purple-400 shadow',
                                        };
                                        return (
                                            <button
                                                key={f}
                                                onClick={() => setFilter(f)}
                                                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? activeStyles[f] : 'text-slate-400 hover:text-slate-200'}`}
                                            >
                                                {labels[f]}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* TABLE */}
                        {filteredAttendees.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                <Users size={32} className="text-slate-600 mb-3" />
                                <p className="text-slate-400 text-sm">Nenhum registro encontrado com os filtros atuais.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Nome</th>
                                                <th className="px-6 py-4">Tipo</th>
                                                <th className="px-6 py-4">Data Ingresso</th>
                                                <th className="px-6 py-4">Empresa / Cargo</th>
                                                <th className="px-6 py-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {filteredAttendees.map(ticket => {
                                                const profile = (ticket.rsvp as any)?.profile;
                                                return (
                                                    <tr key={ticket.id} className="hover:bg-slate-800/30 transition-colors">
                                                        
                                                        {/* Name */}
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700">
                                                                    {profile?.image_url ? (
                                                                        <img src={profile.image_url} alt={ticket.owner_name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <User size={16} className="text-slate-500" />
                                                                    )}
                                                                </div>
                                                                <p className="font-bold text-white">{ticket.owner_name || profile?.name || 'Sem nome'}</p>
                                                            </div>
                                                        </td>

                                                        {/* Type Badge */}
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                                ticket.owner_type === 'GUEST'
                                                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                            }`}>
                                                                {ticket.owner_type === 'GUEST' ? (
                                                                    <><Users2 size={11} /> Convidado</>
                                                                ) : (
                                                                    <><User size={11} /> Sócio</>
                                                                )}
                                                            </span>
                                                        </td>

                                                        {/* Ticket Date */}
                                                        <td className="px-6 py-4">
                                                            {ticket.event_date && (
                                                                <span className="inline-flex items-center gap-1 text-slate-300 text-xs">
                                                                    <CalendarDays size={12} className="text-slate-500" />
                                                                    {new Date(ticket.event_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Company */}
                                                        <td className="px-6 py-4">
                                                            <p className="text-slate-300 font-medium">{profile?.company || '-'}</p>
                                                            <p className="text-xs text-slate-500">{profile?.job_title || '-'}</p>
                                                        </td>

                                                        {/* Status Badge */}
                                                        <td className="px-6 py-4">
                                                            {ticket.check_in_status ? (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold leading-none">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Entrou às {ticket.updated_at ? new Date(ticket.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                                </div>
                                                            ) : (
                                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold leading-none">
                                                                    <Clock size={12} />
                                                                    Pendente
                                                                </div>
                                                            )}
                                                        </td>

                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventAuditDashboard;
