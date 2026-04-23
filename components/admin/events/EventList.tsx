// ============================================
// EVENT LIST - Sub-component (Extracted)
// ============================================
// Tabela de eventos + painel RSVP expansível inline
// Refatorado: delete sem confirm → AdminConfirmDialog, AdminTable, AdminActionButton, toast

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
    Edit,
    Trash2,
    Users,
    User,
    UserCheck,
    UserX,
    Download,
    Loader2,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    CalendarDays,
} from 'lucide-react';
import { ClubEvent, EventCategory } from '../../../types';
import { eventService } from '../../../services/eventService';
import {
    AdminTable,
    AdminActionButton,
    AdminConfirmDialog,
    AdminEmptyState,
} from '../shared';
import { EventAuditDashboard } from './EventAuditDashboard';

// Category badge sub-component (inlined to avoid .ts/.tsx extension conflict)
const CategoryBadge = ({ category }: { category: EventCategory }) => {
    const config = {
        ONLINE: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', label: 'Online' },
        PRESENTIAL: { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/30', label: 'Presencial' },
        RECORDED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Gravado (Legacy)' }
    };
    const style = config[category] || config.ONLINE;
    return (
        <span className={`px-2 py-1 ${style.bg} ${style.text} border ${style.border} text-xs font-bold uppercase tracking-wider inline-block`}>
            {style.label}
        </span>
    );
};

interface EventListProps {
    events: ClubEvent[];
    onEdit: (event: ClubEvent) => void;
    onRefresh: () => Promise<void>;
}

export const EventList: React.FC<EventListProps> = ({ events, onEdit, onRefresh }) => {
    // --- CONFIRM DIALOG STATE ---
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        title: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, title: '', isLoading: false });

    // --- AUDIT DASHBOARD STATE ---
    const [auditEvent, setAuditEvent] = useState<{ id: string; title: string } | null>(null);

    // --- RSVP MANAGEMENT STATE ---
    const [expandedRsvpEventId, setExpandedRsvpEventId] = useState<string | null>(null);
    interface RsvpItem {
        id: string;
        status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
        created_at: string;
        user_id: string;
        profiles?: {
            id: string;
            name: string | null;
            company: string | null;
            job_title: string | null;
            image_url: string | null;
            email: string;
        } | null;
    }
    const [rsvpList, setRsvpList] = useState<RsvpItem[]>([]);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpFilter, setRsvpFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');

    // ─── Filter & Pagination state ───────────────────────────────────────
    const [evtSearch, setEvtSearch] = useState('');
    const [evtCatFilter, setEvtCatFilter] = useState<'ALL' | 'ONLINE' | 'PRESENTIAL'>('ALL');
    const [evtAudienceFilter, setEvtAudienceFilter] = useState<'ALL' | 'MEMBER' | 'TEAM' | 'PRIVATE'>('ALL');
    const [evtSortOrder, setEvtSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [evtPage, setEvtPage] = useState(1);
    const [evtPageSize, setEvtPageSize] = useState(10);

    // Reset page on filter change
    useEffect(() => { setEvtPage(1); }, [evtSearch, evtCatFilter, evtAudienceFilter, evtSortOrder, evtPageSize]);

    // ============================================
    // DELETE EVENT
    // ============================================

    const requestDelete = (event: ClubEvent) => {
        setConfirmState({
            isOpen: true,
            id: event.id,
            title: event.title,
            isLoading: false,
        });
    };

    const executeDelete = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            await eventService.deleteEvent(confirmState.id);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            // If the RSVP panel was open for this event, close it
            if (expandedRsvpEventId === confirmState.id) {
                setExpandedRsvpEventId(null);
                setRsvpList([]);
            }
            await onRefresh();
            toast.success('Evento excluído com sucesso!');
        } catch (err: unknown) {
            console.error('Error deleting event:', err);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao excluir evento: ' + ((err as Error)?.message || 'Erro desconhecido'));
        }
    };

    // ============================================
    // RSVP MANAGEMENT
    // ============================================

    const fetchRsvps = async (eventId: string) => {
        setRsvpLoading(true);
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { data, error } = await supabase
                .from('event_rsvps')
                .select('id, status, created_at, user_id, profiles:user_id(id, name, company, job_title, image_url, email)')
                .eq('event_id', eventId)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setRsvpList(data || []);
        } catch (err) {
            console.error('Error fetching RSVPs:', err);
            setRsvpList([]);
        } finally {
            setRsvpLoading(false);
        }
    };

    const toggleRsvpPanel = (eventId: string) => {
        if (expandedRsvpEventId === eventId) {
            setExpandedRsvpEventId(null);
            setRsvpList([]);
        } else {
            setExpandedRsvpEventId(eventId);
            setRsvpFilter('ALL');
            fetchRsvps(eventId);
        }
    };

    const updateRsvpStatus = async (rsvpId: string, newStatus: 'CONFIRMED' | 'REJECTED') => {
        try {
            const { supabase } = await import('../../../lib/supabase');
            const { error } = await supabase
                .from('event_rsvps')
                .update({ status: newStatus })
                .eq('id', rsvpId);
            if (error) throw error;
            setRsvpList(prev => prev.map(r => r.id === rsvpId ? { ...r, status: newStatus } : r));
            toast.success(newStatus === 'CONFIRMED' ? 'Presença confirmada!' : 'Inscrição recusada.');
        } catch (err) {
            console.error('Error updating RSVP:', err);
            toast.error('Erro ao atualizar status da inscrição.');
        }
    };

    const exportRsvpCsv = () => {
        const confirmed = rsvpList.filter(r => r.status === 'CONFIRMED');
        const csvLines = ['Nome,Email,Empresa,Cargo'];
        confirmed.forEach(r => {
            const p = r.profiles;
            csvLines.push(`"${p?.name || ''}","${p?.email || ''}","${p?.company || ''}","${p?.job_title || ''}"`);
        });
        const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `presenca_evento_${expandedRsvpEventId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`CSV exportado com ${confirmed.length} confirmado(s)!`);
    };

    const filteredRsvps = rsvpList.filter(r => {
        if (rsvpFilter === 'PENDING') return r.status === 'PENDING';
        if (rsvpFilter === 'CONFIRMED') return r.status === 'CONFIRMED';
        return true;
    });

    const rsvpCounts = {
        total: rsvpList.length,
        confirmed: rsvpList.filter(r => r.status === 'CONFIRMED').length,
        pending: rsvpList.filter(r => r.status === 'PENDING').length,
    };

    // ============================================
    // HELPERS
    // ============================================

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ============================================
    // RENDER
    // ============================================

    // ─── Filtered + paginated events ─────────────────────────────────────
    const filteredEvents = (() => {
        const term = evtSearch.toLowerCase().trim();
        let result = events.filter(ev => {
            const matchesSearch = !term || ev.title.toLowerCase().includes(term);
            const matchesCat = evtCatFilter === 'ALL' || ev.category === evtCatFilter;
            const matchesAudience = evtAudienceFilter === 'ALL' || ev.type === evtAudienceFilter;
            return matchesSearch && matchesCat && matchesAudience;
        });
        result.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return evtSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        return result;
    })();
    const evtTotalPages = Math.max(1, Math.ceil(filteredEvents.length / evtPageSize));
    const paginatedEvents = filteredEvents.slice((evtPage - 1) * evtPageSize, evtPage * evtPageSize);
    const isFiltered = evtSearch || evtCatFilter !== 'ALL' || evtAudienceFilter !== 'ALL';

    if (events.length === 0) {
        return (
            <AdminEmptyState
                icon={<Users size={48} />}
                message="Nenhum evento cadastrado"
                description="Crie seu primeiro evento para começar."
            />
        );
    }

    return (
        <div className="space-y-6 min-w-0 w-full">
            {/* ─── Filter Bar ──────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={evtSearch}
                        onChange={e => setEvtSearch(e.target.value)}
                        placeholder="Buscar por título..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 transition"
                    />
                    {evtSearch && (
                        <button onClick={() => setEvtSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition">
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={evtCatFilter}
                    onChange={e => setEvtCatFilter(e.target.value as 'ALL' | 'ONLINE' | 'PRESENTIAL')}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[130px]"
                >
                    <option value="ALL">Todas categorias</option>
                    <option value="PRESENTIAL">📍 Presencial</option>
                    <option value="ONLINE">🖥️ Online</option>
                </select>
                <select
                    value={evtAudienceFilter}
                    onChange={e => setEvtAudienceFilter(e.target.value as 'ALL' | 'MEMBER' | 'TEAM' | 'PRIVATE')}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[130px]"
                >
                    <option value="ALL">Todo público</option>
                    <option value="MEMBER">Sócios</option>
                    <option value="TEAM">Time</option>
                    <option value="PRIVATE">🔒 Privado</option>
                </select>
                <select
                    value={evtSortOrder}
                    onChange={e => setEvtSortOrder(e.target.value as 'newest' | 'oldest')}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[130px]"
                >
                    <option value="newest">Mais recentes</option>
                    <option value="oldest">Mais antigos</option>
                </select>
                {isFiltered && (
                    <button
                        onClick={() => { setEvtSearch(''); setEvtCatFilter('ALL'); setEvtAudienceFilter('ALL'); }}
                        className="text-xs text-yellow-500 hover:text-yellow-400 whitespace-nowrap self-center"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {isFiltered && (
                <p className="text-xs text-slate-500">{filteredEvents.length} de {events.length} eventos</p>
            )}
            <div className="hidden md:block w-full overflow-x-auto">
                <AdminTable>
                <table className="w-full">
                    <thead className="bg-slate-800/50 border-b border-slate-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Título</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Público</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Categoria</th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {paginatedEvents.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                    Nenhum evento encontrado com esses filtros.
                                </td>
                            </tr>
                        ) : paginatedEvents.map((event) => (
                            <React.Fragment key={event.id}>
                                <tr className="hover:bg-slate-800/30 transition-colors">
                                    <td className="px-4 py-3 text-sm font-medium text-white">{event.title}</td>
                                    <td className="px-4 py-3 text-sm text-slate-300">{formatDate(event.date)}</td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        <span className={`px-2 py-0.5 text-xs font-bold ${event.type === 'MEMBER' ? 'bg-blue-500/10 text-blue-400' :
                                            event.type === 'PRIVATE' ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-purple-500/10 text-purple-400'
                                            }`}>
                                            {event.type === 'MEMBER' ? 'Sócios' : event.type === 'PRIVATE' ? `🔒 ${event.targetMemberName || 'Privado'}` : 'Time'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <CategoryBadge category={event.category} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <AdminActionButton
                                                icon={BarChart3}
                                                onClick={() => setAuditEvent({ id: event.id, title: event.title })}
                                                variant="ghost"
                                                title="Auditoria"
                                            />
                                            <AdminActionButton
                                                icon={Users}
                                                onClick={() => toggleRsvpPanel(event.id)}
                                                variant={expandedRsvpEventId === event.id ? 'primary' : 'ghost'}
                                                title="Lista de Presença"
                                            />
                                            <AdminActionButton
                                                icon={Edit}
                                                onClick={() => onEdit(event)}
                                                variant="ghost"
                                                title="Editar"
                                            />
                                            <AdminActionButton
                                                icon={Trash2}
                                                onClick={() => requestDelete(event)}
                                                variant="danger"
                                                title="Excluir"
                                            />
                                        </div>
                                    </td>
                                </tr>

                                {/* RSVP Expandable Panel */}
                                {expandedRsvpEventId === event.id && (
                                    <tr>
                                        <td colSpan={5} className="p-0">
                                            <div className="bg-slate-800/40 border-t border-b border-slate-700 p-4 space-y-4">
                                                {/* Header: Counters + Export */}
                                                <div className="flex items-center justify-between flex-wrap gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                            <Users size={16} className="text-yellow-500" />
                                                            Lista de Presença
                                                        </h4>
                                                        <span className="px-2 py-0.5 bg-slate-700 text-xs text-slate-300 rounded-full">{rsvpCounts.total} total</span>
                                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-xs text-emerald-400 rounded-full">{rsvpCounts.confirmed} confirmados</span>
                                                        <span className="px-2 py-0.5 bg-amber-500/10 text-xs text-amber-400 rounded-full">{rsvpCounts.pending} pendentes</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {/* Filters */}
                                                        {(['ALL', 'PENDING', 'CONFIRMED'] as const).map(f => (
                                                            <button
                                                                key={f}
                                                                onClick={() => setRsvpFilter(f)}
                                                                className={`px-3 py-1 text-xs font-semibold rounded transition ${rsvpFilter === f
                                                                    ? 'bg-yellow-600 text-white'
                                                                    : 'bg-slate-700 text-slate-400 hover:text-white'
                                                                    }`}
                                                                style={{ minHeight: 'auto', minWidth: 'auto' }}
                                                            >
                                                                {f === 'ALL' ? 'Todos' : f === 'PENDING' ? 'Pendentes' : 'Confirmados'}
                                                            </button>
                                                        ))}
                                                        {/* CSV Export */}
                                                        {rsvpCounts.confirmed > 0 && (
                                                            <button
                                                                onClick={exportRsvpCsv}
                                                                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                                                                style={{ minHeight: 'auto', minWidth: 'auto' }}
                                                            >
                                                                <Download size={12} /> CSV
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* RSVP List */}
                                                {rsvpLoading ? (
                                                    <div className="flex items-center justify-center py-6">
                                                        <Loader2 size={20} className="animate-spin text-yellow-500" />
                                                    </div>
                                                ) : filteredRsvps.length === 0 ? (
                                                    <div className="text-center py-6 text-slate-500 text-sm">
                                                        {rsvpList.length === 0 ? 'Nenhuma solicitação de presença ainda.' : 'Nenhum resultado para este filtro.'}
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 max-h-72 overflow-y-auto">
                                                        {filteredRsvps.map(rsvp => {
                                                            const profile = rsvp.profiles;
                                                            return (
                                                                <div key={rsvp.id} className="flex items-center gap-3 bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
                                                                    {/* Avatar */}
                                                                    <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden shrink-0">
                                                                        {profile?.image_url ? (
                                                                            <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                                                <User size={16} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* Info */}
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="text-sm font-medium text-white truncate">{profile?.name || 'Sem nome'}</p>
                                                                        <p className="text-xs text-slate-400 truncate">
                                                                            {profile?.job_title && profile?.company
                                                                                ? `${profile.job_title} · ${profile.company}`
                                                                                : profile?.company || profile?.job_title || ''}
                                                                        </p>
                                                                    </div>
                                                                    {/* Date */}
                                                                    <span className="text-xs text-slate-500 shrink-0">
                                                                        {new Date(rsvp.created_at).toLocaleDateString('pt-BR')}
                                                                    </span>
                                                                    {/* Status Badge / Actions */}
                                                                    {rsvp.status === 'PENDING' ? (
                                                                        <div className="flex items-center gap-1 shrink-0">
                                                                            <button
                                                                                onClick={() => updateRsvpStatus(rsvp.id, 'CONFIRMED')}
                                                                                className="p-1.5 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition"
                                                                                title="Aprovar"
                                                                                style={{ minHeight: 'auto', minWidth: 'auto' }}
                                                                            >
                                                                                <UserCheck size={14} />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => updateRsvpStatus(rsvp.id, 'REJECTED')}
                                                                                className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
                                                                                title="Recusar"
                                                                                style={{ minHeight: 'auto', minWidth: 'auto' }}
                                                                            >
                                                                                <UserX size={14} />
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className={`px-2 py-0.5 text-xs font-bold rounded shrink-0 ${rsvp.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                            rsvp.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                                                                                'bg-slate-600/10 text-slate-400'
                                                                            }`}>
                                                                            {rsvp.status === 'CONFIRMED' ? '✅ Confirmado' :
                                                                                rsvp.status === 'REJECTED' ? '❌ Recusado' :
                                                                                    rsvp.status}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </AdminTable>
            </div>

            {/* ─── MOBILE CARDS RENDER (Table-to-Card Pattern) ──────────────── */}
            <div className="grid grid-cols-1 gap-4 md:hidden w-full mt-4">
                {paginatedEvents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">Nenhum evento encontrado.</div>
                ) : paginatedEvents.map((event) => (
                    <div key={event.id} className="bg-prosperus-box border border-prosperus-stroke rounded-xl p-5 flex flex-col gap-3 relative shadow-sm">
                        {/* BLOCO SUPERIOR */}
                        <div>
                            <h3 className="text-base font-bold text-prosperus-white break-words line-clamp-2 leading-tight">
                                {event.title}
                            </h3>
                            <span className="flex items-center gap-1.5 text-sm text-prosperus-muted-text mt-1">
                                <CalendarDays size={14} />
                                {formatDate(event.date)}
                            </span>
                        </div>

                        {/* BLOCO DO MEIO */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-3 border-t border-prosperus-stroke/30">
                            <span className="bg-prosperus-navy border border-prosperus-stroke text-xs text-prosperus-muted-text px-2.5 py-1 rounded-md font-bold uppercase tracking-wider">
                                {event.type === 'MEMBER' ? 'Sócios' : event.type === 'PRIVATE' ? `🔒 Privado` : 'Time'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border bg-opacity-10 ${
                                event.category === 'PRESENTIAL' 
                                    ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' 
                                    : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                            }`}>
                                {event.category === 'PRESENTIAL' ? 'Presencial' : 'Online'}
                            </span>
                        </div>

                        {/* BLOCO BASE */}
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-semibold text-prosperus-muted-text flex items-center gap-1.5">
                                <Users size={14} />
                                {event.sessions?.length ? `${event.sessions.length} sessões` : '1 sessão'}
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={() => setAuditEvent({ id: event.id, title: event.title })}
                                    className="w-10 h-10 rounded-lg bg-prosperus-navy border border-prosperus-stroke flex items-center justify-center hover:bg-prosperus-muted-bg transition-colors active:scale-95 text-prosperus-gold-dark"
                                    title="Auditoria"
                                >
                                    <BarChart3 size={18} />
                                </button>
                                <button
                                    onClick={() => toggleRsvpPanel(event.id)}
                                    className={`w-10 h-10 rounded-lg bg-prosperus-navy border border-prosperus-stroke flex items-center justify-center transition-colors active:scale-95 ${
                                        expandedRsvpEventId === event.id ? 'bg-prosperus-muted-bg border-prosperus-gold-dark text-prosperus-gold-dark' : 'text-prosperus-grey hover:bg-prosperus-muted-bg'
                                    }`}
                                    title="Lista de Presença"
                                >
                                    <Users size={18} />
                                </button>
                                <button
                                    onClick={() => onEdit(event)}
                                    className="w-10 h-10 rounded-lg bg-prosperus-navy border border-prosperus-stroke flex items-center justify-center hover:bg-prosperus-muted-bg transition-colors active:scale-95 text-blue-400"
                                    title="Editar"
                                >
                                    <Edit size={18} />
                                </button>
                                <button
                                    onClick={() => requestDelete(event)}
                                    className="w-10 h-10 rounded-lg bg-prosperus-navy border border-prosperus-stroke flex items-center justify-center hover:bg-prosperus-muted-bg transition-colors active:scale-95 text-red-500"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* MÓDULO EXPANSSÍVEL RSVP (No Card Local) */}
                        {expandedRsvpEventId === event.id && (
                            <div className="mt-3 pt-3 border-t border-prosperus-stroke/30">
                                <div className="text-xs text-prosperus-gold-dark pb-2 flex items-center justify-between">
                                    <span className="font-bold flex items-center gap-1"><Users size={12}/> Confirmados: {rsvpCounts.confirmed}</span>
                                </div>
                                <div className="text-xs text-prosperus-muted-text italic">
                                    Acesse a gestão completa deste evento no computador para vizualisar inscrições detalhadas ou gere o CSV.
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Pagination ─────────────────────────────────────────────── */}
            {filteredEvents.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Mostrar</span>
                        <select
                            value={evtPageSize}
                            onChange={e => setEvtPageSize(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-yellow-600/50 transition"
                        >
                            {[10, 20, 30].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-xs text-slate-500">por página</span>
                    </div>
                    {evtTotalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setEvtPage(p => Math.max(1, p - 1))}
                                disabled={evtPage === 1}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-slate-400 px-3">{evtPage} / {evtTotalPages}</span>
                            <button
                                onClick={() => setEvtPage(p => Math.min(evtTotalPages, p + 1))}
                                disabled={evtPage === evtTotalPages}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* CONFIRM DIALOG */}
            {/* ============================================ */}
            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDelete}
                title="Excluir Evento"
                message={`Excluir "${confirmState.title}"? Todas as inscrições (RSVPs) associadas também serão removidas. Esta ação não pode ser desfeita.`}
                confirmText="Excluir Evento"
                isDestructive
                isLoading={confirmState.isLoading}
            />

            {/* AUDIT DASHBOARD MODAL */}
            {auditEvent && (
                <EventAuditDashboard
                    eventId={auditEvent.id}
                    eventTitle={auditEvent.title}
                    onClose={() => setAuditEvent(null)}
                />
            )}
        </div>
    );
};

export default EventList;
