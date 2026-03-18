-- ============================================
-- 069: Admin Audit Log
-- ============================================
-- Rastreabilidade total de ações administrativas.
-- Registra toda auditoria, decisão e ação em massa.

CREATE TABLE IF NOT EXISTS admin_audit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL,           -- ex: 'AUDIT_DEAL', 'BULK_AUDIT', 'RESOLVE_REFERRAL'
    entity_type TEXT NOT NULL,           -- ex: 'deal', 'referral', 'member'
    entity_id   UUID,                    -- ID do registro afetado (nullable para bulk)
    details     JSONB DEFAULT '{}',      -- Payload livre: notas, decisão, IDs em lote, etc.
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index: busca por admin e por entidade
CREATE INDEX IF NOT EXISTS idx_audit_log_admin    ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity   ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created  ON admin_audit_log(created_at DESC);

-- ─── RLS ──────────────────────────────────────────────────────

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins/Team podem inserir (registrar ações)
CREATE POLICY "admin_audit_log_insert"
    ON admin_audit_log FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'TEAM')
        )
    );

-- Admins/Team podem ler logs
CREATE POLICY "admin_audit_log_select"
    ON admin_audit_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'TEAM')
        )
    );
