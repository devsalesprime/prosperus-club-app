// tests/services/notificationService.test.ts
// Unit tests for NotificationService

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted to ensure mock variables are available when vi.mock factory runs
const { mockQueryBuilder, mockAuth, mockFrom, mockRpc } = vi.hoisted(() => {
    // Create a truly chainable query builder — every method always returns the builder
    const qb: Record<string, any> = {};
    const methods = [
        'select', 'insert', 'update', 'delete',
        'eq', 'neq', 'order', 'limit', 'range',
        'single', 'maybeSingle', 'gte', 'is', 'or',
    ];
    methods.forEach(m => {
        qb[m] = vi.fn().mockImplementation(() => qb);
    });
    // Add awaitable behavior — when the chain is awaited
    qb.then = vi.fn().mockImplementation((resolve: any) => {
        return Promise.resolve({ data: null, error: null }).then(resolve);
    });

    const auth = { getUser: vi.fn() };
    const from = vi.fn().mockReturnValue(qb);
    const rpc = vi.fn();

    return { mockQueryBuilder: qb, mockAuth: auth, mockFrom: from, mockRpc: rpc };
});

vi.mock('../../lib/supabase', () => ({
    supabase: {
        auth: mockAuth,
        from: mockFrom,
        rpc: mockRpc,
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnThis(),
        }),
        removeChannel: vi.fn(),
    },
}));

import { notificationService, getScheduledNotifications, cancelScheduledNotification } from '../../services/notificationService';

describe('NotificationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Restore chain behavior
        const methods = [
            'select', 'insert', 'update', 'delete',
            'eq', 'neq', 'order', 'limit', 'range',
            'single', 'maybeSingle', 'gte', 'is', 'or',
        ];
        methods.forEach(m => {
            mockQueryBuilder[m] = vi.fn().mockImplementation(() => mockQueryBuilder);
        });
        mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
            return Promise.resolve({ data: null, error: null }).then(resolve);
        });
        mockFrom.mockReturnValue(mockQueryBuilder);
        mockAuth.getUser.mockResolvedValue({
            data: { user: { id: 'admin-user', email: 'admin@test.com' } },
            error: null,
        });
    });

    describe('getUnreadCount', () => {
        it('should call from with user_notifications table', async () => {
            mockQueryBuilder.single.mockResolvedValueOnce({
                data: null,
                error: null,
                count: 5,
            });

            await notificationService.getUnreadCount('user-1');
            expect(mockFrom).toHaveBeenCalledWith('user_notifications');
        });
    });

    describe('markAsRead', () => {
        it('should call update with is_read=true', async () => {
            // The last .eq() in the chain resolves
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ error: null }).then(resolve);
            });

            await notificationService.markAsRead('notif-123');
            expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_read: true });
        });
    });

    describe('markAllAsRead', () => {
        it('should call update on user_notifications', async () => {
            // Ensure the chain resolves correctly with destructurable result
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ error: null }).then(resolve);
            });

            await notificationService.markAllAsRead('user-1');
            expect(mockQueryBuilder.update).toHaveBeenCalledWith({ is_read: true });
        });
    });

    describe('createNotification', () => {
        it('should send notification via RPC for ALL segment', async () => {
            mockRpc.mockResolvedValueOnce({ data: 10, error: null });

            const count = await notificationService.createNotification(
                'Test Title',
                'Test Message',
                'ALL',
                '/test-url'
            );

            expect(mockRpc).toHaveBeenCalled();
            expect(count).toBe(10);
        });

        it('should throw error when user is not authenticated', async () => {
            mockAuth.getUser.mockResolvedValueOnce({
                data: { user: null },
                error: null,
            });

            await expect(
                notificationService.createNotification('T', 'M', 'ALL')
            ).rejects.toThrow();
        });

        it('should insert scheduled notification directly (not via RPC)', async () => {
            // scheduledFor path uses supabase.from().insert(), not rpc
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ error: null }).then(resolve);
            });

            const count = await notificationService.createNotification(
                'Scheduled',
                'Message',
                'ALL',
                undefined,
                undefined,
                '2026-03-01T10:00:00Z'
            );

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'SCHEDULED',
                    scheduled_for: '2026-03-01T10:00:00Z',
                })
            );
            expect(count).toBe(1);
        });
    });

    describe('deleteNotification', () => {
        it('should attempt to delete the notification', async () => {
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ error: null }).then(resolve);
            });

            await notificationService.deleteNotification('notif-to-delete');
            expect(mockQueryBuilder.delete).toHaveBeenCalled();
        });
    });
});

describe('Scheduled Notification Helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const methods = [
            'select', 'insert', 'update', 'delete',
            'eq', 'neq', 'order', 'limit', 'range',
            'single', 'maybeSingle', 'gte', 'is', 'or',
        ];
        methods.forEach(m => {
            mockQueryBuilder[m] = vi.fn().mockImplementation(() => mockQueryBuilder);
        });
        mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
            return Promise.resolve({ data: null, error: null }).then(resolve);
        });
        mockFrom.mockReturnValue(mockQueryBuilder);
    });

    describe('getScheduledNotifications', () => {
        it('should return an array of scheduled notifications', async () => {
            const mockData = [
                { id: '1', title: 'N1', message: 'M1', status: 'SCHEDULED', scheduled_for: '2026-03-01' },
                { id: '2', title: 'N2', message: 'M2', status: 'SCHEDULED', scheduled_for: '2026-03-02' },
            ];

            // Override the then to return our data
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ data: mockData, error: null }).then(resolve);
            });

            const result = await getScheduledNotifications();
            expect(result).toHaveLength(2);
            expect(result[0].title).toBe('N1');
        });

        it('should return empty array on error', async () => {
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ data: null, error: { message: 'DB error' } }).then(resolve);
            });

            const result = await getScheduledNotifications();
            expect(result).toEqual([]);
        });
    });

    describe('cancelScheduledNotification', () => {
        it('should call update with CANCELLED status', async () => {
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ error: null }).then(resolve);
            });

            await cancelScheduledNotification('notif-1');
            expect(mockQueryBuilder.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
        });

        it('should throw on Supabase error', async () => {
            mockQueryBuilder.then = vi.fn().mockImplementation((resolve: any) => {
                return Promise.resolve({ error: { message: 'Not found' } }).then(resolve);
            });

            await expect(
                cancelScheduledNotification('notif-bad')
            ).rejects.toThrow();
        });
    });
});
