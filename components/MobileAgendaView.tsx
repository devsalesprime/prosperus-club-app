// components/MobileAgendaView.tsx
// Mobile Timeline View - Google Calendar Style
// Prosperus Club App v2.8

import React, { useMemo } from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import { ClubEvent } from '../types';
import { EventCard } from './EventCard';

interface MobileAgendaViewProps {
    events: ClubEvent[];
    onSelectEvent: (event: ClubEvent) => void;
}

interface GroupedEvents {
    date: string;
    dateObj: Date;
    dayNumber: string;
    dayName: string;
    events: ClubEvent[];
}

export const MobileAgendaView: React.FC<MobileAgendaViewProps> = ({ events, onSelectEvent }) => {
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

    // Empty state
    if (groupedEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 px-4">
                <Calendar size={64} className="text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Sem eventos próximos</h3>
                <p className="text-slate-400 text-center">
                    Não há eventos agendados para os próximos dias.
                </p>
            </div>
        );
    }

    return (
        <div className="mobile-agenda-view bg-slate-950">
            {/* Timeline */}
            <div className="timeline-container">
                {groupedEvents.map((group, groupIndex) => (
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

            {/* Bottom Padding */}
            <div className="h-20"></div>
        </div>
    );
};

export default MobileAgendaView;
