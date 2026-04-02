// ============================================
// EVENT CONFIG - Shared Category Styling
// ============================================
// Single source of truth for event category colors,
// used by EventCard, EventDetailsModal, and admin panels.

import React from 'react';
import { MapPin, Video, PlayCircle } from 'lucide-react';

export type EventCategoryKey = 'ONLINE' | 'PRESENTIAL' | 'RECORDED';

export interface CategoryStyle {
    bg: string;
    text: string;
    border: string;
    borderLeft: string;
    label: string;
    icon: React.ReactNode;
}

export const EVENT_CATEGORY_CONFIG: Record<EventCategoryKey, CategoryStyle> = {
    ONLINE: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        borderLeft: 'border-emerald-500',
        label: 'Online',
        icon: <Video size={14} className="text-emerald-400" />,
    },
    PRESENTIAL: {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        borderLeft: 'border-purple-500',
        label: 'Presencial',
        icon: <MapPin size={14} className="text-purple-400" />,
    },
    RECORDED: {
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        borderLeft: 'border-orange-500',
        label: 'Gravado',
        icon: <PlayCircle size={14} className="text-orange-400" />,
    },
};

export const getCategoryConfig = (category: string): CategoryStyle => {
    return EVENT_CATEGORY_CONFIG[category as EventCategoryKey] || EVENT_CATEGORY_CONFIG.ONLINE;
};
