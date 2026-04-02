-- ============================================
-- VIDEO MATERIALS LINKS — Migration 064
-- Prosperus Club · Março 2026
-- Adiciona suporte a links (URLs) como materiais complementares
-- ============================================

-- 1. Atualizar CHECK para incluir 'link'
ALTER TABLE video_materials DROP CONSTRAINT IF EXISTS video_materials_file_type_check;
ALTER TABLE video_materials ADD CONSTRAINT video_materials_file_type_check
    CHECK (file_type IN ('pdf','pptx','ppt','image','link'));

-- 2. Tornar colunas de arquivo nullable (links não têm arquivo)
ALTER TABLE video_materials ALTER COLUMN file_path DROP NOT NULL;
ALTER TABLE video_materials ALTER COLUMN file_size DROP NOT NULL;
ALTER TABLE video_materials ALTER COLUMN file_name DROP NOT NULL;

-- Defaults para links (sem arquivo)
ALTER TABLE video_materials ALTER COLUMN file_path SET DEFAULT '';
ALTER TABLE video_materials ALTER COLUMN file_size SET DEFAULT 0;
ALTER TABLE video_materials ALTER COLUMN file_name SET DEFAULT '';

-- ============================================
-- END OF MIGRATION 064
-- ============================================
