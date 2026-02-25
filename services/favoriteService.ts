// services/favoriteService.ts
// User Favorites: Toggle, Check, List, Count
// Prosperus Club App v2.9 — Gap Fix

import { supabase } from '../lib/supabase';

// ========== TYPES ==========

export type FavoriteEntityType = 'video' | 'article' | 'event' | 'member' | 'gallery';

export interface UserFavorite {
    id: string;
    user_id: string;
    entity_type: FavoriteEntityType;
    entity_id: string;
    created_at: string;
}

// ========== SERVICE CLASS ==========

class FavoriteService {

    /**
     * Toggle a favorite (add if not exists, remove if exists)
     * Returns true if now favorited, false if unfavorited
     */
    async toggleFavorite(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Check if already favorited
            const { data: existing } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .maybeSingle();

            if (existing) {
                // Remove favorite
                const { error } = await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('id', existing.id);

                if (error) throw error;
                return false; // unfavorited
            } else {
                // Add favorite
                const { error } = await supabase
                    .from('user_favorites')
                    .insert({
                        user_id: user.id,
                        entity_type: entityType,
                        entity_id: entityId
                    });

                if (error) throw error;
                return true; // favorited
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    }

    /**
     * Check if a specific entity is favorited by the current user
     */
    async isFavorited(entityType: FavoriteEntityType, entityId: string): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;

            const { data } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .maybeSingle();

            return !!data;
        } catch (error) {
            console.error('Error checking favorite:', error);
            return false;
        }
    }

    /**
     * Get all favorite IDs for a given entity type (batch check)
     * Returns Set of entity_ids for fast lookup
     */
    async getFavoritedIds(entityType: FavoriteEntityType): Promise<Set<string>> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return new Set();

            const { data, error } = await supabase
                .from('user_favorites')
                .select('entity_id')
                .eq('user_id', user.id)
                .eq('entity_type', entityType);

            if (error) throw error;
            return new Set((data || []).map(f => f.entity_id));
        } catch (error) {
            console.error('Error getting favorited IDs:', error);
            return new Set();
        }
    }

    /**
     * Get all favorites for current user, optionally filtered by type
     */
    async getFavorites(entityType?: FavoriteEntityType): Promise<UserFavorite[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            let query = supabase
                .from('user_favorites')
                .select('id, user_id, entity_type, entity_id, created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (entityType) {
                query = query.eq('entity_type', entityType);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting favorites:', error);
            return [];
        }
    }

    /**
     * Remove a favorite by its row ID
     */
    async removeFavorite(favoriteId: string): Promise<void> {
        try {
            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('id', favoriteId);

            if (error) throw error;
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    /**
     * Remove a favorite by entity type and ID
     */
    async removeFavoriteByEntity(entityType: FavoriteEntityType, entityId: string): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('entity_type', entityType)
                .eq('entity_id', entityId);

            if (error) throw error;
        } catch (error) {
            console.error('Error removing favorite:', error);
            throw error;
        }
    }

    /**
     * Alias: getUserFavorites for convenient naming
     */
    getUserFavorites = this.getFavorites;
}

export const favoriteService = new FavoriteService();
