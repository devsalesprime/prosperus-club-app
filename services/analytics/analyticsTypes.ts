// ============================================
// ANALYTICS TYPES — All interfaces for the analytics system
// Extracted from analyticsService.ts (Operação Estilhaço)
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
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
    activeUsersToday: number;
    newMembersMonth: number;
    messagesSent: number;
    videosCompleted: number;
    totalEvents: number;
    period: '7d' | '30d' | '90d';
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
