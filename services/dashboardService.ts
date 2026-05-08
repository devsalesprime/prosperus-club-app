// dashboardService.ts
// Data layer for the Admin dashboard home (KPI counters)

import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface AdminKpis {
    members: number;
    upcomingEvents: number;
    videos: number;
    articles: number;
    files: number;
}

class DashboardService {
    async getAdminKpis(): Promise<AdminKpis> {
        const nowIso = new Date().toISOString();

        const [membersRes, eventsRes, videosRes, articlesRes, filesRes] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('club_events').select('*', { count: 'exact', head: true }).gte('date', nowIso),
            supabase.from('videos').select('*', { count: 'exact', head: true }),
            supabase.from('articles').select('*', { count: 'exact', head: true }).eq('status', 'PUBLISHED'),
            supabase.from('member_files').select('*', { count: 'exact', head: true }).eq('is_visible', true),
        ]);

        const firstError =
            membersRes.error || eventsRes.error || videosRes.error || articlesRes.error || filesRes.error;
        if (firstError) {
            logger.error('[dashboardService.getAdminKpis] query error', firstError);
            throw firstError;
        }

        return {
            members: membersRes.count ?? 0,
            upcomingEvents: eventsRes.count ?? 0,
            videos: videosRes.count ?? 0,
            articles: articlesRes.count ?? 0,
            files: filesRes.count ?? 0,
        };
    }
}

export const dashboardService = new DashboardService();
