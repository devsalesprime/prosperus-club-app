// tests/hooks/useOnlineStatus.test.ts
// Unit tests for the useOnlineStatus hook

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

// navigator.onLine is non-configurable in jsdom,
// so we use vi.spyOn with a getter to mock it.
let onLineGetter: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    onLineGetter = vi.spyOn(navigator, 'onLine', 'get');
    onLineGetter.mockReturnValue(true);
});

afterEach(() => {
    onLineGetter.mockRestore();
});

describe('useOnlineStatus', () => {
    it('should return isOnline=true when navigator.onLine is true', () => {
        onLineGetter.mockReturnValue(true);
        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(true);
        expect(result.current.wasOffline).toBe(false);
    });

    it('should return isOnline=false when navigator.onLine is false', () => {
        onLineGetter.mockReturnValue(false);
        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(false);
    });

    it('should update when going offline', () => {
        onLineGetter.mockReturnValue(true);
        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(true);

        act(() => {
            onLineGetter.mockReturnValue(false);
            window.dispatchEvent(new Event('offline'));
        });

        expect(result.current.isOnline).toBe(false);
    });

    it('should update when going back online', () => {
        onLineGetter.mockReturnValue(false);
        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.isOnline).toBe(false);

        act(() => {
            onLineGetter.mockReturnValue(true);
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.isOnline).toBe(true);
        expect(result.current.wasOffline).toBe(true);
    });

    it('should set lastOnline when coming back online', () => {
        onLineGetter.mockReturnValue(false);
        const { result } = renderHook(() => useOnlineStatus());

        expect(result.current.lastOnline).toBeNull();

        act(() => {
            onLineGetter.mockReturnValue(true);
            window.dispatchEvent(new Event('online'));
        });

        expect(result.current.lastOnline).toBeInstanceOf(Date);
    });
});
