-- supabase/migrations/061_notification_banners.sql

CREATE TABLE IF NOT EXISTS notification_banners (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,                 -- título interno (só admin vê)
  image_url     TEXT NOT NULL,                 -- URL no Supabase Storage
  deep_link     TEXT NOT NULL,                 -- rota interna do app (ex: '/app/sócios')
  link_label    TEXT,                          -- ex: "Ver Sócios"
  is_active     BOOLEAN NOT NULL DEFAULT true,
  starts_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at       TIMESTAMPTZ,                   -- null = sem expiração
  skip_delay    INTEGER NOT NULL DEFAULT 5,    -- segundos do countdown
  target_roles  TEXT[] NOT NULL DEFAULT ARRAY['MEMBER'],  -- 'MEMBER','ADMIN','TEAM'
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca de banners ativos
CREATE INDEX IF NOT EXISTS idx_notification_banners_active
  ON notification_banners(is_active, starts_at, ends_at)
  WHERE is_active = true;

-- RLS
ALTER TABLE notification_banners ENABLE ROW LEVEL SECURITY;

-- Sócios leem banners ativos
CREATE POLICY "members_read_active_banners"
ON notification_banners FOR SELECT TO authenticated
USING (
  is_active = true
  AND starts_at <= now()
  AND (ends_at IS NULL OR ends_at >= now())
);

-- Admin gerencia tudo
CREATE POLICY "admin_all_notification_banners"
ON notification_banners FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'TEAM', 'CEO')
  )
);

-- Tabela de impressões (não exibir mais de 1x por sessão por banner)
CREATE TABLE IF NOT EXISTS notification_banner_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id  UUID NOT NULL REFERENCES notification_banners(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(banner_id, user_id)   -- 1 view por banner por usuário (toda sessão)
);

ALTER TABLE notification_banner_views ENABLE ROW LEVEL SECURITY;

-- Verificar a policy se já existe, mas geralmente o Supabase deixa passar ou você usa drop
DROP POLICY IF EXISTS "user_own_banner_views" ON notification_banner_views;
CREATE POLICY "user_own_banner_views"
ON notification_banner_views FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
