// ============================================
// MEMBERS MODULE - Admin Component (Refactored v2)
// ============================================
// Gerenciamento de membros com dados reais do Supabase
// v2: Todas as queries extraídas para adminMemberService (MVC)

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2, PlaySquare, RefreshCw, Search, X, Download, ChevronLeft, ChevronRight, Clock, Activity, CalendarDays, BarChart3, Filter } from 'lucide-react';
import { UserActivityDetail } from './UserActivityDetail';
import { adminMemberService, MemberRow } from '../../services/adminMemberService';
import {
    AdminPageHeader,
    AdminModal,
    AdminLoadingState,
    AdminTable,
    AdminActionButton,
    AdminConfirmDialog,
} from './shared';

export const MembersModule: React.FC = () => {
    const [members, setMembers] = useState<MemberRow[]>([]);
    const [totalMembers, setTotalMembers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'CEO' | 'MANAGER' | 'ACCOUNT_MANAGER' | 'TEAM' | 'MEMBER'>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastActivityMap, setLastActivityMap] = useState<Record<string, string>>({});
    const [pageSize, setPageSize] = useState(20);

    // ─── Advanced Filters ─────────────────────────────────────
    const [lastAccessFilter, setLastAccessFilter] = useState<'ALL' | 'TODAY' | '7D' | '30D' | '60D' | '90D_PLUS'>('ALL');
    const [activeDaysFilter, setActiveDaysFilter] = useState<'ALL' | '1_PLUS' | '5_PLUS' | '10_PLUS' | '20_PLUS'>('ALL');
    const [activeDaysMap, setActiveDaysMap] = useState<Record<string, number>>({});
    const [eventFilter, setEventFilter] = useState<string>('ALL');
    const [eventsList, setEventsList] = useState<{ id: string; title: string; date: string }[]>([]);
    const [eventAttendees, setEventAttendees] = useState<Set<string>>(new Set());

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<MemberRow | null>(null);
    const [editFormData, setEditFormData] = useState({ pitch_video_url: '', role: '' });
    const [saving, setSaving] = useState(false);
    const [videoUrlStatus, setVideoUrlStatus] = useState<{ type: 'youtube' | 'vimeo' | 'drive' | 'loom' | 'invalid' | null; message: string }>({ type: null, message: '' });

    // Confirm Dialog state
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        id: string | null;
        memberName: string;
        isLoading: boolean;
    }>({ isOpen: false, id: null, memberName: '', isLoading: false });

    // Activity Detail state
    const [activityMember, setActivityMember] = useState<MemberRow | null>(null);

    // ============================================
    // DATA LOADING — via adminMemberService
    // ============================================

    const loadMembers = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await adminMemberService.getMembers(currentPage, pageSize);
            setMembers(result.data);
            setTotalMembers(result.total);
        } catch (err: any) {
            if (err?.message?.includes('AbortError') || err?.code === 'ABORT_ERR') return;
            console.error('Error loading members:', err);
            setError(err.message || 'Erro ao carregar membros');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadMembers(); }, [currentPage, pageSize]);

    // Load last activity + active days data
    useEffect(() => {
        if (members.length === 0) return;
        const loadActivityData = async () => {
            try {
                const [lastAct, activeDays] = await Promise.all([
                    adminMemberService.getMembersLastActivity(),
                    adminMemberService.getMembersActiveDays(),
                ]);
                setLastActivityMap(lastAct);
                setActiveDaysMap(activeDays);
            } catch (err) {
                console.error('Error loading activity data:', err);
            }
        };
        loadActivityData();
    }, [members]);

    // Load events list for filter dropdown
    useEffect(() => {
        const loadEvents = async () => {
            try {
                const events = await adminMemberService.getEvents();
                setEventsList(events.map(e => ({
                    id: e.id,
                    title: e.title,
                    date: new Date(e.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                })));
            } catch (err) {
                console.error('Error loading events:', err);
            }
        };
        loadEvents();
    }, []);

    // Load event attendees when event filter changes
    useEffect(() => {
        if (eventFilter === 'ALL') {
            setEventAttendees(new Set());
            return;
        }
        const loadAttendees = async () => {
            try {
                const attendees = await adminMemberService.getEventAttendees(eventFilter);
                setEventAttendees(attendees);
            } catch (err) {
                console.error('Error loading attendees:', err);
            }
        };
        loadAttendees();
    }, [eventFilter]);

    // Format relative time
    const formatLastSeen = (isoDate: string | undefined): { text: string; color: string } => {
        if (!isoDate) return { text: '—', color: 'text-slate-600' };
        const now = Date.now();
        const then = new Date(isoDate).getTime();
        const diffMs = now - then;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return { text: 'Hoje', color: 'text-emerald-400' };
        if (diffDays === 1) return { text: 'Ontem', color: 'text-emerald-400' };
        if (diffDays <= 7) return { text: `${diffDays}d atrás`, color: 'text-yellow-400' };
        if (diffDays <= 30) return { text: `${diffDays}d atrás`, color: 'text-orange-400' };
        return { text: `${diffDays}d atrás`, color: 'text-red-400' };
    };

    const detectVideoPlatform = (url: string) => {
        if (!url || url.trim() === '') {
            setVideoUrlStatus({ type: null, message: '' });
            return;
        }
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();
            if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                setVideoUrlStatus({ type: 'youtube', message: '✓ YouTube detectado' });
            } else if (hostname.includes('vimeo.com')) {
                setVideoUrlStatus({ type: 'vimeo', message: '✓ Vimeo detectado' });
            } else if (hostname.includes('drive.google.com')) {
                setVideoUrlStatus({ type: 'drive', message: '✓ Google Drive detectado' });
            } else if (hostname.includes('loom.com')) {
                setVideoUrlStatus({ type: 'loom', message: '✓ Loom detectado' });
            } else {
                setVideoUrlStatus({ type: 'invalid', message: '⚠ Use YouTube, Vimeo, Drive ou Loom' });
            }
        } catch {
            setVideoUrlStatus({ type: 'invalid', message: '⚠ URL inválida' });
        }
    };

    const handleEditMember = (member: MemberRow) => {
        setEditingMember(member);
        setEditFormData({ pitch_video_url: member.pitch_video_url || '', role: member.role || 'MEMBER' });
        detectVideoPlatform(member.pitch_video_url || '');
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingMember) return;
        if (editFormData.pitch_video_url && videoUrlStatus.type === 'invalid') {
            toast.error('Por favor, use uma URL válida do YouTube, Vimeo, Google Drive ou Loom.');
            return;
        }
        try {
            setSaving(true);
            await adminMemberService.updateMember(editingMember.id, {
                pitch_video_url: editFormData.pitch_video_url || null,
                role: editFormData.role || undefined,
            });
            await loadMembers();
            setIsEditModalOpen(false);
            setEditingMember(null);
            toast.success('Membro atualizado com sucesso!');
        } catch (err: any) {
            console.error('Error saving member:', err);
            toast.error('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const requestDeleteMember = (member: MemberRow) => {
        setConfirmState({
            isOpen: true,
            id: member.id,
            memberName: member.name || member.email,
            isLoading: false,
        });
    };

    const executeDeleteMember = async () => {
        if (!confirmState.id) return;
        try {
            setConfirmState(prev => ({ ...prev, isLoading: true }));
            await adminMemberService.deleteMember(confirmState.id);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            await loadMembers();
            toast.success('Membro removido com sucesso.');
        } catch (err: any) {
            console.error('Error deleting member:', err);
            setConfirmState(prev => ({ ...prev, isOpen: false, isLoading: false }));
            toast.error('Erro ao remover membro: ' + err.message);
        }
    };

    const formatRole = (role: string) => {
        switch (role) {
            case 'ADMIN': return <span className="text-red-400 font-bold">Admin</span>;
            case 'CEO': return <span className="text-purple-400 font-bold">CEO</span>;
            case 'MANAGER': return <span className="text-pink-400 font-bold">Gestora</span>;
            case 'ACCOUNT_MANAGER': return <span className="text-yellow-400 font-bold">Account Manager</span>;
            case 'TEAM': return <span className="text-blue-400 font-bold">Time</span>;
            case 'MEMBER': return <span className="text-emerald-400 font-bold">Sócio</span>;
            default: return <span className="text-slate-400">{role}</span>;
        }
    };

    // Reset page when filters change (must be before early returns)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, pageSize, lastAccessFilter, activeDaysFilter, eventFilter]);

    const hasAdvancedFilters = lastAccessFilter !== 'ALL' || activeDaysFilter !== 'ALL' || eventFilter !== 'ALL';
    const clearAdvancedFilters = () => {
        setLastAccessFilter('ALL');
        setActiveDaysFilter('ALL');
        setEventFilter('ALL');
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Sócios" subtitle="Gestão de membros do clube" />
                <AdminLoadingState message="Carregando membros do Supabase..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <AdminPageHeader title="Sócios" subtitle="Gestão de membros do clube" />
                <div className="bg-red-900/20 border border-red-900/50 p-6 rounded-xl text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button onClick={loadMembers} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition">
                        Tentar Novamente
                    </button>
                </div>
            </div>
        );
    }

    // Client-side filtering on the already-paginated results
    const term = searchTerm.toLowerCase().trim();
    const filteredMembers = members.filter(m => {
        const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;
        const matchesSearch = !term || [
            m.name, m.email, m.company, m.job_title
        ].some(f => f?.toLowerCase().includes(term));

        // Último acesso
        const matchesLastAccess = (() => {
            if (lastAccessFilter === 'ALL') return true;
            const lastSeen = lastActivityMap[m.id];
            if (!lastSeen) return lastAccessFilter === '90D_PLUS';
            const diffDays = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 86400000);
            switch (lastAccessFilter) {
                case 'TODAY': return diffDays === 0;
                case '7D': return diffDays <= 7;
                case '30D': return diffDays <= 30;
                case '60D': return diffDays <= 60;
                case '90D_PLUS': return diffDays > 90;
                default: return true;
            }
        })();

        // Dias ativo
        const matchesActiveDays = (() => {
            if (activeDaysFilter === 'ALL') return true;
            const days = activeDaysMap[m.id] || 0;
            switch (activeDaysFilter) {
                case '1_PLUS': return days >= 1;
                case '5_PLUS': return days >= 5;
                case '10_PLUS': return days >= 10;
                case '20_PLUS': return days >= 20;
                default: return true;
            }
        })();

        // Evento
        const matchesEvent = eventFilter === 'ALL' || eventAttendees.has(m.id);

        return matchesRole && matchesSearch && matchesLastAccess && matchesActiveDays && matchesEvent;
    });

    // ─── CSV Export ────────────────────────────────────────
    const exportToCsv = () => {
        const headers = ['Nome', 'Email', 'Empresa', 'Cargo', 'Perfil', 'Cadastro'];
        const rows = filteredMembers.map(m => [
            m.name || '',
            m.email || '',
            m.company || '',
            m.job_title || '',
            m.role || '',
            m.created_at ? new Date(m.created_at).toLocaleDateString('pt-BR') : ''
        ]);
        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `socios_prosperus_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(`${filteredMembers.length} membros exportados!`);
    };

    // Server-side pagination — totalPages based on server count
    const totalPages = Math.max(1, Math.ceil(totalMembers / pageSize));

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Sócios"
                subtitle={`${totalMembers} usuários no total`}
                action={
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToCsv}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                            title="Exportar CSV"
                        >
                            <Download size={16} />
                            CSV
                        </button>
                        <button
                            onClick={loadMembers}
                            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition"
                        >
                            <RefreshCw size={16} />
                            Atualizar
                        </button>
                    </div>
                }
            />

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar por nome, email ou empresa..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-yellow-600/50 focus:ring-1 focus:ring-yellow-600/20 transition"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[140px]"
                >
                    <option value="ALL">Todos os perfis</option>
                    <option value="MEMBER">Sócios</option>
                    <option value="ACCOUNT_MANAGER">Account Managers</option>
                    <option value="CEO">CEO</option>
                    <option value="MANAGER">Gestora</option>
                    <option value="TEAM">Time</option>
                    <option value="ADMIN">Admins</option>
                </select>
            </div>

            {/* ─── Advanced Filters Bar ─────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
                    <Filter size={13} />
                    <span>Filtros:</span>
                </div>
                <select
                    value={lastAccessFilter}
                    onChange={(e) => setLastAccessFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[160px]"
                >
                    <option value="ALL">🕐 Último Acesso</option>
                    <option value="TODAY">Hoje</option>
                    <option value="7D">Últimos 7 dias</option>
                    <option value="30D">Últimos 30 dias</option>
                    <option value="60D">Últimos 60 dias</option>
                    <option value="90D_PLUS">⚠ Inativos 90d+</option>
                </select>
                <select
                    value={activeDaysFilter}
                    onChange={(e) => setActiveDaysFilter(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[160px]"
                >
                    <option value="ALL">📊 Dias Ativo</option>
                    <option value="1_PLUS">1+ dia ativo</option>
                    <option value="5_PLUS">5+ dias ativos</option>
                    <option value="10_PLUS">10+ dias ativos</option>
                    <option value="20_PLUS">20+ dias ativos</option>
                </select>
                <select
                    value={eventFilter}
                    onChange={(e) => setEventFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-yellow-600/50 transition min-w-[200px] max-w-[300px]"
                >
                    <option value="ALL">📅 Presença em Evento</option>
                    {eventsList.map(ev => (
                        <option key={ev.id} value={ev.id}>
                            {ev.date} — {ev.title.length > 30 ? ev.title.slice(0, 30) + '…' : ev.title}
                        </option>
                    ))}
                </select>
                {hasAdvancedFilters && (
                    <button
                        onClick={clearAdvancedFilters}
                        className="text-xs text-yellow-500 hover:text-yellow-400 whitespace-nowrap transition"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            <AdminTable>
                <table className="w-full min-w-[800px] text-left text-sm text-slate-400 whitespace-nowrap">
                    <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Usuário</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Empresa</th>
                            <th className="px-6 py-4">Cargo</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Último Acesso</th>
                            <th className="px-6 py-4">Vídeo Pitch</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {filteredMembers.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={member.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={member.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                                        <span className="font-medium text-white">{member.name || 'Sem nome'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{member.email}</td>
                                <td className="px-6 py-4">{member.company || '-'}</td>
                                <td className="px-6 py-4">{member.job_title || '-'}</td>
                                <td className="px-6 py-4">{formatRole(member.role)}</td>
                                <td className="px-6 py-4">
                                    {(() => {
                                        const { text, color } = formatLastSeen(lastActivityMap[member.id]);
                                        return (
                                            <span className={`inline-flex items-center gap-1 text-xs ${color}`}>
                                                <Clock size={12} />
                                                {text}
                                            </span>
                                        );
                                    })()}
                                </td>
                                <td className="px-6 py-4">
                                    {member.pitch_video_url ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs">
                                            <PlaySquare size={14} /> Configurado
                                        </span>
                                    ) : (
                                        <span className="text-slate-600 text-xs">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <AdminActionButton
                                            icon={Activity}
                                            onClick={() => setActivityMember(member)}
                                            variant="primary"
                                            title="Ver atividade"
                                        />
                                        <AdminActionButton
                                            icon={Edit}
                                            onClick={() => handleEditMember(member)}
                                            variant="primary"
                                            title="Editar membro"
                                        />
                                        <AdminActionButton
                                            icon={Trash2}
                                            onClick={() => requestDeleteMember(member)}
                                            variant="danger"
                                            title="Remover membro"
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredMembers.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-slate-600">
                                    {searchTerm || roleFilter !== 'ALL'
                                        ? 'Nenhum membro encontrado com esses filtros.'
                                        : 'Nenhum membro cadastrado.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </AdminTable>

            {/* ─── Server-Side Pagination Controls ─────────────────── */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Mostrar</span>
                        <select
                            value={pageSize}
                            onChange={e => setPageSize(Number(e.target.value))}
                            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-yellow-600/50 transition"
                        >
                            {[10, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="text-xs text-slate-500">
                            Página {currentPage} de {totalPages} ({totalMembers} total)
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm text-slate-400 px-3">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Edit Member Modal */}
            {isEditModalOpen && editingMember && (
                <AdminModal title={`Editar: ${editingMember.name}`} onClose={() => setIsEditModalOpen(false)}>
                    <div className="space-y-4">
                        {/* Member Info (Read-only) */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <img src={editingMember.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`} alt={editingMember.name} className="w-12 h-12 rounded-full object-cover border border-slate-600" />
                                <div>
                                    <p className="font-bold text-white">{editingMember.name}</p>
                                    <p className="text-sm text-slate-400">{editingMember.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <p className="text-slate-500">Empresa: <span className="text-slate-300">{editingMember.company || '-'}</span></p>
                                <p className="text-slate-500">Cargo: <span className="text-slate-300">{editingMember.job_title || '-'}</span></p>
                            </div>
                        </div>

                        {/* Pitch Video URL Input */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <PlaySquare size={14} className="text-yellow-500" />
                                URL do Vídeo Pitch
                            </label>
                            <input
                                type="text"
                                value={editFormData.pitch_video_url}
                                onChange={(e) => { setEditFormData({ ...editFormData, pitch_video_url: e.target.value }); detectVideoPlatform(e.target.value); }}
                                placeholder="Link do YouTube, Vimeo, Google Drive ou Loom"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-yellow-600 transition"
                            />
                            {videoUrlStatus.message && (
                                <p className={`text-xs flex items-center gap-1 ${videoUrlStatus.type === 'invalid' ? 'text-orange-400' : 'text-emerald-400'}`}>
                                    {videoUrlStatus.message}
                                </p>
                            )}
                            <p className="text-xs text-slate-500">Cole aqui o link do vídeo de pitch do sócio.</p>
                        </div>

                        {/* Role Selector */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                🎭 Função do Usuário
                            </label>
                            <select
                                value={editFormData.role}
                                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 outline-none focus:border-yellow-600 transition"
                            >
                                <option value="MEMBER">Sócio</option>
                                <option value="ACCOUNT_MANAGER">Account Manager</option>
                                <option value="CEO">CEO</option>
                                <option value="MANAGER">Gestora</option>
                                <option value="TEAM">Time Interno</option>
                                <option value="ADMIN">Administrador do Sistema</option>
                            </select>
                            <p className="text-xs text-slate-500">Define a função e regras de privacidade no app.</p>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition" disabled={saving}>
                                Cancelar
                            </button>
                            <button onClick={handleSaveEdit} disabled={saving} className="px-4 py-2 rounded-lg bg-yellow-600 text-white font-medium hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20 disabled:opacity-50 flex items-center gap-2">
                                {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                Salvar
                            </button>
                        </div>
                    </div>
                </AdminModal>
            )}

            {/* ============================================ */}
            {/* CONFIRM DIALOG */}
            {/* ============================================ */}
            <AdminConfirmDialog
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeDeleteMember}
                title="Remover Membro"
                message={`Tem certeza que deseja remover "${confirmState.memberName}"? Esta ação não pode ser desfeita.`}
                confirmText="Remover"
                isDestructive
                isLoading={confirmState.isLoading}
            />

            {/* ============================================ */}
            {/* USER ACTIVITY DETAIL MODAL */}
            {/* ============================================ */}
            {activityMember && (
                <UserActivityDetail
                    userId={activityMember.id}
                    userName={activityMember.name || activityMember.email}
                    userImage={activityMember.image_url || null}
                    onClose={() => setActivityMember(null)}
                />
            )}
        </div>
    );
};

export default MembersModule;
