// ConfirmedAttendeesSection.tsx
// Shows avatar chips of confirmed attendees for an event

import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { getConfirmedRsvps, RsvpWithProfile } from '../services/rsvpService';

interface Props {
    eventId: string;
}

const ConfirmedAttendeesSection: React.FC<Props> = ({ eventId }) => {
    const [rsvps, setRsvps] = useState<RsvpWithProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        getConfirmedRsvps(eventId)
            .then(data => { if (mounted) setRsvps(data); })
            .catch(() => { })
            .finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [eventId]);

    if (loading || rsvps.length === 0) return null;

    return (
        <div className="px-4 py-3">
            <div className="h-px bg-slate-800 mb-3" />
            <div className="flex items-center gap-1.5 mb-3">
                <Users size={13} className="text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Quem vai · {rsvps.length}
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {rsvps.slice(0, 12).map(rsvp => (
                    <div
                        key={rsvp.id}
                        className="flex items-center gap-1.5 bg-slate-800/60 rounded-full px-2.5 py-1 border border-slate-700/50"
                    >
                        {rsvp.profile.image_url ? (
                            <img
                                src={rsvp.profile.image_url}
                                alt={rsvp.profile.name}
                                className="w-5 h-5 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-yellow-600/30 flex items-center justify-center text-yellow-500 text-[10px] font-bold">
                                {rsvp.profile.name?.[0] || '?'}
                            </div>
                        )}
                        <span className="text-xs text-slate-300">
                            {rsvp.profile.name?.split(' ')[0] || 'Sócio'}
                        </span>
                    </div>
                ))}
                {rsvps.length > 12 && (
                    <div className="flex items-center px-2.5 py-1 text-xs text-slate-500">
                        +{rsvps.length - 12} mais
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConfirmedAttendeesSection;
