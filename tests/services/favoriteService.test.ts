// tests/services/favoriteService.test.ts
// Unit tests for FavoriteService with Supabase mock

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mock variables are available when vi.mock factory runs
const { mockQueryBuilder, mockAuth, mockFrom } = vi.hoisted(() => {
    const qb: Record<string, any> = {};
    ['select', 'insert', 'delete', 'eq', 'order', 'maybeSingle'].forEach(m => {
        qb[m] = vi.fn().mockReturnValue(qb);
    });
    const auth = { getUser: vi.fn() };
    const from = vi.fn().mockReturnValue(qb);
    return { mockQueryBuilder: qb, mockAuth: auth, mockFrom: from };
});

vi.mock('../../lib/supabase', () => ({
    supabase: { auth: mockAuth, from: mockFrom },
}));

import { favoriteService } from '../../services/favoriteService';

describe('FavoriteService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chain
        ['select', 'insert', 'delete', 'eq', 'order', 'maybeSingle'].forEach(m => {
            mockQueryBuilder[m] = vi.fn().mockReturnValue(mockQueryBuilder);
        });
        mockFrom.mockReturnValue(mockQueryBuilder);
        // Default: authenticated user
        mockAuth.getUser.mockResolvedValue({
            data: { user: { id: 'user-123' } },
            error: null,
        });
    });

    describe('toggleFavorite', () => {
        it('should add a favorite when not yet favorited', async () => {
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            mockQueryBuilder.insert.mockReturnValueOnce(
                Promise.resolve({ error: null })
            );

            const result = await favoriteService.toggleFavorite('video', 'vid-1');
            expect(result).toBe(true);
        });

        it('should remove a favorite when already favorited', async () => {
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: { id: 'fav-99' },
                error: null,
            });
            // delete().eq() chain
            const deleteChain: Record<string, any> = {};
            deleteChain.eq = vi.fn().mockResolvedValue({ error: null });
            mockQueryBuilder.delete.mockReturnValueOnce(deleteChain);

            const result = await favoriteService.toggleFavorite('video', 'vid-1');
            expect(result).toBe(false);
        });

        it('should throw when user is not authenticated', async () => {
            mockAuth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            await expect(
                favoriteService.toggleFavorite('event', 'evt-1')
            ).rejects.toThrow('User not authenticated');
        });
    });

    describe('isFavorited', () => {
        it('should return true when entity is favorited', async () => {
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: { id: 'fav-1' },
                error: null,
            });

            const result = await favoriteService.isFavorited('article', 'art-1');
            expect(result).toBe(true);
        });

        it('should return false when entity is not favorited', async () => {
            mockQueryBuilder.maybeSingle.mockResolvedValueOnce({
                data: null,
                error: null,
            });

            const result = await favoriteService.isFavorited('article', 'art-2');
            expect(result).toBe(false);
        });

        it('should return false when user is not authenticated', async () => {
            mockAuth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await favoriteService.isFavorited('event', 'evt-1');
            expect(result).toBe(false);
        });
    });

    describe('getFavoritedIds', () => {
        it('should return a Set of entity IDs', async () => {
            // Make the final .eq() in the chain resolve with data
            const terminalEq = vi.fn().mockResolvedValue({
                data: [
                    { entity_id: 'id-1' },
                    { entity_id: 'id-2' },
                    { entity_id: 'id-3' },
                ],
                error: null,
            });
            // select -> eq(user_id) -> eq(entity_type) -> await
            let eqCallCount = 0;
            mockQueryBuilder.eq.mockImplementation(() => {
                eqCallCount++;
                if (eqCallCount >= 2) {
                    return Promise.resolve({
                        data: [
                            { entity_id: 'id-1' },
                            { entity_id: 'id-2' },
                            { entity_id: 'id-3' },
                        ],
                        error: null,
                    });
                }
                return mockQueryBuilder;
            });

            const result = await favoriteService.getFavoritedIds('video');
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(3);
            expect(result.has('id-1')).toBe(true);
        });

        it('should return empty Set when not authenticated', async () => {
            mockAuth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await favoriteService.getFavoritedIds('article');
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
        });
    });

    describe('getFavorites', () => {
        it('should return empty array when not authenticated', async () => {
            mockAuth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            const result = await favoriteService.getFavorites();
            expect(result).toEqual([]);
        });

        it('getUserFavorites should be an alias for getFavorites', () => {
            expect(favoriteService.getUserFavorites).toBeDefined();
            expect(typeof favoriteService.getUserFavorites).toBe('function');
        });
    });

    describe('removeFavoriteByEntity', () => {
        it('should throw when user is not authenticated', async () => {
            mockAuth.getUser.mockResolvedValue({
                data: { user: null },
                error: null,
            });

            await expect(
                favoriteService.removeFavoriteByEntity('video', 'vid-1')
            ).rejects.toThrow('User not authenticated');
        });
    });
});
