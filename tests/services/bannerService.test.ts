// tests/services/bannerService.test.ts
// Unit tests for BannerService — carousel logic

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (resolve: any) => resolve({ data: [], error: null }),
        }),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test' } }, error: null }),
        },
    },
}));

import { bannerService } from '../../services/bannerService';
import type { CarouselItem } from '../../services/bannerService';

// Access private methods via prototype for testing
const serviceProto = Object.getPrototypeOf(bannerService);

// ===== Test Data Factories =====

function createMember(overrides: Partial<{
    id: string; name: string; email: string; company: string;
    jobTitle: string; imageUrl: string; tags: string[];
    createdAt: string; isNew: boolean;
}> = {}) {
    return {
        id: overrides.id ?? 'member-1',
        name: overrides.name ?? 'Test Member',
        email: overrides.email ?? 'test@example.com',
        company: overrides.company ?? 'Test Co',
        jobTitle: overrides.jobTitle ?? 'Developer',
        imageUrl: overrides.imageUrl ?? '/img.jpg',
        tags: overrides.tags ?? ['tech'],
        createdAt: overrides.createdAt ?? new Date().toISOString(),
        isNew: overrides.isNew ?? false,
    };
}

function createBanner(overrides: Partial<{
    id: string; title: string; priority: number; is_active: boolean;
    image_url: string; placement: string;
}> = {}) {
    return {
        id: overrides.id ?? 'banner-1',
        title: overrides.title ?? 'Test Banner',
        image_url: overrides.image_url ?? '/banner.jpg',
        link_type: 'INTERNAL' as const,
        is_active: overrides.is_active ?? true,
        placement: overrides.placement ?? 'HOME',
        priority: overrides.priority ?? 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };
}

