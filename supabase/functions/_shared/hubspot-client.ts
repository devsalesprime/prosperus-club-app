// ============================================================
// HubSpot Client — retry/backoff wrapper + failure queue
// ============================================================
// ADR-015: HubSpot rate limit handling com queue persistente.
//
// Exports:
//   - hubspotFetch(url, init?)     → fetch wrapper com retry/backoff
//   - HubSpotRateLimitError        → erro lançado quando attempts esgotam
//   - withFailureQueue(name, payload, fn) → executa fn(), enfileira se falhar
//
// Política de retry (HubSpot Public API):
//   - 4 tentativas totais (1 inicial + 3 retries)
//   - 429: respeita header `Retry-After` (segundos) — se ausente, usa backoff
//   - 5xx (500/502/503/504): exponential backoff base 1s, factor 2, max 30s
//   - Jitter: ±25% em todas as esperas para evitar thundering herd
//   - 4xx (exceto 429): NÃO faz retry, propaga erro imediato
//   - 2xx: retorna Response normalmente
//
// Authorization é injetada automaticamente a partir de HUBSPOT_ACCESS_TOKEN
// (fallback: HUBSPOT_API_KEY). Caller não precisa setar header.

import { createClient, SupabaseClient } from 'supabase';

// ============================================================
// CONFIG
// ============================================================

const MAX_ATTEMPTS = 4;
const BASE_DELAY_MS = 1_000;
const BACKOFF_FACTOR = 2;
const MAX_DELAY_MS = 30_000;
const JITTER_PCT = 0.25;

const HUBSPOT_TOKEN =
    Deno.env.get('HUBSPOT_ACCESS_TOKEN') ||
    Deno.env.get('HUBSPOT_API_KEY') ||
    '';

// ============================================================
// TYPES
// ============================================================

export class HubSpotRateLimitError extends Error {
    public readonly status: number;
    public readonly url: string;
    public readonly method: string;
    public readonly attempts: number;
    public readonly responseBody: string;

    constructor(opts: {
        status: number;
        url: string;
        method: string;
        attempts: number;
        responseBody: string;
        message?: string;
    }) {
        super(
            opts.message ??
            `HubSpot API ${opts.status} after ${opts.attempts} attempts: ${opts.method} ${opts.url}`
        );
        this.name = 'HubSpotRateLimitError';
        this.status = opts.status;
        this.url = opts.url;
        this.method = opts.method;
        this.attempts = opts.attempts;
        this.responseBody = opts.responseBody;
    }
}

