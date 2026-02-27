// Service for managing user notifications

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface UserNotification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    action_url?: string;
    is_read: boolean;
    created_at: string;
}

export interface NotificationStats {
    total: number;
    unread: number;
}

export interface NotificationResult {
    data: UserNotification[];
    total: number;
    page: number;
    hasMore: boolean;
}

export type NotificationSegment = 'ALL' | 'MEMBERS' | 'TEAM' | 'ADMIN' | 'INDIVIDUAL';

export interface ScheduledNotification {
    id: string;
    title: string;
    message: string;
    segment: NotificationSegment;
    target_url?: string;
    scheduled_for: string;
    status: string;
    created_at: string;
}

class NotificationService {
    /**
     * Get all notifications for a user with pagination
     */
    async getUserNotifications(
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<NotificationResult> {
        try {
            logger.debug('🔔 Fetching notifications for user:', userId, { page, limit });

            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('user_notifications')
                .select('id, user_id, title, message, action_url, is_read, created_at', { count: 'exact' })
                .eq('user_id', userId)
                .neq('title', '[Excluída]')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            const total = count || 0;
            const hasMore = offset + limit < total;

            logger.debug(`✅ Found ${data?.length || 0} notifications (total: ${total})`);

            return {
                data: data || [],
                total,
                page,
                hasMore
            };
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread notifications count
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const { count, error } = await supabase
                .from('user_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('is_read', false)
                .neq('title', '[Excluída]');

            if (error) throw error;
            return count || 0;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }

    /**
     * Get notification statistics
     */
    async getNotificationStats(userId: string): Promise<NotificationStats> {
        try {
            const [total, unread] = await Promise.all([
                supabase
                    .from('user_notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId),
                supabase
                    .from('user_notifications')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('is_read', false)
            ]);

            return {
                total: total.count || 0,
                unread: unread.count || 0
            };
        } catch (error) {
            console.error('Error fetching notification stats:', error);
            return { total: 0, unread: 0 };
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_notifications')
                .update({ is_read: true })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    /**
     * Delete a notification
     * Uses delete first, falls back to soft-delete if RLS blocks it
     */
    async deleteNotification(notificationId: string): Promise<void> {
        try {
            // Try direct delete first
            const { error } = await supabase
                .from('user_notifications')
                .delete()
                .eq('id', notificationId);

            if (error) {
                console.warn('Delete error, trying soft-delete:', error.message);
            } else {
                // Verify the record was actually deleted (RLS may silently block)
                const { data: stillExists } = await supabase
                    .from('user_notifications')
                    .select('id')
                    .eq('id', notificationId)
                    .maybeSingle();

                if (!stillExists) {
                    // Successfully deleted
                    return;
                }
                console.warn('Delete returned no error but record still exists (RLS block), using soft-delete');
            }

            // Fallback: soft-delete by marking title as "[Excluída]"
            const { error: updateError } = await supabase
                .from('user_notifications')
                .update({
                    is_read: true,
                    title: '[Excluída]',
                    message: ''
                })
                .eq('id', notificationId);

            if (updateError) {
                console.error('Soft-delete also failed:', updateError);
                throw updateError;
            }

            logger.info('✅ Notification soft-deleted successfully');
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    /**
     * Create notification for specific users (Admin only)
     */
    async createNotification(
        title: string,
        message: string,
        segment: NotificationSegment,
        actionUrl?: string,
        targetUserId?: string,
        scheduledFor?: string
    ): Promise<number> {
        try {
            // Handle scheduled notifications
            if (scheduledFor) {
                const { error } = await supabase
                    .from('notifications')
                    .insert({
                        title,
                        message,
                        target_url: actionUrl,
                        segment,
                        status: 'SCHEDULED',
                        scheduled_for: scheduledFor
                    });

                if (error) throw error;
                return 1; // Scheduled for later
            }

            // For individual user notifications, use direct insert
            if (segment === 'INDIVIDUAL' && targetUserId) {
                return await this.createIndividualNotification(title, message, targetUserId, actionUrl);
            }

            // First, insert into notifications table (master record)
            const { data: notification, error: notifError } = await supabase
                .from('notifications')
                .insert({
                    title,
                    message,
                    target_url: actionUrl,
                    segment,
                    status: 'SENT'
                })
                .select()
                .single();

            if (notifError) throw notifError;

            // Then, call the function to create user notifications
            const { data, error } = await supabase.rpc('create_user_notifications', {
                p_title: title,
                p_message: message,
                p_action_url: actionUrl || null,
                p_segment: segment
            });

            if (error) throw error;

            // Push notifications (fire-and-forget, best-effort)
            this._sendSegmentPush(title, message, segment, actionUrl).catch(() => { });

            return data || 0;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Create notification for a specific individual user
     * Uses the same RPC as segment-based notifications but with segment 'ALL'
     * then deletes extra notifications, OR inserts directly if RPC isn't available
     */
    async createIndividualNotification(
        title: string,
        message: string,
        userId: string,
        actionUrl?: string
    ): Promise<number> {
        try {
            // Strategy: Insert master record with segment='ALL' (safe value)
            // then insert directly into user_notifications for the specific user

            // 1. Insert master notification record (log only)
            const { error: notifError } = await supabase
                .from('notifications')
                .insert({
                    title,
                    message,
                    target_url: actionUrl || null,
                    segment: 'ALL',
                    status: 'SENT'
                });

            // Log but don't block on master record failure
            if (notifError) {
                console.warn('Warning: Could not create master notification record:', notifError);
            }

            // 2. Try RPC first (bypasses RLS)
            try {
                const { data: rpcData, error: rpcError } = await supabase.rpc('create_individual_notification', {
                    p_user_id: userId,
                    p_title: title,
                    p_message: message,
                    p_action_url: actionUrl || null
                });

                if (!rpcError) {
                    logger.info('✅ Individual notification sent via RPC');
                    return rpcData || 1;
                }

                // RPC doesn't exist, fall through to direct insert
                console.warn('RPC not available, trying direct insert:', rpcError.message);
            } catch (rpcErr) {
                console.warn('RPC call failed, trying direct insert');
            }

            // 3. Fallback: Direct insert into user_notifications
            const { error } = await supabase
                .from('user_notifications')
                .insert({
                    user_id: userId,
                    title,
                    message,
                    action_url: actionUrl || null,
                    is_read: false
                });

            if (error) {
                console.error('Direct insert failed:', error);
                throw error;
            }

            logger.info('✅ Individual notification sent via direct insert');

            // Push notification (fire-and-forget)
            supabase.functions.invoke('send-push', {
                body: { user_id: userId, title, message, url: actionUrl || '/notificacoes', type: 'notification' }
            }).catch(() => { });

            return 1;
        } catch (error) {
            console.error('Error creating individual notification:', error);
            throw error;
        }
    }

    /**
     * Subscribe to new notifications (Realtime)
     * Each caller gets a unique channel to avoid Supabase deduplication
     */
    subscribeToNotifications(
        userId: string,
        callback: (notification: UserNotification) => void
    ): () => void {
        // Generate unique channel name per subscriber to prevent conflicts
        const channelName = `user_notifications_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    logger.debug('🔔 Realtime notification received:', payload.new);
                    callback(payload.new as UserNotification);
                }
            )
            .subscribe((status) => {
                logger.debug(`📡 Realtime channel [${channelName}] status:`, status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime subscription failed. Check if Realtime is enabled for user_notifications table in Supabase Dashboard.');
                }
            });

        // Return unsubscribe function
        return () => {
            supabase.removeChannel(channel);
        };
    }

    /**
     * Send notification with structured result (for admin panel)
     */
    async sendNotificationWithLog(
        title: string,
        message: string,
        segment: NotificationSegment,
        actionUrl?: string
    ): Promise<{ success: boolean; count: number; error?: string }> {
        try {
            const count = await this.createNotification(title, message, segment, actionUrl);
            return { success: true, count };
        } catch (error: any) {
            console.error('Error in sendNotificationWithLog:', error);
            return { success: false, count: 0, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Get notification history (admin only - from master table)
     */
    async getNotificationHistory(
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: any[]; total: number; hasMore: boolean }> {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .order('sent_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: data || [],
                total: count || 0,
                hasMore: offset + limit < (count || 0)
            };
        } catch (error) {
            console.error('Error fetching notification history:', error);
            return { data: [], total: 0, hasMore: false };
        }
    }

    // ================================================
    // PUSH SUBSCRIPTION MANAGEMENT
    // ================================================

    /**
     * Register a push subscription token for a user device
     * Uses upsert to handle multiple devices per user
     */
    async registerPushToken(
        userId: string,
        subscription: PushSubscription
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const subscriptionData = subscription.toJSON();

            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: userId,
                    endpoint: subscription.endpoint,
                    p256dh: subscriptionData.keys?.p256dh || null,
                    auth: subscriptionData.keys?.auth || null,
                    subscription_json: subscriptionData,
                    user_agent: navigator.userAgent,
                    platform: this.detectPlatform(),
                    is_active: true,
                    error_count: 0,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'endpoint'
                });

            if (error) {
                console.error('❌ Error registering push token:', error);
                return { success: false, error: error.message };
            }

            logger.info('✅ Push token registered successfully');
            return { success: true };
        } catch (error: any) {
            console.error('❌ Error in registerPushToken:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Update last used timestamp for a push subscription
     */
    async updatePushTokenActivity(endpoint: string): Promise<void> {
        try {
            await supabase
                .from('push_subscriptions')
                .update({
                    last_used_at: new Date().toISOString(),
                    error_count: 0 // Reset errors on successful use
                })
                .eq('endpoint', endpoint);
        } catch (error) {
            console.error('Error updating push token activity:', error);
        }
    }

    /**
     * Increment error count for a failed push (used by backend)
     */
    async incrementPushTokenError(endpoint: string): Promise<void> {
        try {
            const { data } = await supabase
                .from('push_subscriptions')
                .select('error_count')
                .eq('endpoint', endpoint)
                .single();

            const newCount = (data?.error_count || 0) + 1;

            await supabase
                .from('push_subscriptions')
                .update({
                    error_count: newCount,
                    is_active: newCount < 3 // Desativa após 3 erros
                })
                .eq('endpoint', endpoint);
        } catch (error) {
            console.error('Error incrementing push token error:', error);
        }
    }

    /**
     * Remove a push subscription
     */
    async removePushToken(
        userId: string,
        endpoint: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('push_subscriptions')
                .delete()
                .eq('user_id', userId)
                .eq('endpoint', endpoint);

            if (error) {
                return { success: false, error: error.message };
            }

            logger.info('✅ Push token removed successfully');
            return { success: true };
        } catch (error: any) {
            console.error('Error removing push token:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all active push subscriptions for a user
     */
    async getUserPushSubscriptions(userId: string): Promise<any[]> {
        try {
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('id, user_id, endpoint, p256dh, auth, subscription_json, user_agent, platform, is_active, error_count, last_used_at, created_at, updated_at')
                .eq('user_id', userId)
                .eq('is_active', true);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching user push subscriptions:', error);
            return [];
        }
    }

    /**
     * Detect platform from user agent
     */
    private detectPlatform(): string {
        const ua = navigator.userAgent.toLowerCase();
        if (/android/i.test(ua)) return 'android';
        if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
        if (/windows/i.test(ua)) return 'windows';
        if (/macintosh|mac os/i.test(ua)) return 'macos';
        if (/linux/i.test(ua)) return 'linux';
        return 'web';
    }

    /**
     * Send push notifications for segment-based admin notifications (fire-and-forget)
     * Queries push_subscriptions for all active users and sends push to each
     */
    private async _sendSegmentPush(title: string, message: string, segment: NotificationSegment, actionUrl?: string): Promise<void> {
        try {
            // Get all users with active push subscriptions
            let query = supabase
                .from('push_subscriptions')
                .select('user_id')
                .eq('is_active', true);

            // For role-based segments, filter by role via profiles join
            if (segment !== 'ALL') {
                const roleMap: Record<string, string> = { MEMBERS: 'MEMBER', TEAM: 'TEAM', ADMIN: 'ADMIN' };
                const role = roleMap[segment];
                if (role) {
                    const { data: profiles } = await supabase
                        .from('profiles')
                        .select('id')
                        .eq('role', role);

                    if (!profiles?.length) return;
                    const userIds = profiles.map(p => p.id);
                    query = query.in('user_id', userIds);
                }
            }

            const { data: subs } = await query;
            if (!subs?.length) return;

            // Get unique user_ids
            const uniqueUserIds = [...new Set(subs.map(s => s.user_id))];

            // Send push to each user (parallel, best-effort)
            await Promise.allSettled(
                uniqueUserIds.map(userId =>
                    supabase.functions.invoke('send-push', {
                        body: {
                            user_id: userId,
                            title,
                            body: message,
                            url: actionUrl || '/notificacoes',
                            type: 'notification'
                        }
                    })
                )
            );

            logger.debug(`[Push] Sent segment push to ${uniqueUserIds.length} user(s)`);
        } catch (err) {
            // Never block notifications for push failures
            logger.debug('[Push] Segment push skipped');
        }
    }
}

export const notificationService = new NotificationService();

// ========== SCHEDULED NOTIFICATION HELPERS ==========

/**
 * Get all scheduled notifications (Admin only)
 * Standalone function using the service pattern
 */
export async function getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('id, title, message, segment, target_url, scheduled_for, status, sent_at')
            .eq('status', 'SCHEDULED')
            .order('scheduled_for', { ascending: true });

        if (error) throw error;
        return (data || []) as ScheduledNotification[];
    } catch (error) {
        console.error('Error fetching scheduled notifications:', error);
        return [];
    }
}

/**
 * Cancel a scheduled notification (Admin only)
 */
export async function cancelScheduledNotification(id: string): Promise<void> {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ status: 'CANCELLED' })
            .eq('id', id)
            .eq('status', 'SCHEDULED');

        if (error) throw error;
    } catch (error) {
        console.error('Error cancelling scheduled notification:', error);
        throw error;
    }
}


