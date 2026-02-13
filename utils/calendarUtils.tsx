/**
 * Calendar utility functions extracted from App.tsx
 * Handles ICS generation, Google Calendar links, Outlook links, and date formatting.
 */
import React, { useMemo } from 'react';
import { dateFnsLocalizer, Navigate } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClubEvent as Event } from '../types';

// --- LOCALIZER ---

const locales = {
    'pt-BR': ptBR,
};

export const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

// --- HELPER FUNCTIONS ---

export const formatDateForCalendar = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
        date.getFullYear() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        'T' +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds())
    );
};

export const escapeICS = (text: string = '') =>
    text.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n');

export const generateGoogleCalendarUrl = (event: Event) => {
    const startDate = formatDateForCalendar(new Date(event.date));
    const endDate = event.endDate
        ? formatDateForCalendar(new Date(event.endDate))
        : formatDateForCalendar(new Date(new Date(event.date).getTime() + 3600000));

    const details = `Detalhes do evento Prosperus:\n${event.description}\n\nLink: ${event.link || event.videoUrl || 'N/A'}`;
    const location = event.location || 'Online';

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${startDate}/${endDate}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&sf=true&output=xml`;
};

export const generateOutlookCalendarUrl = (event: Event) => {
    const start = new Date(event.date).toISOString();
    const end = event.endDate
        ? new Date(event.endDate).toISOString()
        : new Date(new Date(event.date).getTime() + 3600000).toISOString();

    const details = `Detalhes do evento Prosperus: ${event.description}. Link: ${event.link || event.videoUrl || 'N/A'}`;
    const location = event.location || 'Online';

    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&startdt=${start}&enddt=${end}&subject=${encodeURIComponent(event.title)}&body=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
};

export const downloadIcsFile = (event: Event) => {
    const start = formatDateForCalendar(new Date(event.date));
    const end = event.endDate
        ? formatDateForCalendar(new Date(event.endDate))
        : formatDateForCalendar(new Date(new Date(event.date).getTime() + 3600000));

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Prosperus Club//App//PT
BEGIN:VEVENT
UID:${event.id}@prosperus.club
DTSTAMP:${formatDateForCalendar(new Date())}
DTSTART:${start}
DTEND:${end}
SUMMARY:${escapeICS(event.title)}
DESCRIPTION:${escapeICS(event.description)}
LOCATION:${escapeICS(event.location || 'Online')}
URL:${event.link || event.videoUrl || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- CUSTOM YEAR VIEW COMPONENT ---

interface YearViewProps {
    date: Date;
    onNavigate: (date: Date) => void;
    onView: (view: string) => void;
}

export const YearView = ({ date, onNavigate, onView }: YearViewProps) => {
    const months = useMemo(() => {
        const ms = [];
        for (let i = 0; i < 12; i++) {
            ms.push(new Date(date.getFullYear(), i, 1));
        }
        return ms;
    }, [date]);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 h-full overflow-y-auto">
            {months.map((month) => {
                const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
                const startDay = month.getDay();

                return (
                    <div
                        key={month.toISOString()}
                        className="bg-slate-800 rounded-lg p-3 border border-slate-700 hover:border-yellow-600/50 cursor-pointer transition flex flex-col items-center"
                        onClick={() => {
                            onNavigate(month);
                            onView('month');
                        }}
                    >
                        <h3 className="font-bold text-white uppercase text-sm mb-2">
                            {month.toLocaleString('pt-BR', { month: 'long' })}
                        </h3>
                        <div className="grid grid-cols-7 gap-1 text-[8px] text-center w-full">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={`${d}-${i}`} className="text-slate-500 font-bold">{d}</span>)}
                            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const isWeekend = (startDay + i) % 7 === 0 || (startDay + i + 1) % 7 === 0;
                                return (
                                    <div key={i} className={`h-1 w-1 rounded-full mx-auto ${isWeekend ? 'bg-slate-700' : 'bg-slate-500'}`}></div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

YearView.title = (date: Date) => { return date.getFullYear().toString(); };
YearView.navigate = (date: Date, action: string) => {
    if (action === Navigate.PREVIOUS) return new Date(date.getFullYear() - 1, 0, 1);
    if (action === Navigate.NEXT) return new Date(date.getFullYear() + 1, 0, 1);
    return date;
};
