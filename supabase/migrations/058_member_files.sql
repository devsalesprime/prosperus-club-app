-- 058_member_files.sql
-- Arquivos do Sócio: tabelas, RLS, RPCs
-- Prosperus Club · Março 2026

-- ─── Tabela principal ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS member_files (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  file_url       TEXT NOT NULL,
  file_path      TEXT NOT NULL,
  file_type      TEXT NOT NULL
                   CHECK (file_type IN ('pdf','pptx','ppt','image','doc','docx','xlsx')),
  file_size      BIGINT NOT NULL,
  file_name      TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'geral'
                   CHECK (category IN ('geral','apresentacao','evento','material')),
  is_visible     BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_by     UUID REFERENCES profiles(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Tabela de logs de download ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS file_downloads (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id       UUID NOT NULL REFERENCES member_files(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indices ─────────────────────────────────────────────────────────────────
CREATE INDEX idx_file_downloads_file_id ON file_downloads(file_id);
CREATE INDEX idx_file_downloads_user_id ON file_downloads(user_id);
CREATE INDEX idx_member_files_visible   ON member_files(is_visible);
CREATE INDEX idx_member_files_created   ON member_files(created_at DESC);
CREATE INDEX idx_member_files_downloads ON member_files(download_count DESC);

-- ─── Trigger updated_at ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_member_files_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_member_files_updated_at
  BEFORE UPDATE ON member_files
  FOR EACH ROW EXECUTE FUNCTION update_member_files_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE member_files   ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_downloads ENABLE ROW LEVEL SECURITY;

-- Sócios veem apenas arquivos visíveis
CREATE POLICY "members_read_visible_files"
  ON member_files FOR SELECT TO authenticated
  USING (is_visible = true);

-- Admin CRUD completo
CREATE POLICY "admin_all_files"
  ON member_files FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN','TEAM'))
  );

-- Sócio pode inserir seu próprio download log
CREATE POLICY "members_insert_download_log"
  ON file_downloads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Sócio vê apenas seus downloads
CREATE POLICY "members_read_own_downloads"
  ON file_downloads FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admin vê todos os downloads
CREATE POLICY "admin_read_all_downloads"
  ON file_downloads FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN','TEAM'))
  );

-- ─── RPC: analytics de downloads ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_file_download_stats(
  p_period TEXT DEFAULT '30d'
)
RETURNS TABLE (
  file_id          UUID,
  title            TEXT,
  file_type        TEXT,
  category         TEXT,
  total_downloads  BIGINT,
  unique_downloaders BIGINT,
  last_downloaded  TIMESTAMPTZ
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    f.id,
    f.title,
    f.file_type,
    f.category,
    COUNT(d.id)               AS total_downloads,
    COUNT(DISTINCT d.user_id) AS unique_downloaders,
    MAX(d.downloaded_at)      AS last_downloaded
  FROM member_files f
  LEFT JOIN file_downloads d ON d.file_id = f.id
    AND (
      p_period = 'all'
      OR d.downloaded_at > NOW() - (p_period::INTERVAL)
    )
  GROUP BY f.id, f.title, f.file_type, f.category
  ORDER BY total_downloads DESC;
$$;

-- Incrementar contador de downloads (atomic)
CREATE OR REPLACE FUNCTION increment_file_download(p_file_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE member_files
  SET download_count = download_count + 1,
      updated_at     = NOW()
  WHERE id = p_file_id;
$$;
