// ============================================
// PROSPERUS CLUB - PUSH NOTIFICATIONS HOOK
// ============================================
// Hook para gerenciar Service Worker e Push Notifications
// Compatível com Chrome, Firefox, Edge, Safari 16+

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Tipos
type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

interface UsePushNotificationsReturn {
    /** Estado atual da permissão */
    permissionState: PermissionState;
    /** Se o navegador suporta Push Notifications */
    isSupported: boolean;
    /** Se o SW está registrado */
    isRegistered: boolean;
    /** Se está processando (loading) */
    isLoading: boolean;
    /** Erro, se houver */
    error: string | null;
    /** Função para solicitar permissão e inscrever */
    requestPermission: () => Promise<boolean>;
    /** Função para cancelar inscrição */
    unsubscribe: () => Promise<boolean>;
}

// VAPID Public Key do ambiente
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Converte a VAPID key de base64 para Uint8Array
 * Necessário para o PushManager.subscribe()
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Hook para gerenciar Push Notifications
 */
export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
    const [permissionState, setPermissionState] = useState<PermissionState>('default');
    const [isSupported, setIsSupported] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ========================================
    // Verificar suporte do navegador
    // ========================================
    useEffect(() => {
        const checkSupport = () => {
            const supported =
                'serviceWorker' in navigator &&
                'PushManager' in window &&
                'Notification' in window;

            setIsSupported(supported);

            if (supported) {
                // Verifica estado atual da permissão
                setPermissionState(Notification.permission as PermissionState);
            } else {
                setPermissionState('unsupported');
            }
        };

        checkSupport();
    }, []);

    // ========================================
    // Registrar Service Worker
    // ========================================
    useEffect(() => {
        const registerServiceWorker = async () => {
            if (!isSupported) return;

            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });

                console.log('[Push] Service Worker registered:', registration.scope);
                setIsRegistered(true);

                // Verifica se já existe uma subscription
                const existingSubscription = await registration.pushManager.getSubscription();
                if (existingSubscription) {
                    console.log('[Push] Existing subscription found');
                }
            } catch (err) {
                console.error('[Push] Service Worker registration failed:', err);
                setError('Falha ao registrar Service Worker');
            }
        };

        registerServiceWorker();
    }, [isSupported]);

    // ========================================
    // Solicitar permissão e inscrever
    // ========================================
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!isSupported) {
            setError('Push Notifications não suportadas neste navegador');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            // 1. Solicitar permissão
            const permission = await Notification.requestPermission();
            setPermissionState(permission as PermissionState);

            if (permission !== 'granted') {
                setError('Permissão de notificação negada');
                return false;
            }

            // 2. Obter registro do Service Worker
            const registration = await navigator.serviceWorker.ready;

            // 3. Verificar se já existe subscription
            let subscription = await registration.pushManager.getSubscription();

            // 4. Se não existir, criar nova
            if (!subscription) {
                if (!VAPID_PUBLIC_KEY) {
                    console.warn('[Push] VAPID_PUBLIC_KEY não configurada');
                    // Mesmo sem VAPID, notificações locais funcionam
                    return true;
                }

                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

                console.log('[Push] New subscription created');
            }

            // 5. Salvar subscription no Supabase
            if (userId && subscription) {
                await savePushSubscription(userId, subscription);
            }

            return true;
        } catch (err: any) {
            console.error('[Push] Error requesting permission:', err);
            setError(err.message || 'Erro ao configurar notificações');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, userId]);

    // ========================================
    // Cancelar inscrição
    // ========================================
    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (!isSupported) return false;

        setIsLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
                console.log('[Push] Unsubscribed successfully');

                // Remove do Supabase
                if (userId) {
                    await removePushSubscription(userId, subscription.endpoint);
                }
            }

            return true;
        } catch (err: any) {
            console.error('[Push] Error unsubscribing:', err);
            setError(err.message || 'Erro ao cancelar notificações');
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, userId]);

    return {
        permissionState,
        isSupported,
        isRegistered,
        isLoading,
        error,
        requestPermission,
        unsubscribe
    };
}

// ============================================
// FUNÇÕES DE INTEGRAÇÃO COM SUPABASE
// ============================================

/**
 * Salva a subscription de push no Supabase
 */
async function savePushSubscription(
    userId: string,
    subscription: PushSubscription
): Promise<void> {
    try {
        const subscriptionData = subscription.toJSON();

        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscriptionData.keys?.p256dh || null,
                auth: subscriptionData.keys?.auth || null,
                subscription_json: JSON.stringify(subscriptionData),
                user_agent: navigator.userAgent,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'endpoint'
            });

        if (error) {
            console.error('[Push] Error saving subscription:', error);
            throw error;
        }

        console.log('[Push] Subscription saved to Supabase');
    } catch (err) {
        console.error('[Push] Failed to save subscription:', err);
        // Não propaga o erro - a notificação local ainda funciona
    }
}

/**
 * Remove a subscription de push do Supabase
 */
async function removePushSubscription(
    userId: string,
    endpoint: string
): Promise<void> {
    try {
        const { error } = await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', userId)
            .eq('endpoint', endpoint);

        if (error) {
            console.error('[Push] Error removing subscription:', error);
        }

        console.log('[Push] Subscription removed from Supabase');
    } catch (err) {
        console.error('[Push] Failed to remove subscription:', err);
    }
}

export default usePushNotifications;
