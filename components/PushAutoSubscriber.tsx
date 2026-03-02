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
 * Componente invisível — monta SEMPRE no App.tsx.
 * 
 * Responsabilidades (nesta ordem):
 * 1. REGISTRA o Service Worker (se ainda não registrado)
 * 2. Se permissão === 'granted', cria/obtém subscription
 * 3. Salva subscription no banco (upsert por endpoint)
 * 
 * Roda UMA VEZ por sessão (useRef guard).
 */
export function PushAutoSubscriber({ userId }: { userId: string }) {
    const hasRun = useRef(false);

    useEffect(() => {
        if (hasRun.current) return;
        if (!userId || !VAPID_PUBLIC_KEY) return;
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;

        hasRun.current = true;

        (async () => {
            try {
                // ═══ STEP 1: Register SW (always — regardless of permission) ═══
                let registration = await navigator.serviceWorker.getRegistration('/app/');
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/app/sw.js', {
                        scope: '/app/'
                    });
                    logger.info('[PushAuto] SW registered');
                } else {
                    logger.debug('[PushAuto] SW already registered');
                }

                // Wait for SW to be active
                if (registration.installing || registration.waiting) {
                    await new Promise<void>((resolve) => {
                        const sw = registration!.installing || registration!.waiting;
                        if (!sw) { resolve(); return; }
                        sw.addEventListener('statechange', () => {
                            if (sw.state === 'activated') resolve();
                        });
                        // Timeout after 5s
                        setTimeout(resolve, 5000);
                    });
                }

                // ═══ STEP 2: If permission granted, subscribe + save ═══
                if (Notification.permission !== 'granted') {
                    logger.debug('[PushAuto] Permission not granted yet, SW registered only');
                    return;
                }

                // Get or create browser subscription
                let subscription = await registration.pushManager.getSubscription();
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
                    });
                    logger.info('[PushAuto] Created browser subscription');
                }

                // ═══ STEP 3: Upsert to database ═══
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
                        error_count: 0,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'endpoint' });

                if (error) {
                    console.error('[PushAuto] DB save failed:', error.message);
                } else {
                    logger.info('[PushAuto] ✅ Subscription saved to database');
                }
            } catch (err) {
                console.warn('[PushAuto] Error:', err);
            }
        })();
    }, [userId]);

    return null; // Invisible
}

