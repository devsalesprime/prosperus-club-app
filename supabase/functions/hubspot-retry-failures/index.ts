/// <reference path="../deno.d.ts" />

/**
 * Supabase Edge Function: hubspot-retry-failures
 *
 * Reprocessa entradas pending de hubspot_failed_calls (ADR-015).
 *
 * Disparado por pg_cron a cada 6h (cron expression "0 *\/6 * * *").
 * Migration de schedule: 20260511_hubspot_retry_cron.sql
 *
 * Critérios de pickup:
 *   - status = 'pending'
 *   - created_at <= now() - interval '5 minutes' (evita corrida com inserts recentes)
 *   - LIMIT 50 por execução (cap para não estourar timeout do Edge)
 *
 * Política:
 *   - Re-invoca a Edge Function original via supabase.functions.invoke()
 *     com o payload original.
 *   - Sucesso (synced=true) → status = 'reprocessed', last_reprocessed_at = now()
 *   - Falha (queued=true ou error) → reprocess_attempts++; se >= 4 →
 *     status = 'failed_permanent'
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_REPROCESS_ATTEMPTS = 4;
const BATCH_LIMIT = 50;
const MIN_AGE_MINUTES = 5;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface FailedCall {
    id: string;
    function_name: string;
    payload: Record<string, unknown>;
    reprocess_attempts: number;
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const stats = { picked: 0, reprocessed: 0, requeued: 0, failed_permanent: 0, errors: 0 };

    // Pega lote de pending elegíveis
    const cutoffISO = new Date(Date.now() - MIN_AGE_MINUTES * 60_000).toISOString();
    const { data: rows, error: fetchErr } = await supabase
        .from('hubspot_failed_calls')
        .select('id, function_name, payload, reprocess_attempts')
        .eq('status', 'pending')
        .lte('created_at', cutoffISO)
        .order('created_at', { ascending: true })
        .limit(BATCH_LIMIT);

    if (fetchErr) {
        console.error('❌ Failed to fetch pending queue:', fetchErr);
        return new Response(
            JSON.stringify({ ok: false, error: fetchErr.message, stats }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const queue: FailedCall[] = (rows ?? []) as FailedCall[];
    stats.picked = queue.length;
    console.log(`📋 Picked ${queue.length} pending entries`);

    for (const row of queue) {
        const nextAttempts = row.reprocess_attempts + 1;
        try {
            // Re-invoca a função original com payload preservado
            const { data, error: invokeErr } = await supabase.functions.invoke(
                row.function_name,
                { body: row.payload }
            );

            if (invokeErr) {
                throw new Error(`invoke error: ${invokeErr.message ?? String(invokeErr)}`);
            }

            const synced = data?.synced === true;
            const queued = data?.queued === true;

            if (synced && !queued) {
                // Sucesso: marca reprocessed
                await supabase
                    .from('hubspot_failed_calls')
                    .update({
                        status: 'reprocessed',
                        last_reprocessed_at: new Date().toISOString(),
                        reprocess_attempts: nextAttempts,
                    })
                    .eq('id', row.id);
                stats.reprocessed++;
                console.log(`✅ Reprocessed ${row.function_name} (${row.id})`);
            } else {
                // Falhou de novo: incrementa tentativa
                if (nextAttempts >= MAX_REPROCESS_ATTEMPTS) {
                    await supabase
                        .from('hubspot_failed_calls')
                        .update({
                            status: 'failed_permanent',
                            last_reprocessed_at: new Date().toISOString(),
                            reprocess_attempts: nextAttempts,
                            error_message: data?.error ?? 'Reprocess exhausted',
                        })
                        .eq('id', row.id);
                    stats.failed_permanent++;
                    console.warn(`⚰️ Failed permanent: ${row.function_name} (${row.id}) after ${nextAttempts} attempts`);
                } else {
                    await supabase
                        .from('hubspot_failed_calls')
                        .update({
                            last_reprocessed_at: new Date().toISOString(),
                            reprocess_attempts: nextAttempts,
                            error_message: data?.error ?? 'Reprocess returned queued',
                        })
                        .eq('id', row.id);
                    stats.requeued++;
                    console.log(`🔁 Requeued ${row.function_name} (${row.id}) — attempt ${nextAttempts}/${MAX_REPROCESS_ATTEMPTS}`);
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`❌ Reprocess threw for ${row.id}:`, msg);

            if (nextAttempts >= MAX_REPROCESS_ATTEMPTS) {
                await supabase
                    .from('hubspot_failed_calls')
                    .update({
                        status: 'failed_permanent',
                        last_reprocessed_at: new Date().toISOString(),
                        reprocess_attempts: nextAttempts,
                        error_message: msg.slice(0, 2000),
                    })
                    .eq('id', row.id);
                stats.failed_permanent++;
            } else {
                await supabase
                    .from('hubspot_failed_calls')
                    .update({
                        last_reprocessed_at: new Date().toISOString(),
                        reprocess_attempts: nextAttempts,
                        error_message: msg.slice(0, 2000),
                    })
                    .eq('id', row.id);
                stats.errors++;
            }
        }
    }

    console.log('🏁 Retry cron complete:', stats);
    return new Response(
        JSON.stringify({ ok: true, stats }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
});
