// ============================================
// PushSettingsButton — Manual push notification toggle
// ============================================
// Fallback for cases where automatic prompt didn't appear.
// Place in profile/settings page.

import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

interface PushSettingsButtonProps {
    userId: string;
}

export const PushSettingsButton: React.FC<PushSettingsButtonProps> = ({ userId }) => {
    const {
        permissionState,
        isSupported,
        isLoading,
        requestPermission,
        unsubscribe,
    } = usePushNotifications(userId);

    if (!isSupported) return null;

    const isSubscribed = permissionState === 'granted';
    const isDenied = permissionState === 'denied';

    const handleToggle = async () => {
        if (isSubscribed) {
            await unsubscribe();
        } else {
            await requestPermission();
        }
    };

    return (
        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSubscribed ? 'bg-yellow-600/20' : 'bg-slate-800'}`}>
                    {isSubscribed ? (
                        <Bell className="text-yellow-500" size={18} />
                    ) : (
                        <BellOff className="text-slate-500" size={18} />
                    )}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">
                        Notificações push
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {isDenied
                            ? 'Bloqueado nas configurações do celular'
                            : isSubscribed
                                ? 'Ativo neste dispositivo'
                                : 'Receba alertas mesmo com o app fechado'}
                    </p>
                </div>
            </div>

            {!isDenied && (
                <button
                    onClick={handleToggle}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${isSubscribed
                        ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        : 'bg-yellow-600 text-white hover:bg-yellow-500'
                        }`}
                >
                    {isLoading ? '...' : isSubscribed ? 'Desativar' : 'Ativar'}
                </button>
            )}
        </div>
    );
};
