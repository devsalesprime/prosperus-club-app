// tests/services/rsvpService.test.ts
// Unit tests for the RSVP service (new Sprint 4)

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockSupabase, queryBuilder } from '../mocks/supabase';
import { getConfirmedRsvps, getRsvpSummary, exportRsvpCsv } from '../../services/rsvpService';

// ─── Mock data ─────────────────────────────────────────────────────

const mockRsvps = [
    {
        id: 'rsvp-001',
        event_id: 'event-001',
        user_id: 'user-001',
        status: 'CONFIRMED',
        confirmed_at: '2026-02-27T10:00:00Z',
        cancelled_at: null,
        notes: null,
        profile: {
            id: 'user-001',
            name: 'João Silva',
            image_url: null,
            company: 'Empresa A',
            job_title: 'CEO',
        },
    },
    {
        id: 'rsvp-002',
        event_id: 'event-001',
        user_id: 'user-002',
        status: 'CONFIRMED',
        confirmed_at: '2026-02-27T11:00:00Z',
        cancelled_at: null,
        notes: null,
        profile: {
            id: 'user-002',
            name: 'Maria Santos',
            image_url: 'https://example.com/photo.jpg',
            company: 'Empresa B',
            job_title: 'Diretora',
        },
    },
];

const mockSummary = {
    event_id: 'event-001',
    event_title: 'Prosperus Club',
    event_date: '2026-03-15T19:00:00Z',
    max_rsvps: 50,
    confirmed_count: 2,
    waitlist_count: 0,
    is_full: false,
};

describe('rsvpService', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ─── getConfirmedRsvps ─────────────────────────────────────────

    describe('getConfirmedRsvps', () => {
        it('busca RSVPs confirmados para o evento', async () => {
            queryBuilder.__setResolvedValue({
                data: mockRsvps,
                error: null,
            });

            const result = await getConfirmedRsvps('event-001');

            expect(mockSupabase.from).toHaveBeenCalledWith('event_rsvps');
            expect(queryBuilder.eq).toHaveBeenCalledWith('event_id', 'event-001');
            expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'CONFIRMED');
            expect(result).toHaveLength(2);
        });

        it('retorna array vazio quando não há RSVPs', async () => {
            queryBuilder.__setResolvedValue({
                data: [],
                error: null,
            });

            const result = await getConfirmedRsvps('event-empty');

            expect(result).toHaveLength(0);
        });

        it('lança erro quando Supabase falha', async () => {
            queryBuilder.__setResolvedValue({
                data: null,
                error: { message: 'DB Error' },
            });

            await expect(getConfirmedRsvps('event-001')).rejects.toThrow();
        });
    });

    // ─── getRsvpSummary ────────────────────────────────────────────

    describe('getRsvpSummary', () => {
        it('retorna summary do evento', async () => {
            queryBuilder.__setResolvedValue({
                data: mockSummary,
                error: null,
            });

            const result = await getRsvpSummary('event-001');

            expect(mockSupabase.from).toHaveBeenCalledWith('event_rsvp_summary');
            expect(result?.confirmed_count).toBe(2);
            expect(result?.is_full).toBe(false);
        });

        it('retorna null quando evento não encontrado', async () => {
            queryBuilder.__setResolvedValue({
                data: null,
                error: { message: 'Not found' },
            });

            const result = await getRsvpSummary('nonexistent');

            expect(result).toBeNull();
        });
    });

    // ─── exportRsvpCsv ─────────────────────────────────────────────

    describe('exportRsvpCsv', () => {
        it('gera CSV com header correto', async () => {
            queryBuilder.__setResolvedValue({
                data: mockRsvps,
                error: null,
            });

            const csv = await exportRsvpCsv('event-001');

            expect(csv).toContain('Nome,Empresa,Cargo,Data de Confirmação');
        });

        it('inclui dados dos confirmados no CSV', async () => {
            queryBuilder.__setResolvedValue({
                data: mockRsvps,
                error: null,
            });

            const csv = await exportRsvpCsv('event-001');

            expect(csv).toContain('João Silva');
            expect(csv).toContain('Empresa A');
            expect(csv).toContain('Maria Santos');
        });

        it('gera CSV vazio (só header) quando não há RSVPs', async () => {
            queryBuilder.__setResolvedValue({
                data: [],
                error: null,
            });

            const csv = await exportRsvpCsv('event-empty');
            const lines = csv.trim().split('\n');

            expect(lines).toHaveLength(1); // Only header
        });
    });
});
