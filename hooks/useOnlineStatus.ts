// hooks/useOnlineStatus.ts
// Reactive online/offline detection hook
// Uses navigator.onLine + event listeners for real-time status

import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
    isOnline: boolean;
    wasOffline: boolean;  // True if user was offline and just came back
    lastOnline: Date | null;
}

export function useOnlineStatus(): OnlineStatus {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [wasOffline, setWasOffline] = useState(false);
    const [lastOnline, setLastOnline] = useState<Date | null>(
        navigator.onLine ? new Date() : null
    );

    const handleOnline = useCallback(() => {
        setIsOnline(true);
        setWasOffline(true);
        setLastOnline(new Date());

        // Clear "wasOffline" after 5 seconds
        setTimeout(() => setWasOffline(false), 5000);
    }, []);

    const handleOffline = useCallback(() => {
        setIsOnline(false);
    }, []);

    useEffect(() => {
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [handleOnline, handleOffline]);

    return { isOnline, wasOffline, lastOnline };
}
