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
