-- ============================================
-- Migration: hubspot_failed_calls (persistence para retry queue)
-- ADR-015: HubSpot rate limit handling
--
-- Tabela enfileira chamadas HubSpot que falharam apos os 4 attempts do
-- hubspotFetch() (429/5xx esgotados). Cron job hubspot-retry-failures
-- (etapa seguinte) le linhas pending, reprocessa, e marca como reprocessed
-- ou failed_permanent apos 4 reprocess_attempts.
--
-- RLS:
--   - SELECT: usuarios com role ADMIN ou TEAM (para painel de inspecao futuro)
--   - INSERT/UPDATE/DELETE: apenas service_role (Edge Functions)
-- ============================================

CREATE TABLE IF NOT EXISTS public.hubspot_failed_calls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    function_name text NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    request_method text,
    request_url text,
    error_status integer,
    error_message text,
    attempts integer NOT NULL DEFAULT 4,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'reprocessed', 'failed_permanent')),
    reprocess_attempts integer NOT NULL DEFAULT 0,
    last_reprocessed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.hubspot_failed_calls IS
    'Fila persistente de chamadas HubSpot que falharam apos retry/backoff (ADR-015). Reprocessada pelo cron hubspot-retry-failures a cada 6h.';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hubspot_failed_calls_status_created
    ON public.hubspot_failed_calls (status, created_at)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_hubspot_failed_calls_function_name
    ON public.hubspot_failed_calls (function_name);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION public.set_hubspot_failed_calls_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hubspot_failed_calls_updated_at
    ON public.hubspot_failed_calls;

CREATE TRIGGER trg_hubspot_failed_calls_updated_at
    BEFORE UPDATE ON public.hubspot_failed_calls
    FOR EACH ROW
    EXECUTE FUNCTION public.set_hubspot_failed_calls_updated_at();

-- RLS
ALTER TABLE public.hubspot_failed_calls ENABLE ROW LEVEL SECURITY;

-- SELECT: ADMIN e TEAM podem ver (para painel futuro)
DROP POLICY IF EXISTS "hubspot_failed_calls_select_admin_team"
    ON public.hubspot_failed_calls;

CREATE POLICY "hubspot_failed_calls_select_admin_team"
    ON public.hubspot_failed_calls
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role IN ('ADMIN', 'TEAM')
        )
    );

-- INSERT/UPDATE/DELETE: apenas service_role (Edge Functions)
-- Nao criamos policies para esses commands na role authenticated → bloqueia tudo.
-- service_role bypassa RLS por padrao no Supabase, entao nao precisa policy explicita.

-- Grants explicitos (defesa em profundidade)
GRANT SELECT ON public.hubspot_failed_calls TO authenticated;
GRANT ALL ON public.hubspot_failed_calls TO service_role;
