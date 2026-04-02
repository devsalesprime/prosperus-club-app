-- ============================================
-- Feature: Member Progress Reports (Automated via Webhook)
-- ============================================

-- 1. Create Private Storage Bucket for Reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('member_reports', 'member_reports', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies
-- Permitir que membros leiam APENAS os seus próprios diretórios/relatórios
CREATE POLICY "Membros podem ver seus proprios relatorios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'member_reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Service Role tem acesso total para a Edge Function poder salvar os HTMLs
CREATE POLICY "Service Role tem acesso total aos relatorios"
ON storage.objects FOR ALL
USING (bucket_id = 'member_reports' AND auth.jwt()->>'role' = 'service_role')
WITH CHECK (bucket_id = 'member_reports' AND auth.jwt()->>'role' = 'service_role');


-- 2. Create Table to index reports
CREATE TABLE IF NOT EXISTS public.member_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_member_reports_user_id ON public.member_reports(user_id);

-- 3. SQL RLS Policies
ALTER TABLE public.member_reports ENABLE ROW LEVEL SECURITY;

-- Membros podem ver apenas seus próprios relatórios
CREATE POLICY "Membros podem ver seus relatorios"
ON public.member_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Service Role pode inserir (Webhook)
CREATE POLICY "Service Role pode inserir relatorios"
ON public.member_reports
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');
