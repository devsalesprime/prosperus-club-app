// Service for managing user profiles

import { supabase } from '../lib/supabase';
import { fetchWithOfflineCache, cacheData, getCachedData } from './offlineStorage';
import { logger } from '../utils/logger';

export interface ProfileData {
    id: string;
    email: string;
    name: string;
    role: 'ADMIN' | 'TEAM' | 'MEMBER';
    company?: string;
    job_title?: string;
    image_url?: string;
    bio?: string;
    socials?: {
        linkedin?: string;
        instagram?: string;
        whatsapp?: string;
        website?: string;
    };
    tags?: string[];
    is_featured?: boolean;
    exclusive_benefit?: ExclusiveBenefit | null;
    has_completed_onboarding?: boolean;
    pitch_video_url?: string; // URL do vídeo de pitch (YouTube, Vimeo, Drive, Loom)
    hubspot_contact_id?: string; // HubSpot Contact ID for CRM sync
    // Strategic Profile Fields (PRD v2.1)
    what_i_sell?: string;              // ONB-FLD-001: O que vende/faz
    what_i_need?: string;              // ONB-FLD-002: O que precisa/compraria
    partnership_interests?: string[];   // ONB-FLD-003: Setores de interesse
    member_since?: string;             // HUB-SYNC-008: Data de entrada no clube
    phone?: string;
}

// Exclusive Benefit type - cada sócio pode oferecer um benefício ao clube
export interface ExclusiveBenefit {
    title: string;
    description: string;
    ctaLabel?: string;  // Ex: "Pegar Cupom", "Agendar"
    ctaUrl?: string;    // Link para ação
    code?: string;      // Cupom/código opcional
    active: boolean;    // Se o benefício está ativo
}

export interface ProfileUpdateData {
    name?: string;
    company?: string;
    job_title?: string;
    image_url?: string;
    bio?: string;
    socials?: {
        linkedin?: string;
        instagram?: string;
        whatsapp?: string;
        website?: string;
    };
    tags?: string[];
    exclusive_benefit?: ExclusiveBenefit | null;
    pitch_video_url?: string; // URL do vídeo de pitch (YouTube, Vimeo, Drive, Loom)
    // Strategic Profile Fields (PRD v2.1)
    what_i_sell?: string;
    what_i_need?: string;
    partnership_interests?: string[];
    phone?: string;
}

