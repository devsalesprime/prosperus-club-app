// ============================================
// EVENTS MODULE - Admin Component (Extracted)
// ============================================
// Gerenciamento de eventos com formulário validado via Zod + react-hook-form

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Plus,
    Edit,
    Trash2,
    FileText,
    Upload,
    CalendarDays,
    Clock,
    X,
    Search,
    User,
    Users,
    UserCheck,
    UserX,
    Download,
    ChevronDown,
    Check,
    Loader2
} from 'lucide-react';
import { ClubEvent, EventCategory, EventMaterial, EventSession } from '../../types';
import { eventService } from '../../services/eventService';
import { AdminPageHeader, AdminModal, AdminFormInput } from './shared';

// --- ZOD SCHEMA ---
const eventSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    type: z.enum(['MEMBER', 'TEAM', 'PRIVATE']),
    category: z.enum(['PRESENTIAL', 'ONLINE']),
    date: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    bannerUrl: z.string().optional(),
    location: z.string().optional(),
    mapLink: z.string().url('URL do mapa inválida').optional().or(z.literal('')),
    link: z.string().url('URL da reunião inválida').optional().or(z.literal('')),
    meetingPassword: z.string().optional()
}).refine((data) => {
    if (data.date && data.endDate) {
        return new Date(data.endDate) >= new Date(data.date);
    }
    return true;
}, { message: 'Data de término deve ser posterior à data de início', path: ['endDate'] })
    .refine((data) => {
        if (data.category === 'PRESENTIAL') return !!data.location && data.location.length > 0;
        return true;
    }, { message: 'Localização é obrigatória para eventos presenciais', path: ['location'] })
    .refine((data) => {
        if (data.category === 'ONLINE') return !!data.link && data.link.length > 0;
        return true;
    }, { message: 'Link da reunião é obrigatório para eventos online', path: ['link'] });

