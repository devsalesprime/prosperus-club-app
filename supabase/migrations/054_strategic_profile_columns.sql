-- Migration 054: Documentar colunas estratégicas do perfil
-- Colunas já existem no banco de produção (adicionadas diretamente)
-- Esta migration garante que o schema pode ser recriado corretamente

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS what_i_sell             text,
  ADD COLUMN IF NOT EXISTS what_i_need             text,
  ADD COLUMN IF NOT EXISTS partnership_interests   text[];

-- Confirmar que as colunas de termos também existem (migration 050)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_at        timestamptz,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at      timestamptz,
  ADD COLUMN IF NOT EXISTS custom_interest          text;

COMMENT ON COLUMN profiles.what_i_sell           IS 'O que o sócio oferece/vende — usado no match engine';
COMMENT ON COLUMN profiles.what_i_need           IS 'O que o sócio busca — usado no match engine';
COMMENT ON COLUMN profiles.partnership_interests IS 'Áreas de interesse (array) — filtros do Member Book';
COMMENT ON COLUMN profiles.custom_interest       IS 'Interesse personalizado quando "Outros" é selecionado';
