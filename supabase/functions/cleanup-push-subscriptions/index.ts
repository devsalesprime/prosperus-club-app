/// <reference path="../deno.d.ts" />

// Supabase Edge Function: cleanup-push-subscriptions
//
// Manutenção diária da tabela push_subscriptions (ADR-016).
//
// Disparada por pg_cron a cada 24h às 03:00 UTC (00:00 SP, baixo tráfego).
// Migration de schedule: 20260513_push_cleanup_cron.sql
//
// Regras aplicadas:
//   A) DELETE inativas com created_at < NOW() - 30 dias
//   B) SKIPPED nesta versão. Coluna `last_failed_at` não existe e as
//      candidatas (`last_used_at`, `error_count`) nunca são populadas
//      por send-push em produção (validado 2026-05-13). Reintroduzir
//      quando send-push incrementar error_count em catches de 410/4xx.
//   C) DELETE órfãs (user_id sem profile correspondente). Defensivo —
//      0 órfãs em 2026-05-13 mas previne crescimento se profile sumir.
//
// HARD_LIMIT 500 deletes totais por run. Se atingir, log "cleanup_capped"
// e segue; próxima rodada (24h depois) pega o resto.
//
// Response sempre 200 com payload estruturado. Erros vão em `errors[]`.

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const HARD_LIMIT = 500;
const INACTIVE_AGE_DAYS = 30;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CleanupStats {
    deleted_inactive_old: number;
    marked_stale: number;
    deleted_orphans: number;
    total_deleted: number;
    capped: boolean;
}

interface CleanupResponse {
    ok: boolean;
    stats: CleanupStats;
    timestamp: string;
    errors: string[];
}

async function deleteInactiveOld(
    supabase: SupabaseClient,
    remaining: number
): Promise<{ deleted: number; error?: string }> {
    if (remaining <= 0) return { deleted: 0 };
    const cutoffISO = new Date(Date.now() - INACTIVE_AGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Pega IDs primeiro (com limit) — DELETE direto não aceita LIMIT no postgrest.
    const { data: rows, error: selectErr } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('is_active', false)
        .lt('created_at', cutoffISO)
        .limit(remaining);

    if (selectErr) {
        return { deleted: 0, error: `select inactive_old: ${selectErr.message}` };
    }
    if (!rows || rows.length === 0) return { deleted: 0 };

    const ids = rows.map((r) => r.id as string);
    const { error: delErr, count } = await supabase
        .from('push_subscriptions')
        .delete({ count: 'exact' })
        .in('id', ids);

    if (delErr) {
        return { deleted: 0, error: `delete inactive_old: ${delErr.message}` };
    }
    return { deleted: count ?? ids.length };
}

async function deleteOrphans(
    supabase: SupabaseClient,
    remaining: number
): Promise<{ deleted: number; error?: string }> {
    if (remaining <= 0) return { deleted: 0 };

    // Busca todos os user_id distintos de push_subscriptions
    const { data: subRows, error: subErr } = await supabase
        .from('push_subscriptions')
        .select('user_id');
    if (subErr) {
        return { deleted: 0, error: `select push user_ids: ${subErr.message}` };
    }
    const subUserIds = Array.from(new Set((subRows ?? []).map((r) => r.user_id as string)));
    if (subUserIds.length === 0) return { deleted: 0 };

    // Busca os user_ids existentes em profiles (entre os candidatos)
    const { data: profileRows, error: profErr } = await supabase
        .from('profiles')
        .select('id')
        .in('id', subUserIds);
    if (profErr) {
        return { deleted: 0, error: `select profiles: ${profErr.message}` };
    }
    const validIds = new Set((profileRows ?? []).map((r) => r.id as string));
    const orphanUserIds = subUserIds.filter((uid) => !validIds.has(uid));
    if (orphanUserIds.length === 0) return { deleted: 0 };

    // Pega IDs de subscriptions órfãs até remaining
    const { data: orphanRows, error: orphSelErr } = await supabase
        .from('push_subscriptions')
        .select('id')
        .in('user_id', orphanUserIds)
        .limit(remaining);
    if (orphSelErr) {
        return { deleted: 0, error: `select orphan subs: ${orphSelErr.message}` };
    }
    if (!orphanRows || orphanRows.length === 0) return { deleted: 0 };

    const ids = orphanRows.map((r) => r.id as string);
    const { error: delErr, count } = await supabase
        .from('push_subscriptions')
        .delete({ count: 'exact' })
        .in('id', ids);
    if (delErr) {
        return { deleted: 0, error: `delete orphans: ${delErr.message}` };
    }
    return { deleted: count ?? ids.length };
}

Deno.serve(async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const stats: CleanupStats = {
        deleted_inactive_old: 0,
        marked_stale: 0,
        deleted_orphans: 0,
        total_deleted: 0,
        capped: false,
    };
    const errors: string[] = [];

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
        });

        // Regra A — inativas antigas
        const remainingA = HARD_LIMIT - stats.total_deleted;
        const resA = await deleteInactiveOld(supabase, remainingA);
        stats.deleted_inactive_old = resA.deleted;
        stats.total_deleted += resA.deleted;
        if (resA.error) errors.push(resA.error);
        console.log(`[cleanup] Regra A — deleted ${resA.deleted} inactive >${INACTIVE_AGE_DAYS}d`);

        // Regra B — skipped (ver header)
        stats.marked_stale = 0;

        // Regra C — órfãs
        const remainingC = HARD_LIMIT - stats.total_deleted;
        const resC = await deleteOrphans(supabase, remainingC);
        stats.deleted_orphans = resC.deleted;
        stats.total_deleted += resC.deleted;
        if (resC.error) errors.push(resC.error);
        console.log(`[cleanup] Regra C — deleted ${resC.deleted} orphans`);

        // Cap warning
        stats.capped = stats.total_deleted >= HARD_LIMIT;
        if (stats.capped) {
            console.warn(`[cleanup_capped] Atingiu HARD_LIMIT=${HARD_LIMIT}, próxima rodada pega o resto`);
        }

        const body: CleanupResponse = {
            ok: errors.length === 0,
            stats,
            timestamp: new Date().toISOString(),
            errors,
        };
        console.log('[cleanup] complete:', body);
        return new Response(JSON.stringify(body), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[cleanup] fatal:', msg);
        errors.push(`fatal: ${msg.slice(0, 500)}`);
        const body: CleanupResponse = {
            ok: false,
            stats,
            timestamp: new Date().toISOString(),
            errors,
        };
        return new Response(JSON.stringify(body), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
