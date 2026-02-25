// ============================================
// EVENT SERVICE - Supabase Integration
// ============================================
// Replaces mockData event methods with real Supabase queries
// Table: club_events (created via SQL in Supabase Dashboard)

import { supabase } from '../lib/supabase';
import { ClubEvent, EventCategory, EventMaterial, EventSession } from '../types';
import { logger } from '../utils/logger';

// ============================================
// DB Row ↔ ClubEvent Mappers
// ============================================

interface ClubEventRow {
    id: string;
    title: string;
    description: string;
    date: string;
    end_date: string | null;
    type: string;
    category: string;
    target_member_id: string | null;
    target_member_name: string | null;
    location: string | null;
    map_link: string | null;
    link: string | null;
    meeting_password: string | null;
    video_url: string | null;
    cover_image: string | null;
    banner_url: string | null;
    materials: EventMaterial[] | null;
    sessions: EventSession[] | null;
    created_at: string;
    updated_at: string;
}

function rowToClubEvent(row: ClubEventRow): ClubEvent {
    return {
        id: row.id,
        title: row.title,
        description: row.description || '',
        date: row.date,
        endDate: row.end_date || undefined,
        type: row.type as ClubEvent['type'],
        category: row.category as EventCategory,
        targetMemberId: row.target_member_id || undefined,
        targetMemberName: row.target_member_name || undefined,
        location: row.location || undefined,
        mapLink: row.map_link || undefined,
        link: row.link || undefined,
        meetingPassword: row.meeting_password || undefined,
        videoUrl: row.video_url || undefined,
        coverImage: row.cover_image || undefined,
        bannerUrl: row.banner_url || undefined,
        materials: row.materials || undefined,
        sessions: row.sessions || undefined,
    };
}

function clubEventToRow(event: Partial<ClubEvent>): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if (event.title !== undefined) row.title = event.title;
    if (event.description !== undefined) row.description = event.description;
    if (event.date !== undefined) row.date = event.date;
    if (event.endDate !== undefined) row.end_date = event.endDate || null;
    if (event.type !== undefined) row.type = event.type;
    if (event.category !== undefined) row.category = event.category;
    if (event.targetMemberId !== undefined) row.target_member_id = event.targetMemberId || null;
    if (event.targetMemberName !== undefined) row.target_member_name = event.targetMemberName || null;
    if (event.location !== undefined) row.location = event.location || null;
    if (event.mapLink !== undefined) row.map_link = event.mapLink || null;
    if (event.link !== undefined) row.link = event.link || null;
    if (event.meetingPassword !== undefined) row.meeting_password = event.meetingPassword || null;
    if (event.videoUrl !== undefined) row.video_url = event.videoUrl || null;
    if (event.coverImage !== undefined) row.cover_image = event.coverImage || null;
    if (event.bannerUrl !== undefined) row.banner_url = event.bannerUrl || null;
    if (event.materials !== undefined) row.materials = event.materials || [];
    if (event.sessions !== undefined) row.sessions = event.sessions || [];
    return row;
}

// ============================================
// EVENT SERVICE CLASS
// ============================================

class EventService {

    /**
     * Get events visible to a specific user.
     * RLS handles PRIVATE filtering, but we also filter client-side as fallback.
     */
    async getEventsForUser(userId?: string): Promise<ClubEvent[]> {
        try {
            const { data, error } = await supabase
                .from('club_events')
                .select('id, title, description, date, end_date, type, category, target_member_id, target_member_name, location, map_link, link, meeting_password, video_url, cover_image, banner_url, materials, sessions, created_at, updated_at')
                .order('date', { ascending: true });

            if (error) {
                console.error('❌ Error fetching events:', error);
                return [];
            }

            // Client-side fallback filter for PRIVATE events
            const events = (data || []).map(rowToClubEvent);
            if (userId) {
                return events.filter(e =>
                    e.type !== 'PRIVATE' || e.targetMemberId === userId
                );
            }
            return events.filter(e => e.type !== 'PRIVATE');
        } catch (error) {
            console.error('Error in getEventsForUser:', error);
            return [];
        }
    }

    /**
     * Get ALL events (Admin use - no filtering).
     */
    async getAllEvents(): Promise<ClubEvent[]> {
        try {
            const { data, error } = await supabase
                .from('club_events')
                .select('id, title, description, date, end_date, type, category, target_member_id, target_member_name, location, map_link, link, meeting_password, video_url, cover_image, banner_url, materials, sessions, created_at, updated_at')
                .order('date', { ascending: false });

            if (error) {
                console.error('❌ Error fetching all events:', error);
                return [];
            }

            return (data || []).map(rowToClubEvent);
        } catch (error) {
            console.error('Error in getAllEvents:', error);
            return [];
        }
    }

    /**
     * Create a new event.
     */
    async createEvent(event: Omit<ClubEvent, 'id'>): Promise<{ success: boolean; data?: ClubEvent; error?: string }> {
        try {
            const row = clubEventToRow(event);
            const { data, error } = await supabase
                .from('club_events')
                .insert(row)
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating event:', error);
                return { success: false, error: error.message };
            }

            logger.info('✅ Event created:', data.title);
            return { success: true, data: rowToClubEvent(data) };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error in createEvent:', error);
            return { success: false, error: message };
        }
    }

    /**
     * Update an existing event.
     */
    async updateEvent(id: string, event: Partial<ClubEvent>): Promise<{ success: boolean; data?: ClubEvent; error?: string }> {
        try {
            const row = clubEventToRow(event);
            row.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('club_events')
                .update(row)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating event:', error);
                return { success: false, error: error.message };
            }

            logger.info('✅ Event updated:', data.title);
            return { success: true, data: rowToClubEvent(data) };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error in updateEvent:', error);
            return { success: false, error: message };
        }
    }

    /**
     * Delete an event.
     */
    async deleteEvent(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('club_events')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('❌ Error deleting event:', error);
                return { success: false, error: error.message };
            }

            logger.info('✅ Event deleted:', id);
            return { success: true };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error in deleteEvent:', error);
            return { success: false, error: message };
        }
    }

    /**
     * Get event count (for admin dashboard stats).
     */
    async getEventCount(): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('club_events')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error('❌ Error counting events:', error);
                return 0;
            }

            return count || 0;
        } catch (error) {
            console.error('Error in getEventCount:', error);
            return 0;
        }
    }
}

// Singleton export
export const eventService = new EventService();
