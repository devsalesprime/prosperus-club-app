-- ================================================================
-- MIGRATION: 079_add_category_icon.sql
-- Adiciona suporte a ícone proprietário (PNG/SVG/WebP) por categoria
-- ================================================================

-- PASSO 1: Adicionar coluna icon_url na tabela video_categories
ALTER TABLE public.video_categories
    ADD COLUMN IF NOT EXISTS icon_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.video_categories.icon_url
    IS 'URL pública do ícone da categoria (PNG/SVG/WebP) — bucket: category_icons';

-- PASSO 2: Criar bucket público category_icons (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'category_icons',
    'category_icons',
    true,
    524288,           -- 512 KB — ícones são pequenos
    ARRAY['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
    public             = true,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- PASSO 3: RLS — SELECT público (anônimo) para que Sócios vejam os ícones
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename  = 'objects'
          AND policyname = 'category_icons: public read'
    ) THEN
        CREATE POLICY "category_icons: public read"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'category_icons');
    END IF;
END $$;

-- PASSO 4: RLS — INSERT/UPDATE/DELETE apenas para authenticated (Admin via service_role)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename  = 'objects'
          AND policyname = 'category_icons: admin write'
    ) THEN
        CREATE POLICY "category_icons: admin write"
            ON storage.objects
            FOR ALL
            TO authenticated
            USING    (bucket_id = 'category_icons')
            WITH CHECK (bucket_id = 'category_icons');
    END IF;
END $$;
