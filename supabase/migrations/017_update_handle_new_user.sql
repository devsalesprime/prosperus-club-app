-- ============================================
-- Migration: Atualizar handle_new_user para usar dados do HubSpot
-- ============================================
-- Execute no Supabase SQL Editor
-- ============================================

-- Atualizar função para popular job_title, company e phone do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, job_title, company, phone)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'),
    'MEMBER',
    COALESCE(new.raw_user_meta_data->>'job_title', ''),
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar que a função foi atualizada
SELECT '✅ Trigger handle_new_user atualizado!' as status;
