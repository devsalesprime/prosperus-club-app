import React, { useState, useEffect, useMemo } from 'react';
import { X, Users, CheckCircle, AlertTriangle, Trophy, Search, Clock, User, Download } from 'lucide-react';
import { getEventAuditStats, EventAuditStats } from '../../../services/rsvpService';
import { AdminLoadingState } from '../shared';

interface EventAuditDashboardProps {
    eventId: string;
    eventTitle: string;
    onClose: () => void;
}

export const EventAuditDashboard: React.FC<EventAuditDashboardProps> = ({ eventId, eventTitle, onClose }) => {
    const [stats, setStats] = useState<EventAuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PRESENT' | 'ABSENT'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getEventAuditStats(eventId);
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
        let list = stats.attendeesList;

        if (filter === 'PRESENT') list = list.filter(r => r.check_in_status === true);
        if (filter === 'ABSENT') list = list.filter(r => !r.check_in_status);

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(r => 
                r.profile.name?.toLowerCase().includes(term) ||
                r.profile.company?.toLowerCase().includes(term)
            );
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
        // BOM (Byte Order Mark) para garantir que o Excel reconheça UTF-8 com acentos
        const BOM = '\uFEFF';
        const header = 'Nome;Empresa;Cargo;Data Confirmação;Status;Horário Check-in\n';
        const rows = stats.attendeesList.map(r => {
            const name = r.profile?.name || 'Sem nome';
            const company = r.profile?.company || '';
            const jobTitle = r.profile?.job_title || '';
            const confirmedDate = new Date(r.confirmed_at).toLocaleDateString('pt-BR');
            const status = r.check_in_status ? 'Presente' : 'Ausente';
            const checkInTime = r.check_in_status && r.updated_at
                ? new Date(r.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                : '-';
            return `"${name}";"${company}";"${jobTitle}";"${confirmedDate}";"${status}";"${checkInTime}"`;
        }).join('\n');

        const summary = `\n\n"--- RESUMO ---"\n"Confirmados";"${stats.totalRSVPs}"\n"Presentes";"${stats.totalCheckedIn}"\n"Ausentes";"${stats.totalNoShows}"\n"High Score";"${stats.attendanceScore}%"`;

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
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-slate-900 rounded-2xl w-full max-w-5xl h-[85vh] border border-slate-700 flex items-center justify-center">
                    <AdminLoadingState message="Calculando auditoria do evento..." />
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const scoreStyle = getScoreStyle(stats.attendanceScore);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-950 rounded-2xl w-full max-w-6xl h-[90vh] border border-slate-800 flex flex-col shadow-2xl overflow-hidden">
                
                {/* ── HEADER ── */}
                <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500" size={20} />
                            Auditoria de Evento
                        </h2>
                        <p className="text-sm text-slate-400 truncate max-w-lg mt-0.5">{eventTitle}</p>
                    </div>
                    <div className="flex items-center gap-3">
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
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    
                    {/* KPI CARDS (ETAPA 2) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Card 1: Confirmados */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-start transition hover:border-slate-700">
                            <div className="flex items-center gap-2 text-slate-400 mb-2">
                                <Users size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Confirmados</span>
                            </div>
                            <span className="text-3xl font-bold text-white">{stats.totalRSVPs}</span>
                            <span className="text-xs text-slate-500 mt-1">Total de RSVPs</span>
                        </div>

                        {/* Card 2: Presentes */}
                        <div className="bg-emerald-900/10 border border-emerald-900/30 rounded-xl p-5 flex flex-col items-start transition hover:border-emerald-500/30">
                            <div className="flex items-center gap-2 text-emerald-500 mb-2">
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Presentes</span>
                            </div>
                            <span className="text-3xl font-bold text-white">{stats.totalCheckedIn}</span>
                            <span className="text-xs text-emerald-500/60 mt-1">Escaneados na porta</span>
                        </div>

                        {/* Card 3: Ausentes */}
                        <div className="bg-orange-900/10 border border-orange-900/30 rounded-xl p-5 flex flex-col items-start transition hover:border-orange-500/30">
                            <div className="flex items-center gap-2 text-orange-500 mb-2">
                                <AlertTriangle size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Ausentes</span>
                            </div>
                            <span className="text-3xl font-bold text-white">{stats.totalNoShows}</span>
                            <span className="text-xs text-orange-500/60 mt-1">Não compareceram</span>
                        </div>

                        {/* Card 4: High Score 🏆 */}
                        <div className={`rounded-xl p-5 flex flex-col items-start transition shadow-lg border ${scoreStyle.bg}`}>
                            <div className={`flex items-center gap-2 mb-2 ${scoreStyle.color}`}>
                                <Trophy size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">High Score</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-extrabold ${scoreStyle.color}`}>{stats.attendanceScore}%</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${scoreStyle.bg} ${scoreStyle.color}`}>
                                    {scoreStyle.label}
                                </span>
                            </div>
                            <span className={`text-xs mt-1 ${scoreStyle.color} opacity-70`}>Taxa de Comparecimento</span>
                        </div>
                    </div>

                    {/* ATTENDEES TABLE FILTERS (ETAPA 3) */}
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
                                        placeholder="Buscar membro ou empresa..."
                                        className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition-colors"
                                    />
                                </div>

                                {/* Segmented Control */}
                                <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setFilter('ALL')}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'ALL' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Todos
                                    </button>
                                    <button 
                                        onClick={() => setFilter('PRESENT')}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'PRESENT' ? 'bg-emerald-600/20 text-emerald-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Presentes
                                    </button>
                                    <button 
                                        onClick={() => setFilter('ABSENT')}
                                        className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === 'ABSENT' ? 'bg-orange-600/20 text-orange-400 shadow' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        Ausentes
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* LISTING */}
                        {filteredAttendees.length === 0 ? (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                <Users size={32} className="text-slate-600 mb-3" />
                                <p className="text-slate-400 text-sm">Nenhum membro encontrado com os filtros atuais.</p>
                            </div>
                        ) : (
                            <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Membro</th>
                                                <th className="px-6 py-4">Empresa / Cargo</th>
                                                <th className="px-6 py-4">Status de Presença</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/50">
                                            {filteredAttendees.map(rsvp => (
                                                <tr key={rsvp.id} className="hover:bg-slate-800/30 transition-colors">
                                                    
                                                    {/* Member Info */}
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700">
                                                                {rsvp.profile?.image_url ? (
                                                                    <img src={rsvp.profile.image_url} alt={rsvp.profile.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User size={16} className="text-slate-500" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-white">{rsvp.profile?.name || 'Sem nome'}</p>
                                                                <p className="text-xs text-slate-500">
                                                                    Confirmou em: {new Date(rsvp.confirmed_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Company */}
                                                    <td className="px-6 py-4">
                                                        <p className="text-slate-300 font-medium">{rsvp.profile?.company || '-'}</p>
                                                        <p className="text-xs text-slate-500">{rsvp.profile?.job_title || '-'}</p>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-6 py-4">
                                                        {rsvp.check_in_status ? (
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold leading-none">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                Entrou às {rsvp.updated_at ? new Date(rsvp.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '---'}
                                                            </div>
                                                        ) : (
                                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-400 border border-slate-700 rounded-full text-xs font-bold leading-none">
                                                                <Clock size={12} />
                                                                Pendente
                                                            </div>
                                                        )}
                                                    </td>

                                                </tr>
                                            ))}
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