// Category badge sub-component
const CategoryBadge = ({ category }: { category: EventCategory }) => {
    const config = {
        ONLINE: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', border: 'border-[#10b981]/30', label: 'Online' },
        PRESENTIAL: { bg: 'bg-[#9333ea]/10', text: 'text-[#9333ea]', border: 'border-[#9333ea]/30', label: 'Presencial' },
        RECORDED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Gravado (Legacy)' }
    };
    const style = config[category] || config.ONLINE;
    return (
        <span className={`px-2 py-1 ${style.bg} ${style.text} border ${style.border} text-xs font-bold uppercase tracking-wider inline-block`}>
            {style.label}
        </span>
    );
};

export const EventsModule: React.FC = () => {
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [materials, setMaterials] = useState<EventMaterial[]>([]);
    const [sessions, setSessions] = useState<EventSession[]>([]);
    const [hasMultipleSessions, setHasMultipleSessions] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

    // Private event targeting
    const [targetMemberId, setTargetMemberId] = useState<string | null>(null);
    const [targetMemberName, setTargetMemberName] = useState<string>('');
    const [memberSearch, setMemberSearch] = useState('');
    const [memberResults, setMemberResults] = useState<{ id: string; name: string; image_url: string | null }[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
        resolver: zodResolver(eventSchema),
        defaultValues: {
            type: 'MEMBER',
            category: 'PRESENTIAL',
            date: new Date().toISOString().slice(0, 16),
            endDate: new Date(new Date().getTime() + 3600000).toISOString().slice(0, 16)
        }
    });

    const category = watch('category');
    const startDate = watch('date');
    const eventType = watch('type');

    // Search members when type is PRIVATE
    const searchMembers = async (query: string) => {
        if (query.length < 2) { setMemberResults([]); return; }
        try {
            setLoadingMembers(true);
            const { supabase } = await import('../../lib/supabase');
            const { data } = await supabase
                .from('profiles')
                .select('id, name, image_url')
                .ilike('name', `%${query}%`)
                .order('name')
                .limit(8);
            setMemberResults(data || []);
        } catch (err) {
            console.error('Error searching members:', err);
        } finally {
            setLoadingMembers(false);
        }
    };

    useEffect(() => {
        const fetchEvents = async () => {
            const data = await eventService.getAllEvents();
            setEvents(data);
        };
        fetchEvents();
    }, []);

    const refreshEvents = async () => {
        const data = await eventService.getAllEvents();
        setEvents(data);
    };

    const openModal = (event?: ClubEvent) => {
        if (event) {
            setEditingId(event.id);
            setMaterials(event.materials || []);
            setSessions(event.sessions || []);
            setHasMultipleSessions((event.sessions?.length || 0) > 0);
            setTargetMemberId(event.targetMemberId || null);
            setTargetMemberName(event.targetMemberName || '');
            setMemberSearch(event.targetMemberName || '');
            const formattedEvent = {
                ...event,
                date: event.date ? new Date(event.date).toISOString().slice(0, 16) : '',
                endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : ''
            };
            Object.keys(formattedEvent).forEach(key => {
                setValue(key as any, (formattedEvent as any)[key]);
            });
        } else {
            setEditingId(null);
            setMaterials([]);
            setSessions([]);
            setHasMultipleSessions(false);
            setTargetMemberId(null);
            setTargetMemberName('');
            setMemberSearch('');
            setMemberResults([]);
            reset({
                type: 'MEMBER',
                category: 'PRESENTIAL',
                date: new Date().toISOString().slice(0, 16),
                endDate: new Date(new Date().getTime() + 3600000).toISOString().slice(0, 16)
            });
        }
        setIsModalOpen(true);
    };

    const onSubmit = async (data: any) => {
        const eventData = {
            ...data,
            materials,
            sessions: hasMultipleSessions ? sessions : undefined,
            targetMemberId: data.type === 'PRIVATE' ? targetMemberId : undefined,
            targetMemberName: data.type === 'PRIVATE' ? targetMemberName : undefined,
            id: editingId || undefined
        };

        // Auto-calculate date/endDate from sessions for calendar compatibility
        if (hasMultipleSessions && sessions.length > 0) {
            const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
            const first = sortedSessions[0];
            const last = sortedSessions[sortedSessions.length - 1];
            eventData.date = new Date(`${first.date}T${first.startTime}:00`).toISOString();
            eventData.endDate = new Date(`${last.date}T${last.endTime}:00`).toISOString();
        }

        if (editingId) {
            await eventService.updateEvent(editingId, eventData);
        } else {
            await eventService.createEvent(eventData);
        }
        await refreshEvents();
        setIsModalOpen(false);
    };

    const addSession = () => {
        const today = new Date().toISOString().slice(0, 10);
        setSessions([...sessions, { date: today, startTime: '09:00', endTime: '18:00' }]);
    };

    const updateSession = (index: number, field: keyof EventSession, value: string) => {
        const updated = [...sessions];
        updated[index] = { ...updated[index], [field]: value };
        setSessions(updated);
    };

    const removeSession = (index: number) => {
        setSessions(sessions.filter((_, i) => i !== index));
    };

    const handleFileUpload = async (index: number, file: File) => {
        try {
            setUploadingIndex(index);
            const { supabase } = await import('../../lib/supabase');
            const fileExt = file.name.split('.').pop();
            const fileName = `event-materials/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                alert('Erro no upload: ' + uploadError.message);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const updated = [...materials];
            updated[index].url = publicUrl;
            if (!updated[index].title) {
                updated[index].title = file.name.replace(/\.[^/.]+$/, '');
            }
            const ext = fileExt?.toLowerCase();
            if (ext === 'pdf') updated[index].type = 'PDF';
            else if (['doc', 'docx', 'txt', 'odt'].includes(ext || '')) updated[index].type = 'DOC';
            else if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext || '')) updated[index].type = 'VIDEO';
            setMaterials(updated);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            alert('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploadingIndex(null);
        }
    };

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

    // --- RSVP MANAGEMENT STATE ---
    const [expandedRsvpEventId, setExpandedRsvpEventId] = useState<string | null>(null);
    const [rsvpList, setRsvpList] = useState<any[]>([]);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpFilter, setRsvpFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED'>('ALL');

    // Fetch RSVPs for expanded event
    const fetchRsvps = async (eventId: string) => {
        setRsvpLoading(true);
        try {
            const { supabase } = await import('../../lib/supabase');
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
            const { supabase } = await import('../../lib/supabase');
            const { error } = await supabase
                .from('event_rsvps')
                .update({ status: newStatus })
                .eq('id', rsvpId);
            if (error) throw error;
            setRsvpList(prev => prev.map(r => r.id === rsvpId ? { ...r, status: newStatus } : r));
        } catch (err) {
            console.error('Error updating RSVP:', err);
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

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Gestão de Eventos"
                subtitle="Crie e gerencie eventos do clube"
                action={
                    <button onClick={() => openModal()} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 font-bold transition shadow-lg">
                        <Plus size={18} /> Novo Evento
                    </button>
                }
            />

            {/* Events Table */}
            <div className="bg-slate-900 border border-slate-800 overflow-hidden rounded-xl">
                <div className="overflow-x-auto">
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
                            {events.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                                        Nenhum evento cadastrado
                                    </td>
                                </tr>
                            ) : (
                                events.map((event) => (
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
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => toggleRsvpPanel(event.id)}
                                                        className={`p-2 transition rounded ${expandedRsvpEventId === event.id ? 'text-yellow-500 bg-yellow-500/10' : 'text-slate-400 hover:text-yellow-500 hover:bg-slate-800'}`}
                                                        title="Lista de Presença"
                                                        style={{ minHeight: 'auto', minWidth: 'auto' }}
                                                    >
                                                        <Users size={16} />
                                                    </button>
                                                    <button onClick={() => openModal(event)} className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-800 transition" title="Editar" style={{ minHeight: 'auto', minWidth: 'auto' }}>
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={async () => { await eventService.deleteEvent(event.id); refreshEvents(); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 transition" title="Excluir" style={{ minHeight: 'auto', minWidth: 'auto' }}>
                                                        <Trash2 size={16} />
                                                    </button>
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
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <AdminModal title={editingId ? "Editar Evento" : "Novo Evento"} onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <AdminFormInput
                                    label="Título"
                                    {...register("title")}
                                    onChange={(e: any) => setValue('title', e)}
                                    value={watch('title')}
                                    error={errors.title?.message}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Público-Alvo</label>
                                <select {...register("type")} className="w-full bg-slate-950 border border-slate-800 p-3 text-slate-200 outline-none focus:border-yellow-600 transition">
                                    <option value="MEMBER">Sócios (MEMBER)</option>
                                    <option value="TEAM">Time (TEAM)</option>
                                    <option value="PRIVATE">🔒 Sócio Específico</option>
                                </select>
                            </div>

                            {/* Member Search - Only when PRIVATE */}
                            {eventType === 'PRIVATE' && (
                                <div className="sm:col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                        <User size={12} className="text-orange-400" />
                                        Sócio Destinatário
                                    </label>
                                    {targetMemberId ? (
                                        <div className="flex items-center gap-3 bg-slate-950 border border-orange-500/30 rounded p-3">
                                            <User size={16} className="text-orange-400" />
                                            <span className="text-sm text-white font-medium flex-1">{targetMemberName}</span>
                                            <button
                                                type="button"
                                                onClick={() => { setTargetMemberId(null); setTargetMemberName(''); setMemberSearch(''); }}
                                                className="text-slate-400 hover:text-red-400 transition"
                                                style={{ minHeight: 'auto', minWidth: 'auto' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded focus-within:border-yellow-600 transition">
                                                <Search size={14} className="text-slate-500 ml-3" />
                                                <input
                                                    type="text"
                                                    value={memberSearch}
                                                    onChange={(e) => { setMemberSearch(e.target.value); searchMembers(e.target.value); }}
                                                    placeholder="Buscar sócio pelo nome..."
                                                    className="w-full bg-transparent p-3 text-sm text-slate-200 outline-none"
                                                />
                                                {loadingMembers && <div className="w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-3" />}
                                            </div>
                                            {memberResults.length > 0 && (
                                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-48 overflow-y-auto">
                                                    {memberResults.map((m) => (
                                                        <button
                                                            key={m.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setTargetMemberId(m.id);
                                                                setTargetMemberName(m.name);
                                                                setMemberSearch(m.name);
                                                                setMemberResults([]);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition text-left"
                                                            style={{ minHeight: 'auto', minWidth: 'auto' }}
                                                        >
                                                            <img
                                                                src={m.image_url || '/default-avatar.svg'}
                                                                alt={m.name}
                                                                className="w-8 h-8 rounded-full object-cover border border-slate-700"
                                                            />
                                                            <span className="text-sm text-white">{m.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-slate-500">Este evento só aparecerá na agenda deste sócio.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categoria *</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['PRESENTIAL', 'ONLINE'].map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setValue('category', cat as any)}
                                        className={`py-2 px-1 text-xs font-bold border transition ${category === cat ? 'bg-yellow-600 border-yellow-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        {cat === 'PRESENTIAL' ? '📍 PRESENCIAL' : '🖥️ ONLINE'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AdminFormInput label="Data/Hora de Início *" type="datetime-local" {...register("date")} onChange={(e: any) => setValue('date', e)} value={watch('date')} error={errors.date?.message} />
                            <AdminFormInput label="Data/Hora de Término *" type="datetime-local" {...register("endDate")} onChange={(e: any) => setValue('endDate', e)} value={watch('endDate')} error={errors.endDate?.message} min={startDate} />
                        </div>

                        <div className="bg-slate-800/50 p-4 border border-slate-700 space-y-4">
                            <AdminFormInput label="URL do Banner (Opcional)" placeholder="https://... (Imagem de destaque)" {...register("bannerUrl")} onChange={(e: any) => setValue('bannerUrl', e)} value={watch('bannerUrl')} error={errors.bannerUrl?.message} />

                            {category === 'PRESENTIAL' && (
                                <>
                                    <AdminFormInput label="Localização / Endereço *" placeholder="Ex: Sede Prosperus, Sala 2" {...register("location")} onChange={(e: any) => setValue('location', e)} value={watch('location')} error={errors.location?.message} />
                                    <AdminFormInput label="Link do Google Maps (Opcional)" placeholder="https://maps.app.goo.gl/..." {...register("mapLink")} onChange={(e: any) => setValue('mapLink', e)} value={watch('mapLink')} error={errors.mapLink?.message} />
                                </>
                            )}

                            {category === 'ONLINE' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <AdminFormInput label="Link da Reunião *" placeholder="https://zoom.us/..." {...register("link")} onChange={(e: any) => setValue('link', e)} value={watch('link')} error={errors.link?.message} />
                                    <AdminFormInput label="Senha/ID (Opcional)" placeholder="Ex: 123456" {...register("meetingPassword")} onChange={(e: any) => setValue('meetingPassword', e)} value={watch('meetingPassword')} />
                                </div>
                            )}
                        </div>

                        <AdminFormInput label="Descrição *" textarea {...register("description")} onChange={(e: any) => setValue('description', e)} value={watch('description')} error={errors.description?.message} />

                        {/* SESSIONS SECTION */}
                        <div className="bg-slate-800/30 p-4 border border-slate-700 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <CalendarDays size={14} className="text-yellow-500" />
                                    Múltiplos Horários
                                </label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setHasMultipleSessions(!hasMultipleSessions);
                                        if (!hasMultipleSessions && sessions.length === 0) addSession();
                                    }}
                                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${hasMultipleSessions ? 'bg-yellow-600' : 'bg-slate-700'}`}
                                    style={{ minHeight: 'auto', minWidth: 'auto' }}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200 ${hasMultipleSessions ? 'translate-x-5' : ''}`} />
                                </button>
                            </div>

                            {hasMultipleSessions && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500">Defina os dias e horários de cada sessão do evento.</p>
                                    {sessions.map((session, index) => (
                                        <div key={index} className="bg-slate-900 p-3 rounded border border-slate-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                    <Clock size={12} /> Sessão {index + 1}
                                                </span>
                                                {sessions.length > 1 && (
                                                    <button type="button" onClick={() => removeSession(index)} className="text-red-400 hover:text-red-300 p-1" title="Remover sessão">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase">Data</label>
                                                    <input
                                                        type="date"
                                                        value={session.date}
                                                        onChange={(e) => updateSession(index, 'date', e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 outline-none focus:border-yellow-600 transition"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase">Início</label>
                                                    <input
                                                        type="time"
                                                        value={session.startTime}
                                                        onChange={(e) => updateSession(index, 'startTime', e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 outline-none focus:border-yellow-600 transition"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-slate-500 uppercase">Término</label>
                                                    <input
                                                        type="time"
                                                        value={session.endTime}
                                                        onChange={(e) => updateSession(index, 'endTime', e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 outline-none focus:border-yellow-600 transition"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addSession}
                                        className="flex items-center gap-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded border border-slate-700 transition w-full justify-center"
                                    >
                                        <Plus size={14} /> Adicionar Sessão
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* MATERIALS SECTION */}
                        <div className="bg-slate-800/30 p-4 border border-slate-700 rounded-lg space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText size={14} className="text-yellow-500" />
                                    Materiais do Evento (Opcional)
                                </label>
                                <button type="button" onClick={() => setMaterials([...materials, { title: '', url: '', type: 'PDF' }])} className="flex items-center gap-1 text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded transition">
                                    <Plus size={14} /> Adicionar Material
                                </button>
                            </div>

                            {materials.length === 0 ? (
                                <p className="text-xs text-slate-500 text-center py-2">Nenhum material adicionado</p>
                            ) : (
                                <div className="space-y-2">
                                    {materials.map((material, index) => (
                                        <div key={index} className="bg-slate-900 p-3 rounded border border-slate-700 space-y-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-slate-400">Material #{index + 1}</span>
                                                <button type="button" onClick={() => setMaterials(materials.filter((_, i) => i !== index))} className="text-red-400 hover:text-red-300 p-1" title="Remover material">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <input type="text" placeholder="Título do material" value={material.title} onChange={(e) => { const updated = [...materials]; updated[index].title = e.target.value; setMaterials(updated); }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 outline-none focus:border-yellow-600 transition" />
                                                <select value={material.type} onChange={(e) => { const updated = [...materials]; updated[index].type = e.target.value as any; setMaterials(updated); }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 outline-none focus:border-yellow-600 transition">
                                                    <option value="PDF">📄 PDF</option>
                                                    <option value="DOC">📝 Documento</option>
                                                    <option value="VIDEO">🎥 Vídeo</option>
                                                    <option value="LINK">🔗 Link</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <input type="url" placeholder="URL do material (https://...)" value={material.url} onChange={(e) => { const updated = [...materials]; updated[index].url = e.target.value; setMaterials(updated); }} className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-sm text-slate-200 outline-none focus:border-yellow-600 transition" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-500">ou</span>
                                                    <label className="flex-1">
                                                        <input type="file" accept=".pdf,.doc,.docx,.txt,.mp4,.avi,.mov,.wmv,.webm" onChange={(e) => { const file = e.target.files?.[0]; if (file) { handleFileUpload(index, file); e.target.value = ''; } }} disabled={uploadingIndex === index} className="hidden" id={`file-upload-${index}`} />
                                                        <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded text-xs font-medium transition cursor-pointer ${uploadingIndex === index ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'}`}>
                                                            {uploadingIndex === index ? (
                                                                <><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Enviando...</>
                                                            ) : (
                                                                <><Upload size={14} /> Fazer Upload</>
                                                            )}
                                                        </div>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-300 hover:bg-slate-800 transition">Cancelar</button>
                            <button type="submit" className="px-4 py-2 bg-yellow-600 text-white font-bold hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20">Salvar Evento</button>
                        </div>
                    </form>
                </AdminModal>
            )}
        </div>
    );
};

export default EventsModule;
