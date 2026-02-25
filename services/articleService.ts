// articleService.ts
// Service for managing blog articles (News & Insights)
// Performance-focused with visibility check for menu control

import { supabase } from '../lib/supabase';
import { fetchWithOfflineCache } from './offlineStorage';
import { logger } from '../utils/logger';

// ============================================
// TYPES
// ============================================

export type ArticleStatus = 'DRAFT' | 'PUBLISHED';

export interface Article {
    id: string;
    title: string;
    slug: string;
    author?: string;
    published_date?: string;
    image_url?: string;
    excerpt?: string;
    content?: string;
    category_name?: string;
    status: ArticleStatus;
    views: number;
    created_at: string;
    updated_at: string;
}

export interface ArticleInput {
    title: string;
    slug: string;
    author?: string;
    image_url?: string;
    excerpt?: string;
    content?: string;
    category_name?: string;
}

export interface ArticleListParams {
    page?: number;
    limit?: number;
    category?: string;
}

export interface ArticleListResult {
    data: Article[];
    total: number;
    page: number;
    hasMore: boolean;
}

// ============================================
// CACHE (simple in-memory for hasPublishedArticles)
// ============================================

let visibilityCache: { value: boolean; timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 minute cache

// ============================================
// SERVICE
// ============================================

class ArticleService {
    // ========================================
    // VISIBILITY CHECK (CRITICAL - FAST)
    // ========================================

    /**
     * Check if there's at least one published article
     * Uses head query (no data transfer) + simple cache
     * Controls menu visibility
     */
    async hasPublishedArticles(): Promise<boolean> {
        try {
            // Check cache first
            if (visibilityCache && Date.now() - visibilityCache.timestamp < CACHE_TTL) {
                logger.debug('📰 hasPublishedArticles: using cache');
                return visibilityCache.value;
            }

            logger.debug('📰 hasPublishedArticles: querying...');

            const { count, error } = await supabase
                .from('articles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PUBLISHED')
                .limit(1);

            if (error) throw error;

            const hasArticles = (count || 0) > 0;

            // Update cache
            visibilityCache = { value: hasArticles, timestamp: Date.now() };

            logger.debug(`📰 hasPublishedArticles: ${hasArticles}`);
            return hasArticles;
        } catch (error) {
            console.error('Error checking published articles:', error);
            return false;
        }
    }

    /**
     * Invalidate visibility cache (call after publish/unpublish)
     */
    invalidateVisibilityCache(): void {
        visibilityCache = null;
        logger.debug('📰 Visibility cache invalidated');
    }

    // ========================================
    // READ (PUBLIC / MEMBER)
    // ========================================

    /**
     * Get published articles with pagination
     * Uses offline cache for offline reading (5 min TTL)
     */
    async getPublishedArticles(params: ArticleListParams = {}): Promise<ArticleListResult> {
        const { page = 1, limit = 10, category } = params;
        const cacheKey = `articles:published:p${page}:l${limit}:c${category || 'all'}`;

        try {
            const { data } = await fetchWithOfflineCache<ArticleListResult>(
                cacheKey,
                async () => {
                    const offset = (page - 1) * limit;

                    let query = supabase
                        .from('articles')
                        .select('*', { count: 'exact' })
                        .eq('status', 'PUBLISHED')
                        .order('published_date', { ascending: false });

                    if (category) {
                        query = query.eq('category_name', category);
                    }

                    const { data, error, count } = await query.range(offset, offset + limit - 1);

                    if (error) throw error;

                    const total = count || 0;

                    return {
                        data: data || [],
                        total,
                        page,
                        hasMore: offset + limit < total
                    };
                },
                5 * 60 * 1000 // 5 minutes
            );
            return data;
        } catch (error) {
            console.error('Error fetching published articles:', error);
            throw error;
        }
    }

    /**
     * Get single article by ID
     */
    async getArticleById(id: string): Promise<Article | null> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('id, title, slug, author, published_date, image_url, excerpt, content, category_name, status, views, created_at, updated_at')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // Not found
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching article:', error);
            throw error;
        }
    }

    /**
     * Get article by slug (for SEO-friendly URLs)
     */
    async getArticleBySlug(slug: string): Promise<Article | null> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('id, title, slug, author, published_date, image_url, excerpt, content, category_name, status, views, created_at, updated_at')
                .eq('slug', slug)
                .eq('status', 'PUBLISHED')
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null;
                throw error;
            }

            return data;
        } catch (error) {
            console.error('Error fetching article by slug:', error);
            throw error;
        }
    }

    /**
     * Increment article views
     */
    async incrementViews(id: string): Promise<void> {
        try {
            // Use RPC for atomic increment if available, otherwise do update
            const { error } = await supabase.rpc('increment_article_views', {
                article_id: id
            });

            // Fallback if RPC doesn't exist
            if (error && error.message.includes('function')) {
                const article = await this.getArticleById(id);
                if (article) {
                    await supabase
                        .from('articles')
                        .update({ views: (article.views || 0) + 1 })
                        .eq('id', id);
                }
            } else if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error incrementing views:', error);
            // Don't throw - views increment is not critical
        }
    }

    /**
     * Get unique categories from published articles
     */
    async getCategories(): Promise<string[]> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('category_name')
                .eq('status', 'PUBLISHED')
                .not('category_name', 'is', null);

            if (error) throw error;

            // Extract unique categories
            const categories = [...new Set(data?.map(a => a.category_name).filter(Boolean))];
            return categories as string[];
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    // ========================================
    // ADMIN (WRITE)
    // ========================================

    /**
     * Get all articles for admin (including drafts)
     */
    async getAllArticlesAdmin(): Promise<Article[]> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .select('id, title, slug, author, published_date, image_url, excerpt, content, category_name, status, views, created_at, updated_at')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all articles:', error);
            throw error;
        }
    }

    /**
     * Create a new article (as draft)
     */
    async createArticle(input: ArticleInput): Promise<Article> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .insert({
                    ...input,
                    status: 'DRAFT',
                    views: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating article:', error);
            throw error;
        }
    }

    /**
     * Update an existing article
     */
    async updateArticle(id: string, updates: Partial<ArticleInput>): Promise<Article> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating article:', error);
            throw error;
        }
    }

    /**
     * Delete an article
     */
    async deleteArticle(id: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('articles')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Invalidate cache since article count changed
            this.invalidateVisibilityCache();
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    }

    /**
     * Publish an article
     */
    async publishArticle(id: string): Promise<Article> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .update({
                    status: 'PUBLISHED',
                    published_date: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Invalidate visibility cache
            this.invalidateVisibilityCache();

            return data;
        } catch (error) {
            console.error('Error publishing article:', error);
            throw error;
        }
    }

    /**
     * Unpublish an article (return to draft)
     */
    async unpublishArticle(id: string): Promise<Article> {
        try {
            const { data, error } = await supabase
                .from('articles')
                .update({
                    status: 'DRAFT',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            // Invalidate visibility cache
            this.invalidateVisibilityCache();

            return data;
        } catch (error) {
            console.error('Error unpublishing article:', error);
            throw error;
        }
    }

    /**
     * Duplicate an article (creates draft copy)
     */
    async duplicateArticle(id: string): Promise<Article> {
        try {
            const original = await this.getArticleById(id);
            if (!original) throw new Error('Article not found');

            const { data, error } = await supabase
                .from('articles')
                .insert({
                    title: `${original.title} (Cópia)`,
                    slug: `${original.slug}-copy-${Date.now()}`,
                    author: original.author,
                    image_url: original.image_url,
                    excerpt: original.excerpt,
                    content: original.content,
                    category_name: original.category_name,
                    status: 'DRAFT',
                    views: 0
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error duplicating article:', error);
            throw error;
        }
    }
}

export const articleService = new ArticleService();
