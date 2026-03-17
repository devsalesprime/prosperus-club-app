// analyticsService.ts
// Sistema de Analytics Interno - Fire and Forget Event Tracking
// Captura métricas de uso silenciosamente sem impactar performance
//
// ═══════════════════════════════════════════════════════════════
// FASE A.1 — Refatoração: RPCs no lugar de downloads em massa
// - getDashboardStats → get_dashboard_stats_with_trends (RPC)
// - getActivityByDay  → get_daily_activity_stats (RPC)
// - getTopVideos/Articles → get_top_content (RPC)
// - getEventBreakdown → get_event_type_breakdown (RPC)
// - getBenefitOverview → get_benefit_overview_stats (RPC)
// - getBenefitEngagement → get_benefit_engagement_stats (RPC)
// - Trends calculados via período anterior (não mais hardcoded)
// - isAbortError guard em todas as queries admin
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';
import { isAbortError } from '../utils/isAbortError';

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
    | 'TOOL_VIEW'          // Acesso a uma ferramenta específica
    | 'FILE_DOWNLOAD'      // Download de arquivo
    | 'REPORT_VIEW'        // Visualização de relatório
    | 'GALLERY_VIEW'       // Visualização de galeria de fotos
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
// TREND CALCULATION HELPER
// ============================================

/**
 * Calculate trend percentage: ((current - previous) / previous) * 100
 * Returns null if no previous data to compare against
 */
