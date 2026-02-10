// tests/services/searchService.test.ts
// Unit tests for SearchService pure utility methods

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing the service
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test' } }, error: null })
        },
    },
}));

import { searchService } from '../../services/searchService';

// Helper: create empty results
const emptyResults = () => ({
    members: [],
    events: [],
    articles: [],
    videos: [],
    gallery: [],
    deals: [],
    referrals: [],
    benefits: [],
});

describe('SearchService', () => {

    describe('hasResults', () => {
        it('should return false for completely empty results', () => {
            expect(searchService.hasResults(emptyResults())).toBe(false);
        });

        it('should return true when members has items', () => {
            const results = { ...emptyResults(), members: [{ id: '1', name: 'Test' }] as any };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when events has items', () => {
            const results = { ...emptyResults(), events: [{ id: '1' }] as any };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when articles has items', () => {
            const results = { ...emptyResults(), articles: [{ id: '1', title: 'T', slug: 's' }] };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when videos has items', () => {
            const results = { ...emptyResults(), videos: [{ id: '1', title: 'V' }] };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when gallery has items', () => {
            const results = { ...emptyResults(), gallery: [{ id: '1', title: 'G', embedUrl: '', createdAt: '' }] };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when deals has items', () => {
            const results = {
                ...emptyResults(),
                deals: [{ id: '1', description: 'D', amount: 100, status: 'CONFIRMED', deal_date: '' }],
            };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when referrals has items', () => {
            const results = {
                ...emptyResults(),
                referrals: [{ id: '1', lead_name: 'L', status: 'PENDING', created_at: '' }],
            };
            expect(searchService.hasResults(results)).toBe(true);
        });

        it('should return true when benefits has items', () => {
            const results = { ...emptyResults(), benefits: [{ id: '1', title: 'B' }] };
            expect(searchService.hasResults(results)).toBe(true);
        });
    });

    describe('getTotalCount', () => {
        it('should return 0 for empty results', () => {
            expect(searchService.getTotalCount(emptyResults())).toBe(0);
        });

        it('should count items across all categories', () => {
            const results = {
                members: [{ id: '1' }, { id: '2' }] as any,
                events: [{ id: '1' }] as any,
                articles: [{ id: '1', title: 'T', slug: 's' }],
                videos: [{ id: '1', title: 'V' }, { id: '2', title: 'V2' }],
                gallery: [],
                deals: [{ id: '1', description: 'D', amount: 100, status: 'CONFIRMED', deal_date: '' }],
                referrals: [],
                benefits: [{ id: '1', title: 'B' }],
            };
            // 2 + 1 + 1 + 2 + 0 + 1 + 0 + 1 = 8
            expect(searchService.getTotalCount(results)).toBe(8);
        });

        it('should return correct count with single category populated', () => {
            const results = {
                ...emptyResults(),
                members: Array.from({ length: 5 }, (_, i) => ({ id: `${i}` })) as any,
            };
            expect(searchService.getTotalCount(results)).toBe(5);
        });
    });

    describe('globalSearch', () => {
        it('should return empty results for queries shorter than 3 characters', async () => {
            const result = await searchService.globalSearch('ab');
            expect(result).toEqual(emptyResults());
        });

        it('should return empty results for empty string', async () => {
            const result = await searchService.globalSearch('');
            expect(result).toEqual(emptyResults());
        });

        it('should return empty results for whitespace-only input', async () => {
            const result = await searchService.globalSearch('   ');
            expect(result).toEqual(emptyResults());
        });
    });
});
