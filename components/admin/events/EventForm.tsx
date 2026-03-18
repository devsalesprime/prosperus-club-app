// ============================================
// EVENT FORM - Sub-component (Extracted)
// ============================================
// Formulário completo de criação/edição de eventos
// Inclui: Zod validation, sessões múltiplas, materiais com upload, member search
// Refatorado: 2x alert() → toast
// v3.0.1: Toggle "Notificar sócios?" + admin exclusion

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useApp } from '../../../contexts/AppContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Plus,
    Trash2,
    FileText,
    Upload,
    CalendarDays,
    Clock,
    X,
    Search,
    User,
} from 'lucide-react';
import { ClubEvent, EventMaterial, EventSession } from '../../../types';
import { eventService } from '../../../services/eventService';
import { AdminModal, AdminFormInput } from '../shared';
import { eventSchema } from './eventSchema';

/** Convert a Date to the format required by datetime-local input (YYYY-MM-DDTHH:mm) in LOCAL time */
const toLocalDatetimeInput = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface EventFormProps {
    event?: ClubEvent | null;
    onSaved: () => void;
    onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ event, onSaved, onCancel }) => {
    const isEditing = !!event?.id;

    // --- FORM STATE ---
    const [materials, setMaterials] = useState<EventMaterial[]>([]);
    const [sessions, setSessions] = useState<EventSession[]>([]);
    const [hasMultipleSessions, setHasMultipleSessions] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [shouldNotify, setShouldNotify] = useState(true);
    const { currentUser } = useApp();

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
            date: toLocalDatetimeInput(new Date()),
            endDate: toLocalDatetimeInput(new Date(new Date().getTime() + 3600000))
        }
    });

    const category = watch('category');
    const startDate = watch('date');
    const eventType = watch('type');

    // Initialize form when editing
    useEffect(() => {
        if (event) {
            setMaterials(event.materials || []);
            setSessions(event.sessions || []);
            setHasMultipleSessions((event.sessions?.length || 0) > 0);
            setTargetMemberId(event.targetMemberId || null);
            setTargetMemberName(event.targetMemberName || '');
            setMemberSearch(event.targetMemberName || '');
            const formattedEvent = {
                ...event,
                date: event.date ? toLocalDatetimeInput(new Date(event.date)) : '',
                endDate: event.endDate ? toLocalDatetimeInput(new Date(event.endDate)) : ''
            };
            Object.keys(formattedEvent).forEach(key => {
                setValue(key as any, (formattedEvent as any)[key]);
            });
        } else {
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
    }, [event, setValue, reset]);

    // ============================================
    // MEMBER SEARCH (PRIVATE EVENTS)
    // ============================================

    const searchMembers = async (query: string) => {
        if (query.length < 2) { setMemberResults([]); return; }
        try {
            setLoadingMembers(true);
            const { supabase } = await import('../../../lib/supabase');
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

    // ============================================
    // SESSIONS MANAGEMENT
    // ============================================

    const addSession = () => {
        const today = toLocalDatetimeInput(new Date()).slice(0, 10);
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

    // ============================================
    // FILE UPLOAD
    // ============================================

    const handleFileUpload = async (index: number, file: File) => {
        try {
            setUploadingIndex(index);
            const { supabase } = await import('../../../lib/supabase');
            const fileExt = file.name.split('.').pop();
            const fileName = `event-materials/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { cacheControl: '3600', upsert: false });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                toast.error('Erro no upload: ' + uploadError.message);
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
            toast.success('Arquivo enviado com sucesso!');
        } catch (error: any) {
            console.error('Error uploading file:', error);
            toast.error('Erro ao fazer upload: ' + error.message);
        } finally {
            setUploadingIndex(null);
        }
    };

    // ============================================
    // SUBMIT
    // ============================================

    const onSubmit = async (data: any) => {
        try {
            setSaving(true);
            const eventData = {
                ...data,
                materials,
                sessions: hasMultipleSessions ? sessions : undefined,
                targetMemberId: data.type === 'PRIVATE' ? targetMemberId : undefined,
                targetMemberName: data.type === 'PRIVATE' ? targetMemberName : undefined,
                id: event?.id || undefined
            };

            // Auto-calculate date/endDate from sessions for calendar compatibility
            if (hasMultipleSessions && sessions.length > 0) {
                const sortedSessions = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
                const first = sortedSessions[0];
                const last = sortedSessions[sortedSessions.length - 1];
                eventData.date = new Date(`${first.date}T${first.startTime}:00`).toISOString();
                eventData.endDate = new Date(`${last.date}T${last.endTime}:00`).toISOString();
            }

            if (event?.id) {
                await eventService.updateEvent(event.id, eventData);

                // 🔔 Detectar mudanças relevantes e notificar sócios com RSVP
                const dateChanged = eventData.date !== event.date;
                const locationChanged = (eventData.location || '') !== (event.location || '');
                const linkChanged = (eventData.link || '') !== (event.link || '');

                if (dateChanged || locationChanged || linkChanged) {
                    if (shouldNotify) {
                        import('../../../services/notificationTriggers').then(({ notifyEventUpdated }) => {
                            notifyEventUpdated({
                                eventId: event.id,
                                eventTitle: eventData.title || event.title,
                                dateChanged,
                                newDate: dateChanged ? eventData.date : undefined,
                                locationChanged,
                                newLocation: locationChanged ? eventData.location : undefined,
                                linkChanged,
                                newLink: linkChanged ? eventData.link : undefined,
                                excludeUserId: currentUser?.id,
                            }).catch(() => { });
                        });
                    }
                }
            } else {
                await eventService.createEvent(eventData);
                // 🔔 Notificar sócios sobre novo evento
                if (shouldNotify) {
                    import('../../../services/notificationTriggers').then(({ notifyNewEvent }) => {
                        notifyNewEvent(
                            eventData.id || 'new',
                            eventData.title,
                            eventData.date,
                            currentUser?.id
                        ).catch(() => { });
                    });
                }
            }
            toast.success(isEditing ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');
            onSaved();
        } catch (err: any) {
            console.error('Error saving event:', err);
            toast.error('Erro ao salvar evento: ' + (err?.message || 'Erro desconhecido'));
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <AdminModal title={isEditing ? "Editar Evento" : "Novo Evento"} onClose={onCancel}>
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
                                                        src={m.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`}
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

                {/* Notification Toggle */}
                <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none">
                        <input
                            type="checkbox"
                            checked={shouldNotify}
                            onChange={(e) => setShouldNotify(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-yellow-600 focus:ring-yellow-600 focus:ring-offset-0 cursor-pointer"
                        />
                        🔔 Notificar sócios
                    </label>
                    <span className="text-[10px] text-slate-500">
                        {shouldNotify
                            ? (isEditing ? 'Notificará se data/local/link mudar' : 'Push + in-app serão enviados')
                            : 'Salvar silenciosamente'}
                    </span>
                </div>

                <div className="p-6 border-t border-slate-800 flex justify-end gap-3 bg-slate-900 sticky bottom-0 -mx-6 -mb-6">
                    <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-300 hover:bg-slate-800 transition" disabled={saving}>Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-yellow-600 text-white font-bold hover:bg-yellow-500 transition shadow-lg shadow-yellow-900/20 disabled:opacity-50 flex items-center gap-2" disabled={saving}>
                        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        {saving ? 'Salvando...' : 'Salvar Evento'}
                    </button>
                </div>
            </form>
        </AdminModal>
    );
};

export default EventForm;
