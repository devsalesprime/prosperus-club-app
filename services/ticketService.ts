// services/ticketService.ts
// V2 Ticket Service — Multi-day tickets, Guest support, new event_tickets table

import { supabase } from '../lib/supabase';
import { EventTicket, TicketOwnerType } from '../types';

// ─── INTERFACES ───────────────────────────────────────────────────

export interface TicketWithProfile extends EventTicket {
    rsvp?: {
        user_id: string;
        profile?: {
            id: string;
            name: string;
            image_url: string | null;
            company: string | null;
            job_title: string | null;
        };
    };
}

export interface TicketValidationResultV2 {
    valid: boolean;
    error?: string;
    alreadyUsed?: boolean;
    ticket?: TicketWithProfile;
}

// ─── GENERATE TICKETS FOR RSVP (Multi-day) ────────────────────────
// Called when a member confirms presence. Creates 1 ticket per event day.

export async function generateTicketsForRsvp(
    rsvpId: string,
    eventId: string,
    memberName: string
): Promise<EventTicket[]> {
    // 1. Fetch event sessions to determine days
    const { data: event } = await supabase
        .from('club_events')
        .select('date, sessions')
        .eq('id', eventId)
        .single();

    if (!event) throw new Error('Evento não encontrado');

    // 2. Build array of dates based on sessions
    const eventDates: string[] = [];
    const sessions = event.sessions as { date: string }[] | null;

    if (sessions && sessions.length > 0) {
        // Multi-day: use each session's date
        sessions.forEach((s: { date: string }) => {
            if (s.date && !eventDates.includes(s.date)) {
                eventDates.push(s.date);
            }
        });
    }

    // Fallback: if no sessions or empty, use event.date
    if (eventDates.length === 0) {
        const fallbackDate = event.date
            ? new Date(event.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        eventDates.push(fallbackDate);
    }

    // 3. Check for already existing tickets (idempotency)
    const { data: existing } = await supabase
        .from('event_tickets')
        .select('event_date')
        .eq('rsvp_id', rsvpId)
        .eq('owner_type', 'MEMBER');

    const existingDates = new Set((existing || []).map(t => t.event_date));

    // 4. Only create tickets for dates that don't have one yet
    const newDates = eventDates.filter(d => !existingDates.has(d));

    if (newDates.length === 0) {
        // All tickets already exist, just return existing ones
        const { data } = await supabase
            .from('event_tickets')
            .select('*')
            .eq('rsvp_id', rsvpId)
            .order('event_date', { ascending: true });
        return (data || []) as EventTicket[];
    }

    const ticketsToInsert = newDates.map(date => ({
        rsvp_id: rsvpId,
        event_id: eventId,
        owner_type: 'MEMBER' as TicketOwnerType,
        owner_name: memberName,
        event_date: date,
    }));

    const { data: inserted, error } = await supabase
        .from('event_tickets')
        .insert(ticketsToInsert)
        .select('*');

    if (error) throw error;
    return (inserted || []) as EventTicket[];
}

// ─── ADD GUEST TICKETS ─────────────────────────────────────────────
// Creates guest tickets (1 per day) linked to the member's RSVP

export async function addGuestToRsvp(
    rsvpId: string,
    eventId: string,
    guestName: string,
    guestRole: string = 'Social Media'
): Promise<EventTicket[]> {
    // 1. Check if guest already exists for this RSVP
    const { data: existingGuest } = await supabase
        .from('event_tickets')
        .select('id')
        .eq('rsvp_id', rsvpId)
        .eq('owner_type', 'GUEST');

    if (existingGuest && existingGuest.length > 0) {
        throw new Error('Este RSVP já possui um convidado registrado.');
    }

    // 2. Get event dates (same logic as generateTicketsForRsvp)
    const { data: event } = await supabase
        .from('club_events')
        .select('date, sessions')
        .eq('id', eventId)
        .single();

    if (!event) throw new Error('Evento não encontrado');

    const eventDates: string[] = [];
    const sessions = event.sessions as { date: string }[] | null;

    if (sessions && sessions.length > 0) {
        sessions.forEach((s: { date: string }) => {
            if (s.date && !eventDates.includes(s.date)) {
                eventDates.push(s.date);
            }
        });
    }
    if (eventDates.length === 0) {
        const fallbackDate = event.date
            ? new Date(event.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
        eventDates.push(fallbackDate);
    }

    // 3. Create guest tickets (1 per day)
    const guestTickets = eventDates.map(date => ({
        rsvp_id: rsvpId,
        event_id: eventId,
        owner_type: 'GUEST' as TicketOwnerType,
        owner_name: guestName,
        owner_role: guestRole,
        event_date: date,
    }));

    const { data: inserted, error } = await supabase
        .from('event_tickets')
        .insert(guestTickets)
        .select('*');

    if (error) throw error;
    return (inserted || []) as EventTicket[];
}

// ─── REMOVE GUEST TICKETS ──────────────────────────────────────────

export async function removeGuestFromRsvp(rsvpId: string): Promise<boolean> {
    const { error } = await supabase
        .from('event_tickets')
        .delete()
        .eq('rsvp_id', rsvpId)
        .eq('owner_type', 'GUEST');

    if (error) {
        console.error('Error removing guest tickets:', error);
        return false;
    }
    return true;
}

// ─── GET ALL TICKETS FOR RSVP ──────────────────────────────────────

export async function getTicketsForRsvp(rsvpId: string): Promise<EventTicket[]> {
    const { data, error } = await supabase
        .from('event_tickets')
        .select('*')
        .eq('rsvp_id', rsvpId)
        .order('event_date', { ascending: true })
        .order('owner_type', { ascending: true }); // MEMBER first, then GUEST

    if (error) {
        console.error('Error fetching tickets:', error);
        return [];
    }
    return (data || []) as EventTicket[];
}

// ─── SCANNER: VALIDATE TICKET V2 ──────────────────────────────────
// Now reads from event_tickets. Validates date match.

export async function validateTicketV2(ticketCode: string): Promise<TicketValidationResultV2> {
    const { data, error } = await supabase
        .from('event_tickets')
        .select(`
            *,
            rsvp:event_rsvps!rsvp_id (
                user_id, status,
                profile:profiles!user_id (
                    id, name, image_url, company, job_title
                )
            )
        `)
        .eq('ticket_code', ticketCode)
        .single();

    if (error || !data) {
        return { valid: false, error: 'Ingresso inválido ou não encontrado.' };
    }

    const ticket = data as unknown as TicketWithProfile;

    // Check RSVP status
    if ((ticket.rsvp as any)?.status !== 'CONFIRMED') {
        return { valid: false, error: 'RSVP não está confirmado para este evento.' };
    }

    // Check if already used
    if (ticket.check_in_status) {
        return { valid: false, error: 'Este ingresso já foi utilizado.', alreadyUsed: true, ticket };
    }

    // Check date match (optional strict mode — warn but don't block)
    const today = new Date().toISOString().split('T')[0];
    if (ticket.event_date && ticket.event_date !== today) {
        // Allow entry but flag it — the event staff might scan early/late
        console.warn(`Ticket date mismatch: ticket=${ticket.event_date}, today=${today}`);
    }

    return { valid: true, ticket };
}

// ─── SCANNER: CONFIRM CHECK-IN V2 ─────────────────────────────────

export async function confirmCheckInV2(ticketCode: string): Promise<boolean> {
    const { error } = await supabase
        .from('event_tickets')
        .update({ check_in_status: true, updated_at: new Date().toISOString() })
        .eq('ticket_code', ticketCode);

    if (error) {
        console.error('Error confirming check-in V2:', error);
        return false;
    }
    return true;
}

// ─── AUDIT V2: Get stats from event_tickets ────────────────────────

export interface EventAuditStatsV2 {
    totalTickets: number;
    totalCheckedIn: number;
    totalPending: number;
    attendanceScore: number;
    memberTickets: number;
    guestTickets: number;
    ticketsList: TicketWithProfile[];
}

export async function getEventAuditStatsV2(eventId: string): Promise<EventAuditStatsV2> {
    const { data, error } = await supabase
        .from('event_tickets')
        .select(`
            *,
            rsvp:event_rsvps!rsvp_id (
                user_id,
                profile:profiles!user_id (
                    id, name, image_url, company, job_title
                )
            )
        `)
        .eq('event_id', eventId)
        .order('event_date', { ascending: true });

    if (error) throw error;

    const tickets = (data || []) as unknown as TicketWithProfile[];
    const totalTickets = tickets.length;
    const totalCheckedIn = tickets.filter(t => t.check_in_status).length;
    const totalPending = totalTickets - totalCheckedIn;
    const attendanceScore = totalTickets > 0 ? Math.round((totalCheckedIn / totalTickets) * 100) : 0;
    const memberTickets = tickets.filter(t => t.owner_type === 'MEMBER').length;
    const guestTickets = tickets.filter(t => t.owner_type === 'GUEST').length;

    return {
        totalTickets,
        totalCheckedIn,
        totalPending,
        attendanceScore,
        memberTickets,
        guestTickets,
        ticketsList: tickets,
    };
}

// ─── SILENT VIRTUAL CHECK-IN ───────────────────────────────────────
// Registers attendance for virtual events without blocking the user.
// Called fire-and-forget before redirecting to Zoom.

export async function registerSilentVirtualCheckIn(
    eventId: string,
    userId: string
): Promise<void> {
    try {
        // Update the RSVP's check_in status
        const { error } = await supabase
            .from('event_rsvps')
            .update({
                check_in_status: true,
                updated_at: new Date().toISOString(),
            })
            .eq('event_id', eventId)
            .eq('user_id', userId)
            .eq('status', 'CONFIRMED');

        if (error) {
            console.error('[SilentCheckIn] Error updating RSVP:', error);
        }

        // Also update event_tickets if they exist
        const { data: tickets } = await supabase
            .from('event_tickets')
            .select('id')
            .eq('event_id', eventId)
            .eq('owner_type', 'MEMBER')
            .eq('check_in_status', false);

        if (tickets && tickets.length > 0) {
            await supabase
                .from('event_tickets')
                .update({ check_in_status: true, updated_at: new Date().toISOString() })
                .in('id', tickets.map(t => t.id));
        }
    } catch (err) {
        console.error('[SilentCheckIn] Exception:', err);
    }
}
