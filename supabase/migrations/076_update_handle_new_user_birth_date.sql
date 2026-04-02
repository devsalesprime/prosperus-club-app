-- ============================================
-- Migration: Atualizar handle_new_user para incluir birth_date do HubSpot
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, job_title, company, phone, birth_date)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Membro'),
    'MEMBER',
    COALESCE(new.raw_user_meta_data->>'job_title', ''),
    COALESCE(new.raw_user_meta_data->>'company', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    (new.raw_user_meta_data->>'birth_date')::date
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Trigger handle_new_user atualizado com birth_date!' as status;