export interface UniformResponse {
    synced: boolean;
    queued: boolean;
    queueId?: string;
    error?: string;
    [extra: string]: unknown;
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

function jitter(ms: number): number {
    const delta = ms * JITTER_PCT;
    const min = ms - delta;
    const max = ms + delta;
    return Math.floor(min + Math.random() * (max - min));
}

function computeBackoff(attempt: number): number {
    // attempt is 1-indexed: 1 → ~1s, 2 → ~2s, 3 → ~4s, 4 → ~8s (capped 30s)
    const raw = BASE_DELAY_MS * Math.pow(BACKOFF_FACTOR, attempt - 1);
    return Math.min(jitter(raw), MAX_DELAY_MS);
}

function parseRetryAfter(headerValue: string | null): number | null {
    if (!headerValue) return null;
    const seconds = Number.parseInt(headerValue, 10);
    if (Number.isFinite(seconds) && seconds >= 0) {
        return Math.min(seconds * 1000, MAX_DELAY_MS);
    }
    return null;
}

function shouldRetry(status: number): boolean {
    return status === 429 || (status >= 500 && status < 600);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// hubspotFetch — main wrapper
// ============================================================

export async function hubspotFetch(
    url: string,
    init: RequestInit = {}
): Promise<Response> {
    if (!HUBSPOT_TOKEN) {
        throw new Error(
            '[hubspotFetch] Missing HUBSPOT_ACCESS_TOKEN (and HUBSPOT_API_KEY fallback). Set the env var in the Edge Function secrets.'
        );
    }

    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers ?? {});
    if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${HUBSPOT_TOKEN}`);
    }
    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const requestInit: RequestInit = { ...init, method, headers };

    let lastResponse: Response | null = null;
    let lastBody = '';

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        let response: Response;
        try {
            response = await fetch(url, requestInit);
        } catch (networkErr) {
            // Network-level failure: treat like 5xx and retry
            if (attempt === MAX_ATTEMPTS) {
                throw new HubSpotRateLimitError({
                    status: 0,
                    url,
                    method,
                    attempts: attempt,
                    responseBody: String(networkErr).slice(0, 500),
                    message: `Network failure after ${attempt} attempts: ${String(networkErr).slice(0, 200)}`,
                });
            }
            await sleep(computeBackoff(attempt));
            continue;
        }

        if (response.ok) {
            return response;
        }

        if (!shouldRetry(response.status)) {
            // 4xx (não-429): erro de negócio, não retry
            return response;
        }

        // Captura body para log/queue antes do retry consumir a Response
        lastResponse = response;
        lastBody = await response.clone().text().catch(() => '');

        if (attempt === MAX_ATTEMPTS) {
            break; // sai do loop para lançar erro fora
        }

        let waitMs: number;
        if (response.status === 429) {
            waitMs = parseRetryAfter(response.headers.get('Retry-After')) ?? computeBackoff(attempt);
        } else {
            waitMs = computeBackoff(attempt);
        }
        await sleep(waitMs);
    }

    throw new HubSpotRateLimitError({
        status: lastResponse?.status ?? 0,
        url,
        method,
        attempts: MAX_ATTEMPTS,
        responseBody: lastBody.slice(0, 2000),
    });
}

// ============================================================
// withFailureQueue — enfileira em hubspot_failed_calls se fn() falhar
// ============================================================

let _adminClient: SupabaseClient | null = null;

function getAdminClient(): SupabaseClient {
    if (_adminClient) return _adminClient;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            '[withFailureQueue] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.'
        );
    }
    _adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    return _adminClient;
}

export interface FailureQueueContext {
    functionName: string;
    payload: unknown;
    requestMethod?: string;
    requestUrl?: string;
}

export async function withFailureQueue<T>(
    ctx: FailureQueueContext,
    fn: () => Promise<T>
): Promise<{ ok: true; result: T } | { ok: false; queueId?: string; error: string }> {
    try {
        const result = await fn();
        return { ok: true, result };
    } catch (err) {
        const isRateLimit = err instanceof HubSpotRateLimitError;
        const errorMessage = err instanceof Error ? err.message : String(err);
        const errorStatus = isRateLimit ? err.status : null;
        const errorUrl = isRateLimit ? err.url : (ctx.requestUrl ?? null);
        const errorMethod = isRateLimit ? err.method : (ctx.requestMethod ?? null);

        try {
            const admin = getAdminClient();
            const { data, error: insertErr } = await admin
                .from('hubspot_failed_calls')
                .insert({
                    function_name: ctx.functionName,
                    payload: ctx.payload,
                    request_method: errorMethod,
                    request_url: errorUrl,
                    error_status: errorStatus,
                    error_message: errorMessage.slice(0, 2000),
                    attempts: isRateLimit ? err.attempts : 1,
                    status: 'pending',
                    reprocess_attempts: 0,
                })
                .select('id')
                .single();

            if (insertErr) {
                console.error('[withFailureQueue] Failed to enqueue:', insertErr.message);
                return { ok: false, error: errorMessage };
            }
            return { ok: false, queueId: data?.id as string | undefined, error: errorMessage };
        } catch (queueErr) {
            console.error('[withFailureQueue] Queue insert threw:', queueErr);
            return { ok: false, error: errorMessage };
        }
    }
}

// ============================================================
// Helper: response uniforme das Edge Functions
// ============================================================

export function uniformResponse(payload: UniformResponse, extra: Record<string, unknown> = {}): Response {
    return new Response(
        JSON.stringify({ ...payload, ...extra }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
}
