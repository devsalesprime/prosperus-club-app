// ==============================================
// EVENT DETAILS MODAL v2.0 — Premium Bottom Sheet
// ==============================================
// UX Redesign:
// - Bottom-sheet pattern (mobile-first)
// - Interactive timeline with visual selection states
// - Hero image with gradient overlay
// - State-aware RSVP footer
// - Swipe-down dismiss preserved

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSwipeDismiss } from '../hooks/useSwipeDismiss';
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
import ConfirmedAttendeesSection from './ConfirmedAttendeesSection';

type RsvpStatus = 'NONE' | 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'WAITLIST' | 'CANCELLED';

interface EventDetailsModalProps {
    event: ClubEvent;
    onClose: () => void;
    userId?: string;
}

// ── Helper: Generate .ics calendar link ──
const generateCalendarUrl = (event: ClubEvent, session?: EventSession) => {
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description || '');
    const location = encodeURIComponent(event.location || '');

    let startDate: string;
    let endDate: string;

    if (session) {
        const start = new Date(`${session.date}T${session.startTime}:00`);
        const end = new Date(`${session.date}T${session.endTime}:00`);
        startDate = start.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        endDate = end.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    } else {
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

// ── Format session date ──
const formatSessionDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
};

// ═══════════════════════════════════════════════
// SUBCOMPONENT: TimelineSession — Interactive node
// ═══════════════════════════════════════════════
function TimelineSession({
    session,
    index,
    isActive,
    isLast,
    onSelect,
    event,
    isAdded,
    onAddToCalendar,
}: {
    session: EventSession;
    index: number;
    isActive: boolean;
    isLast: boolean;
    onSelect: () => void;
    event: ClubEvent;
    isAdded: boolean;
    onAddToCalendar: () => void;
}) {
    return (
        <div className="flex gap-3">
            {/* COLUMN LEFT: line + node */}
            <div className="flex flex-col items-center" style={{ minWidth: '20px' }}>
                {/* Line above node (skip for first item) */}
                {index > 0 && (
                    <div className={`w-0.5 h-3 transition-colors duration-300 ${isActive ? 'bg-yellow-500' : 'bg-slate-700'
                        }`} />
                )}

                {/* TIMELINE NODE — the heart of interactivity */}
                <button
                    onClick={onSelect}
                    className={`
                        relative flex-shrink-0 w-5 h-5 rounded-full
                        border-2 transition-all duration-300 ease-out
                        ${isActive
                            ? 'bg-yellow-500 border-yellow-400'
                            : 'bg-transparent border-slate-600 hover:border-yellow-500/60'
                        }
                    `}
                    style={{
                        boxShadow: isActive ? '0 0 12px rgba(202,138,4,0.6)' : 'none',
                        minHeight: '20px',
                        minWidth: '20px',
                    }}
                    aria-label={`Selecionar Dia ${index + 1}`}
                >
                    {isActive && (
                        <span className="absolute inset-0 rounded-full bg-yellow-400/30 animate-ping pointer-events-none" />
                    )}
                </button>

                {/* Line below node (skip for last item) */}
                {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[40px] transition-colors duration-300 ${isActive ? 'bg-yellow-500/50' : 'bg-slate-700'
                        }`} />
                )}
            </div>

            {/* COLUMN RIGHT: day card */}
            <button
                onClick={onSelect}
                className={`
                    flex-1 mb-3 p-3 rounded-xl border text-left
                    transition-all duration-300 ease-out
                    ${isActive
                        ? 'bg-slate-800 border-yellow-600/40 shadow-lg shadow-yellow-900/10'
                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                    }
                `}
                style={{
                    transform: isActive ? 'scale(1.01)' : 'scale(1)',
                }}
            >
                {/* Card header */}
                <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-yellow-500' : 'text-slate-500'
                        }`}>
                        Dia {index + 1}
                    </span>
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddToCalendar();
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.stopPropagation();
                                onAddToCalendar();
                            }
                        }}
                        className={`text-xs px-2 py-1 rounded transition-all ${isAdded
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-slate-800 hover:bg-yellow-600 text-slate-400 hover:text-white active:scale-95'
                            }`}
                    >
                        {isAdded ? '✓ Adicionado' : '+ Agenda'}
                    </span>
                </div>

                {/* Date */}
                <p className={`text-sm font-semibold mb-1 capitalize transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-300'
                    }`}>
                    {formatSessionDate(session.date)}
                </p>

                {/* Time */}
                <div className="flex items-center gap-1.5">
                    <Clock size={12} className={`transition-colors duration-300 ${isActive ? 'text-yellow-500' : 'text-slate-500'}`} />
                    <span className={`text-xs transition-colors duration-300 ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        {session.startTime} — {session.endTime}
                    </span>
                </div>
            </button>
        </div>
    );
}


// ═══════════════════════════════════════════════
// MAIN COMPONENT: EventDetailsModal v2.0
// ═══════════════════════════════════════════════
export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose, userId }) => {
    const [addedSessions, setAddedSessions] = useState<Set<number>>(new Set());
    const [activeSessionIndex, setActiveSessionIndex] = useState<number>(0);

    // ── RSVP State ──
    const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('NONE');
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [rsvpToast, setRsvpToast] = useState<string | null>(null);
    const [confirmedCount, setConfirmedCount] = useState(0);

    // ── Swipe-down dismiss gesture ──
    const { offsetY, backdropOpacity, isDragging, bind: swipeBind, transition: swipeTransition } = useSwipeDismiss({
        onDismiss: onClose,
    });

    // ── Fetch RSVP status on mount ──
    useEffect(() => {
        if (!userId) return;
        const fetchRsvp = async () => {
            try {
                const { data } = await supabase
                    .from('event_rsvps')
                    .select('status')
                    .eq('event_id', event.id)
                    .eq('user_id', userId)
                    .maybeSingle();
                setRsvpStatus(data?.status || 'NONE');

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

    const handleAddToCalendar = (session?: EventSession, index?: number) => {
        const url = generateCalendarUrl(event, session);
        window.open(url, '_blank');
        if (index !== undefined) {
            setAddedSessions(prev => new Set([...prev, index]));
        }
    };

    const handleAddAll = () => {
        sessions.forEach((session, i) => {
            setTimeout(() => {
                const url = generateCalendarUrl(event, session);
                window.open(url, '_blank');
                setAddedSessions(prev => new Set([...prev, i]));
            }, i * 500);
        });
    };

    const heroImage = event.coverImage || event.bannerUrl;

    return createPortal(
        <div
            className="fixed inset-0 z-[70] flex items-end justify-center"
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{
                animation: 'edm-fadeIn 200ms ease-out',
                paddingBottom: 0,
            }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                style={{ opacity: backdropOpacity }}
                onClick={onClose}
            />

            {/* ═══ BOTTOM SHEET MODAL ═══ */}
            <div
                className="relative w-full md:max-w-2xl max-h-[92dvh] bg-slate-900 rounded-t-3xl flex flex-col overflow-hidden"
                style={{
                    animation: offsetY === 0 && !isDragging ? 'edm-slideUp 300ms ease-out' : 'none',
                    transform: `translateY(${offsetY}px)`,
                    transition: swipeTransition,
                    willChange: isDragging ? 'transform' : 'auto',
                }}
            >
                {/* ══ HERO IMAGE ══ */}
                <div className="relative flex-shrink-0" style={{ height: '200px' }}>
                    {heroImage ? (
                        <img
                            src={heroImage}
                            alt={event.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className={`w-full h-full flex items-center justify-center ${event.category === 'PRESENTIAL'
                            ? 'bg-gradient-to-br from-purple-900/60 to-slate-900'
                            : 'bg-gradient-to-br from-emerald-900/60 to-slate-900'
                            }`}>
                            <CalendarDays size={48} className="text-slate-600" />
                        </div>
                    )}

                    {/* Gradient overlay at base */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent pointer-events-none" />

                    {/* Drag handle */}
                    <div
                        {...swipeBind()}
                        className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-2 pb-4 cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                    >
                        <div className="w-10 h-1 bg-white/30 rounded-full" />
                    </div>

                    {/* Multi-day badge — top left */}
                    {isMultiDay && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 rounded-full shadow-lg">
                            <CalendarDays size={12} className="text-white" />
                            <span className="text-xs font-bold text-white">{sessions.length} dias</span>
                        </div>
                    )}

                    {/* Close button — top right */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors z-20"
                    >
                        <X size={16} className="text-white" />
                    </button>
                </div>

                {/* ══ SCROLLABLE CONTENT ══ */}
                <div
                    className="flex-1 overflow-y-auto overscroll-contain"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        paddingBottom: userId ? '100px' : '24px',
                    }}
                >

                    {/* Event Header */}
                    <div className="px-4 pt-4 pb-3">
                        {/* Category badge */}
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${event.category === 'PRESENTIAL'
                            ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            }`}>
                            {event.category === 'PRESENTIAL'
                                ? <MapPin size={11} />
                                : <Video size={11} />
                            }
                            {event.category === 'PRESENTIAL' ? 'Presencial' : 'Online'}
                        </div>

                        {/* Date & time */}
                        <div className="flex items-center gap-1.5 mb-2">
                            <Clock size={13} className="text-slate-500" />
                            <span className="text-sm text-slate-400">
                                {new Date(event.date).toLocaleDateString('pt-BR')} às {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        {/* Title */}
                        <h2 className="text-xl font-bold text-white leading-tight mb-3">
                            {event.title}
                        </h2>

                        {/* Description — no "SOBRE O EVENTO" label */}
                        {event.description && (
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {event.description}
                            </p>
                        )}
                    </div>

                    {/* ═══ DIVIDER ═══ */}
                    {(isMultiDay || event.location || event.link || (event.materials && event.materials.length > 0)) && (
                        <div className="h-px bg-slate-800 mx-4" />
                    )}

                    {/* ═══ TIMELINE SECTION ═══ */}
                    {isMultiDay && (
                        <div className="px-4 py-4">
                            <div className="flex items-center gap-2 mb-4">
                                <CalendarDays size={16} className="text-yellow-500" />
                                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                                    Cronograma
                                </h3>
                            </div>

                            <div className="pl-1">
                                {sessions.map((session, index) => (
                                    <TimelineSession
                                        key={index}
                                        session={session}
                                        index={index}
                                        isActive={activeSessionIndex === index}
                                        isLast={index === sessions.length - 1}
                                        onSelect={() => setActiveSessionIndex(index)}
                                        event={event}
                                        isAdded={addedSessions.has(index)}
                                        onAddToCalendar={() => handleAddToCalendar(session, index)}
                                    />
                                ))}
                            </div>

                            {/* Add All button */}
                            <button
                                onClick={handleAddAll}
                                className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-2.5 rounded-xl transition-all text-xs border border-slate-700 active:scale-[0.98]"
                            >
                                <CalendarPlus size={14} />
                                Adicionar Todos à Agenda
                            </button>
                        </div>
                    )}

                    {/* Single-day: simple calendar button */}
                    {!isMultiDay && sessions.length <= 1 && (
                        <div className="px-4 py-3">
                            <button
                                onClick={() => handleAddToCalendar(sessions[0])}
                                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium py-2.5 rounded-xl transition-all text-sm border border-slate-700 active:scale-[0.98]"
                            >
                                <CalendarPlus size={16} />
                                Adicionar à Agenda
                            </button>
                        </div>
                    )}

                    {/* ═══ DIVIDER ═══ */}
                    {(event.location || event.link) && (
                        <div className="h-px bg-slate-800 mx-4" />
                    )}

                    {/* ═══ LOCATION ═══ */}
                    {event.location && (
                        <div className="px-4 py-3">
                            <a
                                href={event.mapLink || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-purple-500/30 transition-colors group"
                                onClick={(e) => !event.mapLink && e.preventDefault()}
                            >
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin size={15} className="text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 mb-0.5">Local</p>
                                    <p className="text-sm text-slate-200 group-hover:text-purple-300 transition-colors">
                                        {event.location}
                                    </p>
                                </div>
                                {event.mapLink && (
                                    <ExternalLink size={14} className="text-slate-600 ml-auto self-center flex-shrink-0" />
                                )}
                            </a>
                        </div>
                    )}

                    {/* ═══ ONLINE LINK ═══ */}
                    {event.link && (
                        <div className="px-4 py-3">
                            <a
                                href={event.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-colors group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                                    <Video size={15} className="text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500 mb-0.5">Link da Reunião</p>
                                    <p className="text-sm text-emerald-400 truncate">{event.link}</p>
                                    {event.meetingPassword && (
                                        <p className="text-xs text-slate-500 mt-0.5">Senha: {event.meetingPassword}</p>
                                    )}
                                </div>
                                <ExternalLink size={14} className="text-slate-600 flex-shrink-0" />
                            </a>
                        </div>
                    )}

                    {/* ═══ MATERIALS ═══ */}
                    {event.materials && event.materials.length > 0 && (
                        <>
                            <div className="h-px bg-slate-800 mx-4" />
                            <div className="px-4 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <FileText size={16} className="text-yellow-500" />
                                    <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                                        Ata e Materiais
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    {event.materials.map((material, index) => {
                                        const { icon: Icon, color } = getMaterialIconAndColor(material.type);
                                        return (
                                            <a
                                                key={index}
                                                href={material.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl transition border border-slate-700/50 group active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${color === 'red' ? 'bg-red-500/10 text-red-400' :
                                                        color === 'purple' ? 'bg-purple-500/10 text-purple-400' :
                                                            color === 'blue' ? 'bg-blue-500/10 text-blue-400' :
                                                                'bg-green-500/10 text-green-400'
                                                        }`}>
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
                        </>
                    )}
                </div>

                {/* ═══ CONFIRMED ATTENDEES ═══ */}
                <ConfirmedAttendeesSection eventId={event.id} />

                {/* ═══ RSVP STICKY FOOTER ═══ */}
                {userId && (
                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent pt-8 rounded-b-none">
                        <div className="flex flex-col items-center gap-2">

                            {/* NONE: Confirmar Presença */}
                            {rsvpStatus === 'NONE' && (
                                <button
                                    onClick={handleRequestRsvp}
                                    disabled={rsvpLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all active:scale-[0.97] shadow-lg shadow-yellow-900/20 text-sm disabled:opacity-50"
                                >
                                    {rsvpLoading ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                                    Confirmar Presença
                                </button>
                            )}

                            {/* PENDING: Aguardando */}
                            {rsvpStatus === 'PENDING' && (
                                <div className="w-full flex flex-col items-center gap-2">
                                    <div className="w-full flex items-center justify-center gap-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold py-3.5 px-4 rounded-xl text-sm">
                                        <Clock3 size={16} className="shrink-0 animate-pulse" />
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

                            {/* CONFIRMED: Presença Confirmada */}
                            {rsvpStatus === 'CONFIRMED' && (
                                <div className="w-full flex flex-col items-center gap-2">
                                    <div className="w-full flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold py-3.5 px-4 rounded-xl text-sm">
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

                            {/* REJECTED */}
                            {rsvpStatus === 'REJECTED' && (
                                <div className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 font-semibold py-3.5 px-4 rounded-xl text-sm">
                                    <XCircle size={16} className="shrink-0" />
                                    <span>Não Aprovado</span>
                                </div>
                            )}

                            {/* WAITLIST */}
                            {rsvpStatus === 'WAITLIST' && (
                                <div className="w-full flex items-center justify-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold py-3.5 px-4 rounded-xl text-sm">
                                    <Clock3 size={16} className="shrink-0" />
                                    <span>Lista de Espera</span>
                                </div>
                            )}

                            {/* Confirmed counter */}
                            {confirmedCount > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                    <Users size={12} className="text-emerald-500" />
                                    <span>{confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''}</span>
                                </div>
                            )}
                        </div>

                        {/* Toast */}
                        {rsvpToast && (
                            <div
                                className="mt-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 text-center"
                                style={{ animation: 'edm-slideUpSmall 200ms ease-out' }}
                            >
                                {rsvpToast}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CSS Animations — namespaced to avoid conflicts */}
            <style>{`
                @keyframes edm-fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes edm-slideUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes edm-slideUpSmall {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
};

export default EventDetailsModal;
