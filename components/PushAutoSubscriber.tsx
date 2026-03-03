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
 * RE-TENTA quando a permissão muda de 'default' para 'granted'
 * (ex: após o PushPermissionPrompt conceder permissão).
 */
export function PushAutoSubscriber({ userId }: { userId: string }) {
    const subscriptionSaved = useRef(false);

    useEffect(() => {
        if (!userId || !VAPID_PUBLIC_KEY) {
            console.warn('[PushAuto] ❌ Missing userId or VAPID_PUBLIC_KEY');
            return;
        }
        if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
            console.warn('[PushAuto] ❌ Browser does not support push');
            return;
        }

        // Função que tenta registrar SW + salvar subscription
        const trySubscribe = async () => {
            if (subscriptionSaved.current) return; // Already saved this session

            console.log('[PushAuto] 🔄 Attempting push subscription...');
            console.log('[PushAuto] Permission:', Notification.permission);

            try {
                // ═══ STEP 1: Get or register SW ═══
                let registration = await navigator.serviceWorker.getRegistration('/app/');
                if (!registration) {
                    registration = await navigator.serviceWorker.register('/app/sw.js', {
                        scope: '/app/'
                    });
                    console.log('[PushAuto] ✅ SW registered');
                } else {
                    console.log('[PushAuto] SW already registered, scope:', registration.scope);
                }

                // Wait for SW to be active
                if (registration.installing || registration.waiting) {
                    await new Promise<void>((resolve) => {
                        const sw = registration!.installing || registration!.waiting;
                        if (!sw) { resolve(); return; }
                        sw.addEventListener('statechange', () => {
                            if (sw.state === 'activated') resolve();
                        });
                        setTimeout(resolve, 5000);
                    });
                }

                // ═══ STEP 2: Check permission ═══
                if (Notification.permission !== 'granted') {
                    console.log('[PushAuto] ⏳ Permission not granted yet:', Notification.permission, '(will retry when granted)');
                    return; // Will be called again when permission changes
                }

                // ═══ STEP 3: Get or create browser subscription ═══
                let subscription = await registration.pushManager.getSubscription();
                console.log('[PushAuto] Existing subscription:', subscription ? 'Yes' : 'No');

                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource
                    });
                    console.log('[PushAuto] ✅ Created NEW browser subscription');
                }

                // ═══ STEP 4: Upsert to database ═══
                const json = subscription.toJSON();
                console.log('[PushAuto] Saving to DB, endpoint:', subscription.endpoint.slice(-30));

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
                    console.error('[PushAuto] ❌ DB save failed:', error.message);
                } else {
                    subscriptionSaved.current = true;
                    console.log('[PushAuto] ✅✅ Subscription saved to database!');
                }
            } catch (err) {
                console.error('[PushAuto] ❌ Error:', err);
            }
        };

        // Run immediately
        trySubscribe();

        // ALSO listen for permission changes — re-try when user grants permission
        // This handles the case where PushPermissionPrompt grants permission AFTER mount
        const permissionInterval = setInterval(() => {
            if (subscriptionSaved.current) {
                clearInterval(permissionInterval);
                return;
            }
            if (Notification.permission === 'granted') {
                console.log('[PushAuto] 🔔 Permission now granted! Retrying...');
                trySubscribe();
            }
        }, 2000); // Check every 2 seconds

        return () => clearInterval(permissionInterval);
    }, [userId]);

    return null; // Invisible
}
