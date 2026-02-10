-- ============================================
-- ETAPA 2: Atualizar dados e configurações
-- Execute este bloco DEPOIS da ETAPA 1
-- ============================================

-- Atualizar dados existentes (se houver)
UPDATE public.profiles SET role = 'ADMIN' WHERE role = 'admin';
UPDATE public.profiles SET role = 'MEMBER' WHERE role = 'member';

-- Atualizar o valor padrão da coluna
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'MEMBER';

-- Atualizar a função trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'), 'MEMBER');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ✅ Pronto! Agora pode executar o seed do admin
