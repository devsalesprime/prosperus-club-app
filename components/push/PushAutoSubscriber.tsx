import { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../utils/logger';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

function getDevicePlatform(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
}

/** Detectar se está rodando como PWA instalado */
function isPWA(): boolean {
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://')
    );
}

interface Props { userId: string }

/**
 * Componente invisível — monta SEMPRE no App.tsx.
 * 
 * Fluxo:
 * 1. Verifica suporte (SW, PushManager, Notification)
 * 2. Se iOS e não PWA → sai (sem suporte no Safari normal)
 * 3. Se permissão === 'default' → SOLICITA ATIVAMENTE
 * 4. Se permissão === 'granted' → cria/obtém subscription
 * 5. Salva subscription no banco (upsert por endpoint)
 * 6. Re-verifica ao retornar ao foreground (visibilitychange)
 */
export function PushAutoSubscriber({ userId }: Props) {
    const isRunning = useRef(false);

    useEffect(() => {
        if (!userId) return;

        async function autoSubscribe() {
            // Prevent concurrent runs
            if (isRunning.current) return;
            isRunning.current = true;

            try {
                const platform = getDevicePlatform();

                // ─── 1. Verificar suporte ──────────────────────────────
                if (!('Notification' in window)) {
                    logger.debug('[PushAuto] Notification API não suportada');
                    return;
                }
                if (!('serviceWorker' in navigator)) {
                    logger.debug('[PushAuto] Service Worker não suportado');
                    return;
                }
                if (!('PushManager' in window)) {
                    logger.debug('[PushAuto] PushManager não suportado');
                    return;
                }

                // iOS: push só funciona se instalado como PWA
                if (platform === 'ios' && !isPWA()) {
                    logger.debug('[PushAuto] iOS detectado mas não é PWA instalado — skip');
                    return;
                }

                if (!VAPID_PUBLIC_KEY) {
                    logger.warn('[PushAuto] VITE_VAPID_PUBLIC_KEY não definida');
                    return;
                }

                // ─── 2. Verificar/solicitar permissão ──────────────────
                let permission = Notification.permission;

                if (permission === 'denied') {
                    logger.debug('[PushAuto] Permissão negada pelo usuário');
                    return;
                }

                // Se 'default', NÃO solicitar ativamente aqui pois causa erro de falta de interação do usuário (DOM Exception).
                // A solicitação ativa deve ser feita EXCLUSIVAMENTE pelo componente <PushPermissionPrompt /> via clique do usuário.
                if (permission !== 'granted') {
                    logger.debug('[PushAuto] Permissão não concedida (atual: ' + permission + '). Aguardando interação do usuário no prompt.');
                    return;
                }

                // ─── 3. Aguardar SW estar pronto ───────────────────────
                let registration: ServiceWorkerRegistration;
                try {
                    registration = await navigator.serviceWorker.ready;
                    logger.debug('[PushAuto] SW pronto, scope:', registration.scope);
                } catch (err) {
                    logger.error('[PushAuto] SW não está pronto:', err);
                    return;
                }

                // ─── 4. Criar subscription ─────────────────────────────
                let subscription: PushSubscription | null = null;
                try {
                    subscription = await registration.pushManager.getSubscription();

                    if (!subscription) {
                        logger.info('[PushAuto] Criando nova subscription...');
                        subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
                        });
                        logger.info('[PushAuto] ✅ Subscription criada');
                    } else {
                        logger.debug('[PushAuto] Subscription já existe, atualizando banco');
                    }
                } catch (err: any) {
                    logger.error('[PushAuto] Erro ao criar subscription:', err.message);
                    return;
                }

                // ─── 5. Extrair chaves e salvar no banco ───────────────
                const json = subscription.toJSON();
                const p256dh = json.keys?.p256dh;
                const auth = json.keys?.auth;

                if (!p256dh || !auth) {
                    logger.error('[PushAuto] Chaves p256dh/auth ausentes');
                    return;
                }

                const { error } = await supabase
                    .from('push_subscriptions')
                    .upsert(
                        {
                            user_id: userId,
                            endpoint: subscription.endpoint,
                            p256dh,
                            auth,
                            subscription_json: json,
                            platform,
                            user_agent: navigator.userAgent.slice(0, 200),
                            is_active: true,
                            error_count: 0,
                            updated_at: new Date().toISOString(),
                        },
                        { onConflict: 'endpoint' }
                    );

                if (error) {
                    logger.error('[PushAuto] Erro ao salvar no banco:', error.message);
                    return;
                }

                logger.info(`[PushAuto] ✅ ${platform} salvo com sucesso!`);
            } finally {
                isRunning.current = false;
            }
        }

        // Run on mount
        autoSubscribe();

        // ─── Re-subscribe on foreground return ─────────────────────────
        // Subscription can expire while app is in background.
        // Re-running autoSubscribe ensures we always have a fresh subscription.
        const handleVisibility = () => {
            if (!document.hidden) {
                logger.debug('[PushAuto] App voltou ao foreground — verificando subscription');
                autoSubscribe();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [userId]);

    return null;
}

