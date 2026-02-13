-- ============================================
-- FASE 1: Campos Estratégicos do Perfil
-- PRD Complementar v2.1 — Requisitos ONB + PRF
-- ============================================

-- Etapa 1.1: Adicionar colunas ao profiles
-- Campos para networking inteligente entre sócios

-- ONB-FLD-001: O que o membro vende/faz
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS what_i_sell TEXT;

-- ONB-FLD-002: O que o membro precisa/compraria
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS what_i_need TEXT;

-- ONB-FLD-003: Setores de interesse para parcerias
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partnership_interests TEXT[];

-- HUB-SYNC-008: Data de entrada no clube (via HubSpot Deal.closedate)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS member_since TIMESTAMPTZ;

-- ============================================
-- RLS: Campos são visíveis para todos os membros autenticados
-- (já coberto pela policy existente de SELECT em profiles)
-- UPDATE: somente o próprio usuário pode editar (já coberto)
-- ============================================

-- Verificação: listar colunas adicionadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('what_i_sell', 'what_i_need', 'partnership_interests', 'member_since');