class ProfileService {
    /**
     * Get profile by user ID
     * Includes 15-second timeout to prevent indefinite hanging
     * Uses offline cache as fallback
     */
    async getProfile(userId: string): Promise<ProfileData | null> {
        const cacheKey = `profile:${userId}`;

        try {
            logger.debug('🔍 profileService.getProfile: Starting query for userId:', userId);

            const startTime = Date.now();

            // Create timeout promise (15 seconds - increased for VPS latency)
            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => {
                    reject(new Error('Profile fetch timeout after 15 seconds'));
                }, 15000);
            });

            // Create query promise
            const queryPromise = supabase
                .from('profiles')
                .select('id, name, email, image_url, company, job_title, phone, role, bio, socials, tags, is_featured, exclusive_benefit, has_completed_onboarding, pitch_video_url, hubspot_contact_id, what_i_sell, what_i_need, partnership_interests, member_since, created_at, updated_at')
                .eq('id', userId)
                .single();

            // Race between query and timeout
            const result = await Promise.race([queryPromise, timeoutPromise]);

            const duration = Date.now() - startTime;
            logger.debug(`⏱️ profileService.getProfile: Query completed in ${duration}ms`);

            // Type guard to check if result has error property
            if (result && typeof result === 'object' && 'error' in result) {
                const { data, error } = result as { data: ProfileData | null; error: any };

                if (error) {
                    console.error('❌ profileService.getProfile: Supabase error:', {
                        code: error.code,
                        message: error.message,
                        details: error.details,
                        hint: error.hint
                    });
                    throw error;
                }

                logger.debug('✅ profileService.getProfile: Profile found:', data?.name);

                // Cache for offline use (10 minutes)
                if (data) {
                    await cacheData(cacheKey, data, 10 * 60 * 1000);
                }

                return data;
            }

            return null;
        } catch (error: any) {
            console.error('❌ profileService.getProfile: Exception caught:', {
                name: error?.name,
                message: error?.message,
                code: error?.code,
                userId
            });

            // Fallback to offline cache
            const cached = await getCachedData<ProfileData>(cacheKey);
            if (cached) {
                logger.debug('📦 profileService.getProfile: Returning cached profile');
                return cached;
            }

            // Return null to let caller create fallback profile
            return null;
        }
    }

    /**
     * Get all member profiles (for Member Book)
     * Returns profiles ordered by name, excluding blocked users
     * Uses offline cache for offline access (5 min TTL)
     * @param excludeUserId - Optional user ID to exclude from results (e.g., current user)
     */
    async getAllProfiles(excludeUserId?: string): Promise<ProfileData[]> {
        const cacheKey = `all-profiles:${excludeUserId || 'all'}`;

        try {
            const { data } = await fetchWithOfflineCache<ProfileData[]>(
                cacheKey,
                async () => {
                    let query = supabase
                        .from('profiles')
                        .select('id, name, email, image_url, company, job_title, phone, role, bio, socials, tags, is_featured, exclusive_benefit, has_completed_onboarding, pitch_video_url, what_i_sell, what_i_need, partnership_interests, member_since, created_at')
                        .eq('role', 'MEMBER');

                    // Exclude specific user if provided (e.g., logged-in user)
                    if (excludeUserId) {
                        query = query.neq('id', excludeUserId);
                    }

                    const { data, error } = await query.order('name', { ascending: true });
                    if (error) throw error;
                    return data || [];
                },
                5 * 60 * 1000 // 5 minutes
            );
            return data;
        } catch (error) {
            console.error('Error fetching all profiles:', error);
            return [];
        }
    }

    /**
     * Get filtered member profiles (for Member Book with filters)
     * Supports filtering by query (name/company), job title, and tags
     * @param filters - Optional filters for query, role, tag, and excludeUserId
     */
    async getFilteredProfiles(filters?: {
        query?: string;
        role?: string;
        tag?: string;
        excludeUserId?: string;
    }): Promise<ProfileData[]> {
        try {
            let queryBuilder = supabase
                .from('profiles')
                .select('id, name, email, image_url, company, job_title, phone, role, bio, socials, tags, is_featured, exclusive_benefit, has_completed_onboarding, pitch_video_url, what_i_sell, what_i_need, partnership_interests, member_since, created_at')
                .eq('role', 'MEMBER');

            // Exclude specific user if provided (e.g., logged-in user)
            if (filters?.excludeUserId) {
                queryBuilder = queryBuilder.neq('id', filters.excludeUserId);
            }

            // Text search - name or company
            if (filters?.query && filters.query.trim()) {
                const searchTerm = `%${filters.query.trim()}%`;
                queryBuilder = queryBuilder.or(`name.ilike.${searchTerm},company.ilike.${searchTerm}`);
            }

            // Job title filter
            if (filters?.role && filters.role.trim()) {
                const roleTerm = `%${filters.role.trim()}%`;
                queryBuilder = queryBuilder.ilike('job_title', roleTerm);
            }

            // Tag filter - using contains for array
            if (filters?.tag && filters.tag.trim()) {
                queryBuilder = queryBuilder.contains('tags', [filters.tag.trim()]);
            }

            const { data, error } = await queryBuilder.order('name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching filtered profiles:', error);
            return [];
        }
    }

    /**
     * Get paginated member profiles (for Member Book with infinite scroll)
     * Uses Supabase .range() for efficient server-side pagination
     * @param page - Zero-based page index
     * @param pageSize - Number of items per page
     * @param filters - Optional filters (query, role, tag, excludeUserId)
     * @returns { data: ProfileData[], count: number | null }
     */
    async getProfilesPaginated(
        page: number,
        pageSize: number,
        filters?: {
            query?: string;
            role?: string;
            tag?: string;
            excludeUserId?: string;
        }
    ): Promise<{ data: ProfileData[]; count: number | null }> {
        try {
            const from = page * pageSize;
            const to = from + pageSize - 1;

            let queryBuilder = supabase
                .from('profiles')
                .select(
                    'id, name, email, image_url, company, job_title, phone, role, bio, socials, tags, is_featured, exclusive_benefit, has_completed_onboarding, pitch_video_url, what_i_sell, what_i_need, partnership_interests, member_since, created_at',
                    { count: 'exact', head: false }
                )
                .eq('role', 'MEMBER');

            // Exclude specific user if provided
            if (filters?.excludeUserId) {
                queryBuilder = queryBuilder.neq('id', filters.excludeUserId);
            }

            // Text search — name or company
            if (filters?.query && filters.query.trim()) {
                const searchTerm = `%${filters.query.trim()}%`;
                queryBuilder = queryBuilder.or(`name.ilike.${searchTerm},company.ilike.${searchTerm}`);
            }

            // Job title filter
            if (filters?.role && filters.role.trim()) {
                const roleTerm = `%${filters.role.trim()}%`;
                queryBuilder = queryBuilder.ilike('job_title', roleTerm);
            }

            // Tag filter — using contains for array
            if (filters?.tag && filters.tag.trim()) {
                queryBuilder = queryBuilder.contains('tags', [filters.tag.trim()]);
            }

            const { data, error, count } = await queryBuilder
                .order('name', { ascending: true })
                .range(from, to);

            if (error) throw error;
            return { data: data || [], count };
        } catch (error) {
            console.error('Error fetching paginated profiles:', error);
            return { data: [], count: null };
        }
    }

    /**
     * Create a new profile (called on first login)
     */
    async createProfile(userId: string, profileData: Partial<ProfileData>): Promise<ProfileData | null> {
        try {
            logger.debug('🔍 createProfile called for userId:', userId);

            // Verify user is authenticated
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            logger.debug('🔍 Session check:', {
                hasSession: !!session,
                sessionUserId: session?.user?.id,
                requestedUserId: userId,
                sessionError
            });

            if (!session) {
                console.error('❌ Cannot create profile: user not authenticated');
                console.error('Session error:', sessionError);
                throw new Error('User must be authenticated to create profile');
            }

            // Verify userId matches authenticated user
            if (session.user.id !== userId) {
                console.error('Cannot create profile: userId mismatch', {
                    sessionUserId: session.user.id,
                    requestedUserId: userId
                });
                throw new Error('User ID mismatch');
            }

            const { data, error } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: profileData.email || session.user.email || '',
                    name: profileData.name || profileData.email || session.user.email || 'Novo Sócio',
                    role: profileData.role || 'MEMBER',
                    company: profileData.company || '',
                    job_title: profileData.job_title || '',
                    image_url: profileData.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
                    bio: profileData.bio || '',
                    socials: profileData.socials || {},
                    tags: profileData.tags || [],
                    is_featured: false,
                    has_completed_onboarding: false,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select('id, name, email, image_url, company, job_title, phone, role, bio, socials, tags, is_featured, exclusive_benefit, has_completed_onboarding, pitch_video_url, hubspot_contact_id, created_at, updated_at')
                .single();

            if (error) {
                console.error('Supabase error creating profile:', error);
                throw error;
            }

            logger.info('✅ Profile created successfully:', data);
            return data;
        } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
        }
    }

    /**
     * Update profile
     * Note: Profile must exist before calling this method.
     * Profile creation happens during first login in App.tsx
     */
    async updateProfile(userId: string, updates: ProfileUpdateData): Promise<ProfileData | null> {
        try {
            // Clean up empty strings and nulls, but preserve arrays and objects
            const cleanUpdates: any = {};

            Object.keys(updates).forEach(key => {
                const value = (updates as any)[key];

                // Always include arrays (even empty ones - user may want to clear all tags)
                if (Array.isArray(value)) {
                    cleanUpdates[key] = value;
                }
                // Always include objects (socials) - Supabase handles JSONB
                else if (value !== null && typeof value === 'object') {
                    cleanUpdates[key] = value;
                }
                // For primitive values, exclude undefined, null, and empty strings
                else if (value !== undefined && value !== null && value !== '') {
                    cleanUpdates[key] = value;
                }
            });

            // Always update the updated_at timestamp
            cleanUpdates.updated_at = new Date().toISOString();

            const { data, error } = await supabase
                .from('profiles')
                .update(cleanUpdates)
                .eq('id', userId)
                .select('id, name, email, image_url, company, job_title, phone, role, bio, socials, tags, is_featured, exclusive_benefit, has_completed_onboarding, pitch_video_url, hubspot_contact_id, what_i_sell, what_i_need, partnership_interests, member_since, created_at, updated_at')
                .single();

            if (error) {
                // If profile doesn't exist, throw a more helpful error
                if (error.code === 'PGRST116') {
                    throw new Error('Profile not found. Please refresh the page to create your profile.');
                }
                throw error;
            }

            // 🔄 HubSpot sync (fire-and-forget — never blocks profile save)
            if (data?.hubspot_contact_id) {
                supabase.functions
                    .invoke('sync-hubspot', { body: { profile: data } })
                    .then(({ error: syncError }) => {
                        if (syncError) {
                            console.warn('⚠️ HubSpot sync failed (non-blocking):', syncError);
                        }
                    })
                    .catch(err => console.warn('⚠️ HubSpot sync error (non-blocking):', err));
            }

            return data;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    }

    /**
     * Update profile image
     */
    async updateProfileImage(userId: string, imageUrl: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    image_url: imageUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating profile image:', error);
            throw error;
        }
    }

    /**
     * Add tag to profile
     */
    async addTag(userId: string, tag: string): Promise<void> {
        try {
            // Get current tags
            const profile = await this.getProfile(userId);
            if (!profile) throw new Error('Profile not found');

            const currentTags = profile.tags || [];

            // Add tag if not already present
            if (!currentTags.includes(tag)) {
                const newTags = [...currentTags, tag];
                await supabase
                    .from('profiles')
                    .update({
                        tags: newTags,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
            }
        } catch (error) {
            console.error('Error adding tag:', error);
            throw error;
        }
    }

    /**
     * Remove tag from profile
     */
    async removeTag(userId: string, tag: string): Promise<void> {
        try {
            // Get current tags
            const profile = await this.getProfile(userId);
            if (!profile) throw new Error('Profile not found');

            const currentTags = profile.tags || [];
            const newTags = currentTags.filter(t => t !== tag);

            await supabase
                .from('profiles')
                .update({
                    tags: newTags,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (error) {
            console.error('Error removing tag:', error);
            throw error;
        }
    }

    /**
     * Mark onboarding as completed
     */
    async completeOnboarding(userId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    has_completed_onboarding: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;
        } catch (error) {
            console.error('Error completing onboarding:', error);
            throw error;
        }
    }

    /**
     * Check if profile is complete
     */
    isProfileComplete(profile: ProfileData): boolean {
        return !!(
            profile.name &&
            profile.bio &&
            profile.company &&
            profile.job_title &&
            profile.tags && profile.tags.length > 0
        );
    }

    /**
     * Get profile completion percentage
     */
    getProfileCompletionPercentage(profile: ProfileData): number {
        const fields = [
            profile.name,
            profile.bio,
            profile.company,
            profile.job_title,
            profile.image_url,
            profile.tags && profile.tags.length > 0,
            profile.socials?.linkedin,
            profile.socials?.instagram
        ];

        const completedFields = fields.filter(field => !!field).length;
        return Math.round((completedFields / fields.length) * 100);
    }

    /**
     * Validate URL format
     */
    validateUrl(url: string): boolean {
        if (!url) return true; // Empty is valid (optional field)

        try {
            new URL(url);
            return true;
        } catch {
            // Check if it's a relative URL
            return url.startsWith('/') || url.startsWith('#');
        }
    }

    /**
     * Validate social media URLs
     */
    validateSocials(socials: ProfileUpdateData['socials']): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (socials?.linkedin && !this.validateUrl(socials.linkedin)) {
            errors.push('LinkedIn URL inválida');
        }

        if (socials?.instagram && !this.validateUrl(socials.instagram)) {
            errors.push('Instagram URL inválida');
        }

        if (socials?.website && !this.validateUrl(socials.website)) {
            errors.push('Website URL inválida');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Validate video URL for pitch videos
     * Accepts: YouTube, Vimeo, Google Drive, Loom
     */
    validateVideoUrl(url: string): { valid: boolean; error?: string } {
        // Empty is valid (optional field)
        if (!url || url.trim() === '') {
            return { valid: true };
        }

        // Check if it's a valid URL first
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();

            // Allowed video platforms
            const allowedDomains = [
                'youtube.com',
                'www.youtube.com',
                'youtu.be',
                'vimeo.com',
                'www.vimeo.com',
                'player.vimeo.com',
                'drive.google.com',
                'loom.com',
                'www.loom.com'
            ];

            const isAllowed = allowedDomains.some(domain =>
                hostname === domain || hostname.endsWith('.' + domain)
            );

            if (!isAllowed) {
                return {
                    valid: false,
                    error: 'URL deve ser do YouTube, Vimeo, Google Drive ou Loom'
                };
            }

            return { valid: true };
        } catch {
            return {
                valid: false,
                error: 'URL inválida'
            };
        }
    }

    /**
     * Validate exclusive benefit data
     * Ensures title and description are not empty if benefit is active
     */
    validateBenefit(benefit: ExclusiveBenefit | null | undefined): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Null/undefined benefit is always valid (optional field)
        if (!benefit) {
            return { valid: true, errors: [] };
        }

        // If benefit is active, require title and description
        if (benefit.active) {
            if (!benefit.title || benefit.title.trim().length === 0) {
                errors.push('Título do benefício é obrigatório');
            }

            if (!benefit.description || benefit.description.trim().length === 0) {
                errors.push('Descrição do benefício é obrigatória');
            }

            // Validate CTA URL if provided
            if (benefit.ctaUrl && benefit.ctaUrl.trim().length > 0) {
                if (!this.validateUrl(benefit.ctaUrl)) {
                    errors.push('URL de ação inválida');
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Update exclusive benefit
     * Convenience method for updating just the benefit
     */
    async updateBenefit(userId: string, benefit: ExclusiveBenefit | null): Promise<ProfileData | null> {
        const validation = this.validateBenefit(benefit);
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
        }

        return this.updateProfile(userId, { exclusive_benefit: benefit });
    }
}

export const profileService = new ProfileService();
