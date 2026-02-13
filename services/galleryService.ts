import { supabase } from '../lib/supabase';
import { GalleryAlbum } from '../types';
import { fetchWithOfflineCache } from './offlineStorage';

/**
 * Gallery Service - CRUD operations for Gallery Albums
 * FASE 6 (ATUALIZADA): Multi-Álbum Gallery System
 */

export const galleryService = {
    /**
     * Fetch all gallery albums, ordered by most recent first
     * Uses offline cache for offline access (5 min TTL)
     */
    async getAllAlbums(): Promise<GalleryAlbum[]> {
        const { data } = await fetchWithOfflineCache<GalleryAlbum[]>(
            'gallery:all-albums',
            async () => {
                const { data, error } = await supabase
                    .from('gallery_albums')
                    .select('id, title, description, embedUrl, coverImage, createdAt')
                    .order('createdAt', { ascending: false });

                if (error) {
                    console.error('Error fetching gallery albums:', error);
                    throw error;
                }

                return data || [];
            },
            5 * 60 * 1000 // 5 minutes
        );
        return data;
    },

    /**
     * Get a single album by ID
     */
    async getAlbumById(id: string): Promise<GalleryAlbum | null> {
        const { data, error } = await supabase
            .from('gallery_albums')
            .select('id, title, description, embedUrl, coverImage, createdAt')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching album:', error);
            return null;
        }

        return data;
    },

    /**
     * Get the most recent album (for quick access button)
     */
    async getMostRecentAlbum(): Promise<GalleryAlbum | null> {
        const { data, error } = await supabase
            .from('gallery_albums')
            .select('id, title, description, embedUrl, coverImage, createdAt')
            .order('createdAt', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error('Error fetching most recent album:', error);
            return null;
        }

        return data;
    },

    /**
     * Create a new gallery album
     */
    async createAlbum(album: Omit<GalleryAlbum, 'id' | 'createdAt'>): Promise<GalleryAlbum> {
        const { data, error } = await supabase
            .from('gallery_albums')
            .insert([
                {
                    title: album.title,
                    description: album.description,
                    embedUrl: album.embedUrl,
                    coverImage: album.coverImage || null,
                    createdAt: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating album:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update an existing gallery album
     */
    async updateAlbum(id: string, updates: Partial<Omit<GalleryAlbum, 'id' | 'createdAt'>>): Promise<GalleryAlbum> {
        const { data, error } = await supabase
            .from('gallery_albums')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating album:', error);
            throw error;
        }

        return data;
    },

    /**
     * Delete a gallery album
     */
    async deleteAlbum(id: string): Promise<void> {
        const { error } = await supabase
            .from('gallery_albums')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting album:', error);
            throw error;
        }
    }
};
