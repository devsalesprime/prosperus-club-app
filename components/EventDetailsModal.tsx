// ==============================================
// EVENT DETAILS MODAL — Premium Component
// ==============================================
// Extracted from App.tsx inline modal with enhancements:
// - Multi-day timeline visualization
// - Session selection for "Add to Calendar"
// - Premium micro-interactions
// - Portal rendering for proper z-index

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Clock,
    MapPin,
    CalendarPlus,
    FileText,
    PlayCircle,
    BookOpen,
    ExternalLink,
    CalendarDays,
    ChevronRight,
    Video,
    Check,
    UserCheck,
    Loader2,
    XCircle,
    Clock3,
    Users
} from 'lucide-react';
import { ClubEvent, EventSession } from '../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RsvpStatus = 'NONE' | 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'WAITLIST' | 'CANCELLED';

interface EventDetailsModalProps {
    event: ClubEvent;
    onClose: () => void;
    userId?: string; // From useAuth, enables RSVP
}

// ── Helper: Generate .ics calendar link ──
const generateCalendarUrl = (event: ClubEvent, session?: EventSession) => {
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    let startDate: string;
    let endDate: string;

    if (session) {
        // Use specific session
        const start = new Date(`${session.date}T${session.startTime}:00`);
        const end = new Date(`${session.date}T${session.endTime}:00`);
        startDate = start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        endDate = end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    } else {
        // Use global dates
        startDate = new Date(event.date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        endDate = event.endDate
            ? new Date(event.endDate).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
            : new Date(new Date(event.date).getTime() + 3600000).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${description}&location=${location}`;
};

// ── Material Icon Helper ──
const getMaterialIconAndColor = (type: string) => {
    switch (type) {
        case 'PDF': return { icon: FileText, color: 'red' };
        case 'VIDEO': return { icon: PlayCircle, color: 'purple' };
        case 'DOC': return { icon: BookOpen, color: 'blue' };
        case 'LINK':
        default: return { icon: ExternalLink, color: 'green' };
    }
};

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, userId }) => {
    const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);
    const [addedSessions, setAddedSessions] = useState<Set<number>>(new Set());

    // ── RSVP State ──
    const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('NONE');
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpToast, setRsvpToast] = useState<string | null>(null);
    const [confirmedCount, setConfirmedCount] = useState(0);

    // ── Fetch RSVP status on mount ──
    useEffect(() => {
        if (!userId) return;
        const fetchRsvp = async () => {
            try {
                // Get user's RSVP
                const { data } = await supabase
                    .from('event_rsvps')
                    .select('status')
                    .eq('event_id', event.id)
                    .eq('user_id', userId)
                    .maybeSingle();
                setRsvpStatus(data?.status || 'NONE');

                // Get confirmed count
                const { count } = await supabase
                    .from('event_rsvps')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', event.id)
                    .eq('status', 'CONFIRMED');
                setConfirmedCount(count || 0);
            } catch (err) {
                console.error('Error fetching RSVP:', err);
            }
        };
        fetchRsvp();
    }, [userId, event.id]);

    // ── Toast auto-dismiss ──
    useEffect(() => {
        if (!rsvpToast) return;
        const timer = setTimeout(() => setRsvpToast(null), 3500);
        return () => clearTimeout(timer);
    }, [rsvpToast]);

    // ── Request RSVP ──
    const handleRequestRsvp = useCallback(async () => {
        if (!userId || rsvpLoading) return;
        setRsvpLoading(true);
        // Optimistic
        setRsvpStatus('PENDING');
        try {
            const { error } = await supabase
                .from('event_rsvps')
                .insert({ event_id: event.id, user_id: userId, status: 'PENDING' });
            if (error) throw error;
            setRsvpToast('Sua solicitação foi enviada para análise! ⏳');
        } catch (err: any) {
            console.error('RSVP request failed:', err);
            setRsvpStatus('NONE');
            setRsvpToast('Erro ao solicitar presença. Tente novamente.');
        } finally {
            setRsvpLoading(false);
        }
    }, [userId, event.id, rsvpLoading]);

    // ── Cancel RSVP ──
    const handleCancelRsvp = useCallback(async () => {
        if (!userId || rsvpLoading) return;
        setRsvpLoading(true);
        const prevStatus = rsvpStatus;
        setRsvpStatus('NONE');
        try {
            const { error } = await supabase
                .from('event_rsvps')
                .delete()
                .eq('event_id', event.id)
                .eq('user_id', userId);
            if (error) throw error;
            setConfirmedCount(prev => Math.max(0, prev - (prevStatus === 'CONFIRMED' ? 1 : 0)));
            setRsvpToast('Presença cancelada.');
        } catch (err: any) {
            console.error('Cancel RSVP failed:', err);
            setRsvpStatus(prevStatus);
            setRsvpToast('Erro ao cancelar. Tente novamente.');
        } finally {
            setRsvpLoading(false);
        }
    }, [userId, event.id, rsvpLoading, rsvpStatus]);

    const isMultiDay = (event.sessions?.length || 0) > 1;
    const sessions = event.sessions || [];

    // Format session date for display
    const formatSessionDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
    };

    const handleAddToCalendar = (session?: EventSession, index?: number) => {
        const url = generateCalendarUrl(event, session);
        window.open(url, '_blank');
        if (index !== undefined) {
            setAddedSessions(prev => new Set([...prev, index]));
        }
        if (!isMultiDay) setCalendarMenuOpen(false);
    };

    const handleAddAll = () => {
        sessions.forEach((session, i) => {
            setTimeout(() => {
                const url = generateCalendarUrl(event, session);
                window.open(url, '_blank');
                setAddedSessions(prev => new Set([...prev, i]));
            }, i * 500); // Stagger to avoid popup blocking
        });
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                animation: 'fadeIn 200ms ease-out',
                paddingTop: 'env(safe-area-inset-top, 0)',
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}
        >
            <div className="bg-slate-900 border border-slate-700 w-[90%] md:w-full md:max-w-2xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90dvh]"
                style={{ animation: 'scaleIn 250ms ease-out' }}
            >
                {/* Banner */}
                <div className="h-32 bg-gradient-to-r from-yellow-600 to-yellow-800 relative rounded-t-2xl overflow-hidden shrink-0">
                    {event.bannerUrl && (
                        <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover opacity-50" />
                    )}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
                    >
                        <X size={20} />
                    </button>

                    {/* Multi-day Badge */}
                    {isMultiDay && (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-orange-500/90 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-lg"
                            style={{ animation: 'slideIn 300ms ease-out 100ms both' }}
                        >
                            <CalendarDays size={14} className="text-white" />
                            <span className="text-xs font-bold text-white">{sessions.length} dias</span>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {/* Category & Date Badges */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${event.category === 'ONLINE'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                            }`}>
                            {event.category === 'PRESENTIAL' ? '📍 Presencial' : '🖥️ Online'}
                        </span>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(event.date).toLocaleDateString('pt-BR')} às {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4">{event.title}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Sobre o Evento</h3>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    {event.description || 'Nenhuma descrição disponível para este evento.'}
                                </p>
                            </div>

                            {/* ═══ TIMELINE SECTION (Sessions) ═══ */}
                            {isMultiDay && (
                                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <CalendarDays size={16} className="text-yellow-500" />
                                        Cronograma
                                    </h3>
                                    <div className="relative">
                                        {/* Vertical timeline line */}
                                        <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gradient-to-b from-yellow-500 via-yellow-600 to-yellow-700 rounded-full" />

                                        <div className="space-y-4">
                                            {sessions.map((session, index) => {
                                                const isAdded = addedSessions.has(index);
                                                return (
                                                    <div
                                                        key={index}
                                                        className="relative pl-10 group"
                                                        style={{ animation: `slideUp 300ms ease-out ${index * 100}ms both` }}
                                                    >
                                                        {/* Timeline dot */}
                                                        <div className={`absolute left-1 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isAdded
                                                            ? 'bg-green-500 border-green-400 scale-110'
                                                            : 'bg-slate-900 border-yellow-500 group-hover:bg-yellow-500/20'
                                                            }`}>
                                                            {isAdded && <Check size={10} className="text-white" />}
                                                        </div>

                                                        <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700/50 transition-all hover:border-yellow-500/30 hover:shadow-lg hover:shadow-yellow-500/5">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-xs font-bold text-yellow-500 uppercase">
                                                                    Dia {index + 1}
                                                                </span>
                                                                <button
                                                                    onClick={() => handleAddToCalendar(session, index)}
                                                                    className={`text-xs px-2 py-1 rounded transition-all ${isAdded
                                                                        ? 'bg-green-500/10 text-green-400 cursor-default'
                                                                        : 'bg-slate-800 hover:bg-yellow-600 text-slate-400 hover:text-white active:scale-95'
                                                                        }`}
                                                                    disabled={isAdded}
                                                                >
                                                                    {isAdded ? '✓ Adicionado' : '+ Agenda'}
                                                                </button>
                                                            </div>
                                                            <p className="text-sm text-white font-medium capitalize">
                                                                {formatSessionDate(session.date)}
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {session.startTime} — {session.endTime}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Materials */}
                            {event.materials && event.materials.length > 0 && (
                                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <FileText size={16} className="text-yellow-500" />
                                        Ata e Materiais
                                    </h3>
                                    <div className="space-y-2">
                                        {event.materials.map((material, index) => {
                                            const { icon: Icon, color } = getMaterialIconAndColor(material.type);
                                            return (
                                                <a
                                                    key={index}
                                                    href={material.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full flex items-center justify-between p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition border border-slate-700 group active:scale-[0.98]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 bg-${color}-500/10 rounded-lg text-${color}-400`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <span className="text-sm text-slate-300 group-hover:text-white font-medium">
                                                            {material.title}
                                                        </span>
                                                    </div>
                                                    <ExternalLink size={16} className="text-slate-500 group-hover:text-white" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-4">
                            {/* Location */}
                            {event.location && (
                                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50 transition-all hover:border-slate-600">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-yellow-500 shrink-0 mt-1" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">Localização</h4>
                                            <p className="text-xs text-slate-400 leading-relaxed">{event.location}</p>
                                            {event.mapLink && (
                                                <a href={event.mapLink} target="_blank" rel="noreferrer" className="text-xs text-yellow-500 hover:underline mt-2 inline-flex items-center gap-1 transition-all hover:gap-2">
                                                    Ver no Mapa <ChevronRight size={12} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Online Link */}
                            {event.category === 'ONLINE' && event.link && (
                                <div className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/50">
                                    <div className="flex items-start gap-3">
                                        <Video className="text-emerald-500 shrink-0 mt-1" size={18} />
                                        <div>
                                            <h4 className="text-sm font-bold text-white mb-1">Link da Reunião</h4>
                                            <a href={event.link} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline break-all">
                                                Acessar Reunião
                                            </a>
                                            {event.meetingPassword && (
                                                <p className="text-xs text-slate-500 mt-1">Senha: {event.meetingPassword}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Add to Calendar */}
                            <div className="pt-4 border-t border-slate-800">
                                {isMultiDay ? (
                                    <div className="space-y-2">
                                        <button
                                            onClick={handleAddAll}
                                            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm active:scale-[0.97] shadow-lg shadow-yellow-900/20"
                                        >
                                            <CalendarPlus size={16} />
                                            Adicionar Todos os Dias
                                        </button>
                                        <p className="text-[10px] text-slate-500 text-center">
                                            Ou adicione dias específicos na seção Cronograma
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleAddToCalendar()}
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-700 active:scale-[0.97]"
                                    >
                                        <CalendarPlus size={16} />
                                        Adicionar à Agenda
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ RSVP STICKY FOOTER ═══ */}
                {userId && (
                    <div className="shrink-0 border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm px-4 py-3 rounded-b-2xl">
                        <div className="flex flex-col items-center gap-2">

                            {/* RSVP Button — Full width on mobile */}
                            {rsvpStatus === 'NONE' && (
                                <button
                                    onClick={handleRequestRsvp}
                                    disabled={rsvpLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-4 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-yellow-900/20 text-sm disabled:opacity-50"
                                >
                                    {rsvpLoading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                                    Confirmar Presença
                                </button>
                            )}

                            {rsvpStatus === 'PENDING' && (
                                <div className="w-full flex flex-col items-center gap-2">
                                    <div className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold py-3 px-4 rounded-xl text-sm">
                                        <Clock3 size={16} className="shrink-0" />
                                        <span>Aguardando Aprovação</span>
                                    </div>
                                    <button
                                        onClick={handleCancelRsvp}
                                        disabled={rsvpLoading}
                                        className="text-xs text-slate-500 hover:text-red-400 transition underline py-1"
                                    >
                                        Cancelar solicitação
                                    </button>
                                </div>
                            )}

                            {rsvpStatus === 'CONFIRMED' && (
                                <div className="w-full flex flex-col items-center gap-2">
                                    <div className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold py-3 px-4 rounded-xl text-sm">
                                        <Check size={16} className="shrink-0" />
                                        <span>Presença Confirmada</span>
                                    </div>
                                    <button
                                        onClick={handleCancelRsvp}
                                        disabled={rsvpLoading}
                                        className="text-xs text-slate-500 hover:text-red-400 transition underline py-1"
                                    >
                                        Cancelar presença
                                    </button>
                                </div>
                            )}

                            {rsvpStatus === 'REJECTED' && (
                                <div className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold py-3 px-4 rounded-xl text-sm">
                                    <XCircle size={16} className="shrink-0" />
                                    <span>Não Aprovado</span>
                                </div>
                            )}

                            {rsvpStatus === 'WAITLIST' && (
                                <div className="w-full flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold py-3 px-4 rounded-xl text-sm">
                                    <Clock3 size={16} className="shrink-0" />
                                    <span>Lista de Espera</span>
                                </div>
                            )}

                            {/* Confirmed counter — below button */}
                            {confirmedCount > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Users size={12} className="text-emerald-500" />
                                    <span>{confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>

                        {/* Toast */}
                        {rsvpToast && (
                            <div className="mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 text-center"
                                style={{ animation: 'slideUp 200ms ease-out' }}
                            >
                                {rsvpToast}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default EventDetailsModal;
