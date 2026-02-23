// ============================================
// BANNER SERVICE
// ============================================
// Serviço para gerenciar banners dinâmicos com agendamento

import { supabase } from '../lib/supabase';

// Tipos
export interface Banner {
    id: string;
    title: string;
    subtitle?: string;
    image_url: string;
    link_url?: string;
    link_type: 'INTERNAL' | 'EXTERNAL';
    start_date?: string;
    end_date?: string;
    is_active: boolean;
    placement: 'HOME' | 'EVENTS' | 'VIDEOS' | 'ARTICLES';
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface BannerInput {
    title: string;
    subtitle?: string;
    image_url: string;
    link_url?: string;
    link_type?: 'INTERNAL' | 'EXTERNAL';
    start_date?: string | null;
    end_date?: string | null;
    is_active?: boolean;
    placement?: 'HOME' | 'EVENTS' | 'VIDEOS' | 'ARTICLES';
    priority?: number;
}

class BannerService {
    // ================================================
    // PUBLIC METHODS (Para a Home/App)
    // ================================================

    /**
     * Get active banners for display
     * Filters: is_active = true AND (start_date is null OR start_date <= now) 
     *          AND (end_date is null OR end_date >= now)
     * Order: priority DESC, created_at DESC
     */
    async getActiveBanners(placement: Banner['placement'] = 'HOME'): Promise<Banner[]> {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('banners')
                .select('id, title, subtitle, image_url, link_url, link_type, placement, priority, is_active, start_date, end_date, created_at, updated_at')
                .eq('is_active', true)
                .eq('placement', placement)
                // Start date: null OR <= now (já começou)
                .or(`start_date.is.null,start_date.lte.${now}`)
                // End date: null OR >= now (ainda não expirou)
                .or(`end_date.is.null,end_date.gte.${now}`)
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) {
                console.error('❌ Error fetching active banners:', error);
                throw error;
            }

            // Filtro adicional em memória para garantir lógica correta
            // (Supabase OR não combina bem com AND múltiplos)
            const filteredBanners = (data || []).filter(banner => {
                const startOk = !banner.start_date || new Date(banner.start_date) <= new Date(now);
                const endOk = !banner.end_date || new Date(banner.end_date) >= new Date(now);
                return startOk && endOk;
            });

