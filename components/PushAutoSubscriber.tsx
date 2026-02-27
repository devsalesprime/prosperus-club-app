import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
}

/**
 * Componente invisível que garante subscription salva no banco.
 * Montado SEMPRE no App.tsx — independente do PushPermissionPrompt.
 * 
 * Fluxo:
 * 1. Verifica se browser suporta + permissão === 'granted'
 * 2. Obtém ou cria subscription no browser via PushManager
 * 3. Upsert na tabela push_subscriptions
 * 4. Roda UMA VEZ por sessão (useRef guard)
 */
export function PushAutoSubscriber({ userId }: { userId: string }) {
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        if (!userId || !VAPID_PUBLIC_KEY) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;

        hasRun.current = true;

        (async () => {
            try {
                const registration = await navigator.serviceWorker.ready;

                // Get or create browser subscription
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                    logger.info('[PushAuto] Created browser subscription');
                }

                // Upsert to database
                const json = subscription.toJSON();
                const { error } = await supabase
                    .from('push_subscriptions')
                    .upsert({
                        user_id: userId,
                        endpoint: subscription.endpoint,
                        p256dh: json.keys?.p256dh || null,
                        auth: json.keys?.auth || null,
                        subscription_json: json,
                        user_agent: navigator.userAgent,
                        platform: /android/i.test(navigator.userAgent) ? 'android'
                            : /iphone|ipad/i.test(navigator.userAgent) ? 'ios'
                                : 'desktop',
                        is_active: true,
                        error_count: 0
                    }, { onConflict: 'endpoint' });

                if (error) {
                    console.error('[PushAuto] DB save failed:', error.message);
                } else {
                    logger.info('[PushAuto] ✅ Subscription saved to database');
                }
            } catch (err) {
                console.warn('[PushAuto] Skipped:', err);
            }
        })();
    }, [userId]);

    return null; // Invisible
}
