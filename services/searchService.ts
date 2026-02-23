// ============================================
// GLOBAL SEARCH SERVICE
// ============================================
// Serviço para busca global em Sócios, Eventos, Notícias, Academy e Galeria

import { supabase } from '../lib/supabase';
import { ProfileData } from './profileService';
import { ClubEvent } from '../types';

// Article type for search results
export interface SearchArticle {
    id: string;
    title: string;
    slug: string;
    category?: string;
}

// Video type for search results (Academy)
export interface SearchVideo {
    id: string;
    title: string;
    description?: string;
    series_id?: string;
}

// Gallery Album type for search results
export interface SearchGalleryAlbum {
    id: string;
    title: string;
    description?: string;
    embedUrl: string;
    coverImage?: string;
    createdAt: string;
}

// Deal type for search results (Business Core)
export interface SearchDeal {
    id: string;
    description: string;
    amount: number;
    partner_name?: string;
    status: string;
    deal_date: string;
}

// Referral type for search results (Business Core)
export interface SearchReferral {
    id: string;
    lead_name: string;
    lead_company?: string;
    status: string;
    created_at: string;
}

// Benefit type for search results
export interface SearchBenefit {
    id: string;
    title: string;
    description?: string;
    category?: string;
}

// Search result types
export interface GlobalSearchResults {
    members: ProfileData[];
    events: ClubEvent[];
    articles: SearchArticle[];
    videos: SearchVideo[];
    gallery: SearchGalleryAlbum[];
    deals: SearchDeal[];
    referrals: SearchReferral[];
    benefits: SearchBenefit[];
}

// Empty results constant
const EMPTY_RESULTS: GlobalSearchResults = {
    members: [],
    events: [],
    articles: [],
    videos: [],
    gallery: [],
    deals: [],
    referrals: [],
    benefits: []
};

class SearchService {
    /**
     * Perform a global search across members, events, articles, videos, and gallery
     * Requires at least 3 characters to search
     * @param query - Search query string
     * @returns Object with all arrays (max 3 each)
     */
    async globalSearch(query: string): Promise<GlobalSearchResults> {
        // Require at least 3 characters
        if (!query || query.trim().length < 3) {
            return EMPTY_RESULTS;
        }

        const searchTerm = `%${query.trim()}%`;
        const now = new Date().toISOString();

        try {
            // Execute all EIGHT searches in parallel
            const [
                membersResult,
                eventsResult,
                articlesResult,
                videosResult,
                galleryResult,
                dealsResult,
                referralsResult,
                benefitsResult
            ] = await Promise.all([
                // 1. Search Members (profiles)
                supabase
                    .from('profiles')
                    .select('id, name, email, company, job_title, image_url, tags')
                    .or(`name.ilike.${searchTerm},company.ilike.${searchTerm}`)
                    .limit(3),

                // 2. Search Events (from club_events table)
                supabase
                    .from('club_events')
                    .select('id, title, description, date, end_date, type, category, location')
                    .ilike('title', searchTerm)
                    .order('date', { ascending: true })
                    .limit(3),

                // 3. Search Articles (published only)
                supabase
                    .from('articles')
                    .select('id, title, slug')
                    .eq('status', 'PUBLISHED')
                    .ilike('title', searchTerm)
                    .limit(3),

                // 4. Search Videos (Academy)
                supabase
                    .from('videos')
                    .select('id, title, description, series_id')
                    .ilike('title', searchTerm)
                    .limit(3),

                // 5. Search Gallery Albums
                supabase
                    .from('gallery_albums')
                    .select('id, title, description, "embedUrl", "coverImage", "createdAt"')
                    .ilike('title', searchTerm)
                    .order('"createdAt"', { ascending: false })
                    .limit(3),

                // 6. Search Deals (Business Core - RLS auto-filters to current user)
                supabase
                    .from('member_deals')
                    .select('id, description, amount, status, deal_date')
                    .ilike('description', searchTerm)
                    .order('deal_date', { ascending: false })
                    .limit(3),

                // 7. Search Referrals (Business Core - RLS auto-filters to current user)
                supabase
                    .from('member_referrals')
                    .select('id, lead_name, status, created_at')
                    .ilike('lead_name', searchTerm)
                    .order('created_at', { ascending: false })
                    .limit(3),

                // 8. Search Benefits (placeholder - table doesn't exist yet)
                Promise.resolve({ data: [], error: null })
            ]);

            // Handle errors gracefully - return empty arrays for failed queries
            const members = membersResult.error
                ? []
                : (membersResult.data as ProfileData[] || []);

            const events = eventsResult.error || !eventsResult.data
                ? []
                : eventsResult.data.map((e: any) => ({
                    ...e,
                    endDate: e.end_date // Map end_date to endDate for ClubEvent compatibility
                } as ClubEvent));

            const articles = articlesResult.error
                ? []
                : (articlesResult.data as SearchArticle[] || []);

            const videos = videosResult.error
                ? []
                : (videosResult.data as SearchVideo[] || []);

            const gallery = galleryResult.error
                ? []
                : (galleryResult.data as SearchGalleryAlbum[] || []);

            const deals = dealsResult.error
                ? []
                : (dealsResult.data as SearchDeal[] || []);

            const referrals = referralsResult.error
                ? []
                : (referralsResult.data as SearchReferral[] || []);

            const benefits = benefitsResult.error
                ? []
                : (benefitsResult.data as SearchBenefit[] || []);

            // Log any errors for debugging
            if (membersResult.error) {
                console.warn('Search members error:', membersResult.error);
            }
            if (eventsResult.error) {
                console.warn('Search events error:', eventsResult.error);
            }
            if (articlesResult.error) {
                console.warn('Search articles error:', articlesResult.error);
            }
            if (videosResult.error) {
                console.warn('Search videos error:', videosResult.error);
            }
            if (galleryResult.error) {
                console.warn('Search gallery error:', galleryResult.error);
            }
            if (dealsResult.error) {
                console.warn('Search deals error:', dealsResult.error);
            }
            if (referralsResult.error) {
                console.warn('Search referrals error:', referralsResult.error);
            }
            if (benefitsResult.error) {
                console.warn('Search benefits error:', benefitsResult.error);
            }

            return { members, events, articles, videos, gallery, deals, referrals, benefits };
        } catch (error) {
            console.error('Global search error:', error);
            return EMPTY_RESULTS;
        }
    }

    /**
     * Check if there are any results
     */
    hasResults(results: GlobalSearchResults): boolean {
        return (
            results.members.length > 0 ||
            results.events.length > 0 ||
            results.articles.length > 0 ||
            results.videos.length > 0 ||
            results.gallery.length > 0 ||
            results.deals.length > 0 ||
            results.referrals.length > 0 ||
            results.benefits.length > 0
        );
    }

    /**
     * Get total count of results
     */
    getTotalCount(results: GlobalSearchResults): number {
        return (
            results.members.length +
            results.events.length +
            results.articles.length +
            results.videos.length +
            results.gallery.length +
            results.deals.length +
            results.referrals.length +
            results.benefits.length
        );
    }
}

export const searchService = new SearchService();
