// ============================================
// AUDIT LOG SERVICE
// ============================================
// Generic service for recording admin actions.
// Best-effort: never throws — failures are logged silently.

import { supabase } from '../lib/supabase';

export interface AuditLogEntry {
    action: string;         // e.g. 'AUDIT_DEAL', 'BULK_AUDIT', 'RESOLVE_REFERRAL'
    entityType: string;     // e.g. 'deal', 'referral', 'member'
    entityId?: string;      // UUID of the affected record (optional for bulk)
    details?: Record<string, any>;  // Free-form payload
}

class AuditLogService {
    /**
     * Log an admin action. Best-effort — errors are swallowed.
     * Admin ID is resolved from the current Supabase session.
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.from('admin_audit_log').insert({
                admin_id: user.id,
                action: entry.action,
                entity_type: entry.entityType,
                entity_id: entry.entityId || null,
                details: entry.details || {},
            });
        } catch (err) {
            console.error('[AuditLog] Failed to write:', err);
            // Best-effort: never block the main operation
        }
    }

    /**
     * Log multiple actions in a single batch (for bulk operations).
     */
    async logBatch(entries: AuditLogEntry[]): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const rows = entries.map(entry => ({
                admin_id: user.id,
                action: entry.action,
                entity_type: entry.entityType,
                entity_id: entry.entityId || null,
                details: entry.details || {},
            }));

            await supabase.from('admin_audit_log').insert(rows);
        } catch (err) {
            console.error('[AuditLog] Failed to write batch:', err);
        }
    }
}

export const auditLogService = new AuditLogService();