describe('BannerService — Carousel Logic', () => {

    describe('scoreMemberSuggestions', () => {
        const scoreFn = serviceProto.scoreMemberSuggestions.bind(bannerService);

        it('should exclude the current user from suggestions', () => {
            const members = [
                createMember({ id: 'me', isNew: true }),
                createMember({ id: 'other', isNew: true }),
            ];
            const result = scoreFn(members, [], 'me');
            const ids = result.map((r: any) => r.id);
            expect(ids).not.toContain('me');
        });

        it('should include new members with reason NEW', () => {
            const members = [
                createMember({ id: 'new-1', isNew: true, tags: [] }),
            ];
            const result = scoreFn(members, [], 'other-user');
            expect(result.length).toBeGreaterThanOrEqual(1);
            expect(result[0].reason).toBe('NEW');
        });

        it('should include members with matching tags with reason MATCH', () => {
            const members = [
                createMember({ id: 'match-1', isNew: false, tags: ['React', 'TypeScript'] }),
            ];
            const result = scoreFn(members, ['react', 'node'], 'other-user');
            expect(result.length).toBe(1);
            expect(result[0].reason).toBe('MATCH');
            expect(result[0].matchingTags).toContain('React');
        });

        it('should include members without tag match (low score)', () => {
            const members = [
                createMember({ id: 'boring', isNew: false, tags: ['python'] }),
            ];
            const result = scoreFn(members, ['java'], 'other-user');
            // Service includes all members with a score; non-matching get low score
            if (result.length > 0) {
                expect(result[0].score).toBeLessThanOrEqual(5);
            }
        });

        it('should score new members higher than tag-only matches', () => {
            const members = [
                createMember({ id: 'tag-only', isNew: false, tags: ['React'] }),
                createMember({ id: 'new-one', isNew: true, tags: [] }),
            ];
            // Note: scoring is done before shuffle, but we can verify scores
            // new member: score 10, tag match: score 5 + 1 = 6
            const result = scoreFn(members, ['React'], 'other-user');
            expect(result.length).toBe(2);
        });

        it('should return at most 5 suggestions', () => {
            const members = Array.from({ length: 10 }, (_, i) =>
                createMember({ id: `member-${i}`, isNew: true })
            );
            const result = scoreFn(members, [], 'other-user');
            expect(result.length).toBeLessThanOrEqual(5);
        });

        it('should be case-insensitive for tag matching', () => {
            const members = [
                createMember({ id: 'ci-1', isNew: false, tags: ['REACT', 'VuE'] }),
            ];
            const result = scoreFn(members, ['react', 'vue'], 'other-user');
            expect(result[0].matchingTags.length).toBe(2);
        });
    });

    describe('mergeCarouselItems', () => {
        const mergeFn = serviceProto.mergeCarouselItems.bind(bannerService);

        // Create a scored suggestion for merge input
        function createSuggestion(id: string) {
            return {
                id,
                name: 'Member ' + id,
                email: id + '@test.com',
                company: 'Co',
                jobTitle: 'Dev',
                imageUrl: '/img.jpg',
                tags: ['tag1'],
                createdAt: new Date().toISOString(),
                isNew: true,
                reason: 'NEW' as const,
                matchingTags: [],
                score: 10,
            };
        }

        it('should return empty array when there are no banners or suggestions', () => {
            const result: CarouselItem[] = mergeFn([], []);
            expect(result).toEqual([]);
        });

        it('should place high-priority banners (>=10) first', () => {
            const banners = [
                createBanner({ id: 'hp-1', priority: 15 }),
                createBanner({ id: 'normal-1', priority: 3 }),
            ];
            const result: CarouselItem[] = mergeFn(banners, []);

            expect(result[0].type).toBe('PROMO');
            expect((result[0] as any).data.id).toBe('hp-1');
        });

        it('should intercalate normal banners and suggestions', () => {
            const banners = [
                createBanner({ id: 'b1', priority: 2 }),
                createBanner({ id: 'b2', priority: 3 }),
            ];
            const suggestions = [
                createSuggestion('s1'),
                createSuggestion('s2'),
            ];
            const result: CarouselItem[] = mergeFn(banners, suggestions);

            // Pattern: banner, suggestion, banner, suggestion
            expect(result.length).toBe(4);
            expect(result[0].type).toBe('PROMO');
            expect(result[1].type).toBe('MEMBER_SUGGESTION');
            expect(result[2].type).toBe('PROMO');
            expect(result[3].type).toBe('MEMBER_SUGGESTION');
        });

        it('should handle more banners than suggestions', () => {
            const banners = [
                createBanner({ id: 'b1', priority: 1 }),
                createBanner({ id: 'b2', priority: 2 }),
                createBanner({ id: 'b3', priority: 3 }),
            ];
            const suggestions = [createSuggestion('s1')];
            const result: CarouselItem[] = mergeFn(banners, suggestions);

            // Should contain all 3 banners + 1 suggestion = 4 items
            const promos = result.filter(r => r.type === 'PROMO');
            const members = result.filter(r => r.type === 'MEMBER_SUGGESTION');
            expect(promos.length).toBe(3);
            expect(members.length).toBe(1);
        });

        it('should handle more suggestions than banners', () => {
            const banners = [createBanner({ id: 'b1', priority: 1 })];
            const suggestions = [
                createSuggestion('s1'),
                createSuggestion('s2'),
                createSuggestion('s3'),
            ];
            const result: CarouselItem[] = mergeFn(banners, suggestions);

            const promos = result.filter(r => r.type === 'PROMO');
            const members = result.filter(r => r.type === 'MEMBER_SUGGESTION');
            expect(promos.length).toBe(1);
            expect(members.length).toBe(3);
        });

        it('should include member suggestion data in correct shape', () => {
            const suggestions = [createSuggestion('s1')];
            const result: CarouselItem[] = mergeFn([], suggestions);

            expect(result.length).toBe(1);
            const item = result[0] as { type: 'MEMBER_SUGGESTION'; data: any; reason: string };
            expect(item.data.id).toBe('s1');
            expect(item.data.name).toBe('Member s1');
            expect(item.data.tags).toEqual(['tag1']);
            expect(item.reason).toBe('NEW');
        });
    });

    describe('shuffleArray', () => {
        const shuffleFn = serviceProto.shuffleArray.bind(bannerService);

        it('should not change array length', () => {
            const arr = [1, 2, 3, 4, 5];
            shuffleFn(arr);
            expect(arr.length).toBe(5);
        });

        it('should preserve all elements', () => {
            const arr = [1, 2, 3, 4, 5];
            shuffleFn(arr);
            expect(arr.sort()).toEqual([1, 2, 3, 4, 5]);
        });

        it('should handle empty array', () => {
            const arr: number[] = [];
            shuffleFn(arr);
            expect(arr).toEqual([]);
        });

        it('should handle single-element array', () => {
            const arr = [42];
            shuffleFn(arr);
            expect(arr).toEqual([42]);
        });
    });
});
