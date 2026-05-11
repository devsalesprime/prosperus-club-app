-- ============================================
-- Migration: schedule pg_cron para hubspot-retry-failures
-- ADR-015: pg_cron + vault e o padrao oficial de schedule no Prosperus.
-- Reuso de ADR-013 (vault.decrypted_secrets: supabase_url, service_role_key).
--
-- Cron: a cada 6h, no minuto 0.
-- Idempotente: cron.unschedule no nome conhecido antes de cron.schedule.
-- ============================================

-- Habilitar pg_cron (idempotente — ja foi habilitada na migration enable_pg_cron)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Idempotencia: remove job anterior com mesmo nome (se existir)
DO $$
BEGIN
    PERFORM cron.unschedule('hubspot-retry-failures-6h');
EXCEPTION WHEN OTHERS THEN
    -- Job nao existia, ignora
    NULL;
END;
$$;

-- Schedule: invoca a Edge Function via pg_net (HTTP POST) com service_role do vault
SELECT cron.schedule(
    'hubspot-retry-failures-6h',
    '0 */6 * * *',
    $cron$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'supabase_url' LIMIT 1)
               || '/functions/v1/hubspot-retry-failures',
        headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
            'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
    );
    $cron$
);

COMMENT ON EXTENSION pg_cron IS
    'Schedule oficial do Prosperus Club App (ADR-015). Jobs versionados em supabase/migrations/. NAO usar Supabase Dashboard cron UI.';
