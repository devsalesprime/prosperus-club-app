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
    X
} from 'lucide-react';
import { ClubEvent, EventCategory, EventMaterial, EventSession } from '../../types';
import { dataService } from '../../services/mockData';
import { AdminPageHeader, AdminModal, AdminFormInput } from './shared';

// --- ZOD SCHEMA ---
const eventSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    type: z.enum(['MEMBER', 'TEAM']),
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

    useEffect(() => {
        setEvents(dataService.getClubEvents());
        return dataService.subscribe(() => setEvents(dataService.getClubEvents()));
    }, []);

    const openModal = (event?: ClubEvent) => {
        if (event) {
            setEditingId(event.id);
            setMaterials(event.materials || []);
            setSessions(event.sessions || []);
            setHasMultipleSessions((event.sessions?.length || 0) > 0);
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
            reset({
                type: 'MEMBER',
                category: 'PRESENTIAL',
                date: new Date().toISOString().slice(0, 16),
                endDate: new Date(new Date().getTime() + 3600000).toISOString().slice(0, 16)
            });
        }
        setIsModalOpen(true);
    };

    const onSubmit = (data: any) => {
        const eventData = {
            ...data,
            materials,
            sessions: hasMultipleSessions ? sessions : undefined,
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
            dataService.updateClubEvent(eventData);
        } else {
            dataService.addClubEvent(eventData);
        }
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
                                    <tr key={event.id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium text-white">{event.title}</td>
                                        <td className="px-4 py-3 text-sm text-slate-300">{formatDate(event.date)}</td>
                                        <td className="px-4 py-3 text-sm text-slate-300">
                                            <span className={`px-2 py-0.5 text-xs font-bold ${event.type === 'MEMBER' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                {event.type === 'MEMBER' ? 'Sócios' : 'Time'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <CategoryBadge category={event.category} />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openModal(event)} className="p-2 text-slate-400 hover:text-yellow-500 hover:bg-slate-800 transition" title="Editar">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => dataService.deleteClubEvent(event.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-800 transition" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
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
                                </select>
                            </div>
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
