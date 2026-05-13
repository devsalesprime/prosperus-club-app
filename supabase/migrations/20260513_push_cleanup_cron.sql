-- ============================================
-- Migration: schedule pg_cron para cleanup-push-subscriptions
-- ADR-016: manutencao diaria da tabela push_subscriptions.
-- Reuso de ADR-013/ADR-015 (vault.decrypted_secrets + pg_net).
--
-- Cron: diario as 03:00 UTC (00:00 SP, baixo trafego).
-- Idempotente: cron.unschedule no nome conhecido antes de cron.schedule.
-- ============================================

-- pg_cron ja habilitada por enable_pg_cron (2026-05-11). CREATE EXTENSION
-- aqui e idempotente.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotencia: remove job anterior com mesmo nome (se existir)
DO $$
BEGIN
    PERFORM cron.unschedule('push-cleanup-daily');
EXCEPTION WHEN OTHERS THEN
    -- Job nao existia, ignora
    NULL;
END;
$$;

-- Schedule: invoca a Edge Function via pg_net (HTTP POST) com service_role do vault
SELECT cron.schedule(
    'push-cleanup-daily',
    '0 3 * * *',
    $cron$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1)
               || '/functions/v1/cleanup-push-subscriptions',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $cron$
);
