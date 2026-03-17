-- ============================================
-- VIDEO MATERIALS — Migration 061
-- Prosperus Club · Março 2026
-- Tabela para materiais complementares da Academy
-- Replicando padrão da Agenda (event_materials)
-- ============================================

-- ─── Tabela de materiais por vídeo ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_materials (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id    UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  file_url    TEXT NOT NULL,       -- URL pública Supabase Storage
  file_path   TEXT NOT NULL,       -- path no bucket (para deletar)
  file_type   TEXT NOT NULL        -- 'pdf' | 'pptx' | 'ppt' | 'image'
                CHECK (file_type IN ('pdf','pptx','ppt','image')),
  file_size   BIGINT NOT NULL,
  file_name   TEXT NOT NULL,
  sort_order  INTEGER DEFAULT 0,   -- ordem de exibição
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_materials_video_id  ON video_materials(video_id);
CREATE INDEX idx_video_materials_sort      ON video_materials(video_id, sort_order);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE video_materials ENABLE ROW LEVEL SECURITY;

-- Sócios veem todos os materiais de vídeos
CREATE POLICY "members_read_video_materials"
  ON video_materials FOR SELECT TO authenticated
  USING (true);

-- Admin pode inserir, atualizar e deletar
CREATE POLICY "admin_manage_video_materials"
  ON video_materials FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN','TEAM')
    )
  );

-- ─── Tracking de downloads de materiais (opcional) ───────────────────────────
-- Usar a tabela file_downloads existente com campo nullable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'file_downloads' AND column_name = 'video_material_id'
  ) THEN
    ALTER TABLE file_downloads
      ADD COLUMN video_material_id UUID REFERENCES video_materials(id);
  END IF;
END $$;

-- ============================================
-- END OF MIGRATION 061
-- ============================================
