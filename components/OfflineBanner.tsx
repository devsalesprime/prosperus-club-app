// components/OfflineBanner.tsx
// Visual indicator for offline state and reconnection
// Shows a persistent banner when offline, and a brief toast when back online

import React from 'react';
import { WifiOff, Wifi, CloudOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
    const { isOnline, wasOffline } = useOnlineStatus();

    // Online and wasn't recently offline — nothing to show
    if (isOnline && !wasOffline) return null;

    // Just reconnected — show brief success toast
    if (isOnline && wasOffline) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[9999] animate-in slide-in-from-top">
                <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center justify-center gap-2 text-sm font-medium shadow-lg">
                    <Wifi size={16} />
                    Conexão restaurada — dados sincronizando...
                </div>
            </div>
        );
    }

    // Offline — show persistent warning
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999]">
            <div className="bg-amber-600 text-white px-4 py-3 flex items-center justify-center gap-3 text-sm shadow-lg">
                <WifiOff size={18} className="shrink-0 animate-pulse" />
                <div className="text-center">
                    <span className="font-bold">Você está offline</span>
                    <span className="hidden sm:inline"> — exibindo dados do cache local</span>
                </div>
                <CloudOff size={14} className="opacity-60 shrink-0" />
            </div>
        </div>
    );
};
