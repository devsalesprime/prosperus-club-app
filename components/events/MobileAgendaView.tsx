// components/MobileAgendaView.tsx
// Mobile Timeline View - Premium Split Cards
// Prosperus Club App v3.0

import React, { useMemo } from 'react';
import { format, isAfter, startOfDay, differenceInDays, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Video, MapPin } from 'lucide-react';
import { ClubEvent } from '../../types';
import { getCategoryConfig } from '../../lib/eventConfig';

interface MobileAgendaViewProps {
    events: ClubEvent[];
    onSelectEvent: (event: ClubEvent) => void;
    onSwitchToMonth?: () => void;
}

export const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({ events, onSelectEvent }) => {
    // Filter future events (including today) and sort
    const futureEvents = useMemo(() => {
        const today = startOfDay(new Date());
        return events.filter(event => {
            const eventDate = startOfDay(new Date(event.date));
            return isAfter(eventDate, today) || eventDate.getTime() === today.getTime();
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [events]);

    if (futureEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full px-8 text-center text-prosperus-grey">
                Nenhum evento agendado
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 space-y-4 agenda-scroll-area" style={{ WebkitOverflowScrolling: 'touch', minHeight: 0 } as React.CSSProperties}>
            <style>{`.agenda-scroll-area::-webkit-scrollbar { display: none; } .agenda-scroll-area { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
            
            {futureEvents.map((event) => {
                const config = getCategoryConfig(event.category);
                const eventDate = new Date(event.date);
                const now = new Date();
                
                const days = differenceInDays(eventDate, now);
                const totalHours = differenceInHours(eventDate, now);
                const hours = totalHours % 24;
                const isFinished = eventDate.getTime() < now.getTime();

                // Split date formatting
                const dayStr = format(eventDate, 'dd');
                const weekStr = format(eventDate, 'EEEE', { locale: ptBR }).toUpperCase();
                const monthStr = format(eventDate, 'MMMM', { locale: ptBR }).toUpperCase();
                const yearStr = format(eventDate, 'yyyy');
                const formattedExtendedDate = `${weekStr}\n${monthStr} DE\n${yearStr}`;

                return (
                    <div 
                        key={event.id}
                        onClick={() => onSelectEvent(event)}
                        className="bg-prosperus-card/80 rounded-2xl border border-prosperus-border flex w-full overflow-hidden shadow-lg min-h-[160px] relative cursor-pointer hover:border-prosperus-gold/50 transition-colors"
                    >
                        {/* LADO ESQUERDO */}
                        <div className="bg-[#051421] w-[110px] shrink-0 flex flex-col items-center justify-center p-3 border-r border-prosperus-border/50">
                            <span className="text-5xl font-black text-prosperus-gold leading-none tracking-tight">
                                {dayStr}
                            </span>
                            <span className="text-[9px] font-bold text-prosperus-gold uppercase text-center mt-3 tracking-widest leading-[1.4] whitespace-pre-line">
                                {formattedExtendedDate}
                            </span>
                        </div>

                        {/* LADO DIREITO */}
                        <div className="flex-1 p-5 flex flex-col relative justify-center gap-1 min-w-0">
                            <div className="flex justify-between items-start w-full mb-1 gap-2">
                                {/* Esquerda: Horário */}
                                <span className="text-sm font-medium text-prosperus-white shrink-0">
                                    {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {/* Direita: Cronômetro com Relógio */}
                                <div className="flex items-center gap-1.5 shrink-0 justify-end min-w-0">
                                    <span className="text-[10px] sm:text-xs font-bold text-prosperus-gold uppercase truncate text-right">
                                        {isFinished ? 'Concluído' : `Faltam ${days > 0 ? `${days}D ` : ''}${hours}H`}
                                    </span>
                                    <Clock size={14} strokeWidth={2.5} className="text-prosperus-gold shrink-0" />
                                </div>
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-prosperus-white leading-tight mb-2 line-clamp-2 break-words whitespace-normal w-full">
                                {event.title}
                            </h3>

                            {/* Tags de Categoria e Sub */}
                            <div className="flex flex-wrap gap-2 mb-2">
                                <span className={`border px-3 py-1 rounded text-xs font-medium w-fit flex items-center gap-1.5 ${
                                    event.category === 'PRESENTIAL' ? 'border-purple-500/50 bg-purple-500/10 text-purple-400' :
                                    event.category === 'ONLINE' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' :
                                    'border-slate-500/50 bg-slate-500/10 text-slate-400'
                                }`}>
                                    {event.category === 'PRESENTIAL' ? 'Presencial' : event.category === 'ONLINE' ? 'Online' : config.label}
                                </span>
                            </div>

                            {/* Locais/Links com Icones */}
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-prosperus-grey mt-2 truncate w-full">
                                {event.category === 'ONLINE' ? (
                                    <Video size={14} className="text-emerald-400 shrink-0" />
                                ) : (
                                    <MapPin size={14} className="text-purple-400 shrink-0" />
                                )}
                                <span className="truncate">
                                    {event.location || (event.category === 'ONLINE' 
                                        ? (event.link?.includes('zoom') ? 'Zoom' 
                                           : event.link?.includes('meet.google') ? 'Google Meet' 
                                           : event.link?.includes('teams') ? 'Microsoft Teams' 
                                           : 'Plataforma Online') 
                                        : 'A definir')}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MobileAgendaView;
