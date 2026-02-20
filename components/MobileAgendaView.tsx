// components/MobileAgendaView.tsx
// Mobile Timeline View - Google Calendar Style
// Prosperus Club App v3.0

import React, { useMemo } from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CalendarDays } from 'lucide-react';
import { ClubEvent } from '../types';
import { EventCard } from './EventCard';

interface MobileAgendaViewProps {
    events: ClubEvent[];
    onSelectEvent: (event: ClubEvent) => void;
    onSwitchToMonth?: () => void;
}

interface GroupedEvents {
    date: string;
    dateObj: Date;
    dayNumber: string;
    dayName: string;
    events: ClubEvent[];
}

export const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({ events, onSelectEvent, onSwitchToMonth }) => {
    // Group events by date and filter future events
    const groupedEvents = useMemo(() => {
        const today = startOfDay(new Date());

        // Filter future events (including today)
        const futureEvents = events.filter(event => {
            const eventDate = startOfDay(new Date(event.date));
            return isAfter(eventDate, today) || eventDate.getTime() === today.getTime();
        });

        // Sort by date ascending
        const sorted = futureEvents.sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Group by date
        const grouped = sorted.reduce((acc, event) => {
            const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(event);
            return acc;
        }, {} as Record<string, ClubEvent[]>);

        // Convert to array format
        return Object.entries(grouped).map(([dateStr, evts]) => {
            // Parse date string as local date (not UTC) to avoid timezone shift
            const [year, month, day] = dateStr.split('-').map(Number);
            const dateObj = new Date(year, month - 1, day);
            return {
                date: dateStr,
                dateObj,
                dayNumber: format(dateObj, 'dd'),
                dayName: format(dateObj, 'EEE', { locale: ptBR }).toUpperCase(),
                events: evts
            };
        });
    }, [events]);

    // Empty state — Premium design with glow and CTA
    if (groupedEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 px-8 text-center">
                {/* Icon with subtle glow */}
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-600/10 rounded-full blur-xl scale-150" />
                    <div className="relative w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center">
                        <Calendar size={32} className="text-slate-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-slate-200">
                        Nenhum evento agendado
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-[240px]">
                        Novos eventos aparecerão aqui assim que forem publicados pela administração.
                    </p>
                </div>

                {/* CTA to switch to month view */}
                {onSwitchToMonth && (
                    <button
                        onClick={onSwitchToMonth}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                            border border-slate-700 hover:border-yellow-600/40
                            text-sm text-slate-400 hover:text-yellow-500
                            transition-all duration-200"
                    >
                        <CalendarDays size={14} />
                        Ver calendário do mês
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="mobile-agenda-view bg-slate-950 touch-pan-y">
            {/* Timeline */}
            <div className="timeline-container">
                {groupedEvents.map((group) => (
                    <div key={group.date} className="date-group">
                        {/* Sticky Date Header — opaque bg + elevated z for scroll-under */}
                        <div className="sticky top-0 z-20 px-4 py-3 pb-2 border-b border-slate-800/50 flex items-center gap-3 shadow-lg shadow-black/30" style={{ backgroundColor: '#0a1628' }}>
                            <div className="flex flex-col items-center justify-center bg-slate-800 rounded-lg p-2 min-w-[60px]">
                                <div className="text-3xl font-bold text-yellow-500 leading-none">
                                    {group.dayNumber}
                                </div>
                                <div className="text-xs font-bold text-slate-400 mt-1">
                                    {group.dayName}
                                </div>
                            </div>
                            <div className="text-sm text-slate-400">
                                {format(group.dateObj, "MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                        </div>

                        {/* Event Cards */}
                        <div className="event-cards px-4 py-2">
                            {group.events.map((event) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    variant="LIST"
                                    onClick={() => onSelectEvent(event)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Safe-area bottom spacer */}
            <div className="h-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
        </div>
    );
};

export default MobileAgendaView;