function calcTrend(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
}

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
            logger.debug('[Analytics] Error queuing event:', error);
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

    trackToolView(userId: string | null, toolId: string, toolName: string): void {
        this.trackEvent(userId, 'TOOL_VIEW', {
            tool_id: toolId,
            tool_name: toolName
        });
    }

    trackFileDownload(userId: string | null, fileId: string, fileName: string, fileType?: string): void {
        this.trackEvent(userId, 'FILE_DOWNLOAD', {
            file_id: fileId,
            file_name: fileName,
            file_type: fileType
        });
    }

    trackReportView(userId: string | null, reportName: string, metadata?: Record<string, any>): void {
        this.trackEvent(userId, 'REPORT_VIEW', {
            report_name: reportName,
            ...metadata
        });
    }

    trackGalleryView(userId: string | null, albumId: string, albumTitle: string): void {
        this.trackEvent(userId, 'GALLERY_VIEW', {
            album_id: albumId,
            album_title: albumTitle
        });
    }

    trackSolutionClick(userId: string | null, solutionId: string, solutionTitle: string): void {
        this.trackEvent(userId, 'TOOL_VIEW', {
            tool_id: solutionId,
            tool_name: solutionTitle,
            source: 'solutions_page'
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
                logger.debug('[Analytics] Error sending events:', error.message);
                // Re-queue failed events (up to a limit)
                if (this.queue.length < 50) {
                    this.queue = [...eventsToSend, ...this.queue];
                }
            }
        } catch (error) {
            logger.debug('[Analytics] Network error:', error);
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
                logger.debug('[Analytics] Benefit tracking error:', error);
            }
        } catch (err) {
            // Silent fail - analytics nunca deve quebrar a aplicação
            logger.debug('[Analytics] Benefit tracking failed:', err);
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
                if (isAbortError(error)) return null;
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
            if (isAbortError(error)) return null;
            logger.error('[Analytics] Error fetching benefit stats:', error);
            return null;
        }
    }

    // ========================================
    // BENEFIT ANALYTICS - ADMIN LEVEL (RPCs)
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

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            // Fetch owner names
            if (!data || data.length === 0) return [];

            const ownerIds = data.map(d => d.benefit_owner_id);
            const { data: profiles, error: profileError } = await supabase
                .from('profiles')
                .select('id, name, exclusive_benefit')
                .in('id', ownerIds);

            if (profileError) {
                if (isAbortError(profileError)) return [];
                throw profileError;
            }

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
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching top benefits:', error);
            return [];
        }
    }

    /**
     * Get benefit overview stats (Admin only)
     * ✅ REFACTORED: Uses RPC instead of downloading all stats for JS .reduce()
     */
    async getBenefitOverview(): Promise<BenefitOverview> {
        const EMPTY: BenefitOverview = {
            activeBenefits: 0,
            totalViews: 0,
            totalClicks: 0,
            totalUniqueVisitors: 0,
            avgCtrPercent: 0,
            benefitsWithActivity: 0
        };

        try {
            const { data, error } = await supabase
                .rpc('get_benefit_overview_stats');

            if (error) {
                if (isAbortError(error)) return EMPTY;
                throw error;
            }

            const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (!row) return EMPTY;

            return {
                activeBenefits: Number(row.active_benefits) || 0,
                totalViews: Number(row.total_views) || 0,
                totalClicks: Number(row.total_clicks) || 0,
                totalUniqueVisitors: Number(row.total_unique_visitors) || 0,
                avgCtrPercent: parseFloat(row.avg_ctr_percent) || 0,
                benefitsWithActivity: Number(row.benefits_with_activity) || 0
            };
        } catch (error) {
            if (isAbortError(error)) return EMPTY;
            logger.error('[Analytics] Error fetching benefit overview:', error);
            return EMPTY;
        }
    }

    /**
     * Get benefit engagement metrics (Admin only)
     * ✅ REFACTORED: Uses RPC with COUNT(DISTINCT) instead of downloading visitor_ids to JS
     */
    async getBenefitEngagement(days: number = 30): Promise<BenefitEngagement> {
        const EMPTY: BenefitEngagement = {
            uniqueViewers: 0,
            uniqueClickers: 0,
            totalMembers: 0,
            engagementRate: 0,
            conversionRate: 0,
            period: days
        };

        try {
            const { data, error } = await supabase
                .rpc('get_benefit_engagement_stats', { p_days: days });

            if (error) {
                if (isAbortError(error)) return EMPTY;
                throw error;
            }

            const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (!row) return EMPTY;

            return {
                uniqueViewers: Number(row.unique_viewers) || 0,
                uniqueClickers: Number(row.unique_clickers) || 0,
                totalMembers: Number(row.total_members) || 0,
                engagementRate: parseFloat(row.engagement_rate) || 0,
                conversionRate: parseFloat(row.conversion_rate) || 0,
                period: days
            };
        } catch (error) {
            if (isAbortError(error)) return EMPTY;
            logger.error('[Analytics] Error fetching benefit engagement:', error);
            return EMPTY;
        }
    }

    // ========================================
    // DASHBOARD STATS (ADMIN) — RPCs
    // ========================================

    /**
     * Get dashboard statistics for admin panel
     * ✅ REFACTORED: Uses single RPC that returns current + previous period
     * for real trend calculation
     */
    async getDashboardStats(period: '7d' | '30d' | '90d' = '30d'): Promise<DashboardStats> {
        const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
        const EMPTY: DashboardStats = {
            activeUsersToday: 0,
            newMembersMonth: 0,
            messagesSent: 0,
            videosCompleted: 0,
            totalEvents: 0,
            period,
            trendNewMembers: null,
            trendMessages: null,
            trendVideos: null,
            trendEvents: null
        };

        try {
            const { data, error } = await supabase
                .rpc('get_dashboard_stats_with_trends', { p_days: days });

            if (error) {
                if (isAbortError(error)) return EMPTY;
                throw error;
            }

            const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (!row) return EMPTY;

            const current = {
                activeUsersToday: Number(row.active_users_today) || 0,
                newMembers: Number(row.new_members) || 0,
                messagesSent: Number(row.messages_sent) || 0,
                videosCompleted: Number(row.videos_completed) || 0,
                totalEvents: Number(row.total_events) || 0,
            };

            const prev = {
                newMembers: Number(row.prev_new_members) || 0,
                messagesSent: Number(row.prev_messages_sent) || 0,
                videosCompleted: Number(row.prev_videos_completed) || 0,
                totalEvents: Number(row.prev_total_events) || 0,
            };

            return {
                activeUsersToday: current.activeUsersToday,
                newMembersMonth: current.newMembers,
                messagesSent: current.messagesSent,
                videosCompleted: current.videosCompleted,
                totalEvents: current.totalEvents,
                period,
                trendNewMembers: calcTrend(current.newMembers, prev.newMembers),
                trendMessages: calcTrend(current.messagesSent, prev.messagesSent),
                trendVideos: calcTrend(current.videosCompleted, prev.videosCompleted),
                trendEvents: calcTrend(current.totalEvents, prev.totalEvents),
            };
        } catch (error) {
            if (isAbortError(error)) return EMPTY;
            logger.error('[Analytics] Error fetching dashboard stats:', error);
            return EMPTY;
        }
    }

    /**
     * Get activity by day for chart
     * ✅ REFACTORED: Uses RPC — Postgres does GROUP BY instead of downloading ALL rows
     */
    async getActivityByDay(days: number = 30): Promise<DailyActivity[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_daily_activity_stats', { p_days: days });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            // RPC now returns generate_series rows (always p_days rows, zero-filled)
            // activity_date is TEXT 'YYYY-MM-DD' — no timezone ambiguity
            return (data || []).map((row: any) => {
                const dateStr = String(row.activity_date || '');
                // Safe date parse: append T12:00:00Z to avoid browser timezone shifting the day
                const d = new Date(dateStr + 'T12:00:00Z');
                return {
                    date: dateStr,
                    label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }),
                    total: Number(row.total) || 0,
                    pageViews: Number(row.page_views) || 0,
                    videos: Number(row.videos) || 0,
                    messages: Number(row.messages) || 0,
                };
            });
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching activity by day:', error);
            return [];
        }
    }

    /**
     * Get daily access metrics: total sessions + unique users (DAU)
     * Uses RPC get_daily_access_metrics
     */
    async getDailyAccessMetrics(days: number = 30): Promise<DailyAccessMetrics[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_daily_access_metrics', { p_days: days });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            return (data || []).map((row: any) => ({
                date: String(row.activity_date || ''),
                totalSessions: Number(row.total_sessions) || 0,
                uniqueUsers: Number(row.unique_users) || 0,
            }));
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching daily access metrics:', error);
            return [];
        }
    }

    /**
     * Get top videos by view count
     * ✅ REFACTORED: Uses RPC with date filter — no more downloading ALL metadata
     */
    async getTopVideos(limit: number = 5, days: number = 30): Promise<TopContent[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_top_content', {
                    p_event_type: 'VIDEO_START',
                    p_days: days,
                    p_limit: limit
                });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            return (data || []).map((row: any) => ({
                id: row.content_id,
                title: row.content_title || 'Sem título',
                count: Number(row.view_count) || 0
            }));
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching top videos:', error);
            return [];
        }
    }

    /**
     * Get top articles by read count
     * ✅ REFACTORED: Uses RPC with date filter — no more downloading ALL metadata
     */
    async getTopArticles(limit: number = 5, days: number = 30): Promise<TopContent[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_top_content', {
                    p_event_type: 'ARTICLE_READ',
                    p_days: days,
                    p_limit: limit
                });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            return (data || []).map((row: any) => ({
                id: row.content_id,
                title: row.content_title || 'Sem título',
                count: Number(row.view_count) || 0
            }));
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching top articles:', error);
            return [];
        }
    }

    /**
     * Get event breakdown by type
     * ✅ REFACTORED: Uses RPC — Postgres does GROUP BY instead of counting in JS
     */
    async getEventBreakdown(days: number = 30): Promise<EventBreakdown[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_event_type_breakdown', { p_days: days });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            return (data || []).map((row: any) => ({
                name: row.event_name,
                value: Number(row.event_count) || 0
            }));
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching event breakdown:', error);
            return [];
        }
    }

    // ========================================
    // BUSINESS INTELLIGENCE — Fase B RPCs
    // ========================================

    /**
     * Get networking funnel: Referrals → Deals → Audited Deals
     * ✅ Via RPC get_networking_funnel
     */
    async getNetworkingFunnel(days: number = 30): Promise<NetworkingFunnel> {
        const EMPTY: NetworkingFunnel = {
            totalReferrals: 0,
            totalDeals: 0,
            auditedDeals: 0,
            auditedVolume: 0,
            conversionRate: 0
        };

        try {
            const { data, error } = await supabase
                .rpc('get_networking_funnel', { p_days: days });

            if (error) {
                if (isAbortError(error)) return EMPTY;
                throw error;
            }

            const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (!row) return EMPTY;

            return {
                totalReferrals: Number(row.total_referrals) || 0,
                totalDeals: Number(row.total_deals) || 0,
                auditedDeals: Number(row.audited_deals) || 0,
                auditedVolume: parseFloat(row.audited_volume) || 0,
                conversionRate: parseFloat(row.conversion_rate) || 0
            };
        } catch (error) {
            if (isAbortError(error)) return EMPTY;
            logger.error('[Analytics] Error fetching networking funnel:', error);
            return EMPTY;
        }
    }

    /**
     * Get top ROI members ranked by audited deal volume
     * ✅ Via RPC get_top_roi_members
     */
    async getTopRoiMembers(days: number = 30, limit: number = 10): Promise<TopRoiMember[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_top_roi_members', { p_days: days, p_limit: limit });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            return (data || []).map((row: any) => ({
                memberId: row.member_id,
                memberName: row.member_name || 'Desconhecido',
                memberImage: row.member_image || null,
                dealCount: Number(row.deal_count) || 0,
                totalVolume: parseFloat(row.total_volume) || 0
            }));
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching top ROI members:', error);
            return [];
        }
    }

    /**
     * Get members at churn risk: inactive + no deals
     * ✅ Via RPC get_churn_risk_members
     */
    async getChurnRiskMembers(daysInactive: number = 14): Promise<ChurnRiskMember[]> {
        try {
            const { data, error } = await supabase
                .rpc('get_churn_risk_members', { p_days_inactive: daysInactive });

            if (error) {
                if (isAbortError(error)) return [];
                throw error;
            }

            return (data || []).map((row: any) => ({
                memberId: row.member_id,
                memberName: row.member_name || 'Desconhecido',
                memberEmail: row.member_email || '',
                memberImage: row.member_image || null,
                phone: row.member_phone || null,
                lastAccess: row.last_access || null,
                daysInactive: Number(row.days_inactive) || 0,
                dealsLast60d: Number(row.deals_last_60d) || 0
            }));
        } catch (error) {
            if (isAbortError(error)) return [];
            logger.error('[Analytics] Error fetching churn risk members:', error);
            return [];
        }
    }

    /**
     * Get Academy completion rate: VIDEO_START vs VIDEO_COMPLETE
     * ✅ Via RPC get_academy_completion_rate
     */
    async getAcademyCompletionRate(days: number = 30): Promise<AcademyCompletion> {
        const EMPTY: AcademyCompletion = {
            videosStarted: 0,
            videosCompleted: 0,
            completionRate: 0
        };

        try {
            const { data, error } = await supabase
                .rpc('get_academy_completion_rate', { p_days: days });

            if (error) {
                if (isAbortError(error)) return EMPTY;
                throw error;
            }

            const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (!row) return EMPTY;

            return {
                videosStarted: Number(row.videos_started) || 0,
                videosCompleted: Number(row.videos_completed) || 0,
                completionRate: parseFloat(row.completion_rate) || 0
            };
        } catch (error) {
            if (isAbortError(error)) return EMPTY;
            logger.error('[Analytics] Error fetching academy completion:', error);
            return EMPTY;
        }
    }

    /**
     * Get event attendance rate: RSVP vs check-in
     * ✅ Via RPC get_event_attendance_rate
     */
    async getEventAttendanceRate(days: number = 30): Promise<EventAttendance> {
        const EMPTY: EventAttendance = {
            totalRsvps: 0,
            totalCheckins: 0,
            attendanceRate: 0,
            noShowCount: 0
        };

        try {
            const { data, error } = await supabase
                .rpc('get_event_attendance_rate', { p_days: days });

            if (error) {
                if (isAbortError(error)) return EMPTY;
                throw error;
            }

            const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
            if (!row) return EMPTY;

            return {
                totalRsvps: Number(row.total_rsvps) || 0,
                totalCheckins: Number(row.total_checkins) || 0,
                attendanceRate: parseFloat(row.attendance_rate) || 0,
                noShowCount: Number(row.no_show_count) || 0
            };
        } catch (error) {
            if (isAbortError(error)) return EMPTY;
            logger.error('[Analytics] Error fetching event attendance:', error);
            return EMPTY;
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
    period: '7d' | '30d' | '90d';
    // ✅ Real trend percentages (null = no previous data to compare)
    trendNewMembers: number | null;
    trendMessages: number | null;
    trendVideos: number | null;
    trendEvents: number | null;
}

export interface DailyActivity {
    date: string;
    label: string;
    total: number;
    pageViews: number;
    videos: number;
    messages: number;
}

export interface DailyAccessMetrics {
    date: string;
    totalSessions: number;
    uniqueUsers: number;
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

// ============================================
// BUSINESS INTELLIGENCE TYPES (Fase B)
// ============================================

export interface NetworkingFunnel {
    totalReferrals: number;
    totalDeals: number;
    auditedDeals: number;
    auditedVolume: number;
    conversionRate: number;
}

export interface TopRoiMember {
    memberId: string;
    memberName: string;
    memberImage: string | null;
    dealCount: number;
    totalVolume: number;
}

export interface ChurnRiskMember {
    memberId: string;
    memberName: string;
    memberEmail: string;
    memberImage: string | null;
    phone: string | null;
    lastAccess: string | null;
    daysInactive: number;
    dealsLast60d: number;
}

export interface AcademyCompletion {
    videosStarted: number;
    videosCompleted: number;
    completionRate: number;
}

export interface EventAttendance {
    totalRsvps: number;
    totalCheckins: number;
    attendanceRate: number;
    noShowCount: number;
}

// Singleton export
export const analyticsService = new AnalyticsService();
