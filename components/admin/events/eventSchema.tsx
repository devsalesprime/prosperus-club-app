// ============================================
// EVENT SCHEMA & SHARED TYPES
// ============================================
// Zod validation schema + CategoryBadge sub-component
// Extracted from EventsModule for modularity

import React from 'react';
import * as z from 'zod';
import { EventCategory } from '../../../types';

// --- ZOD SCHEMA ---
export const eventSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().min(5, 'Descrição deve ter no mínimo 5 caracteres'),
    type: z.enum(['MEMBER', 'TEAM', 'PRIVATE']),
    category: z.enum(['PRESENTIAL', 'ONLINE']),
    date: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de término é obrigatória'),
    bannerUrl: z.string().optional(),
    location: z.string().optional(),
    mapLink: z.string().url('URL do mapa inválida').optional().or(z.literal('')),
    link: z.string().url('URL da reunião inválida').optional().or(z.literal('')),
    meetingPassword: z.string().optional()
}).refine((data) => {
    if (data.date && data.endDate) {
        return new Date(data.endDate) >= new Date(data.date);
    }
    return true;
}, { message: 'Data de término deve ser posterior à data de início', path: ['endDate'] })
    .refine((data) => {
        if (data.category === 'PRESENTIAL') return !!data.location && data.location.length > 0;
        return true;
    }, { message: 'Localização é obrigatória para eventos presenciais', path: ['location'] })
    .refine((data) => {
        if (data.category === 'ONLINE') return !!data.link && data.link.length > 0;
        return true;
    }, { message: 'Link da reunião é obrigatório para eventos online', path: ['link'] });

export type EventFormData = z.infer<typeof eventSchema>;

// --- CATEGORY BADGE ---
export const CategoryBadge = ({ category }: { category: EventCategory }) => {
    const config = {
        ONLINE: { bg: 'bg-[#10b981]/10', text: 'text-[#10b981]', border: 'border-[#10b981]/30', label: 'Online' },
        PRESENTIAL: { bg: 'bg-[#9333ea]/10', text: 'text-[#9333ea]', border: 'border-[#9333ea]/30', label: 'Presencial' },
        RECORDED: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', label: 'Gravado (Legacy)' }
    };
    const style = config[category] || config.ONLINE;
    return (
        <span className={`px-2 py-1 ${style.bg} ${style.text} border ${style.border} text-xs font-bold uppercase tracking-wider inline-block`}>
            {style.label}
        </span>
    );
};
