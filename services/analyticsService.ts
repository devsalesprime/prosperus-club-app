// analyticsService.ts
// Sistema de Analytics Interno - Fire and Forget Event Tracking
// Captura métricas de uso silenciosamente sem impactar performance

import { supabase } from '../lib/supabase';

// ============================================
// TYPES
// ============================================

export type AnalyticsEventType =
    | 'APP_OPEN'           // Sessão iniciada
    | 'APP_CLOSE'          // Sessão encerrada
    | 'PAGE_VIEW'          // Navegação entre páginas
    | 'VIDEO_START'        // Início de vídeo (Academy)
    | 'VIDEO_PROGRESS'     // Progresso de vídeo
    | 'VIDEO_COMPLETE'     // Vídeo concluído
    | 'ARTICLE_READ'       // Artigo lido (Blog)
    | 'ARTICLE_SCROLL'     // Scroll em artigo
    | 'MESSAGE_SENT'       // Mensagem enviada (Chat)
    | 'NOTIFICATION_CLICK' // Notificação clicada
    | 'PROFILE_VIEW'       // Visualização de perfil de membro
    | 'EVENT_RSVP'         // RSVP para evento
    | 'SEARCH'             // Busca realizada
    | 'LOGIN'              // Login realizado
    | 'LOGOUT'             // Logout realizado
    | 'ERROR';             // Erro capturado

export interface AnalyticsEvent {
    id?: string;
    user_id: string | null;
    event_type: AnalyticsEventType;
    metadata?: Record<string, any>;
    page_url?: string;
    session_id?: string;
    device_info?: DeviceInfo;
    created_at?: string;
}

export interface DeviceInfo {
    userAgent?: string;
    platform?: string;
    screenWidth?: number;
    screenHeight?: number;
    language?: string;
    timezone?: string;
}

export interface PageViewMetadata {
    page_name: string;
    previous_page?: string;
    duration_ms?: number;
}

export interface VideoMetadata {
    video_id: string;
    video_title?: string;
    duration_seconds?: number;
    progress_percent?: number;
    category_id?: string;
}

export interface ArticleMetadata {
    article_id: string;
    article_title?: string;
    category?: string;
    read_time_seconds?: number;
    scroll_depth_percent?: number;
}

export interface MessageMetadata {
    conversation_id: string;
    recipient_id?: string;
    message_type?: 'text' | 'image' | 'file';
}

// ============================================
// SESSION MANAGEMENT
// ============================================

let currentSessionId: string | null = null;
let sessionStartTime: number = 0;

const generateSessionId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const getOrCreateSessionId = (): string => {
    if (!currentSessionId) {
        currentSessionId = generateSessionId();
        sessionStartTime = Date.now();
    }
    return currentSessionId;
};

const getDeviceInfo = (): DeviceInfo => {
    if (typeof window === 'undefined') return {};

    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
};

// ============================================
// ANALYTICS SERVICE
// ============================================

class AnalyticsService {
    private queue: AnalyticsEvent[] = [];
    private isProcessing = false;
    private batchSize = 10;
    private flushInterval = 5000; // 5 seconds
    private deviceInfo: DeviceInfo | null = null;

