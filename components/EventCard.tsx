// ============================================
// EVENT CARD - Unified Component
// ============================================
// Single card component for all event displays.
// Variants: HERO (Home widget) and LIST (Agenda timeline)

import React from 'react';
import { Clock, MapPin, Video, Sparkles, Calendar, CalendarDays } from 'lucide-react';
import { ClubEvent } from '../types';
import { getCategoryConfig } from '../lib/eventConfig';

interface EventCardProps {
    event: ClubEvent;
    variant: 'HERO' | 'LIST';
    onClick: () => void;
    onViewAgenda?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, variant, onClick, onViewAgenda }) => {
    if (variant === 'HERO') return <HeroCard event={event} onClick={onClick} onViewAgenda={onViewAgenda} />;
    return <ListCard event={event} onClick={onClick} />;
};

// ═══════════════════════════════════════════
// HERO Variant — Home Widget
// ═══════════════════════════════════════════

const HeroCard: React.FC<{ event: ClubEvent; onClick: () => void; onViewAgenda?: () => void }> = ({
    event,
    onClick,
    onViewAgenda,
}) => {
    const config = getCategoryConfig(event.category);
    const eventDate = new Date(event.date);
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
    const isToday = eventDate.toDateString() === now.toDateString();
    const isMultiDay = (event.sessions?.length || 0) > 1;

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 overflow-hidden flex flex-col md:flex-row hover:border-yellow-600/50 transition-all group shadow-xl hover:shadow-2xl hover:shadow-yellow-600/10">
            {/* Gold Date Block */}
            <div
                className="md:w-32 bg-gradient-to-br from-[#FFDA71] to-[#D4AF37] p-6 flex flex-col items-center justify-center text-center shrink-0 relative overflow-hidden cursor-pointer"
                onClick={onClick}
                title="Clique para ver detalhes"
            >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 transform rotate-45 translate-x-8 -translate-y-8" />
                <span className="text-5xl font-black text-slate-900 leading-none mb-1 relative z-10">
                    {eventDate.getDate().toString().padStart(2, '0')}
                </span>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2 relative z-10">
                    {eventDate.toLocaleString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()}
                </span>
                <div className="flex items-center gap-1 text-slate-700 relative z-10">
                    <Clock size={12} />
                    <span className="text-xs font-bold">
                        {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div
                className="p-5 flex-1 flex flex-col justify-center min-w-0 bg-slate-900/50 cursor-pointer"
                onClick={onClick}
                title="Clique para ver detalhes"
            >
                {/* Badges Row */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {/* Category Badge */}
                    <span className={`px-2.5 py-1 ${config.bg} ${config.text} border ${config.border} text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5`}>
                        {config.icon}
                        {config.label}
                    </span>

                    {/* Multi-day Badge */}
                    {isMultiDay && (
                        <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <CalendarDays size={12} className="text-orange-400" />
                            {event.sessions!.length} dias
                        </span>
                    )}

                    {/* Countdown Badge */}
                    {timeDiff > 0 && (
                        <span className={`px-2.5 py-1 ${isToday ? 'bg-yellow-500 text-slate-900 animate-pulse' : 'bg-yellow-500/10 text-[#FFDA71] border border-yellow-500/30'} text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5`}>
                            <Sparkles size={12} className={isToday ? 'text-slate-900' : 'text-[#FFDA71]'} />
                            {isToday ? 'É HOJE!' : `Faltam ${days > 0 ? `${days}d ` : ''}${hours}h`}
                        </span>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-white mb-2 line-clamp-2 group-hover:text-[#FFDA71] transition-colors leading-tight">
                    {event.title}
                </h3>

                {/* Location / Link */}
                <div className="flex items-center text-slate-400 text-sm">
                    {event.category === 'PRESENTIAL' ? (
                        <MapPin size={16} className="mr-1.5 shrink-0 text-purple-400" />
                    ) : (
                        <Video size={16} className="mr-1.5 shrink-0 text-emerald-400" />
                    )}
                    <span className="truncate font-medium">
                        {event.location || event.link || 'Link disponível após inscrição'}
                    </span>
                </div>
            </div>

            {/* CTA - Ver Agenda */}
            {onViewAgenda && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onViewAgenda();
                    }}
                    className="p-5 flex items-center justify-center border-t md:border-t-0 md:border-l border-slate-700/50 bg-slate-800/50 md:w-32 hover:bg-yellow-600/10 transition-all"
                    title="Ver calendário completo"
                >
                    <div className="flex flex-col items-center gap-2 text-[#FFDA71] hover:text-yellow-400 transition-colors">
                        <span className="text-xs font-bold uppercase tracking-wider text-center">Ver Agenda</span>
                        <Calendar size={24} className="group-hover:scale-110 transition-transform" />
                    </div>
                </button>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════
// LIST Variant — Agenda Timeline Card
// Unified visual language with HERO variant
// ═══════════════════════════════════════════

const ListCard: React.FC<{ event: ClubEvent; onClick: () => void }> = ({ event, onClick }) => {
    const config = getCategoryConfig(event.category);
    const eventDate = new Date(event.date);
    const eventTime = eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const isMultiDay = (event.sessions?.length || 0) > 1;

    // Countdown (same as HERO)
    const now = new Date();
    const timeDiff = eventDate.getTime() - now.getTime();
    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    const hours = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
    const isToday = eventDate.toDateString() === now.toDateString();

    return (
        <div
            onClick={onClick}
            className={`mb-3 bg-slate-900/80 border-l-4 ${config.borderLeft} rounded-r-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-500/10 hover:border-yellow-500 group`}
        >
            <div className="flex">
                {/* Time Column — dark panel */}
                <div className="flex-shrink-0 w-20 flex flex-col items-center justify-center bg-slate-900 p-3 border-r border-slate-800">
                    <Clock size={16} className="text-slate-500 mb-1" />
                    <div className="text-sm font-bold text-white">{eventTime}</div>
                </div>

                {/* Event Content — subtle category-tinted bg */}
                <div className="flex-1 p-4 bg-slate-800/50">
                    <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-[#FFDA71] transition-colors">
                        {event.title}
                    </h3>

                    {/* Location / Link — same icons as HERO */}
                    {event.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <MapPin size={16} className="shrink-0 text-purple-400" />
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    )}
                    {event.link && !event.location && (
                        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Video size={16} className="shrink-0 text-emerald-400" />
                            <span>Evento Online</span>
                        </div>
                    )}

                    {/* Badges — identical to HERO variant */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {/* Category Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
                            {config.icon}
                            {config.label}
                        </span>

                        {/* Multi-day Badge */}
                        {isMultiDay && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                <CalendarDays size={12} />
                                {event.sessions!.length} dias
                            </span>
                        )}

                        {/* Countdown Badge — now present in LIST too */}
                        {timeDiff > 0 && (
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] font-black uppercase tracking-wider ${isToday ? 'bg-yellow-500 text-slate-900 animate-pulse' : 'bg-yellow-500/10 text-[#FFDA71] border border-yellow-500/30'}`}>
                                <Sparkles size={12} className={isToday ? 'text-slate-900' : 'text-[#FFDA71]'} />
                                {isToday ? 'É HOJE!' : `Faltam ${days > 0 ? `${days}d ` : ''}${hours}h`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
