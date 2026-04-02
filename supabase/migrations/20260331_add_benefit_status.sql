-- ============================================
-- Migration: Benefit Approval Workflow
-- ============================================
-- Adiciona coluna benefit_status à tabela profiles
-- para controle de moderação de benefícios exclusivos.
-- 
-- Status possíveis:
--   NULL       → Sócio nunca cadastrou benefício (default)
--   'pending'  → Aguardando aprovação do admin
--   'approved' → Aprovado e visível na comunidade
--   'rejected' → Reprovado pelo admin

-- 1. Adicionar coluna (DEFAULT NULL — só ganha status quando o sócio de fato cadastra)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS benefit_status TEXT DEFAULT NULL 
CHECK (benefit_status IN ('pending', 'approved', 'rejected'));

-- 2. Proteção de legado: aprovar benefícios que JÁ estavam ativos E com conteúdo real
UPDATE profiles 
SET benefit_status = 'approved' 
WHERE exclusive_benefit IS NOT NULL 
  AND (exclusive_benefit->>'active')::boolean = true
  AND COALESCE(exclusive_benefit->>'title', '') != ''
  AND COALESCE(exclusive_benefit->>'description', '') != '';

-- 3. Limpar qualquer status indevido (quem não tem benefício real fica NULL)
UPDATE profiles 
SET benefit_status = NULL 
WHERE benefit_status IS NOT NULL
  AND (
    exclusive_benefit IS NULL 
    OR COALESCE(exclusive_benefit->>'title', '') = ''
    OR COALESCE(exclusive_benefit->>'description', '') = ''
    OR (exclusive_benefit->>'active')::boolean = false
  );