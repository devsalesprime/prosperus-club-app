-- ============================================================
-- Migration 078: Lesson Ordering & Content Pinning
-- Curadoria de Conteúdo Premium no Academy
-- ============================================================
-- Adiciona colunas de ordenação manual (order_index) e 
-- fixação no topo (is_pinned) na tabela de vídeos.
-- PROTEÇÃO DE LEGADO: configura order_index baseando-se na
-- data de criação para que os vídeos existentes mantenham
-- a ordem visual atual.
-- ============================================================

-- 1. Adicionar colunas
ALTER TABLE public.videos
    ADD COLUMN IF NOT EXISTS order_index  INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_pinned    BOOLEAN NOT NULL DEFAULT false;

-- 2. Proteção de Legado: numerar os vídeos existentes pela
--    data de criação (mais antigo = menor índice)
--    Usa ROW_NUMBER() para garantir unicidade sem gaps.
UPDATE public.videos v
SET order_index = subquery.rn
FROM (
    SELECT
        id,
        ROW_NUMBER() OVER (ORDER BY created_at ASC) AS rn
    FROM public.videos
) AS subquery
WHERE v.id = subquery.id;

-- 3. Índice para acelerar queries de ordenação (usadas em toda listagem)
CREATE INDEX IF NOT EXISTS idx_videos_ordering
    ON public.videos (is_pinned DESC, order_index ASC, created_at DESC);

-- 4. Comentários descritivos nas colunas
COMMENT ON COLUMN public.videos.order_index IS
    'Ordenação manual pelo admin (0 = topo relativo dentro da categoria após is_pinned)';

COMMENT ON COLUMN public.videos.is_pinned IS
    'Se true, o vídeo aparece SEMPRE no topo absoluto da categoria para todos os Sócios';
