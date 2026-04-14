-- supabase/migrations/060_registros_faturamento.sql

-- Tabela principal de faturamento declarado
CREATE TABLE IF NOT EXISTS registros_faturamento (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  valor             DECIMAL(15, 2) NOT NULL CHECK (valor > 0),
  periodo_referencia TEXT NOT NULL,
  -- Formato: 'YYYY-QN' para trimestral (ex: '2026-Q2')
  -- Formato: 'YYYY-MM' para mensal    (ex: '2026-04')
  tipo              TEXT NOT NULL CHECK (tipo IN ('onboarding', 'trimestral', 'manual')),
  data_registro     TIMESTAMPTZ NOT NULL DEFAULT now(),
  fonte             TEXT NOT NULL DEFAULT 'app' CHECK (fonte IN ('app', 'whatsapp', 'admin')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para performance nos cálculos
CREATE INDEX IF NOT EXISTS idx_faturamento_socio ON registros_faturamento(socio_id, periodo_referencia);
CREATE INDEX IF NOT EXISTS idx_faturamento_tipo  ON registros_faturamento(socio_id, tipo);

-- RLS
ALTER TABLE registros_faturamento ENABLE ROW LEVEL SECURITY;

-- Sócio vê e edita apenas os próprios dados
CREATE POLICY "socio_own_faturamento"
ON registros_faturamento FOR ALL TO authenticated
USING (socio_id = auth.uid())
WITH CHECK (socio_id = auth.uid());

-- Admin vê todos
CREATE POLICY "admin_all_faturamento"
ON registros_faturamento FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM', 'CEO', 'MANAGER')
  )
);

-- Coluna valor_pago_mentoria na tabela profiles (denominador do ROI)
-- Inserido manualmente pelo admin (Fase 1) ou via HubSpot (Fase 3)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS valor_pago_mentoria  DECIMAL(15, 2),
  ADD COLUMN IF NOT EXISTS data_entrada_clube   DATE,
  ADD COLUMN IF NOT EXISTS hubspot_deal_id      TEXT;

-- View para calcular ROI em tempo real
CREATE OR REPLACE VIEW v_roi_socios AS
SELECT
  p.id AS socio_id,
  p.name,
  p.valor_pago_mentoria,
  p.data_entrada_clube,

  -- Faturamento base (onboarding)
  base_reg.valor AS faturamento_base,
  base_reg.data_registro AS data_registro_base,

  -- Faturamento mais recente
  ultimo_reg.valor AS faturamento_atual,
  ultimo_reg.periodo_referencia AS ultimo_periodo,

  -- Delta acumulado (soma de todos os deltas vs. base)
  COALESCE(
    SUM(rf.valor - base_reg.valor)
    FILTER (WHERE rf.tipo != 'onboarding'),
    0
  ) AS delta_acumulado,

  -- ROI
  CASE
    WHEN p.valor_pago_mentoria > 0 AND base_reg.valor IS NOT NULL
    THEN COALESCE(
      SUM(rf.valor - base_reg.valor) FILTER (WHERE rf.tipo != 'onboarding'),
      0
    ) / p.valor_pago_mentoria
    ELSE NULL
  END AS roi,

  -- Contagem de registros
  COUNT(*) FILTER (WHERE rf.tipo != 'onboarding') AS total_atualizacoes,

  -- Último registro
  MAX(rf.data_registro) AS ultima_atualizacao

FROM profiles p
LEFT JOIN registros_faturamento base_reg
  ON base_reg.socio_id = p.id AND base_reg.tipo = 'onboarding'
LEFT JOIN LATERAL (
  SELECT valor, periodo_referencia
  FROM registros_faturamento
  WHERE socio_id = p.id AND tipo != 'onboarding'
  ORDER BY data_registro DESC
  LIMIT 1
) ultimo_reg ON true
LEFT JOIN registros_faturamento rf ON rf.socio_id = p.id
WHERE p.role = 'MEMBER'
GROUP BY
  p.id, p.name, p.valor_pago_mentoria, p.data_entrada_clube,
  base_reg.valor, base_reg.data_registro,
  ultimo_reg.valor, ultimo_reg.periodo_referencia;
