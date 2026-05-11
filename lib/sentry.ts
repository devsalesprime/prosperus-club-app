// lib/sentry.ts
// ============================================
// Sentry — camada de observabilidade do Prosperus Club App
// ============================================
// ADR-014: Sentry como camada de observabilidade.
// Inicializa APENAS em produção (enabled: import.meta.env.PROD).
// Source maps são geradas mas não referenciadas publicamente — Sentry consome
// via upload feito por @sentry/vite-plugin (precisa de SENTRY_AUTH_TOKEN no build).
//
// Filtros beforeSend descartam ruído conhecido (ver função abaixo).
// Breadcrumbs categorizados são adicionados em zonas críticas:
//   - push, notification, realtime, hubspot

import * as Sentry from '@sentry/react';

// Build-time injection via vite.config.ts (define: { __APP_VERSION__ })
// Fallback para 'unknown' se algo na pipeline falhar antes de chegar aqui.
declare const __APP_VERSION__: string;
const releaseVersion: string = typeof __APP_VERSION__ === 'string' && __APP_VERSION__.length > 0
    ? __APP_VERSION__
    : 'unknown';

/**
 * Filtros aplicados a TODOS os erros antes de enviar ao Sentry.
 * Retornar null = descarta. Retornar event = envia.
 *
 * Função pura, fácil de estender. Cada filtro tem comentário explicando a razão.
 */
export function filterKnownNoise(
    event: Sentry.ErrorEvent,
    hint: Sentry.EventHint
): Sentry.ErrorEvent | null {
    const exception = hint.originalException;
    const errorName = (exception as Error | undefined)?.name ?? '';
    const errorMessage = (exception as Error | undefined)?.message ?? event.message ?? '';

    // 1) AbortError em React.StrictMode mount/unmount/remount.
    //    AuthContext já trata silenciosamente (linha 73-84). Comportamento esperado.
    if (errorName === 'AbortError' && /aborted|signal is aborted/i.test(errorMessage)) {
        return null;
    }

    // 2) HTTP 410 Gone — push subscriptions stale. send-push faz auto-cleanup
    //    (notificationService.ts:102-108). Comportamento documentado em ADR-013.
    if (/410\s*Gone|HTTP 410/i.test(errorMessage)) {
        return null;
    }

    // 3) ResizeObserver loop — bug conhecido de browser, não tem ação possível.
    if (/ResizeObserver loop/i.test(errorMessage)) {
        return null;
    }

    // 4) Promise rejection sem stack útil — sempre vem de código terceiros
    //    (geralmente extensões do browser) e zero contexto pra debug.
    if (/Non-Error promise rejection captured/i.test(errorMessage)) {
        return null;
    }

    return event;
}

/**
 * Inicializa o Sentry SDK.
 * Chamar UMA vez no entrypoint, ANTES do ReactDOM.createRoot.
 */
export function initSentry(): void {
    const dsn = import.meta.env.VITE_SENTRY_DSN;

    // Em desenvolvimento OU sem DSN configurado: não inicializa, fica silent.
    // Isso garante zero overhead em dev e zero crash se a env var não existir.
    if (!import.meta.env.PROD || !dsn) {
        return;
    }

    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        release: releaseVersion,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,    // PWA interna — texto não sensível em UI
                blockAllMedia: false,
            }),
        ],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0,   // só replay quando há erro
        replaysOnErrorSampleRate: 1.0,
        beforeSend: filterKnownNoise,
        // Define máximo de breadcrumbs para evitar payload gigante em erros
        maxBreadcrumbs: 50,
    });
}

/**
 * Categorias de breadcrumbs usadas no app. Use exclusivamente estes valores
 * pra facilitar busca/filtragem no Dashboard Sentry.
 */
export type BreadcrumbCategory = 'push' | 'notification' | 'realtime' | 'hubspot' | 'auth';

/**
 * Helper para adicionar breadcrumb categorizado.
 * Aceita qualquer dado serializável; NÃO incluir dados sensíveis (email,
 * telefone, valores de deal etc.). Use IDs e statuses.
 */
export function addBreadcrumb(
    category: BreadcrumbCategory,
    message: string,
    data?: Record<string, string | number | boolean | null | undefined>,
    level: Sentry.SeverityLevel = 'info'
): void {
    // No-op em dev: zero overhead
    if (!import.meta.env.PROD) return;

    Sentry.addBreadcrumb({
        category,
        message,
        data,
        level,
    });
}

// Re-export Sentry methods que outros arquivos vão usar.
// Manter superfície de API mínima — se precisar de algo a mais, importar
// direto de '@sentry/react' (e documentar por quê).
export { Sentry };