            console.log(`✅ Found ${filteredBanners.length} active banners for ${placement}`);
            return filteredBanners;
        } catch (error) {
            console.error('Error in getActiveBanners:', error);
            return [];
        }
    }

    /**
     * Get a single banner by ID
     */
    async getBannerById(id: string): Promise<Banner | null> {
        try {
            const { data, error } = await supabase
                .from('banners')
                .select('id, title, subtitle, image_url, link_url, link_type, placement, priority, is_active, start_date, end_date, created_at, updated_at')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching banner:', error);
            return null;
        }
    }

    // ================================================
    // ADMIN METHODS (CRUD)
    // ================================================

    /**
     * Get all banners (Admin - includes inactive and expired)
     */
    async getAllBanners(
        page: number = 1,
        limit: number = 20,
        placement?: Banner['placement']
    ): Promise<{ data: Banner[]; total: number; hasMore: boolean }> {
        try {
            const offset = (page - 1) * limit;

            let query = supabase
                .from('banners')
                .select('*', { count: 'exact' });

            if (placement) {
                query = query.eq('placement', placement);
            }

            const { data, error, count } = await query
                .order('priority', { ascending: false })
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return {
                data: data || [],
                total: count || 0,
                hasMore: offset + limit < (count || 0)
            };
        } catch (error) {
            console.error('Error fetching all banners:', error);
            return { data: [], total: 0, hasMore: false };
        }
    }

    /**
     * Create a new banner
     */
    async createBanner(input: BannerInput): Promise<{ success: boolean; data?: Banner; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('banners')
                .insert({
                    title: input.title,
                    subtitle: input.subtitle || null,
                    image_url: input.image_url,
                    link_url: input.link_url || null,
                    link_type: input.link_type || 'INTERNAL',
                    start_date: input.start_date || null,
                    end_date: input.end_date || null,
                    is_active: input.is_active ?? true,
                    placement: input.placement || 'HOME',
                    priority: input.priority ?? 0
                })
                .select()
                .single();

            if (error) {
                console.error('❌ Error creating banner:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Banner created:', data.id);
            return { success: true, data };
        } catch (error: any) {
            console.error('Error in createBanner:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Update an existing banner
     */
    async updateBanner(
        id: string,
        input: Partial<BannerInput>
    ): Promise<{ success: boolean; data?: Banner; error?: string }> {
        try {
            const updateData: any = {
                updated_at: new Date().toISOString()
            };

            // Only include fields that are provided
            if (input.title !== undefined) updateData.title = input.title;
            if (input.subtitle !== undefined) updateData.subtitle = input.subtitle;
            if (input.image_url !== undefined) updateData.image_url = input.image_url;
            if (input.link_url !== undefined) updateData.link_url = input.link_url;
            if (input.link_type !== undefined) updateData.link_type = input.link_type;
            if (input.start_date !== undefined) updateData.start_date = input.start_date;
            if (input.end_date !== undefined) updateData.end_date = input.end_date;
            if (input.is_active !== undefined) updateData.is_active = input.is_active;
            if (input.placement !== undefined) updateData.placement = input.placement;
            if (input.priority !== undefined) updateData.priority = input.priority;

            const { data, error } = await supabase
                .from('banners')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('❌ Error updating banner:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Banner updated:', id);
            return { success: true, data };
        } catch (error: any) {
            console.error('Error in updateBanner:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Delete a banner
     */
    async deleteBanner(id: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('banners')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('❌ Error deleting banner:', error);
                return { success: false, error: error.message };
            }

            console.log('✅ Banner deleted:', id);
            return { success: true };
        } catch (error: any) {
            console.error('Error in deleteBanner:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Toggle banner active status
     */
    async toggleBannerActive(id: string): Promise<{ success: boolean; isActive?: boolean; error?: string }> {
        try {
            // Get current status
            const { data: current, error: fetchError } = await supabase
                .from('banners')
                .select('is_active')
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            // Toggle
            const newStatus = !current.is_active;

            const { error: updateError } = await supabase
                .from('banners')
                .update({
                    is_active: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;

            console.log(`✅ Banner ${id} toggled to ${newStatus ? 'active' : 'inactive'}`);
            return { success: true, isActive: newStatus };
        } catch (error: any) {
            console.error('Error toggling banner:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Reorder banners (update priorities)
     */
    async reorderBanners(
        orderedIds: string[]
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Update priorities based on order (first = highest priority)
            const updates = orderedIds.map((id, index) => ({
                id,
                priority: orderedIds.length - index // Highest first
            }));

            for (const update of updates) {
                const { error } = await supabase
                    .from('banners')
                    .update({ priority: update.priority })
                    .eq('id', update.id);

                if (error) throw error;
            }

            console.log('✅ Banners reordered');
            return { success: true };
        } catch (error: any) {
            console.error('Error reordering banners:', error);
            return { success: false, error: error.message || 'Erro desconhecido' };
        }
    }

    /**
     * Get banner statistics
     */
    async getBannerStats(): Promise<{
        total: number;
        active: number;
        scheduled: number;
        expired: number;
    }> {
        try {
            const now = new Date().toISOString();

            const { data, error } = await supabase
                .from('banners')
                .select('is_active, start_date, end_date');

            if (error) throw error;

            const banners = data || [];
            const stats = {
                total: banners.length,
                active: 0,
                scheduled: 0,
                expired: 0
            };

            banners.forEach(banner => {
                if (!banner.is_active) return;

                const startDate = banner.start_date ? new Date(banner.start_date) : null;
                const endDate = banner.end_date ? new Date(banner.end_date) : null;
                const nowDate = new Date(now);

                if (endDate && endDate < nowDate) {
                    stats.expired++;
                } else if (startDate && startDate > nowDate) {
                    stats.scheduled++;
                } else {
                    stats.active++;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error fetching banner stats:', error);
            return { total: 0, active: 0, scheduled: 0, expired: 0 };
        }
    }

    // ================================================
    // HOME CAROUSEL - HYBRID FEED (Banners + Suggestions)
    // ================================================

    /**
     * Get hybrid carousel items for Home page
     * Combines promotional banners with member suggestions
     */
    async getHomeCarouselItems(currentUserId: string): Promise<CarouselItem[]> {
        try {
            console.log('🎠 Building home carousel for user:', currentUserId);

            // Parallel fetch: banners + current user profile + potential suggestions
            const [banners, currentUserProfile, recentMembers] = await Promise.all([
                this.getActiveBanners('HOME'),
                this.getCurrentUserProfile(currentUserId),
                this.getRecentAndMatchingMembers(currentUserId)
            ]);

            // Build member suggestions with reasons
            const suggestions = this.scoreMemberSuggestions(
                recentMembers,
                currentUserProfile?.tags || [],
                currentUserId
            );

            // Merge: intercalate banners and suggestions
            const carouselItems = this.mergeCarouselItems(banners, suggestions);

            console.log(`✅ Carousel built: ${carouselItems.length} items (${banners.length} banners, ${suggestions.length} suggestions)`);
            return carouselItems;
        } catch (error) {
            console.error('Error building home carousel:', error);
            // Fallback: return only banners
            const banners = await this.getActiveBanners('HOME');
            return banners.map(b => ({ type: 'PROMO' as const, data: b }));
        }
    }

    /**
     * Get current user's profile with tags
     */
    private async getCurrentUserProfile(userId: string): Promise<{ tags: string[] } | null> {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('tags')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching current user profile:', error);
            return null;
        }
    }

    /**
     * Get recent members and potential tag matches
     * Fetches last 30 members, filtering done in memory for performance
     */
    private async getRecentAndMatchingMembers(currentUserId: string): Promise<MemberSuggestion[]> {
        try {
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, company, job_title, image_url, tags, created_at, role')
                .neq('id', currentUserId)
                .neq('role', 'ADMIN')
                .order('created_at', { ascending: false })
                .limit(30);

            if (error) throw error;

            return (data || []).map(profile => ({
                id: profile.id,
                name: profile.name,
                email: profile.email,
                company: profile.company || '',
                jobTitle: profile.job_title || '',
                imageUrl: profile.image_url || `${import.meta.env.BASE_URL}default-avatar.svg`,
                tags: profile.tags || [],
                createdAt: profile.created_at,
                isNew: new Date(profile.created_at) >= fifteenDaysAgo
            }));
        } catch (error) {
            console.error('Error fetching member suggestions:', error);
            return [];
        }
    }

    /**
     * Score and filter member suggestions
     * Prioritizes: New members + Tag matches, but always includes some members
     */
    private scoreMemberSuggestions(
        members: MemberSuggestion[],
        currentUserTags: string[],
        currentUserId: string
    ): ScoredMemberSuggestion[] {
        const scored: ScoredMemberSuggestion[] = [];

        for (const member of members) {
            if (member.id === currentUserId) continue;

            // Calculate matching tags
            const matchingTags = member.tags.filter(tag =>
                currentUserTags.some(userTag =>
                    userTag.toLowerCase() === tag.toLowerCase()
                )
            );

            const hasMatchingTags = matchingTags.length > 0;
            const isNew = member.isNew;

            // Determine primary reason
            const reason: 'NEW' | 'MATCH' = isNew ? 'NEW' : 'MATCH';

            // Calculate score (higher = shown first)
            // New members: base 10 + matching tags bonus
            // Tag matches: base 5 + number of matches
            // Others: base 1 (still shown as discovery suggestions)
            let score = 1; // Base score so all members can appear
            if (isNew) score += 10;
            if (hasMatchingTags) score += 5 + matchingTags.length;

            scored.push({
                ...member,
                reason,
                matchingTags,
                score
            });
        }

        // Sort by score descending, then shuffle top results for variety
        scored.sort((a, b) => b.score - a.score);

        // Take top 5 and shuffle for variety
        const top = scored.slice(0, 8);
        this.shuffleArray(top);

        return top.slice(0, 5);
    }

    /**
     * Fisher-Yates shuffle for variety
     */
    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Merge banners and suggestions into intercalated carousel
     * Pattern: Banner, Suggestion, Banner, Suggestion...
     * High-priority banners (priority >= 10) always appear first
     */
    private mergeCarouselItems(
        banners: Banner[],
        suggestions: ScoredMemberSuggestion[]
    ): CarouselItem[] {
        const result: CarouselItem[] = [];

        // Separate high-priority banners
        const highPriority = banners.filter(b => b.priority >= 10);
        const normalBanners = banners.filter(b => b.priority < 10);

        // Add high-priority banners first
        for (const banner of highPriority) {
            result.push({ type: 'PROMO', data: banner });
        }

        // Intercalate normal banners and suggestions
        const maxLength = Math.max(normalBanners.length, suggestions.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < normalBanners.length) {
                result.push({ type: 'PROMO', data: normalBanners[i] });
            }
            if (i < suggestions.length) {
                result.push({
                    type: 'MEMBER_SUGGESTION',
                    data: {
                        id: suggestions[i].id,
                        name: suggestions[i].name,
                        company: suggestions[i].company,
                        jobTitle: suggestions[i].jobTitle,
                        imageUrl: suggestions[i].imageUrl,
                        tags: suggestions[i].tags,
                        matchingTags: suggestions[i].matchingTags
                    },
                    reason: suggestions[i].reason
                });
            }
        }

        return result;
    }
}

// ================================================
// CAROUSEL TYPES
// ================================================

/** Profile data for member suggestion cards */
export interface MemberSuggestionData {
    id: string;
    name: string;
    company: string;
    jobTitle: string;
    imageUrl: string;
    tags: string[];
    matchingTags: string[];
}

/** Internal type for scoring suggestions */
interface MemberSuggestion {
    id: string;
    name: string;
    email: string;
    company: string;
    jobTitle: string;
    imageUrl: string;
    tags: string[];
    createdAt: string;
    isNew: boolean;
}

/** Scored suggestion with reason */
interface ScoredMemberSuggestion extends MemberSuggestion {
    reason: 'NEW' | 'MATCH';
    matchingTags: string[];
    score: number;
}

/** Union type for carousel items */
export type CarouselItem =
    | { type: 'PROMO'; data: Banner }
    | { type: 'MEMBER_SUGGESTION'; data: MemberSuggestionData; reason: 'NEW' | 'MATCH' };

export const bannerService = new BannerService();

