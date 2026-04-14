-- migration_add_roi_approved.sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_roi_approved BOOLEAN DEFAULT false;

DROP VIEW IF EXISTS v_roi_socios;
CREATE OR REPLACE VIEW v_roi_socios AS
SELECT
  p.id AS socio_id,
  p.name,
  p.valor_pago_mentoria,
  p.is_roi_approved,
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
  p.id, p.name, p.valor_pago_mentoria, p.is_roi_approved, p.data_entrada_clube,
  base_reg.valor, base_reg.data_registro,
  ultimo_reg.valor, ultimo_reg.periodo_referencia;
