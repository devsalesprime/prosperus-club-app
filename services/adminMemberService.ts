// ============================================
// ADMIN MEMBER SERVICE
// ============================================
// Centralised data-layer for the Members admin module.
// All Supabase queries live here — the component only manages UI.

import { supabase } from '../lib/supabase';
import { isAbortError } from '../utils/isAbortError';
import { auditLogService } from './auditLogService';
import { logger } from '../utils/logger';

// ─── Types ────────────────────────────────────────────────────────

export interface MemberRow {
    id: string;
    name: string;
    email: string;
    company: string | null;
    job_title: string | null;
    role: string;
    image_url: string | null;
    created_at: string;
    pitch_video_url?: string | null;
    is_active?: boolean;
}

export interface MemberListResult {
    data: MemberRow[];
    total: number;
}

export interface LastActivityEntry {
    user_id: string;
    last_seen: string;
}

export interface ActiveDaysEntry {
    user_id: string;
    active_days: number;
}

export interface EventSummary {
    id: string;
    title: string;
    date: string;
}

// ─── Service ──────────────────────────────────────────────────────

class AdminMemberService {
    /**
     * Fetch paginated members list.
     * Uses Supabase `.range()` + `{ count: 'exact' }` for server-side pagination.
     */
    async getMembers(page: number = 1, limit: number = 20): Promise<MemberListResult> {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('profiles')
            .select('id, name, email, company, job_title, role, image_url, created_at, pitch_video_url, is_active', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            if (isAbortError(error)) return { data: [], total: 0 };
            logger.error('Error loading members:', error);
            throw new Error(error.message || 'Erro ao carregar membros');
        }

        return {
            data: data || [],
            total: count || 0,
        };
    }

    /**
     * Fetch last-activity timestamps for all members (via RPC).
     */
    async getMembersLastActivity(): Promise<Record<string, string>> {
        const { data, error } = await supabase.rpc('get_members_with_last_activity');

        if (error) {
            if (isAbortError(error)) return {};
            logger.error('Error loading last activity:', error);
            return {};
        }

        const map: Record<string, string> = {};
        (data as LastActivityEntry[] || []).forEach(row => {
            map[row.user_id] = row.last_seen;
        });
        return map;
    }

    /**
     * Fetch active-days count for all members (via RPC).
     */
    async getMembersActiveDays(): Promise<Record<string, number>> {
        const { data, error } = await supabase.rpc('get_members_active_days_count');

        if (error) {
            if (isAbortError(error)) return {};
            logger.error('Error loading active days:', error);
            return {};
        }

        const map: Record<string, number> = {};
        (data as ActiveDaysEntry[] || []).forEach(row => {
            map[row.user_id] = Number(row.active_days);
        });
        return map;
    }

    /**
     * Fetch recent events for filter dropdown.
     */
    async getEvents(limit: number = 50): Promise<EventSummary[]> {
        const { data, error } = await supabase
            .from('club_events')
            .select('id, title, date')
            .order('date', { ascending: false })
            .limit(limit);

        if (error) {
            if (isAbortError(error)) return [];
            logger.error('Error loading events:', error);
            return [];
        }

        return (data || []).map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
        }));
    }

    /**
     * Fetch confirmed attendees for a specific event.
     */
    async getEventAttendees(eventId: string): Promise<Set<string>> {
        const { data, error } = await supabase
            .from('event_rsvps')
            .select('user_id')
            .eq('event_id', eventId)
            .eq('status', 'CONFIRMED');

        if (error) {
            if (isAbortError(error)) return new Set();
            logger.error('Error loading attendees:', error);
            return new Set();
        }

        return new Set((data || []).map(r => r.user_id));
    }

    /**
     * Update a member's profile fields (e.g. pitch_video_url, role).
     * Audit-logged.
     */
    async updateMember(memberId: string, updates: Partial<Pick<MemberRow, 'pitch_video_url' | 'role'>>,): Promise<void> {
        const { error } = await supabase
            .from('profiles')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', memberId);

        if (error) {
            if (isAbortError(error)) return;
            logger.error('Error updating member:', error);
            throw new Error(error.message || 'Erro ao atualizar membro');
        }

        auditLogService.log({
            action: 'UPDATE_MEMBER',
            entityType: 'member',
            entityId: memberId,
            details: { updates },
        });
    }

    /**
     * Delete a member profile. Audit-logged.
     */
    async deleteMember(memberId: string): Promise<void> {
        // Fetch name before deleting for audit trail
        const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', memberId)
            .single();

        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', memberId);

        if (error) {
            if (isAbortError(error)) return;
            logger.error('Error deleting member:', error);
            throw new Error(error.message || 'Erro ao remover membro');
        }

        auditLogService.log({
            action: 'DELETE_MEMBER',
            entityType: 'member',
            entityId: memberId,
            details: {
                memberName: profile?.name || 'unknown',
                memberEmail: profile?.email || 'unknown',
            },
        });
    }

    // ─── Bulk Operations ──────────────────────────────────────────

    /**
     * Update role for multiple members at once.
     */
    async bulkUpdateRole(memberIds: string[], newRole: string): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        await Promise.all(
            memberIds.map(async (id) => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ role: newRole, updated_at: new Date().toISOString() })
                        .eq('id', id);
                    if (error) throw error;
                    success++;
                } catch {
                    failed++;
                }
            })
        );

        auditLogService.logBatch(
            memberIds.map(id => ({
                action: 'BULK_UPDATE_ROLE',
                entityType: 'member',
                entityId: id,
                details: { newRole },
            }))
        );

        return { success, failed };
    }

    /**
     * Toggle is_active for multiple members at once.
     */
    async bulkToggleActive(memberIds: string[], isActive: boolean): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        await Promise.all(
            memberIds.map(async (id) => {
                try {
                    const { error } = await supabase
                        .from('profiles')
                        .update({ is_active: isActive, updated_at: new Date().toISOString() })
                        .eq('id', id);
                    if (error) throw error;
                    success++;
                } catch {
                    failed++;
                }
            })
        );

        auditLogService.logBatch(
            memberIds.map(id => ({
                action: isActive ? 'BULK_ACTIVATE' : 'BULK_DEACTIVATE',
                entityType: 'member',
                entityId: id,
                details: { isActive },
            }))
        );

        return { success, failed };
    }
}

export const adminMemberService = new AdminMemberService();

