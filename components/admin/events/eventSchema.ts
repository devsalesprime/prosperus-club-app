// ============================================
// EVENT SCHEMA & SHARED TYPES
// ============================================
// Zod validation schema — NO JSX here (pure .ts)

import * as z from 'zod';

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
