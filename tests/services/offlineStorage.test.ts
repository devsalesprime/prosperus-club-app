// tests/services/offlineStorage.test.ts
// Unit tests for IndexedDB offline storage

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchWithOfflineCache } from '../../services/offlineStorage';

// Note: IndexedDB is not available in jsdom.
// These tests focus on the fetchWithOfflineCache logic
// using navigator.onLine mocking.

describe('fetchWithOfflineCache', () => {
    beforeEach(() => {
        // Reset navigator.onLine to true
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
    });

    it('should call fetcher when online', async () => {
        const mockData = { members: [{ id: '1', name: 'Test' }] };
        const fetcher = vi.fn().mockResolvedValue(mockData);

        const result = await fetchWithOfflineCache('test-key', fetcher);

        expect(fetcher).toHaveBeenCalled();
        expect(result.data).toEqual(mockData);
        expect(result.fromCache).toBe(false);
    });

    it('should throw when offline with no cached data', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

        await expect(
            fetchWithOfflineCache('nonexistent-key', fetcher)
        ).rejects.toThrow('No cached data available and device is offline');

        // Fetcher should NOT be called when offline
        expect(fetcher).not.toHaveBeenCalled();
    });

    it('should not call fetcher when offline', async () => {
        Object.defineProperty(navigator, 'onLine', { value: false });
        const fetcher = vi.fn().mockResolvedValue({ data: 'test' });

        try {
            await fetchWithOfflineCache('test-key', fetcher);
        } catch {
            // Expected to throw
        }

        expect(fetcher).not.toHaveBeenCalled();
    });
});
