// services/rsvpService.ts
// RSVP service for confirmed attendees list and CSV export

import { supabase } from '../lib/supabase';

export interface RsvpWithProfile {
    id: string;
    event_id: string;
    user_id: string;
    status: string;
    confirmed_at: string;
    cancelled_at: string | null;
    notes: string | null;
    ticket_code?: string;
    check_in_status?: boolean;
    updated_at?: string;
    profile: {
        id: string;
        name: string;
        image_url: string | null;
        company: string | null;
        job_title: string | null;
    };
}

export interface RsvpSummary {
    event_id: string;
    event_title: string;
    event_date: string;
    max_rsvps: number | null;
    confirmed_count: number;
    waitlist_count: number;
    is_full: boolean;
}

// ─── Get confirmed RSVPs with profile info ─────────────────────────

export async function getConfirmedRsvps(eventId: string): Promise<RsvpWithProfile[]> {
    const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
      id, event_id, user_id, status, confirmed_at, cancelled_at, notes,
      ticket_code, check_in_status, updated_at,
      profile:profiles!user_id (
        id, name, image_url, company, job_title
      )
    `)
        .eq('event_id', eventId)
        .eq('status', 'CONFIRMED')
        .order('confirmed_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as RsvpWithProfile[];
}

// ─── Get RSVP summary for an event ────────────────────────────────

export async function getRsvpSummary(eventId: string): Promise<RsvpSummary | null> {
    const { data, error } = await supabase
        .from('event_rsvp_summary')
        .select('*')
        .eq('event_id', eventId)
        .single();

    if (error) return null;
    return data as RsvpSummary;
}

// ─── Export confirmed attendees as CSV ─────────────────────────────

export async function exportRsvpCsv(eventId: string): Promise<string> {
    const rsvps = await getConfirmedRsvps(eventId);

    const header = 'Nome,Empresa,Cargo,Data de Confirmação\n';
    const rows = rsvps.map(r =>
        `"${r.profile.name}","${r.profile.company || ''}","${r.profile.job_title || ''}","${new Date(r.confirmed_at).toLocaleDateString('pt-BR')}"`
    ).join('\n');

    return header + rows;
}

// ─── TICKETS & CHECK-IN (PRD v2.0 - Ingressos QR Code) ──────────────

export interface TicketValidationResult {
    valid: boolean;
    error?: string;
    alreadyUsed?: boolean;
    rsvp?: RsvpWithProfile;
}

export async function getTicketByRsvpId(rsvpId: string): Promise<RsvpWithProfile | null> {
    const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
            id, event_id, user_id, status, confirmed_at, cancelled_at, notes,
            ticket_code, check_in_status,
            profile:profiles!user_id (
                id, name, image_url, company, job_title
            )
        `)
        .eq('id', rsvpId)
        .single();

    if (error) {
        console.error('Error fetching ticket:', error);
        return null;
    }
    return data as unknown as RsvpWithProfile;
}

export async function validateTicket(ticketCode: string): Promise<TicketValidationResult> {
    const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
            id, event_id, user_id, status, confirmed_at, cancelled_at, notes,
            ticket_code, check_in_status,
            profile:profiles!user_id (
                id, name, image_url, company, job_title
            )
        `)
        .eq('ticket_code', ticketCode)
        .single();

    if (error || !data) {
        return { valid: false, error: 'Ingresso Inválido ou não encontrado' };
    }

    if (data.status !== 'CONFIRMED') {
        return { valid: false, error: 'RSVP não está confirmado para este evento' };
    }

    if (data.check_in_status) {
        return { valid: false, error: 'Este ingresso já foi utilizado', alreadyUsed: true, rsvp: data as unknown as RsvpWithProfile };
    }

    return { valid: true, rsvp: data as unknown as RsvpWithProfile };
}

export async function confirmCheckIn(ticketCode: string): Promise<boolean> {
    const { error } = await supabase
        .from('event_rsvps')
        .update({ check_in_status: true, updated_at: new Date().toISOString() })
        .eq('ticket_code', ticketCode);

    if (error) {
        console.error('Error confirming check-in:', error);
        return false;
    }
    return true;
}

// ─── AUDIT DASHBOARD (PRD v2.0 - Etapa 5) ──────────────

export interface EventAuditStats {
    totalRSVPs: number;
    totalCheckedIn: number;
    totalNoShows: number;
    attendanceScore: number;
    attendeesList: RsvpWithProfile[];
}

export async function getEventAuditStats(eventId: string): Promise<EventAuditStats> {
    // Busca todos os confirmados do evento
    const attendeesList = await getConfirmedRsvps(eventId);
    
    // Calcula as métricas
    const totalRSVPs = attendeesList.length;
    const totalCheckedIn = attendeesList.filter(rsvp => rsvp.check_in_status === true).length;
    const totalNoShows = totalRSVPs - totalCheckedIn;
    
    // Calcula o percentual (protegendo contra divisão por zero)
    const attendanceScore = totalRSVPs > 0 ? Math.round((totalCheckedIn / totalRSVPs) * 100) : 0;
    
    return {
        totalRSVPs,
        totalCheckedIn,
        totalNoShows,
        attendanceScore,
        attendeesList
    };
}