    constructor() {
        // Start batch processing
        if (typeof window !== 'undefined') {
            this.deviceInfo = getDeviceInfo();
            this.startBatchProcessing();

            // Handle page unload
            window.addEventListener('beforeunload', () => {
                this.flush();
            });

            // Handle visibility change (tab switch)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.flush();
                }
            });
        }
    }

    /**
     * Track an event - Fire and forget
     * Non-blocking, errors are silently logged
     */
    trackEvent(
        userId: string | null,
        eventName: AnalyticsEventType,
        metadata?: Record<string, any>
    ): void {
        try {
            const event: AnalyticsEvent = {
                user_id: userId,
                event_type: eventName,
                metadata: metadata || {},
                page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
                session_id: getOrCreateSessionId(),
                device_info: this.deviceInfo || undefined,
                created_at: new Date().toISOString()
            };

            // Add to queue for batch processing
            this.queue.push(event);

            // If queue is full, flush immediately
            if (this.queue.length >= this.batchSize) {
                this.flush();
            }
        } catch (error) {
            // Silent fail - never impact the app
            console.debug('[Analytics] Error queuing event:', error);
        }
    }

    /**
     * Convenience methods for common events
     */
    trackPageView(userId: string | null, pageName: string, previousPage?: string): void {
        this.trackEvent(userId, 'PAGE_VIEW', {
            page_name: pageName,
            previous_page: previousPage
        } as PageViewMetadata);
    }

    trackVideoStart(userId: string | null, videoId: string, videoTitle?: string): void {
        this.trackEvent(userId, 'VIDEO_START', {
            video_id: videoId,
            video_title: videoTitle
        } as VideoMetadata);
    }

    trackVideoComplete(userId: string | null, videoId: string, durationSeconds?: number): void {
        this.trackEvent(userId, 'VIDEO_COMPLETE', {
            video_id: videoId,
            duration_seconds: durationSeconds
        } as VideoMetadata);
    }

    trackArticleRead(userId: string | null, articleId: string, articleTitle?: string): void {
        this.trackEvent(userId, 'ARTICLE_READ', {
            article_id: articleId,
            article_title: articleTitle
        } as ArticleMetadata);
    }

    trackMessageSent(userId: string | null, conversationId: string): void {
        this.trackEvent(userId, 'MESSAGE_SENT', {
            conversation_id: conversationId
        } as MessageMetadata);
    }

    trackAppOpen(userId: string | null): void {
        currentSessionId = null; // Reset session
        this.trackEvent(userId, 'APP_OPEN', {
            session_start: new Date().toISOString()
        });
    }

    trackLogin(userId: string): void {
        this.trackEvent(userId, 'LOGIN', {
            timestamp: new Date().toISOString()
        });
    }

    trackLogout(userId: string | null): void {
        const sessionDuration = sessionStartTime ? Date.now() - sessionStartTime : 0;
        this.trackEvent(userId, 'LOGOUT', {
            session_duration_ms: sessionDuration
        });
        currentSessionId = null;
    }

    trackError(userId: string | null, errorMessage: string, errorStack?: string): void {
        this.trackEvent(userId, 'ERROR', {
            error_message: errorMessage,
            error_stack: errorStack?.substring(0, 500), // Limit stack trace size
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Flush queue to database
     */
    async flush(): Promise<void> {
        if (this.queue.length === 0 || this.isProcessing) return;

        this.isProcessing = true;
        const eventsToSend = [...this.queue];
        this.queue = [];

        try {
            // Use upsert for better performance
            const { error } = await supabase
                .from('analytics_events')
                .insert(eventsToSend.map(e => ({
                    user_id: e.user_id,
                    event_type: e.event_type,
                    metadata: e.metadata,
                    page_url: e.page_url,
                    session_id: e.session_id,
                    device_info: e.device_info,
                    created_at: e.created_at
                })));

            if (error) {
                // Log but don't throw - silent fail
                console.debug('[Analytics] Error sending events:', error.message);
                // Re-queue failed events (up to a limit)
                if (this.queue.length < 50) {
                    this.queue = [...eventsToSend, ...this.queue];
                }
            }
        } catch (error) {
            console.debug('[Analytics] Network error:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Start interval-based batch processing
     */
    private startBatchProcessing(): void {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    /**
     * Get current session ID
     */
    getSessionId(): string {
        return getOrCreateSessionId();
    }

    /**
     * Get session duration in milliseconds
     */
    getSessionDuration(): number {
        return sessionStartTime ? Date.now() - sessionStartTime : 0;
    }

    // ========================================
    // BENEFIT ANALYTICS
    // ========================================

    /**
     * Track benefit view (when profile modal opens)
     * Debounce: não contar se for o próprio dono
     */
    trackBenefitView(ownerId: string, visitorId: string | null): void {
        // Não contar views do próprio dono
        if (ownerId === visitorId) return;

        this.trackBenefitEvent(ownerId, visitorId, 'VIEW');
    }

    /**
     * Track benefit click (when CTA button is clicked)
     * Fire-and-forget: não bloquear abertura do link
     */
    trackBenefitClick(ownerId: string, visitorId: string | null): void {
        // Não contar cliques do próprio dono
        if (ownerId === visitorId) return;

        this.trackBenefitEvent(ownerId, visitorId, 'CLICK');
    }

    /**
     * Internal method to track benefit events
     * Fire-and-forget pattern - never blocks UI
     */
    private async trackBenefitEvent(
        ownerId: string,
        visitorId: string | null,
        action: 'VIEW' | 'CLICK'
    ): Promise<void> {
        try {
            // Fire and forget - não bloquear UI
            const { error } = await supabase
                .from('benefit_analytics')
                .insert({
                    benefit_owner_id: ownerId,
                    visitor_id: visitorId,
                    action: action,
                    metadata: {
                        page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
                        timestamp: new Date().toISOString()
                    }
                });

            if (error) {
                console.debug('[Analytics] Benefit tracking error:', error);
            }
        } catch (err) {
            // Silent fail - analytics nunca deve quebrar a aplicação
            console.debug('[Analytics] Benefit tracking failed:', err);
        }
    }

    /**
     * Get benefit stats for a specific owner
     */
    async getBenefitStats(ownerId: string): Promise<BenefitStats | null> {
        try {
            // Use RPC function instead of direct view access to avoid RLS 406 error
            const { data, error } = await supabase
                .rpc('get_my_benefit_stats');

            if (error) {
                // No stats yet - return zeros
                if (error.code === 'PGRST116' || error.message?.includes('no rows')) {
                    return {
                        totalViews: 0,
                        totalClicks: 0,
                        uniqueVisitors: 0,
                        ctrPercent: 0,
                        firstViewAt: null,
                        lastActivityAt: null
                    };
                }
                throw error;
            }

            // RPC returns array, get first result
            const stats = Array.isArray(data) && data.length > 0 ? data[0] : null;

            return stats ? {
                totalViews: stats.total_views || 0,
                totalClicks: stats.total_clicks || 0,
                uniqueVisitors: stats.unique_visitors || 0,
                ctrPercent: stats.ctr_percent || 0,
                firstViewAt: stats.first_view_at,
                lastActivityAt: stats.last_activity_at
            } : {
                totalViews: 0,
                totalClicks: 0,
                uniqueVisitors: 0,
                ctrPercent: 0,
                firstViewAt: null,
                lastActivityAt: null
            };
        } catch (error) {
            console.error('[Analytics] Error fetching benefit stats:', error);
            return null;
        }
    }

    // ========================================
    // BENEFIT ANALYTICS - ADMIN LEVEL
    // ========================================

    /**
     * Get top performing benefits (Admin only)
     * Returns benefits sorted by total clicks
     */
    async getTopBenefits(limit: number = 10): Promise<TopBenefit[]> {
        try {
            const { data, error } = await supabase
                .from('view_benefit_stats')
                .select(`
                    benefit_owner_id,
                    total_views,
                    total_clicks,
                    unique_visitors,
                    ctr_percent
                `)
                .order('total_clicks', { ascending: false })
                .limit(limit);

            if (error) throw error;

            // Fetch owner names
            if (!data || data.length === 0) return [];

            const ownerIds = data.map(d => d.benefit_owner_id);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, name, exclusive_benefit')
                .in('id', ownerIds);

            if (profileError) throw profileError;

            // Merge data
            return data.map(stat => {
                const profile = profiles?.find(p => p.id === stat.benefit_owner_id);
                return {
                    ownerId: stat.benefit_owner_id,
                    ownerName: profile?.name || 'Desconhecido',
                    benefitTitle: profile?.exclusive_benefit?.title || 'Sem título',
                    totalViews: stat.total_views || 0,
                    totalClicks: stat.total_clicks || 0,
                    uniqueVisitors: stat.unique_visitors || 0,
                    ctrPercent: stat.ctr_percent || 0
                };
            });
        } catch (error) {
            console.error('[Analytics] Error fetching top benefits:', error);
            return [];
        }
    }

    /**
     * Get benefit overview stats (Admin only)
     * Aggregated stats across all benefits
     */
    async getBenefitOverview(): Promise<BenefitOverview> {
        try {
            // Count active benefits
            const { count: activeBenefitsCount, error: countError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .not('exclusive_benefit', 'is', null)
                .eq('exclusive_benefit->>active', 'true');

            if (countError) throw countError;

            // Get aggregated stats from view
            const { data: stats, error: statsError } = await supabase
                .from('view_benefit_stats')
                .select('total_views, total_clicks, unique_visitors');

            if (statsError) throw statsError;

            // Calculate totals
            const totalViews = stats?.reduce((sum, s) => sum + (s.total_views || 0), 0) || 0;
            const totalClicks = stats?.reduce((sum, s) => sum + (s.total_clicks || 0), 0) || 0;
            const totalUniqueVisitors = stats?.reduce((sum, s) => sum + (s.unique_visitors || 0), 0) || 0;
            const avgCtr = totalViews > 0 ? (totalClicks / totalViews * 100) : 0;

            return {
                activeBenefits: activeBenefitsCount || 0,
                totalViews,
                totalClicks,
                totalUniqueVisitors,
                avgCtrPercent: parseFloat(avgCtr.toFixed(2)),
                benefitsWithActivity: stats?.length || 0
            };
        } catch (error) {
            console.error('[Analytics] Error fetching benefit overview:', error);
            return {
                activeBenefits: 0,
                totalViews: 0,
                totalClicks: 0,
                totalUniqueVisitors: 0,
                avgCtrPercent: 0,
                benefitsWithActivity: 0
            };
        }
    }

    /**
     * Get benefit engagement metrics (Admin only)
     * Shows how many members are engaging with benefits
     */
    async getBenefitEngagement(days: number = 30): Promise<BenefitEngagement> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString();

        try {
            // Count unique users who viewed any benefit
            const { data: viewData, error: viewError } = await supabase
                .from('benefit_analytics')
                .select('visitor_id')
                .eq('action', 'VIEW')
                .gte('created_at', startDateStr)
                .not('visitor_id', 'is', null);

            if (viewError) throw viewError;

            // Count unique users who clicked any benefit
            const { data: clickData, error: clickError } = await supabase
                .from('benefit_analytics')
                .select('visitor_id')
                .eq('action', 'CLICK')
                .gte('created_at', startDateStr)
                .not('visitor_id', 'is', null);

            if (clickError) throw clickError;

            const uniqueViewers = new Set(viewData?.map(d => d.visitor_id) || []).size;
            const uniqueClickers = new Set(clickData?.map(d => d.visitor_id) || []).size;

            // Get total member count for percentage
            const { count: totalMembers, error: memberError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            if (memberError) throw memberError;

            const engagementRate = totalMembers && totalMembers > 0
                ? (uniqueViewers / totalMembers * 100)
                : 0;

            const conversionRate = uniqueViewers > 0
                ? (uniqueClickers / uniqueViewers * 100)
                : 0;

            return {
                uniqueViewers,
                uniqueClickers,
                totalMembers: totalMembers || 0,
                engagementRate: parseFloat(engagementRate.toFixed(2)),
                conversionRate: parseFloat(conversionRate.toFixed(2)),
                period: days
            };
        } catch (error) {
            console.error('[Analytics] Error fetching benefit engagement:', error);
            return {
                uniqueViewers: 0,
                uniqueClickers: 0,
                totalMembers: 0,
                engagementRate: 0,
                conversionRate: 0,
                period: days
            };
        }
    }

    // ========================================
    // DASHBOARD STATS (ADMIN)
    // ========================================

    /**
     * Get dashboard statistics for admin panel
     */
    async getDashboardStats(period: '7d' | '30d' = '30d'): Promise<DashboardStats> {
        const days = period === '7d' ? 7 : 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString();

        try {
            // Parallel queries for performance
            const [
                activeUsersToday,
                newMembersMonth,
                messagesSent,
                videosCompleted,
                totalEvents
            ] = await Promise.all([
                // Active users today (distinct user_id)
                supabase
                    .from('analytics_events')
                    .select('user_id', { count: 'exact', head: true })
                    .gte('created_at', todayStr)
                    .not('user_id', 'is', null),

                // New members this month
                supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startDateStr),

                // Messages sent in period
                supabase
                    .from('analytics_events')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_type', 'MESSAGE_SENT')
                    .gte('created_at', startDateStr),

                // Videos completed in period
                supabase
                    .from('analytics_events')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_type', 'VIDEO_COMPLETE')
                    .gte('created_at', startDateStr),

                // Total events in period
                supabase
                    .from('analytics_events')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', startDateStr)
            ]);

            return {
                activeUsersToday: activeUsersToday.count || 0,
                newMembersMonth: newMembersMonth.count || 0,
                messagesSent: messagesSent.count || 0,
                videosCompleted: videosCompleted.count || 0,
                totalEvents: totalEvents.count || 0,
                period
            };
        } catch (error) {
            console.error('[Analytics] Error fetching dashboard stats:', error);
            return {
                activeUsersToday: 0,
                newMembersMonth: 0,
                messagesSent: 0,
                videosCompleted: 0,
                totalEvents: 0,
                period
            };
        }
    }

    /**
     * Get activity by day for chart
     * Includes both regular analytics events and benefit analytics
     */
    async getActivityByDay(days: number = 30): Promise<DailyActivity[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString();

        try {
            // Fetch regular analytics events
            const { data: analyticsData, error: analyticsError } = await supabase
                .from('analytics_events')
                .select('created_at, event_type')
                .gte('created_at', startDateStr)
                .order('created_at', { ascending: true });

            if (analyticsError) throw analyticsError;

            // Fetch benefit analytics events
            const { data: benefitData, error: benefitError } = await supabase
                .from('benefit_analytics')
                .select('created_at, action')
                .gte('created_at', startDateStr)
                .order('created_at', { ascending: true });

            if (benefitError) {
                console.warn('[Analytics] Error fetching benefit analytics:', benefitError);
                // Continue without benefit data if there's an error
            }

            // Group by day
            const grouped: Record<string, {
                total: number;
                pageViews: number;
                videos: number;
                messages: number;
                benefitViews: number;
                benefitClicks: number;
            }> = {};

            // Process regular analytics events
            (analyticsData || []).forEach(event => {
                const date = new Date(event.created_at).toISOString().split('T')[0];
                if (!grouped[date]) {
                    grouped[date] = {
                        total: 0,
                        pageViews: 0,
                        videos: 0,
                        messages: 0,
                        benefitViews: 0,
                        benefitClicks: 0
                    };
                }
                grouped[date].total++;
                if (event.event_type === 'PAGE_VIEW') grouped[date].pageViews++;
                if (event.event_type === 'VIDEO_START' || event.event_type === 'VIDEO_COMPLETE') grouped[date].videos++;
                if (event.event_type === 'MESSAGE_SENT') grouped[date].messages++;
            });

            // Process benefit analytics events
            (benefitData || []).forEach(event => {
                const date = new Date(event.created_at).toISOString().split('T')[0];
                if (!grouped[date]) {
                    grouped[date] = {
                        total: 0,
                        pageViews: 0,
                        videos: 0,
                        messages: 0,
                        benefitViews: 0,
                        benefitClicks: 0
                    };
                }
                grouped[date].total++;
                if (event.action === 'VIEW') grouped[date].benefitViews++;
                if (event.action === 'CLICK') grouped[date].benefitClicks++;
            });

            // Convert to array and fill missing days
            const result: DailyActivity[] = [];
            for (let i = 0; i < days; i++) {
                const d = new Date();
                d.setDate(d.getDate() - (days - 1 - i));
                const dateStr = d.toISOString().split('T')[0];
                const dayData = grouped[dateStr] || {
                    total: 0,
                    pageViews: 0,
                    videos: 0,
                    messages: 0,
                    benefitViews: 0,
                    benefitClicks: 0
                };
                result.push({
                    date: dateStr,
                    label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
                    total: dayData.total,
                    pageViews: dayData.pageViews,
                    videos: dayData.videos,
                    messages: dayData.messages
                });
            }

            return result;
        } catch (error) {
            console.error('[Analytics] Error fetching activity by day:', error);
            return [];
        }
    }

    /**
     * Get top videos by view count
     */
    async getTopVideos(limit: number = 5): Promise<TopContent[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('metadata')
                .eq('event_type', 'VIDEO_START')
                .not('metadata', 'is', null);

            if (error) throw error;

            // Count by video_id
            const counts: Record<string, { id: string; title: string; count: number }> = {};

            (data || []).forEach(event => {
                const meta = event.metadata as any;
                const videoId = meta?.video_id;
                const title = meta?.video_title || 'Sem título';
                if (videoId) {
                    if (!counts[videoId]) {
                        counts[videoId] = { id: videoId, title, count: 0 };
                    }
                    counts[videoId].count++;
                }
            });

            return Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('[Analytics] Error fetching top videos:', error);
            return [];
        }
    }

    /**
     * Get top articles by read count
     */
    async getTopArticles(limit: number = 5): Promise<TopContent[]> {
        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('metadata')
                .eq('event_type', 'ARTICLE_READ')
                .not('metadata', 'is', null);

            if (error) throw error;

            // Count by article_id
            const counts: Record<string, { id: string; title: string; count: number }> = {};

            (data || []).forEach(event => {
                const meta = event.metadata as any;
                const articleId = meta?.article_id;
                const title = meta?.article_title || 'Sem título';
                if (articleId) {
                    if (!counts[articleId]) {
                        counts[articleId] = { id: articleId, title, count: 0 };
                    }
                    counts[articleId].count++;
                }
            });

            return Object.values(counts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
        } catch (error) {
            console.error('[Analytics] Error fetching top articles:', error);
            return [];
        }
    }

    /**
     * Get event breakdown by type
     */
    async getEventBreakdown(days: number = 30): Promise<EventBreakdown[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        try {
            const { data, error } = await supabase
                .from('analytics_events')
                .select('event_type')
                .gte('created_at', startDate.toISOString());

            if (error) throw error;

            // Count by event_type
            const counts: Record<string, number> = {};

            (data || []).forEach(event => {
                counts[event.event_type] = (counts[event.event_type] || 0) + 1;
            });

            return Object.entries(counts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        } catch (error) {
            console.error('[Analytics] Error fetching event breakdown:', error);
            return [];
        }
    }
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
    activeUsersToday: number;
    newMembersMonth: number;
    messagesSent: number;
    videosCompleted: number;
    totalEvents: number;
    period: '7d' | '30d';
}

export interface DailyActivity {
    date: string;
    label: string;
    total: number;
    pageViews: number;
    videos: number;
    messages: number;
}

export interface TopContent {
    id: string;
    title: string;
    count: number;
}

export interface EventBreakdown {
    name: string;
    value: number;
}

export interface BenefitStats {
    totalViews: number;
    totalClicks: number;
    uniqueVisitors: number;
    ctrPercent: number;
    firstViewAt: string | null;
    lastActivityAt: string | null;
}

export interface TopBenefit {
    ownerId: string;
    ownerName: string;
    benefitTitle: string;
    totalViews: number;
    totalClicks: number;
    uniqueVisitors: number;
    ctrPercent: number;
}

export interface BenefitOverview {
    activeBenefits: number;
    totalViews: number;
    totalClicks: number;
    totalUniqueVisitors: number;
    avgCtrPercent: number;
    benefitsWithActivity: number;
}

export interface BenefitEngagement {
    uniqueViewers: number;
    uniqueClickers: number;
    totalMembers: number;
    engagementRate: number;
    conversionRate: number;
    period: number;
}

// Singleton export
export const analyticsService = new AnalyticsService();

