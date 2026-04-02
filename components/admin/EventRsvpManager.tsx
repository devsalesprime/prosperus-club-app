// EventRsvpManager.tsx
// Admin panel: list of confirmed attendees + CSV export

import React, { useState, useEffect } from 'react';
import { Download, Users, Loader2 } from 'lucide-react';
import { getConfirmedRsvps, exportRsvpCsv, RsvpWithProfile } from '../../services/rsvpService';

interface Props {
    eventId: string;
    eventTitle: string;
}

const EventRsvpManager: React.FC<Props> = ({ eventId, eventTitle }) => {
    const [rsvps, setRsvps] = useState<RsvpWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        let mounted = true;
        getConfirmedRsvps(eventId)
            .then(data => { if (mounted) setRsvps(data); })
            .catch(err => console.error('Error loading RSVPs:', err))
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [eventId]);

    const handleExport = async () => {
        setExporting(true);
        try {
            const csv = await exportRsvpCsv(eventId);
            const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rsvp_${eventTitle.replace(/\s+/g, '_')}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting CSV:', err);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Users size={16} className="text-yellow-500" />
                    <h3 className="text-sm font-semibold text-white">
                        Confirmados · {rsvps.length}
                    </h3>
                </div>
                {rsvps.length > 0 && (
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        {exporting ? (
                            <Loader2 size={12} className="animate-spin" />
                        ) : (
                            <Download size={12} />
                        )}
                        {exporting ? 'Exportando...' : 'Exportar CSV'}
                    </button>
                )}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-slate-600" />
                </div>
            ) : rsvps.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm">
                    Nenhuma confirmação ainda
                </div>
            ) : (
                <div className="space-y-2">
                    {rsvps.map((rsvp, i) => (
                        <div
                            key={rsvp.id}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30"
                        >
                            <span className="text-xs text-slate-600 w-5 text-center font-mono">
                                {i + 1}
                            </span>
                            {rsvp.profile.image_url ? (
                                <img
                                    src={rsvp.profile.image_url}
                                    alt={rsvp.profile.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-yellow-600/20 flex items-center justify-center text-yellow-500 text-sm font-bold">
                                    {rsvp.profile.name?.[0] || '?'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">
                                    {rsvp.profile.name}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {rsvp.profile.job_title || ''}
                                    {rsvp.profile.company && rsvp.profile.job_title && ' · '}
                                    {rsvp.profile.company || ''}
                                </p>
                            </div>
                            <span className="text-xs text-slate-600 shrink-0">
                                {new Date(rsvp.confirmed_at).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EventRsvpManager;
