// ============================================
// YEARLY AGENDA VIEW — Grouped Event List by Month
// ============================================
// Custom year view for the Agenda since react-big-calendar
// doesn't support a native year view.

import React from 'react';
import { ClubEvent } from '../../types';
import { CalendarIcon, MapPin, Globe } from 'lucide-react';

const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

interface YearlyAgendaViewProps {
    events: ClubEvent[];
    onSelectEvent?: (event: ClubEvent) => void;
}

export const YearlyAgendaView: React.FC<YearlyAgendaViewProps> = ({ events, onSelectEvent }) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Filter events for current year and future, then group by month
    const grouped = events
        .filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() >= currentYear;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .reduce<Record<string, ClubEvent[]>>((acc, event) => {
            const d = new Date(event.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!acc[key]) acc[key] = [];
            acc[key].push(event);
            return acc;
        }, {});

    const monthKeys = Object.keys(grouped).sort((a, b) => {
        const [yA, mA] = a.split('-').map(Number);
        const [yB, mB] = b.split('-').map(Number);
        return yA !== yB ? yA - yB : mA - mB;
    });

    if (monthKeys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <CalendarIcon size={48} className="text-slate-600 mb-4" />
                <p className="text-lg font-semibold text-slate-400">Nenhum evento encontrado</p>
                <p className="text-sm text-slate-500 mt-1">Não há eventos agendados para o período.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto overscroll-contain px-2 md:px-4 py-4 space-y-6">
            {monthKeys.map(key => {
                const [year, month] = key.split('-').map(Number);
                const monthEvents = grouped[key];

                return (
                    <section key={key}>
                        {/* Month Header */}
                        <div className="flex items-center gap-2 mb-3 px-2">
                            <span className="text-lg">🗓️</span>
                            <h3 className="text-base font-bold text-white tracking-wide">
                                {MONTH_NAMES[month]} {year}
                            </h3>
                            <span className="ml-auto text-xs text-slate-500 font-medium">
                                {monthEvents.length} evento{monthEvents.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Event Cards */}
                        <div className="space-y-2">
                            {monthEvents.map(event => {
                                const eventDate = new Date(event.date);
                                const day = eventDate.getDate();
                                const weekday = eventDate.toLocaleDateString('pt-BR', { weekday: 'short' });
                                const isPast = eventDate < now;
                                const isPresential = event.category === 'PRESENTIAL';

                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => onSelectEvent?.(event)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                                            ${isPast
                                                ? 'bg-slate-800/40 border-slate-800 opacity-60'
                                                : 'bg-slate-800/80 border-slate-700 hover:border-yellow-600/50 hover:bg-slate-800'
                                            }`}
                                    >
                                        {/* Day Badge */}
                                        <div className={`flex-none w-12 h-12 rounded-lg flex flex-col items-center justify-center
                                            ${isPresential ? 'bg-purple-900/60 text-purple-300' : 'bg-emerald-900/60 text-emerald-300'}`}
                                        >
                                            <span className="text-lg font-bold leading-none">{day}</span>
                                            <span className="text-[10px] uppercase font-medium">{weekday}</span>
                                        </div>

                                        {/* Event Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {isPresential ? (
                                                    <MapPin size={12} className="text-purple-400 flex-none" />
                                                ) : (
                                                    <Globe size={12} className="text-emerald-400 flex-none" />
                                                )}
                                                <span className="text-xs text-slate-400 truncate">
                                                    {isPresential
                                                        ? (event.location || 'Presencial')
                                                        : 'Online'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Indicator */}
                                        <div className={`flex-none w-2 h-2 rounded-full ${isPresential ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
};
