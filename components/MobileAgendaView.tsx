// components/MobileAgendaView.tsx
// Mobile Timeline View - Google Calendar Style
// Prosperus Club App v2.8

import React, { useMemo } from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MapPin, Video, Calendar, Clock } from 'lucide-react';
import { ClubEvent } from '../types';

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
        <div className="mobile-agenda-view bg-slate-950 min-h-screen">
            {/* Timeline */}
            <div className="timeline-container">
                {groupedEvents.map((group, groupIndex) => (
                    <div key={group.date} className="date-group">
                        {/* Sticky Date Header */}
                        <div className="sticky top-[60px] bg-slate-800 z-10 px-4 py-3 border-b border-slate-700 flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center bg-slate-900 rounded-lg p-2 min-w-[60px]">
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
                            {group.events.map((event, eventIndex) => {
                                const eventTime = format(new Date(event.date), 'HH:mm');
                                const isOnline = event.category === 'ONLINE';
                                const borderColor = isOnline ? 'border-green-500' : 'border-purple-600';
                                const bgColor = isOnline ? 'bg-green-500/10' : 'bg-purple-600/10';

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => onSelectEvent(event)}
                                        className={`event-card mb-3 bg-slate-900 border-l-4 ${borderColor} rounded-r-lg overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-yellow-500/10 hover:border-yellow-500`}
                                    >
                                        <div className="flex">
                                            {/* Time Column */}
                                            <div className="time-column flex-shrink-0 w-20 flex flex-col items-center justify-center bg-slate-800 p-3">
                                                <Clock size={16} className="text-slate-400 mb-1" />
                                                <div className="text-sm font-bold text-white">
                                                    {eventTime}
                                                </div>
                                            </div>

                                            {/* Event Content */}
                                            <div className={`event-content flex-1 p-4 ${bgColor}`}>
                                                <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                                                    {event.title}
                                                </h3>

                                                {/* Location/Link */}
                                                {event.location && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                                        <MapPin size={14} />
                                                        <span className="line-clamp-1">{event.location}</span>
                                                    </div>
                                                )}

                                                {event.link && !event.location && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                                                        <Video size={14} />
                                                        <span>Evento Online</span>
                                                    </div>
                                                )}

                                                {/* Category Badge */}
                                                <div className="mt-2 flex items-center gap-2">
                                                    <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${isOnline
                                                        ? 'bg-green-500/20 text-green-400'
                                                        : 'bg-purple-600/20 text-purple-400'
                                                        }`}>
                                                        {isOnline ? '🟢 Online' : '🟣 Presencial'}
                                                    </span>
                                                    {(event.sessions?.length || 0) > 1 && (
                                                        <span className="inline-block px-2 py-1 text-xs font-bold rounded bg-orange-500/20 text-orange-400">
                                                            📅 {event.sessions!.length} dias
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
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
