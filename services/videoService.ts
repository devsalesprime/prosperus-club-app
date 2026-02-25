import { supabase } from '../lib/supabase';
import { Video, VideoProgress, VideoCategory } from '../types';
import { logger } from '../utils/logger';

/**
 * Video Service - Handles all video-related operations
 */
export const videoService = {
    /**
     * Fetch all videos
     */
    async listVideos(): Promise<Video[]> {
        const { data, error } = await supabase
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, platform, duration, category, category_id, series_id, series_order, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapVideoFromDB);
    },

    /**
     * Fetch videos by category
     */
    async getVideosByCategory(category: string): Promise<Video[]> {
        const { data, error } = await supabase
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, platform, duration, category, created_at, view_count, series_id, series_order')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data.map(mapVideoFromDB);
    },

    /**
     * Fetch videos in a series
     */
    async getSeriesVideos(seriesId: string): Promise<Video[]> {
        const { data, error } = await supabase
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, platform, duration, category, created_at, view_count, series_id, series_order')
            .eq('series_id', seriesId)
            .order('series_order', { ascending: true });

        if (error) throw error;
        return data.map(mapVideoFromDB);
    },

    /**
     * Create new video (Admin only)
     */
    async createVideo(video: Partial<Video>): Promise<Video> {
        // DEBUG: Verificar sessão antes de inserir
        const { data: { session } } = await supabase.auth.getSession();
        logger.debug('🔍 createVideo - Session:', {
            email: session?.user?.email,
            id: session?.user?.id,
            hasSession: !!session
        });

        // DEBUG: Verificar perfil
        if (session?.user?.id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, email, role')
                .eq('id', session.user.id)
                .maybeSingle();
            logger.debug('🔍 createVideo - Profile:', profile);
        }

        logger.debug('🔍 createVideo - Tentando inserir:', {
            title: video.title,
            category: video.category
        });

        const { data, error } = await supabase
            .from('videos')
            .insert([{
                title: video.title,
                description: video.description,
                video_url: video.videoUrl,
                thumbnail_url: video.thumbnail,
                duration: video.duration,
                category: video.category,
                category_id: video.categoryId || null,
                series_id: video.seriesId || null,
                series_order: video.seriesOrder || null
            }])
            .select()
            .single();

        if (error) {
            logger.debug('❌ createVideo - Erro:', error);
            throw error;
        }

        logger.info('✅ createVideo - Sucesso:', data);
        return mapVideoFromDB(data);
    },

    /**
     * Update existing video (Admin only)
     */
    async updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
        const { data, error } = await supabase
            .from('videos')
            .update({
                title: updates.title,
                description: updates.description,
                video_url: updates.videoUrl,
                thumbnail_url: updates.thumbnail,
                duration: updates.duration,
                category: updates.category,
                category_id: updates.categoryId || null,
                series_id: updates.seriesId || null,
                series_order: updates.seriesOrder || null
            })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) {
            console.error('❌ updateVideo error:', error);
            throw error;
        }

        if (!data) {
            console.error('❌ updateVideo: No data returned - RLS may be blocking or video not found');
            throw new Error('Não foi possível atualizar o vídeo. Verifique se você tem permissão de administrador.');
        }

        return mapVideoFromDB(data);
    },

    /**
     * Delete video (Admin only)
     */
    async deleteVideo(id: string): Promise<void> {
        const { error } = await supabase
            .from('videos')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get user's video progress
     */
    async getUserProgress(userId: string, videoId: string): Promise<VideoProgress | null> {
        const { data, error } = await supabase
            .from('video_progress')
            .select('id, user_id, video_id, progress, last_watched_at')
            .eq('user_id', userId)
            .eq('video_id', videoId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        return {
            id: data.id,
            userId: data.user_id,
            videoId: data.video_id,
            progress: data.progress,
            lastWatchedAt: data.last_watched_at
        };
    },

    /**
     * Get all user's video progress
     */
    async getAllUserProgress(userId: string): Promise<Map<string, VideoProgress>> {
        const { data, error } = await supabase
            .from('video_progress')
            .select('id, user_id, video_id, progress, last_watched_at')
            .eq('user_id', userId);

        if (error) throw error;

        const progressMap = new Map<string, VideoProgress>();
        data.forEach(item => {
            progressMap.set(item.video_id, {
                id: item.id,
                userId: item.user_id,
                videoId: item.video_id,
                progress: item.progress,
                lastWatchedAt: item.last_watched_at
            });
        });

        return progressMap;
    },

    /**
     * Update video progress with upsert
     * Uses current authenticated user from Supabase
     * @param videoId - Video UUID
     * @param percentage - Progress percentage (0-100)
     */
    async updateProgress(videoId: string, percentage: number): Promise<void> {
        try {
            // Get current user
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.warn('⚠️ updateProgress: No authenticated user');
                return;
            }

            // Validate UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(videoId)) {
                console.warn('⚠️ updateProgress: Invalid video ID format:', videoId);
                return;
            }

            // Determine if completed
            const isCompleted = percentage >= 100;
            const finalPercentage = isCompleted ? 100 : Math.min(percentage, 99);

            logger.debug(`📊 Saving progress: ${finalPercentage}% for video ${videoId}`);

            const { error } = await supabase
                .from('video_progress')
                .upsert({
                    user_id: user.id,
                    video_id: videoId,
                    progress: finalPercentage,
                    last_watched_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,video_id'
                });

            if (error) {
                console.error('❌ updateProgress error:', error);
                // Silent fail - don't throw for auto-save
            } else {
                logger.info(`✅ Progress saved: ${finalPercentage}%${isCompleted ? ' (COMPLETED)' : ''}`);
            }
        } catch (error) {
            console.error('❌ updateProgress exception:', error);
            // Silent fail
        }
    },

    /**
     * Legacy updateProgress with explicit userId (for backward compatibility)
     */
    async updateProgressLegacy(userId: string, videoId: string, progress: number): Promise<void> {
        // Validate UUID format (skip if mock user like "admin-1", "member-1", etc.)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(userId)) {
            logger.debug('⚠️ MOCK MODE: Skipping video progress save for mock user:', userId);
            return;
        }

        if (!uuidRegex.test(videoId)) {
            logger.debug('⚠️ Invalid video ID format:', videoId);
            return;
        }

        const isCompleted = progress >= 100;

        const { error } = await supabase
            .from('video_progress')
            .upsert({
                user_id: userId,
                video_id: videoId,
                progress: isCompleted ? 100 : progress,
                last_watched_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,video_id'
            });

        if (error) {
            console.error('❌ updateProgressLegacy error:', error);
        }
    },

    /**
     * Mark video as completed
     * Forces progress = 100
     * @param videoId - Video UUID
     * @param userId - Optional user ID (fallback when auth.getUser() fails)
     */
    async markAsCompleted(videoId: string, userId?: string): Promise<boolean> {
        try {
            // Try to get user from auth, fallback to provided userId
            let effectiveUserId = userId;

            if (!effectiveUserId) {
                const { data: { user }, error: authError } = await supabase.auth.getUser();
                if (authError || !user) {
                    console.warn('⚠️ markAsCompleted: No authenticated user and no userId provided');
                    return false;
                }
                effectiveUserId = user.id;
            }

            // Validate UUIDs
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(videoId)) {
                console.warn('⚠️ markAsCompleted: Invalid video ID:', videoId);
                return false;
            }
            if (!uuidRegex.test(effectiveUserId)) {
                console.warn('⚠️ markAsCompleted: Invalid user ID:', effectiveUserId);
                return false;
            }

            logger.debug(`🎉 Marking video ${videoId} as completed for user ${effectiveUserId}`);

            const { error } = await supabase
                .from('video_progress')
                .upsert({
                    user_id: effectiveUserId,
                    video_id: videoId,
                    progress: 100,
                    last_watched_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,video_id'
                });

            if (error) {
                console.error('❌ markAsCompleted error:', error);
                return false;
            }

            logger.info('✅ Video marked as completed');
            return true;
        } catch (error) {
            console.error('❌ markAsCompleted exception:', error);
            return false;
        }
    },

    /**
     * Get video progress for current user
     * Returns percentage and is_completed status
     */
    async getVideoProgress(videoId: string): Promise<{ percentage: number; isCompleted: boolean } | null> {
        try {
            // Get current user
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                console.warn('⚠️ getVideoProgress: No authenticated user');
                return null;
            }

            // Validate UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(videoId)) {
                return null;
            }

            const { data, error } = await supabase
                .from('video_progress')
                .select('progress')
                .eq('user_id', user.id)
                .eq('video_id', videoId)
                .maybeSingle();

            if (error) {
                console.error('❌ getVideoProgress error:', error);
                return null;
            }

            if (!data) {
                return { percentage: 0, isCompleted: false };
            }

            return {
                percentage: data.progress || 0,
                isCompleted: (data.progress || 0) >= 100
            };
        } catch (error) {
            console.error('❌ getVideoProgress exception:', error);
            return null;
        }
    },

    /**
     * Get videos user is currently watching (progress > 0 and < 100)
     */
    async getContinueWatching(userId: string): Promise<Video[]> {
        const { data, error } = await supabase
            .from('video_progress')
            .select('video_id, progress, last_watched_at, videos(*)')
            .eq('user_id', userId)
            .gt('progress', 0)
            .lt('progress', 100)
            .order('last_watched_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        if (!data) return [];

        return data
            .filter(item => item.videos)
            .map(item => ({
                ...mapVideoFromDB(item.videos),
                progress: item.progress
            }));
    },

    /**
     * Get all completed videos for user
     */
    async getCompletedVideos(userId: string): Promise<Video[]> {
        const { data, error } = await supabase
            .from('video_progress')
            .select('video_id, progress, last_watched_at, videos(*)')
            .eq('user_id', userId)
            .eq('progress', 100)
            .order('last_watched_at', { ascending: false });

        if (error) throw error;
        if (!data) return [];

        return data
            .filter(item => item.videos)
            .map(item => ({
                ...mapVideoFromDB(item.videos),
                progress: 100
            }));
    },

    // ============================================
    // CATEGORY CRUD
    // ============================================

    /**
     * Fetch all video categories
     */
    async getCategories(): Promise<VideoCategory[]> {
        const { data, error } = await supabase
            .from('video_categories')
            .select('id, name, description, cover_image, created_at')
            .order('name', { ascending: true });

        if (error) throw error;
        return (data || []).map(mapCategoryFromDB);
    },

    /**
     * Create a new video category
     */
    async createCategory(category: Partial<VideoCategory>): Promise<VideoCategory> {
        const { data, error } = await supabase
            .from('video_categories')
            .insert([{
                name: category.name,
                description: category.description || null,
                cover_image: category.coverImage || null
            }])
            .select()
            .single();

        if (error) throw error;
        return mapCategoryFromDB(data);
    },

    /**
     * Update an existing video category
     */
    async updateCategory(id: string, updates: Partial<VideoCategory>): Promise<VideoCategory> {
        const { data, error } = await supabase
            .from('video_categories')
            .update({
                name: updates.name,
                description: updates.description || null,
                cover_image: updates.coverImage || null
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapCategoryFromDB(data);
    },

    /**
     * Delete a video category
     */
    async deleteCategory(id: string): Promise<void> {
        const { error } = await supabase
            .from('video_categories')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Fetch videos by category_id (FK)
     */
    async getVideosByCategoryId(categoryId: string): Promise<Video[]> {
        const { data, error } = await supabase
            .from('videos')
            .select('id, title, description, thumbnail_url, video_url, platform, duration, category, category_id, series_id, series_order, created_at')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(mapVideoFromDB);
    }
};

/**
 * Map database video to Video interface
 */
function mapVideoFromDB(dbVideo: any): Video {
    return {
        id: dbVideo.id,
        title: dbVideo.title,
        description: dbVideo.description || '',
        thumbnail: dbVideo.thumbnail_url || '',
        videoUrl: dbVideo.video_url || '',
        duration: dbVideo.duration || '0:00',
        category: dbVideo.category || 'Geral',
        categoryId: dbVideo.category_id || undefined,
        progress: 0, // Will be populated separately
        seriesId: dbVideo.series_id || undefined,
        seriesOrder: dbVideo.series_order || undefined,
        comments: []
    };
}

/**
 * Map database category to VideoCategory interface
 */
function mapCategoryFromDB(dbCategory: any): VideoCategory {
    return {
        id: dbCategory.id,
        name: dbCategory.name,
        description: dbCategory.description || undefined,
        coverImage: dbCategory.cover_image || undefined,
        createdAt: dbCategory.created_at || undefined
    };
}
