// tests/services/profileService.test.ts
// Unit tests for profile service — the heart of the app

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase, queryBuilder } from '../mocks/supabase';
import { profileService } from '../../services/profileService';

// ─── Mock fixtures ─────────────────────────────────────────────────

const mockMember = {
    id: 'user-001',
    email: 'joao@teste.com',
    name: 'João Silva',
    role: 'MEMBER',
    company: 'Empresa A',
    job_title: 'CEO',
    image_url: null,
    bio: 'Empreendedor',
    tags: ['Vendas', 'Tech'],
    what_i_sell: 'Software de gestão',
    what_i_need: 'Parceiros de distribuição',
    partnership_interests: ['Tecnologia', 'SaaS'],
    has_completed_onboarding: true,
    is_blocked: false,
    is_active: true,
};

const mockAdmin = {
    ...mockMember,
    id: 'admin-001',
    name: 'Admin Prosperus',
    role: 'ADMIN',
    email: 'admin@prosperus.com',
};

describe('profileService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getProfile ────────────────────────────────────────────────

    describe('getProfile', () => {
        it('retorna profile quando encontrado', async () => {
            queryBuilder.__setResolvedValue({ data: mockMember, error: null });

            const result = await profileService.getProfile('user-001');

            expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
            expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'user-001');
            expect(result).toBeTruthy();
            expect(result?.name).toBe('João Silva');
        });

        it('retorna null quando profile não existe', async () => {
            queryBuilder.__setResolvedValue({ data: null, error: null });

            const result = await profileService.getProfile('nonexistent');

            expect(result).toBeNull();
        });

        it('retorna null quando Supabase retorna erro', async () => {
            queryBuilder.__setResolvedValue({
                data: null,
                error: { message: 'DB Error', code: '500' }
            });

            const result = await profileService.getProfile('user-001');

            expect(result).toBeNull();
        });
    });

    // ─── getFilteredProfiles ───────────────────────────────────────

    describe('getFilteredProfiles', () => {
        it('filtra apenas MEMBERs', async () => {
            queryBuilder.__setResolvedValue({
                data: [mockMember],
                error: null
            });

            await profileService.getFilteredProfiles({ role: 'MEMBER' });

            expect(queryBuilder.eq).toHaveBeenCalledWith('role', 'MEMBER');
        });

        it('aplica filtro de busca por nome/empresa', async () => {
            queryBuilder.__setResolvedValue({
                data: [mockMember],
                error: null
            });

            await profileService.getFilteredProfiles({ query: 'João' });

            expect(queryBuilder.or).toHaveBeenCalled();
        });

        it('retorna array vazio quando Supabase retorna erro', async () => {
            queryBuilder.__setResolvedValue({
                data: null,
                error: { message: 'Error' }
            });

            const result = await profileService.getFilteredProfiles();

            expect(result).toEqual([]);
        });
    });

    // ─── getProfilesPaginated ──────────────────────────────────────

    describe('getProfilesPaginated', () => {
        it('aplica paginação com range correto', async () => {
            queryBuilder.__setResolvedValue({
                data: [mockMember],
                error: null,
                count: 42
            });

            await profileService.getProfilesPaginated(0, 20);

            expect(queryBuilder.range).toHaveBeenCalledWith(0, 19);
        });

        it('página 2 com pageSize 20 → range(20, 39)', async () => {
            queryBuilder.__setResolvedValue({
                data: [mockMember],
                error: null,
                count: 100
            });

            await profileService.getProfilesPaginated(1, 20);

            expect(queryBuilder.range).toHaveBeenCalledWith(20, 39);
        });

        it('retorna count correto', async () => {
            queryBuilder.__setResolvedValue({
                data: [mockMember],
                error: null,
                count: 42
            });

            const result = await profileService.getProfilesPaginated(0, 20);

            expect(result.count).toBe(42);
            expect(result.data).toHaveLength(1);
        });
    });

    // ─── isProfileComplete ─────────────────────────────────────────

    describe('isProfileComplete', () => {
        it('retorna true para profile completo', () => {
            const complete = {
                ...mockMember,
                company: 'Empresa',
                job_title: 'CEO',
                bio: 'Uma bio',
                tags: ['tag1'],
            };

            expect(profileService.isProfileComplete(complete as any)).toBe(true);
        });

        it('retorna false sem company', () => {
            const incomplete = {
                ...mockMember,
                company: '',
                job_title: 'CEO',
            };

            expect(profileService.isProfileComplete(incomplete as any)).toBe(false);
        });
    });

    // ─── getProfileCompletionPercentage ────────────────────────────

    describe('getProfileCompletionPercentage', () => {
        it('retorna 0-100 como número', () => {
            const pct = profileService.getProfileCompletionPercentage(mockMember as any);

            expect(pct).toBeGreaterThanOrEqual(0);
            expect(pct).toBeLessThanOrEqual(100);
            expect(typeof pct).toBe('number');
        });
    });

    // ─── validateUrl ───────────────────────────────────────────────

    describe('validateUrl', () => {
        it('aceita URL válida com https', () => {
            expect(profileService.validateUrl('https://example.com')).toBe(true);
        });

        it('aceita URL válida com http', () => {
            expect(profileService.validateUrl('http://example.com')).toBe(true);
        });

        it('rejeita string sem protocolo', () => {
            expect(profileService.validateUrl('example.com')).toBe(false);
        });

        it('rejeita string vazia', () => {
            expect(profileService.validateUrl('')).toBe(false);
        });
    });

    // ─── validateVideoUrl ──────────────────────────────────────────

    describe('validateVideoUrl', () => {
        it('aceita URL do YouTube', () => {
            const result = profileService.validateVideoUrl('https://youtube.com/watch?v=abc123');
            expect(result.valid).toBe(true);
        });

        it('aceita URL do Vimeo', () => {
            const result = profileService.validateVideoUrl('https://vimeo.com/123456');
            expect(result.valid).toBe(true);
        });

        it('aceita URL do Loom', () => {
            const result = profileService.validateVideoUrl('https://loom.com/share/abc123');
            expect(result.valid).toBe(true);
        });

        it('rejeita URL de site aleatório', () => {
            const result = profileService.validateVideoUrl('https://randomsite.com/video');
            expect(result.valid).toBe(false);
        });
    });
});
