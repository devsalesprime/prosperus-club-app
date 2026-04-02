-- ============================================
-- Feature: Member Progress Reports RLS Updates
-- Adds DELETE for Members and SELECT/DELETE for Admins
-- ============================================

-- SQL RLS Policies
-- Permitir que membros deletem seus proprios relatorios
CREATE POLICY "Membros podem deletar seus relatorios"
ON public.member_reports
FOR DELETE
USING (auth.uid() = user_id);

-- Permitir que Administradores leiam todos os relatorios
CREATE POLICY "Admins podem ler todos os relatorios"
ON public.member_reports
FOR SELECT
USING (public.is_admin());

-- Permitir que Administradores deletem todos os relatorios
CREATE POLICY "Admins podem deletar os relatorios"
ON public.member_reports
FOR DELETE
USING (public.is_admin());

-- Storage RLS Policies
-- Permitir que Administradores leiam no bucket
CREATE POLICY "Admins podem ler storage dos relatorios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'member_reports' 
  AND public.is_admin()
);

-- Permitir que Membros E Administradores deletem do bucket
CREATE POLICY "Dono e Admin podem deletar do storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'member_reports' AND 
  ( (storage.foldername(name))[1] = auth.uid()::text OR public.is_admin() )
);
