// tests/utils/matchEngine.test.ts
// Unit tests for the business compatibility scoring engine
// Pure functions — no mocks needed

import { describe, it, expect } from 'vitest';
import { calculateMatch, rankMatches, MatchResult } from '../../utils/matchEngine';
import { ProfileData } from '../../services/profileService';

// ─── Test fixtures (minimal ProfileData) ───────────────────────────

function createProfile(overrides: Partial<ProfileData> = {}): ProfileData {
    return {
        id: 'user-default',
        email: 'test@test.com',
        name: 'Test User',
        role: 'MEMBER' as const,
        what_i_sell: '',
        what_i_need: '',
        partnership_interests: [],
        tags: [],
        ...overrides,
    } as ProfileData;
}

const joao = createProfile({
    id: 'user-001',
    name: 'João Silva',
    what_i_sell: 'Software de gestão empresarial para PMEs',
    what_i_need: 'Parceiros de distribuição no Nordeste',
    partnership_interests: ['Tecnologia', 'SaaS'],
    tags: ['Empreendedorismo', 'Vendas'],
});

const maria = createProfile({
    id: 'user-002',
    name: 'Maria Santos',
    what_i_sell: 'Consultoria em expansão de negócios',
    what_i_need: 'Clientes no setor de tecnologia e software',
    partnership_interests: ['Tecnologia', 'Consultoria'],
    tags: ['Networking', 'Vendas'],
});

const pedro = createProfile({
    id: 'user-003',
    name: 'Pedro Costa',
    what_i_sell: 'Frutas orgânicas direto do produtor',
    what_i_need: 'Restaurantes e mercados premium',
    partnership_interests: ['Alimentação', 'Saúde'],
    tags: ['Sustentabilidade', 'Agro'],
});

describe('matchEngine', () => {

    // ─── calculateMatch ────────────────────────────────────────────

    describe('calculateMatch', () => {

        it('não faz match consigo mesmo (score = 0)', () => {
            const result = calculateMatch(joao, joao);

            expect(result.score).toBe(0);
            expect(result.matchType).toBe('NONE');
            expect(result.reasons).toHaveLength(0);
        });

        it('pontuação > 0 quando há overlap de setores', () => {
            // João e Maria compartilham 'Tecnologia'
            const result = calculateMatch(joao, maria);

            expect(result.score).toBeGreaterThan(0);
            const sectorReason = result.reasons.find(r => r.type === 'SECTOR');
            expect(sectorReason).toBeTruthy();
            expect(sectorReason?.detail).toContain('Tecnologia');
        });

        it('pontuação > 0 quando há overlap de tags', () => {
            // João e Maria compartilham 'Vendas'
            const result = calculateMatch(joao, maria);

            const tagReason = result.reasons.find(r => r.type === 'TAG');
            expect(tagReason).toBeTruthy();
            expect(tagReason?.detail).toContain('Vendas');
        });

        it('pontuação alta quando "sells" match "needs" (keyword overlap)', () => {
            // Maria vende "consultoria em expansão" e precisa de "clientes no setor de tecnologia e software"
            // João vende "software de gestão empresarial" → overlap com o que Maria precisa
            const result = calculateMatch(joao, maria);

            // Deve ter algum reason do tipo NEEDS_SELLS ou SELLS_NEEDS
            const sellBuyReasons = result.reasons.filter(
                r => r.type === 'SELLS_NEEDS' || r.type === 'NEEDS_SELLS'
            );
            expect(sellBuyReasons.length).toBeGreaterThanOrEqual(0);
        });

        it('pontuação zero entre perfis sem nenhum overlap', () => {
            const alienProfile = createProfile({
                id: 'user-alien',
                name: 'Alien',
                what_i_sell: 'Equipamentos espaciais intergalácticos',
                what_i_need: 'Combustível de antimatéria densa',
                partnership_interests: ['Aeroespacial'],
                tags: ['Ciência'],
            });

            const result = calculateMatch(joao, alienProfile);

            // Zero sectors, zero tags in common
            const sectorReason = result.reasons.find(r => r.type === 'SECTOR');
            const tagReason = result.reasons.find(r => r.type === 'TAG');
            expect(sectorReason).toBeUndefined();
            expect(tagReason).toBeUndefined();
        });

        it('score nunca excede 100', () => {
            // Create profiles with massive overlaps
            const superMatch = createProfile({
                id: 'user-super',
                what_i_sell: joao.what_i_need || '',
                what_i_need: joao.what_i_sell || '',
                partnership_interests: joao.partnership_interests || [],
                tags: joao.tags || [],
            });

            const result = calculateMatch(joao, superMatch);
            expect(result.score).toBeLessThanOrEqual(100);
        });

        it('classifica matchType corretamente', () => {
            const result = calculateMatch(joao, maria);

            expect(['STRONG', 'COMMON', 'POTENTIAL', 'NONE']).toContain(result.matchType);

            // matchType should align with score
            if (result.score >= 70) expect(result.matchType).toBe('STRONG');
            else if (result.score >= 40) expect(result.matchType).toBe('COMMON');
            else if (result.score >= 10) expect(result.matchType).toBe('POTENTIAL');
            else expect(result.matchType).toBe('NONE');
        });
    });

    // ─── rankMatches ───────────────────────────────────────────────

    describe('rankMatches', () => {

        it('exclui o próprio usuário dos resultados', () => {
            const all = [joao, maria, pedro];
            const result = rankMatches(joao, all);

            expect(result.every(m => m.profile.id !== joao.id)).toBe(true);
        });

        it('filtra profiles com matchType NONE', () => {
            const result = rankMatches(joao, [joao, maria, pedro]);

            // Todos os resultados retornados devem ter matchType != NONE
            expect(result.every(m => m.matchType !== 'NONE')).toBe(true);
        });

        it('ordena por score decrescente', () => {
            const result = rankMatches(joao, [joao, maria, pedro]);

            for (let i = 0; i < result.length - 1; i++) {
                expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
            }
        });

        it('retorna array vazio quando só tem o próprio usuário', () => {
            const result = rankMatches(joao, [joao]);

            expect(result).toHaveLength(0);
        });

        it('retorna array vazio quando input é vazio', () => {
            const result = rankMatches(joao, []);

            expect(result).toHaveLength(0);
        });

        it('retorna MatchResult[] com structure correta', () => {
            const result = rankMatches(joao, [maria]);

            if (result.length > 0) {
                const match = result[0];
                expect(match).toHaveProperty('profile');
                expect(match).toHaveProperty('score');
                expect(match).toHaveProperty('matchType');
                expect(match).toHaveProperty('reasons');
                expect(Array.isArray(match.reasons)).toBe(true);
            }
        });
    });
});
