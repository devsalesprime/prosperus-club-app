-- =====================================================
-- PROSPERUS CLUB APP - SQL CONSOLIDADO DE REFERÊNCIA
-- =====================================================
-- Versão: 2.3
-- Data: 30/01/2026
-- 
-- IMPORTANTE: Este arquivo é apenas para REFERÊNCIA.
-- Para novos ambientes, execute as migrations em ordem.
-- =====================================================

-- =====================================================
-- PARTE 1: FUNÇÕES HELPER (SECURITY DEFINER)
-- =====================================================

-- Função para verificar se usuário é ADMIN/TEAM
-- Evita recursão de RLS ao usar em políticas
CREATE OR REPLACE FUNCTION public.user_has_admin_role(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = user_id
        AND role IN ('ADMIN', 'TEAM')
    );
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.user_has_admin_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_admin_role(UUID) TO anon;

-- Função para criar perfil automático no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'), 
    'MEMBER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para auto-criar perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Função para atualizar timestamp de conversa
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para incrementar views de artigo
CREATE OR REPLACE FUNCTION public.increment_article_views(article_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.articles
    SET views = views + 1
    WHERE id = article_id;
END;
$$;

-- =====================================================
-- PARTE 2: POLÍTICAS RLS PARA GALLERY_ALBUMS
-- =====================================================
-- (Correção do erro 401 na galeria)

-- Drop políticas antigas
DROP POLICY IF EXISTS "Allow admins to insert gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to update gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow admins to delete gallery albums" ON public.gallery_albums;
DROP POLICY IF EXISTS "Allow authenticated users to read gallery albums" ON public.gallery_albums;

-- Recriar políticas
CREATE POLICY "Allow authenticated users to read gallery albums"
ON public.gallery_albums
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to insert gallery albums"
ON public.gallery_albums
FOR INSERT
TO authenticated
WITH CHECK (public.user_has_admin_role(auth.uid()));

CREATE POLICY "Allow admins to update gallery albums"
ON public.gallery_albums
FOR UPDATE
TO authenticated
USING (public.user_has_admin_role(auth.uid()));

CREATE POLICY "Allow admins to delete gallery albums"
ON public.gallery_albums
FOR DELETE
TO authenticated
USING (public.user_has_admin_role(auth.uid()));

-- =====================================================
-- PARTE 3: VERIFICAÇÃO DE DIAGNÓSTICO
-- =====================================================

-- Verificar todas as políticas do sistema
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Verificar função helper existe
SELECT proname FROM pg_proc WHERE proname = 'user_has_admin_role';

-- Testar função helper (substituir UUID pelo seu)
-- SELECT public.user_has_admin_role('seu-uuid-aqui');
