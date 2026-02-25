import { supabase } from '../lib/supabase';
import { logger } from './logger';

/**
 * Helper function para converter VAPID public key de base64 para Uint8Array
 * Necessário para o pushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Registra dispositivo para receber push notifications
 * 
 * @param userId - ID do usuário logado
 * @returns Promise<boolean> - true se registrado com sucesso
 * 
 * @example
 * ```tsx
 * // No AuthContext ou após login
 * useEffect(() => {
 *   if (session?.user?.id) {
 *     registerPushNotifications(session.user.id);
 *   }
 * }, [session]);
 * ```
 */
export async function registerPushNotifications(userId: string): Promise<boolean> {
    try {
        // 1. Verificar suporte
        if (!('Notification' in window)) {
            console.warn('⚠️ Notifications não suportadas neste navegador');
            return false;
        }

        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker não suportado neste navegador');
            return false;
        }

        if (!('PushManager' in window)) {
            console.warn('⚠️ Push API não suportada neste navegador');
            return false;
        }

        // 2. Verificar se já tem permissão
        let permission = Notification.permission;

        if (permission === 'default') {
            // Solicitar permissão
            permission = await Notification.requestPermission();
        }

        if (permission !== 'granted') {
            console.warn('⚠️ Permissão de notificações negada pelo usuário');
            return false;
        }

        logger.info('✅ Permissão de notificações concedida');

        // 3. Aguardar Service Worker estar pronto
        const registration = await navigator.serviceWorker.ready;

        // 4. Verificar se já existe subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Criar nova subscription
            const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                console.error('❌ VITE_VAPID_PUBLIC_KEY não configurada no .env');
                return false;
            }

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
            });

            logger.debug('✅ Nova subscription criada');
        } else {
            logger.debug('✅ Subscription já existe');
        }

        // 5. Salvar subscription no banco de dados
        const { error } = await supabase
            .from('user_devices')
            .upsert({
                user_id: userId,
                subscription_json: JSON.stringify(subscription),
                device_name: getBrowserName(),
                user_agent: navigator.userAgent,
                last_used_at: new Date().toISOString(),
                is_active: true
            }, {
                onConflict: 'user_id,subscription_json',
                ignoreDuplicates: false
            });

        if (error) {
            console.error('❌ Erro ao salvar dispositivo no banco:', error);
            return false;
        }

        logger.info('✅ Dispositivo registrado para push notifications');
        return true;

    } catch (error) {
        console.error('❌ Erro ao registrar push notifications:', error);
        return false;
    }
}

/**
 * Remove registro de push notifications do dispositivo atual
 * 
 * @param userId - ID do usuário logado
 * @returns Promise<boolean> - true se removido com sucesso
 */
export async function unregisterPushNotifications(userId: string): Promise<boolean> {
    try {
        if (!('serviceWorker' in navigator)) {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            // Cancelar subscription no navegador
            await subscription.unsubscribe();

            // Remover do banco de dados
            const { error } = await supabase
                .from('user_devices')
                .delete()
                .eq('user_id', userId)
                .eq('subscription_json', JSON.stringify(subscription));

            if (error) {
                console.error('❌ Erro ao remover dispositivo do banco:', error);
                return false;
            }

            logger.info('✅ Push notifications desregistradas');
            return true;
        }

        return false;
    } catch (error) {
        console.error('❌ Erro ao desregistrar push notifications:', error);
        return false;
    }
}

/**
 * Verifica se push notifications estão habilitadas
 * 
 * @returns Promise<boolean> - true se habilitadas
 */
export async function isPushNotificationsEnabled(): Promise<boolean> {
    try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
            return false;
        }

        if (Notification.permission !== 'granted') {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        return false;
    }
}

/**
 * Helper para obter nome amigável do navegador
 */
function getBrowserName(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';

    return 'Unknown Browser';
}
